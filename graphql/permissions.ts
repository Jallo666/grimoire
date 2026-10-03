import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignMembers } from "@/db/schema";
import type { Context } from "./context";
import { appError } from "./errors";

export function assertAuthenticated(context: Context) {
  if (!context.user) {
    throw appError("UNAUTHENTICATED");
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
    throw appError("CAMPAIGN_NOT_FOUND");
  }
  if (campaign.ownerId !== userId) {
    throw appError("FORBIDDEN");
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
    throw appError("CAMPAIGN_NOT_FOUND");
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
    throw appError("FORBIDDEN");
  }
  return { campaign, isOwner: false };
}
