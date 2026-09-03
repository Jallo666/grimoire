import { GraphQLError } from "graphql";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { campaigns, users, campaignMembers } from "@/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";

export type Context = {
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
      if (!context.user) {
        throw new GraphQLError("Non autenticato", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return db.select().from(campaigns);
    },
    campaign: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const result = await db.select().from(campaigns).where(eq(campaigns.id, Number(args.id))).limit(1);
      return result[0] ?? null;
    },

    users: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });
      }
      return db.select({ id: users.id, email: users.email, nome: users.nome }).from(users);
    },

    me: (_: unknown, __: unknown, context: Context) => {
      return context.user ?? null;
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
      if (!context.user) {
        throw new GraphQLError("Non autenticato", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return await db.transaction(async (tx) => {
        const [newCampaign] = await tx
          .insert(campaigns)
          .values({
            nome: args.nome,
            descrizione: args.descrizione ?? null,
            stato: args.stato ?? "attiva",
            unitaMisuraDefault: args.unitaMisuraDefault ?? "metri",
            masterPuoModificarePersonaggi: args.masterPuoModificarePersonaggi ?? true,
            ownerId: context.user!.id,
          })
          .returning();

        await tx.insert(campaignMembers).values({
          campaignId: newCampaign.id,
          userId: context.user!.id,
          ruolo: "master",
        });

        return newCampaign;
      });
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
      if (!context.user) {
        throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.stato !== undefined) updates.stato = args.stato;
      if (args.unitaMisuraDefault !== undefined) updates.unitaMisuraDefault = args.unitaMisuraDefault;
      if (args.masterPuoModificarePersonaggi !== undefined) updates.masterPuoModificarePersonaggi = args.masterPuoModificarePersonaggi;

      const existing = await db.select({ ownerId: campaigns.ownerId }).from(campaigns).where(eq(campaigns.id, Number(args.id))).limit(1);
      if (!existing[0] || existing[0].ownerId !== context.user.id) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }

      const result = await db
        .update(campaigns)
        .set(updates)
        .where(eq(campaigns.id, Number(args.id)))
        .returning();
      return result[0];
    },

    deleteCampaign: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });
      }

      const existing = await db.select({ ownerId: campaigns.ownerId }).from(campaigns).where(eq(campaigns.id, Number(args.id))).limit(1);
      if (!existing[0] || existing[0].ownerId !== context.user.id) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }

      await db.delete(campaigns).where(eq(campaigns.id, Number(args.id)));
      return true;
    },

    addMember: async (_: unknown, args: { campaignId: string; email: string; ruolo: string }, context: Context) => {
      if (!context.user) throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });

      const [campaign] = await db.select({ ownerId: campaigns.ownerId }).from(campaigns).where(eq(campaigns.id, Number(args.campaignId))).limit(1);
      if (!campaign) throw new GraphQLError("Campagna non trovata", { extensions: { code: "NOT_FOUND" } });

      const isOwner = campaign.ownerId === context.user.id;
      const [isMaster] = await db.select().from(campaignMembers).where(
        and(
          eq(campaignMembers.campaignId, Number(args.campaignId)),
          eq(campaignMembers.userId, context.user.id),
          eq(campaignMembers.ruolo, "master")
        )
      ).limit(1);

      if (!isOwner && !isMaster) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }

      const [targetUser] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (!targetUser) throw new GraphQLError("Utente non trovato", { extensions: { code: "NOT_FOUND" } });

      const [existing] = await db.select().from(campaignMembers)
        .where(eq(campaignMembers.campaignId, Number(args.campaignId)))
        .where(eq(campaignMembers.userId, targetUser.id)).limit(1);
      if (existing) throw new GraphQLError("Utente già membro", { extensions: { code: "CONFLICT" } });

      const [member] = await db.insert(campaignMembers).values({
        campaignId: Number(args.campaignId),
        userId: targetUser.id,
        ruolo: args.ruolo,
      }).returning();

      return {
        id: member.id,
        userId: member.userId,
        ruolo: member.ruolo,
        user: { id: targetUser.id, email: targetUser.email, nome: targetUser.nome },
      };
    },

    removeMember: async (_: unknown, args: { memberId: string }, context: Context) => {
      if (!context.user) throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });

      const [member] = await db.select({ campaignId: campaignMembers.campaignId, userId: campaignMembers.userId, ruolo: campaignMembers.ruolo })
        .from(campaignMembers).where(eq(campaignMembers.id, Number(args.memberId))).limit(1);
      if (!member) throw new GraphQLError("Membro non trovato", { extensions: { code: "NOT_FOUND" } });

      const [campaign] = await db.select({ ownerId: campaigns.ownerId }).from(campaigns).where(eq(campaigns.id, member.campaignId!)).limit(1);
      if (!campaign) throw new GraphQLError("Campagna non trovata", { extensions: { code: "NOT_FOUND" } });

      const isOwner = campaign.ownerId === context.user.id;
      const [callerMembership] = await db.select().from(campaignMembers).where(
        and(
          eq(campaignMembers.campaignId, member.campaignId!),
          eq(campaignMembers.userId, context.user.id),
          eq(campaignMembers.ruolo, "master")
        )
      ).limit(1);

      if (!isOwner && !callerMembership) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }

      // Solo l'owner può rimuovere altri master
      if (member.ruolo === "master" && !isOwner) {
        throw new GraphQLError("Solo l'owner può rimuovere altri master", { extensions: { code: "FORBIDDEN" } });
      }

      // Nessuno può rimuovere se stesso
      if (member.userId === context.user.id) {
        throw new GraphQLError("Non puoi rimuoverti dalla campagna", { extensions: { code: "FORBIDDEN" } });
      }

      await db.delete(campaignMembers).where(eq(campaignMembers.id, Number(args.memberId)));
      return true;
    },

    updateMemberRole: async (_: unknown, args: { memberId: string; ruolo: string }, context: Context) => {
      if (!context.user) throw new GraphQLError("Non autenticato", { extensions: { code: "UNAUTHENTICATED" } });

      const [member] = await db.select().from(campaignMembers).where(eq(campaignMembers.id, Number(args.memberId))).limit(1);
      if (!member) throw new GraphQLError("Membro non trovato", { extensions: { code: "NOT_FOUND" } });

      const [campaign] = await db.select({ ownerId: campaigns.ownerId }).from(campaigns).where(eq(campaigns.id, member.campaignId!)).limit(1);
      if (!campaign) throw new GraphQLError("Campagna non trovata", { extensions: { code: "NOT_FOUND" } });

      const isOwner = campaign.ownerId === context.user.id;
      const [callerMembership] = await db.select().from(campaignMembers).where(
        and(
          eq(campaignMembers.campaignId, member.campaignId!),
          eq(campaignMembers.userId, context.user.id),
          eq(campaignMembers.ruolo, "master")
        )
      ).limit(1);

      if (!isOwner && !callerMembership) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }

      // Solo l'owner può cambiare ruolo ad altri master
      if (member.ruolo === "master" && !isOwner) {
        throw new GraphQLError("Solo l'owner può cambiare ruolo ad altri master", { extensions: { code: "FORBIDDEN" } });
      }

      // Non si può assegnare il ruolo master se non sei owner
      if (args.ruolo === "master" && !isOwner) {
        throw new GraphQLError("Solo l'owner può assegnare il ruolo master", { extensions: { code: "FORBIDDEN" } });
      }

      const [updated] = await db.update(campaignMembers).set({ ruolo: args.ruolo })
        .where(eq(campaignMembers.id, Number(args.memberId))).returning();

      const [user] = await db.select({ id: users.id, email: users.email, nome: users.nome })
        .from(users).where(eq(users.id, updated.userId!)).limit(1);

      return { id: updated.id, userId: updated.userId, ruolo: updated.ruolo, user };
    },

    logout: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("session");
      return true;
    },
  },
};
