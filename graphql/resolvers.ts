import { GraphQLError } from "graphql";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { campaigns, users } from "@/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";

type Context = {
  user: { id: number; email: string; nome: string | null } | null;
};

const SESSION_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export const resolvers = {
  Query: {
    campaigns: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non autenticato", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return db.select().from(campaigns);
    },
    me: (_: unknown, __: unknown, context: Context) => {
      return context.user ?? null;
    },
  },
  Mutation: {
    createCampaign: async (_: unknown, args: { nome: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non autenticato", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const result = await db
        .insert(campaigns)
        .values({ nome: args.nome, ownerId: context.user.id })
        .returning();
      return result[0];
    },

    register: async (_: unknown, args: { email: string; password: string; nome: string }) => {
      const existing = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (existing.length > 0) {
        throw new GraphQLError("Email già registrata", {
          extensions: { code: "CONFLICT" },
        });
      }
      const passwordHash = await hashPassword(args.password);
      const result = await db
        .insert(users)
        .values({ email: args.email, nome: args.nome, passwordHash })
        .returning({ id: users.id, email: users.email, nome: users.nome });
      const user = result[0];
      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("session", token, SESSION_COOKIE);
      return user;
    },

    login: async (_: unknown, args: { email: string; password: string }) => {
      const result = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (result.length === 0) {
        throw new GraphQLError("Credenziali non valide", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const user = result[0];
      const valid = await verifyPassword(args.password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError("Credenziali non valide", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("session", token, SESSION_COOKIE);
      return { id: user.id, email: user.email, nome: user.nome };
    },

    logout: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("session");
      return true;
    },
  },
};
