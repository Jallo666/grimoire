import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { users, campaignMembers } from "@/db/schema";
import { assertAuthenticated, assertMasterOrOwner } from "./permissions";
import type { Context } from "./context";

export const memberTypeDefs = gql`
  type CampaignMember {
    id: ID!
    userId: Int!
    ruolo: String!
    user: User!
  }

  type Mutation {
    addMember(campaignId: ID!, email: String!, ruolo: String!): CampaignMember!
    removeMember(memberId: ID!): Boolean!
    updateMemberRole(memberId: ID!, ruolo: String!): CampaignMember!
  }
`;

export const memberResolvers = {
  Mutation: {
    addMember: async (
      _: unknown,
      args: { campaignId: string; email: string; ruolo: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const { isOwner } = await assertMasterOrOwner(Number(args.campaignId), user.id);

      if (args.ruolo === "master" && !isOwner) {
        throw new GraphQLError("Solo l'owner può aggiungere un master", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, args.email))
        .limit(1);
      if (!targetUser) {
        throw new GraphQLError("Utente non trovato", { extensions: { code: "NOT_FOUND" } });
      }

      const [existing] = await db
        .select()
        .from(campaignMembers)
        .where(
          and(
            eq(campaignMembers.campaignId, Number(args.campaignId)),
            eq(campaignMembers.userId, targetUser.id)
          )
        )
        .limit(1);
      if (existing) {
        throw new GraphQLError("Utente già membro", { extensions: { code: "CONFLICT" } });
      }

      const [member] = await db
        .insert(campaignMembers)
        .values({
          campaignId: Number(args.campaignId),
          userId: targetUser.id,
          ruolo: args.ruolo,
        })
        .returning();

      return {
        id: member.id,
        userId: member.userId,
        ruolo: member.ruolo,
        user: { id: targetUser.id, email: targetUser.email, nome: targetUser.nome },
      };
    },

    removeMember: async (_: unknown, args: { memberId: string }, context: Context) => {
      const user = assertAuthenticated(context);

      const [member] = await db
        .select({
          campaignId: campaignMembers.campaignId,
          userId: campaignMembers.userId,
          ruolo: campaignMembers.ruolo,
        })
        .from(campaignMembers)
        .where(eq(campaignMembers.id, Number(args.memberId)))
        .limit(1);
      if (!member) {
        throw new GraphQLError("Membro non trovato", { extensions: { code: "NOT_FOUND" } });
      }

      const { campaign, isOwner } = await assertMasterOrOwner(member.campaignId!, user.id);

      // Il master non può rimuovere l'owner
      if (!isOwner && member.userId === campaign.ownerId) {
        throw new GraphQLError("Non puoi rimuovere l'owner dalla campagna", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Deve rimanere almeno un membro
      const [{ memberCount }] = await db
        .select({ memberCount: count() })
        .from(campaignMembers)
        .where(eq(campaignMembers.campaignId, member.campaignId!));

      if (memberCount <= 1) {
        throw new GraphQLError("Deve rimanere almeno un membro nella campagna", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      await db.delete(campaignMembers).where(eq(campaignMembers.id, Number(args.memberId)));
      return true;
    },

    updateMemberRole: async (
      _: unknown,
      args: { memberId: string; ruolo: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);

      const [member] = await db
        .select()
        .from(campaignMembers)
        .where(eq(campaignMembers.id, Number(args.memberId)))
        .limit(1);
      if (!member) {
        throw new GraphQLError("Membro non trovato", { extensions: { code: "NOT_FOUND" } });
      }

      const { campaign, isOwner } = await assertMasterOrOwner(member.campaignId!, user.id);

      // Il master non può cambiare il ruolo dell'owner
      if (!isOwner && member.userId === campaign.ownerId) {
        throw new GraphQLError("Non puoi modificare il ruolo dell'owner", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Solo l'owner può assegnare il ruolo master
      if (args.ruolo === "master" && !isOwner) {
        throw new GraphQLError("Solo l'owner può assegnare il ruolo master", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const [updated] = await db
        .update(campaignMembers)
        .set({ ruolo: args.ruolo })
        .where(eq(campaignMembers.id, Number(args.memberId)))
        .returning();

      const [targetUser] = await db
        .select({ id: users.id, email: users.email, nome: users.nome })
        .from(users)
        .where(eq(users.id, updated.userId!))
        .limit(1);

      return { id: updated.id, userId: updated.userId, ruolo: updated.ruolo, user: targetUser };
    },
  },
};
