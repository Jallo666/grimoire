import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { userTypeDefs, userResolvers } from "./users";
import { campaignTypeDefs, campaignResolvers } from "./campaigns";
import { memberTypeDefs, memberResolvers } from "./members";

export type { Context } from "./context";

export const typeDefs = mergeTypeDefs([userTypeDefs, campaignTypeDefs, memberTypeDefs]);

export const resolvers = mergeResolvers([userResolvers, campaignResolvers, memberResolvers]);
