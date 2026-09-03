import { GraphQLError } from "graphql";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignMembers } from "@/db/schema";
import type { Context } from "./context";

export function assertAuthenticated(context: Context) {
  if (!context.user) {
    throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });
  }
  return context.user;
}

export async function assertOwner(campaignId: number, userId: number) {
  const [campaign] = await db
    .select({ ownerId: campaigns.ownerId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new GraphQLError("Campagna non trovata", { extensions: { code: "NOT_FOUND" } });
  }
  if (campaign.ownerId !== userId) {
    throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
  }
  return campaign;
}

export async function assertMasterOrOwner(campaignId: number, userId: number) {
  const [campaign] = await db
    .select({ ownerId: campaigns.ownerId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new GraphQLError("Campagna non trovata", { extensions: { code: "NOT_FOUND" } });
  }

  const isOwner = campaign.ownerId === userId;
  if (isOwner) return { campaign, isOwner: true };

  const [master] = await db
    .select()
    .from(campaignMembers)
    .where(
      and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, userId),
        eq(campaignMembers.ruolo, "master")
      )
    )
    .limit(1);

  if (!master) {
    throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
  }
  return { campaign, isOwner: false };
}
