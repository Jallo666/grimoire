import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { userTypeDefs, userResolvers } from "./users";
import { campaignTypeDefs, campaignResolvers } from "./campaigns";
import { memberTypeDefs, memberResolvers } from "./members";
import { spellTypeDefs, spellResolvers } from "./spells";
import { spellGroupTypeDefs, spellGroupResolvers } from "./spellGroups";

export type { Context } from "./context";

export const typeDefs = mergeTypeDefs([userTypeDefs, campaignTypeDefs, memberTypeDefs, spellTypeDefs, spellGroupTypeDefs]);

export const resolvers = mergeResolvers([userResolvers, campaignResolvers, memberResolvers, spellResolvers, spellGroupResolvers]);
