import { users, campaigns, campaignMembers } from "./schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignMember = typeof campaignMembers.$inferSelect;
export type NewCampaignMember = typeof campaignMembers.$inferInsert;
