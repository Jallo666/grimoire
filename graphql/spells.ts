import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { spells, userSpellLibrary, campaignSpellLibrary, campaignMembers } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import type { Context } from "./context";

export const spellTypeDefs = gql`
  type Spell {
    id: ID!
    nome: String!
    descrizione: String
    scuola: String
    livello: Int!
    tempoLancio: String
    gittata: String
    durata: String
    componenti: String
    creatorId: Int!
    createdAt: String!
    isOwner: Boolean!
  }

  type Query {
    mySpells: [Spell!]!
    spell(id: ID!): Spell
    campaignSpells(campaignId: ID!): [Spell!]!
  }

  type Mutation {
    createSpell(
      nome: String!
      descrizione: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
    ): Spell!

    updateSpell(
      id: ID!
      nome: String
      descrizione: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
    ): Spell!

    deleteSpell(id: ID!): Boolean!

    shareSpellWithUser(spellId: ID!, email: String!): Boolean!
    shareSpellWithCampaign(spellId: ID!, campaignId: ID!): Boolean!
    removeSpellFromCampaign(spellId: ID!, campaignId: ID!): Boolean!
  }
`;

async function getSpellOrThrow(spellId: number) {
  const [spell] = await db.select().from(spells).where(eq(spells.id, spellId)).limit(1);
  if (!spell) throw new GraphQLError("Incantesimo non trovato", { extensions: { code: "NOT_FOUND" } });
  return spell;
}

export const spellResolvers = {
  Query: {
    mySpells: async (_: unknown, __: unknown, context: Context) => {
      const user = assertAuthenticated(context);
      const rows = await db
        .select({ spell: spells })
        .from(userSpellLibrary)
        .innerJoin(spells, eq(userSpellLibrary.spellId, spells.id))
        .where(eq(userSpellLibrary.userId, user.id));
      return rows.map((r) => ({ ...r.spell, isOwner: r.spell.creatorId === user.id }));
    },

    spell: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      const [entry] = await db
        .select()
        .from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id)))
        .limit(1);
      if (!entry) throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      return { ...spell, isOwner: spell.creatorId === user.id };
    },

    campaignSpells: async (_: unknown, args: { campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db
        .select()
        .from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id)))
        .limit(1);
      if (!member) throw new GraphQLError("Non sei membro di questa campagna", { extensions: { code: "FORBIDDEN" } });
      const rows = await db
        .select({ spell: spells })
        .from(campaignSpellLibrary)
        .innerJoin(spells, eq(campaignSpellLibrary.spellId, spells.id))
        .where(eq(campaignSpellLibrary.campaignId, Number(args.campaignId)));
      return rows.map((r) => ({ ...r.spell, isOwner: r.spell.creatorId === user.id }));
    },
  },

  Mutation: {
    createSpell: async (
      _: unknown,
      args: { nome: string; descrizione?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      return db.transaction(async (tx) => {
        const [spell] = await tx
          .insert(spells)
          .values({
            creatorId: user.id,
            nome: args.nome,
            descrizione: args.descrizione ?? null,
            scuola: args.scuola ?? null,
            livello: args.livello ?? 1,
            tempoLancio: args.tempoLancio ?? null,
            gittata: args.gittata ?? null,
            durata: args.durata ?? null,
            componenti: args.componenti ?? null,
          })
          .returning();
        await tx.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id });
        return { ...spell, isOwner: true };
      });
    },

    updateSpell: async (
      _: unknown,
      args: { id: string; nome?: string; descrizione?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw new GraphQLError("Solo il creatore può modificare l'incantesimo", { extensions: { code: "FORBIDDEN" } });
      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.scuola !== undefined) updates.scuola = args.scuola;
      if (args.livello !== undefined) updates.livello = args.livello;
      if (args.tempoLancio !== undefined) updates.tempoLancio = args.tempoLancio;
      if (args.gittata !== undefined) updates.gittata = args.gittata;
      if (args.durata !== undefined) updates.durata = args.durata;
      if (args.componenti !== undefined) updates.componenti = args.componenti;
      const [updated] = await db.update(spells).set(updates).where(eq(spells.id, spell.id)).returning();
      return { ...updated, isOwner: true };
    },

    deleteSpell: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw new GraphQLError("Solo il creatore può eliminare l'incantesimo", { extensions: { code: "FORBIDDEN" } });
      await db.delete(userSpellLibrary).where(eq(userSpellLibrary.spellId, spell.id));
      await db.delete(campaignSpellLibrary).where(eq(campaignSpellLibrary.spellId, spell.id));
      await db.delete(spells).where(eq(spells.id, spell.id));
      return true;
    },

    shareSpellWithUser: async (_: unknown, args: { spellId: string; email: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw new GraphQLError("Non hai questo incantesimo in raccolta", { extensions: { code: "FORBIDDEN" } });
      const { users } = await import("@/db/schema");
      const [target] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (!target) throw new GraphQLError("Utente non trovato", { extensions: { code: "NOT_FOUND" } });
      const [existing] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, target.id))).limit(1);
      if (!existing) await db.insert(userSpellLibrary).values({ userId: target.id, spellId: spell.id });
      return true;
    },

    shareSpellWithCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw new GraphQLError("Non hai questo incantesimo in raccolta", { extensions: { code: "FORBIDDEN" } });
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw new GraphQLError("Non sei membro di questa campagna", { extensions: { code: "FORBIDDEN" } });
      const [existing] = await db.select().from(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, spell.id), eq(campaignSpellLibrary.campaignId, Number(args.campaignId)))).limit(1);
      if (!existing) await db.insert(campaignSpellLibrary).values({ spellId: spell.id, campaignId: Number(args.campaignId), sharedById: user.id });
      return true;
    },

    removeSpellFromCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member || (member.ruolo !== "master" && member.ruolo !== "owner")) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }
      await db.delete(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, Number(args.spellId)), eq(campaignSpellLibrary.campaignId, Number(args.campaignId))));
      return true;
    },
  },
};
