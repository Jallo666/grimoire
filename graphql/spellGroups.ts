import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { spellGroups, userSpellLibrary } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import type { Context } from "./context";

export const spellGroupTypeDefs = gql`
  type SpellGroup {
    id: ID!
    nome: String!
  }

  type Query {
    mySpellGroups: [SpellGroup!]!
  }

  type Mutation {
    createSpellGroup(nome: String!): SpellGroup!
    renameSpellGroup(id: ID!, nome: String!): SpellGroup!
    deleteSpellGroup(id: ID!): Boolean!
    moveSpellToGroup(spellId: ID!, groupId: ID!): Boolean!
  }
`;

export async function getOrCreateGroup(userId: number, nome: string): Promise<number> {
  const [existing] = await db
    .select()
    .from(spellGroups)
    .where(and(eq(spellGroups.userId, userId), eq(spellGroups.nome, nome)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(spellGroups).values({ nome, userId }).returning();
  return created.id;
}

export const spellGroupResolvers = {
  Query: {
    mySpellGroups: async (_: unknown, __: unknown, context: Context) => {
      const user = assertAuthenticated(context);
      return db.select().from(spellGroups).where(eq(spellGroups.userId, user.id));
    },
  },

  Mutation: {
    createSpellGroup: async (_: unknown, args: { nome: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [existing] = await db.select().from(spellGroups)
        .where(and(eq(spellGroups.userId, user.id), eq(spellGroups.nome, args.nome))).limit(1);
      if (existing) throw new GraphQLError("Gruppo già esistente", { extensions: { code: "BAD_USER_INPUT" } });
      const [group] = await db.insert(spellGroups).values({ nome: args.nome, userId: user.id }).returning();
      return group;
    },

    renameSpellGroup: async (_: unknown, args: { id: string; nome: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [group] = await db.select().from(spellGroups)
        .where(and(eq(spellGroups.id, Number(args.id)), eq(spellGroups.userId, user.id))).limit(1);
      if (!group) throw new GraphQLError("Gruppo non trovato", { extensions: { code: "NOT_FOUND" } });
      const [updated] = await db.update(spellGroups)
        .set({ nome: args.nome })
        .where(eq(spellGroups.id, group.id))
        .returning();
      return updated;
    },

    deleteSpellGroup: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [group] = await db.select().from(spellGroups)
        .where(and(eq(spellGroups.id, Number(args.id)), eq(spellGroups.userId, user.id))).limit(1);
      if (!group) throw new GraphQLError("Gruppo non trovato", { extensions: { code: "NOT_FOUND" } });
      // null out groupId on library entries before deleting
      await db.update(userSpellLibrary)
        .set({ groupId: null })
        .where(eq(userSpellLibrary.groupId, group.id));
      await db.delete(spellGroups).where(eq(spellGroups.id, group.id));
      return true;
    },

    moveSpellToGroup: async (_: unknown, args: { spellId: string; groupId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const groupId = Number(args.groupId);
      const [group] = await db.select().from(spellGroups)
        .where(and(eq(spellGroups.id, groupId), eq(spellGroups.userId, user.id))).limit(1);
      if (!group) throw new GraphQLError("Gruppo non trovato", { extensions: { code: "NOT_FOUND" } });
      await db.update(userSpellLibrary)
        .set({ groupId })
        .where(and(eq(userSpellLibrary.spellId, Number(args.spellId)), eq(userSpellLibrary.userId, user.id)));
      return true;
    },
  },
};
