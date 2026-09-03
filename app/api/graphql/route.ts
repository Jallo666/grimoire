import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs, resolvers, type Context } from "@/graphql/index";
import { getCurrentUser } from "@/lib/session";

const server = new ApolloServer<Context>({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler<NextRequest, Context>(server, {
  context: async () => {
    const user = await getCurrentUser();
    return { user };
  },
});

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
