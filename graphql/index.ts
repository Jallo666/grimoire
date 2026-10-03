import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { userTypeDefs, userResolvers } from "./users";
import { campaignTypeDefs, campaignResolvers } from "./campaigns";
import { memberTypeDefs, memberResolvers } from "./members";
import { spellTypeDefs, spellResolvers } from "./spells";
import { spellGroupTypeDefs, spellGroupResolvers } from "./spellGroups";
import { itemTypeDefs, itemResolvers } from "./items";

export type { Context } from "./context";

export const typeDefs = mergeTypeDefs([userTypeDefs, campaignTypeDefs, memberTypeDefs, spellTypeDefs, spellGroupTypeDefs, itemTypeDefs]);

export const resolvers = mergeResolvers([userResolvers, campaignResolvers, memberResolvers, spellResolvers, spellGroupResolvers, itemResolvers]);
