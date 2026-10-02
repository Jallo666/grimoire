import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";
import { assertAuthenticated } from "./permissions";
import type { Context } from "./context";

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    nome: String
    defaultTheme: String
    defaultLocale: String
    defaultUnitSystem: String
    defaultCampaignLocale: String
  }

  type Query {
    users: [User!]!
    me: User
  }

  type Mutation {
    register(email: String!, password: String!, nome: String!): User!
    login(email: String!, password: String!): User!
    logout: Boolean!
    updateEmail(newEmail: String!, password: String!): User!
    updatePassword(currentPassword: String!, newPassword: String!): Boolean!
    updatePreferences(defaultTheme: String, defaultLocale: String, defaultUnitSystem: String, defaultCampaignLocale: String): User!
  }
`;

const SESSION_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

const USER_FIELDS = {
  id: users.id,
  email: users.email,
  nome: users.nome,
  defaultTheme: users.defaultTheme,
  defaultLocale: users.defaultLocale,
  defaultUnitSystem: users.defaultUnitSystem,
  defaultCampaignLocale: users.defaultCampaignLocale,
};

export const userResolvers = {
  Query: {
    users: async (_: unknown, __: unknown, context: Context) => {
      assertAuthenticated(context);
      return db.select({ id: users.id, email: users.email, nome: users.nome }).from(users);
    },

    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) return null;
      const [user] = await db
        .select(USER_FIELDS)
        .from(users)
        .where(eq(users.id, context.user.id))
        .limit(1);
      return user ?? null;
    },
  },

  Mutation: {
    register: async (_: unknown, args: { email: string; password: string; nome: string }) => {
      const existing = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (existing.length > 0) {
        throw new GraphQLError("Email già registrata", { extensions: { code: "CONFLICT" } });
      }
      const passwordHash = await hashPassword(args.password);
      const result = await db
        .insert(users)
        .values({ email: args.email, nome: args.nome, passwordHash })
        .returning(USER_FIELDS);
      const user = result[0];
      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("session", token, SESSION_COOKIE);
      return user;
    },

    login: async (_: unknown, args: { email: string; password: string }) => {
      const result = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (result.length === 0) {
        throw new GraphQLError("Credenziali non valide", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const user = result[0];
      const valid = await verifyPassword(args.password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError("Credenziali non valide", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("session", token, SESSION_COOKIE);
      return { id: user.id, email: user.email, nome: user.nome, defaultTheme: user.defaultTheme, defaultLocale: user.defaultLocale };
    },

    logout: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("session");
      return true;
    },

    updateEmail: async (_: unknown, args: { newEmail: string; password: string }, context: Context) => {
      assertAuthenticated(context);
      const [current] = await db.select().from(users).where(eq(users.id, context.user!.id)).limit(1);
      const valid = await verifyPassword(args.password, current.passwordHash);
      if (!valid) {
        throw new GraphQLError("Password non corretta", { extensions: { code: "FORBIDDEN" } });
      }
      const existing = await db.select().from(users).where(eq(users.email, args.newEmail)).limit(1);
      if (existing.length > 0 && existing[0].id !== context.user!.id) {
        throw new GraphQLError("Email già in uso", { extensions: { code: "CONFLICT" } });
      }
      const [updated] = await db
        .update(users)
        .set({ email: args.newEmail })
        .where(eq(users.id, context.user!.id))
        .returning(USER_FIELDS);
      return updated;
    },

    updatePassword: async (_: unknown, args: { currentPassword: string; newPassword: string }, context: Context) => {
      assertAuthenticated(context);
      const [current] = await db.select().from(users).where(eq(users.id, context.user!.id)).limit(1);
      const valid = await verifyPassword(args.currentPassword, current.passwordHash);
      if (!valid) {
        throw new GraphQLError("Password attuale non corretta", { extensions: { code: "FORBIDDEN" } });
      }
      if (args.newPassword.length < 8) {
        throw new GraphQLError("La nuova password deve essere di almeno 8 caratteri", { extensions: { code: "BAD_USER_INPUT" } });
      }
      const passwordHash = await hashPassword(args.newPassword);
      await db.update(users).set({ passwordHash }).where(eq(users.id, context.user!.id));
      return true;
    },

    updatePreferences: async (_: unknown, args: { defaultTheme?: string | null; defaultLocale?: string | null; defaultUnitSystem?: string | null; defaultCampaignLocale?: string | null }, context: Context) => {
      assertAuthenticated(context);
      const patch: Partial<{ defaultTheme: string | null; defaultLocale: string | null; defaultUnitSystem: string | null; defaultCampaignLocale: string | null }> = {};
      if (args.defaultTheme !== undefined) patch.defaultTheme = args.defaultTheme || null;
      if (args.defaultLocale !== undefined) patch.defaultLocale = args.defaultLocale || null;
      if (args.defaultUnitSystem !== undefined) patch.defaultUnitSystem = args.defaultUnitSystem || null;
      if (args.defaultCampaignLocale !== undefined) patch.defaultCampaignLocale = args.defaultCampaignLocale || null;
      const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, context.user!.id))
        .returning(USER_FIELDS);
      return updated;
    },
  },
};
