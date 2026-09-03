import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, users, campaignMembers } from "@/db/schema";
import { assertAuthenticated, assertOwner } from "./permissions";
import type { Context } from "./context";

export const campaignTypeDefs = gql`
  type Campaign {
    id: ID!
    nome: String!
    descrizione: String
    stato: String!
    createdAt: String!
    unitaMisuraDefault: String!
    masterPuoModificarePersonaggi: Boolean!
    ownerId: Int!
    owner: User
    members: [CampaignMember!]!
  }

  type Query {
    campaigns: [Campaign!]!
    campaign(id: ID!): Campaign
  }

  type Mutation {
    createCampaign(
      nome: String!
      descrizione: String
      stato: String
      unitaMisuraDefault: String
      masterPuoModificarePersonaggi: Boolean
    ): Campaign!
    updateCampaign(
      id: ID!
      nome: String
      descrizione: String
      stato: String
      unitaMisuraDefault: String
      masterPuoModificarePersonaggi: Boolean
    ): Campaign!
    deleteCampaign(id: ID!): Boolean!
  }
`;

export const campaignResolvers = {
  Campaign: {
    owner: async (campaign: { ownerId: number | null }) => {
      if (!campaign.ownerId) return null;
      const result = await db
        .select({ id: users.id, email: users.email, nome: users.nome })
        .from(users)
        .where(eq(users.id, campaign.ownerId))
        .limit(1);
      return result[0] ?? null;
    },

    members: async (campaign: { id: number }) => {
      const rows = await db
        .select({
          id: campaignMembers.id,
          userId: campaignMembers.userId,
          ruolo: campaignMembers.ruolo,
          userEmail: users.email,
          userNome: users.nome,
          userDbId: users.id,
        })
        .from(campaignMembers)
        .innerJoin(users, eq(campaignMembers.userId, users.id))
        .where(eq(campaignMembers.campaignId, campaign.id));

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        ruolo: r.ruolo,
        user: { id: r.userDbId, email: r.userEmail, nome: r.userNome },
      }));
    },
  },

  Query: {
    campaigns: async (_: unknown, __: unknown, context: Context) => {
      const user = assertAuthenticated(context);

      const memberOf = db
        .select({ campaignId: campaignMembers.campaignId })
        .from(campaignMembers)
        .where(eq(campaignMembers.userId, user.id));

      return db
        .select()
        .from(campaigns)
        .where(or(eq(campaigns.ownerId, user.id), inArray(campaigns.id, memberOf)));
    },

    campaign: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, Number(args.id)))
        .limit(1);
      if (!campaign) return null;

      const isOwner = campaign.ownerId === user.id;
      if (!isOwner) {
        const [member] = await db
          .select()
          .from(campaignMembers)
          .where(
            and(
              eq(campaignMembers.campaignId, campaign.id),
              eq(campaignMembers.userId, user.id)
            )
          )
          .limit(1);
        if (!member) {
          throw new GraphQLError("Non sei membro di questa campagna", {
            extensions: { code: "FORBIDDEN" },
          });
        }
      }

      return campaign;
    },
  },

  Mutation: {
    createCampaign: async (
      _: unknown,
      args: {
        nome: string;
        descrizione?: string;
        stato?: string;
        unitaMisuraDefault?: string;
        masterPuoModificarePersonaggi?: boolean;
      },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      return db.transaction(async (tx) => {
        const [newCampaign] = await tx
          .insert(campaigns)
          .values({
            nome: args.nome,
            descrizione: args.descrizione ?? null,
            stato: args.stato ?? "attiva",
            unitaMisuraDefault: args.unitaMisuraDefault ?? "metri",
            masterPuoModificarePersonaggi: args.masterPuoModificarePersonaggi ?? true,
            ownerId: user.id,
          })
          .returning();

        await tx.insert(campaignMembers).values({
          campaignId: newCampaign.id,
          userId: user.id,
          ruolo: "master",
        });

        return newCampaign;
      });
    },

    updateCampaign: async (
      _: unknown,
      args: {
        id: string;
        nome?: string;
        descrizione?: string;
        stato?: string;
        unitaMisuraDefault?: string;
        masterPuoModificarePersonaggi?: boolean;
      },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      await assertOwner(Number(args.id), user.id);

      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.stato !== undefined) updates.stato = args.stato;
      if (args.unitaMisuraDefault !== undefined) updates.unitaMisuraDefault = args.unitaMisuraDefault;
      if (args.masterPuoModificarePersonaggi !== undefined)
        updates.masterPuoModificarePersonaggi = args.masterPuoModificarePersonaggi;

      const [result] = await db
        .update(campaigns)
        .set(updates)
        .where(eq(campaigns.id, Number(args.id)))
        .returning();
      return result;
    },

    deleteCampaign: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      await assertOwner(Number(args.id), user.id);
      await db.delete(campaigns).where(eq(campaigns.id, Number(args.id)));
      return true;
    },
  },
};
