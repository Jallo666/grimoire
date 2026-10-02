import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and, ilike, isNull } from "drizzle-orm";
import { db } from "@/db";
import { spells, userSpellLibrary, campaignSpellLibrary, campaignMembers, spellGroups } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import { getOrCreateGroup } from "./spellGroups";
import type { Context } from "./context";

export const spellTypeDefs = gql`
  type SpellTranslation {
    locale: String!
    nome: String!
    descrizione: String
  }

  type Spell {
    id: ID!
    nome: String!
    descrizione: String
    scuola: String
    livello: Int!
    tempoLancio: String
    gittata: String
    durata: String
    componenti: String
    higherLevel: String
    concentration: Boolean
    ritual: Boolean
    classi: String
    sottoclassi: String
    creatorId: Int
    createdAt: String!
    isOwner: Boolean!
    isSystem: Boolean!
    inLibrary: Boolean!
    groupId: ID
    groupNome: String
    translations: [SpellTranslation!]!
  }

  type Query {
    mySpells(search: String, scuola: String, livello: Int, concentration: Boolean, ritual: Boolean, groupId: ID, locale: String): [Spell!]!
    spell(id: ID!, locale: String): Spell
    srdSpells(search: String, scuola: String, livello: Int, concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    allSpells(search: String, scuola: String, livello: Int, concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    campaignSpells(campaignId: ID!): [Spell!]!
  }

  type Mutation {
    upsertSpellTranslation(spellId: ID!, locale: String!, nome: String!, descrizione: String): Spell!

    createSpell(
      nome: String!
      descrizione: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
      groupId: ID
    ): Spell!

    updateSpell(
      id: ID!
      nome: String
      descrizione: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
    ): Spell!

    deleteSpell(id: ID!): Boolean!

    addSrdSpellToLibrary(spellId: ID!, groupId: ID): Boolean!
    removeSrdSpellFromLibrary(spellId: ID!): Boolean!
    shareSpellWithUser(spellId: ID!, email: String!): Boolean!
    shareSpellWithCampaign(spellId: ID!, campaignId: ID!): Boolean!
    removeSpellFromCampaign(spellId: ID!, campaignId: ID!): Boolean!
  }
`;

async function getSpellOrThrow(spellId: number) {
  const [spell] = await db.select().from(spells).where(eq(spells.id, spellId)).limit(1);
  if (!spell) throw new GraphQLError("Incantesimo non trovato", { extensions: { code: "NOT_FOUND" } });
  return spell;
}

type TranslationsMap = Record<string, { nome: string; descrizione?: string }>;

function toGql(
  spell: typeof spells.$inferSelect,
  userId: number | null,
  inLibrary: boolean,
  groupId?: number | null,
  groupNome?: string | null,
  locale?: string | null
) {
  const map = (spell.translations ?? {}) as TranslationsMap;
  const t = locale ? map[locale] : undefined;
  const translations = Object.entries(map).map(([l, v]) => ({ locale: l, nome: v.nome, descrizione: v.descrizione ?? null }));
  return {
    ...spell,
    nome: t?.nome ?? spell.nome,
    descrizione: t?.descrizione ?? spell.descrizione,
    createdAt: spell.createdAt.toISOString(),
    isOwner: spell.creatorId != null && spell.creatorId === userId,
    isSystem: spell.isSystem,
    inLibrary,
    groupId: groupId ?? null,
    groupNome: groupNome ?? null,
    translations,
  };
}

export const spellResolvers = {
  Query: {
    mySpells: async (_: unknown, args: { search?: string; scuola?: string; livello?: number; concentration?: boolean; ritual?: boolean; groupId?: string; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const conditions = [eq(userSpellLibrary.userId, user.id)];
      if (args.scuola) conditions.push(eq(spells.scuola, args.scuola));
      if (args.livello !== undefined) conditions.push(eq(spells.livello, args.livello));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));
      if (args.groupId) conditions.push(eq(userSpellLibrary.groupId, Number(args.groupId)));
      const rows = await db
        .select({ spell: spells, lib: userSpellLibrary, group: spellGroups })
        .from(userSpellLibrary)
        .innerJoin(spells, eq(userSpellLibrary.spellId, spells.id))
        .leftJoin(spellGroups, eq(userSpellLibrary.groupId, spellGroups.id))
        .where(and(...conditions));
      return rows.map((r) => toGql(r.spell, user.id, true, r.lib.groupId, r.group?.nome, args.locale));
    },

    spell: async (_: unknown, args: { id: string; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.isSystem) return toGql(spell, user.id, false, null, null, args.locale);
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      return toGql(spell, user.id, true, null, null, args.locale);
    },

    srdSpells: async (_: unknown, args: { search?: string; scuola?: string; livello?: number; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const user = context.user!;

      const conditions = [eq(spells.isSystem, true), isNull(spells.creatorId)];
      if (args.scuola) conditions.push(eq(spells.scuola, args.scuola));
      if (args.livello !== undefined) conditions.push(eq(spells.livello, args.livello));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = await db.select().from(spells).where(and(...conditions));

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale));
    },

    allSpells: async (_: unknown, args: { search?: string; scuola?: string; livello?: number; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);

      const conditions = [];
      if (args.scuola) conditions.push(eq(spells.scuola, args.scuola));
      if (args.livello !== undefined) conditions.push(eq(spells.livello, args.livello));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = conditions.length
        ? await db.select().from(spells).where(and(...conditions))
        : await db.select().from(spells);

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale));
    },

    campaignSpells: async (_: unknown, args: { campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw new GraphQLError("Non sei membro di questa campagna", { extensions: { code: "FORBIDDEN" } });
      const rows = await db.select({ spell: spells }).from(campaignSpellLibrary)
        .innerJoin(spells, eq(campaignSpellLibrary.spellId, spells.id))
        .where(eq(campaignSpellLibrary.campaignId, Number(args.campaignId)));
      return rows.map((r) => toGql(r.spell, user.id, false));
    },
  },

  Mutation: {
    createSpell: async (
      _: unknown,
      args: { nome: string; descrizione?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string; groupId?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const groupId = args.groupId
        ? Number(args.groupId)
        : await getOrCreateGroup(user.id, "generale", "Generale");
      return db.transaction(async (tx) => {
        const [spell] = await tx.insert(spells).values({
          creatorId: user.id,
          nome: args.nome,
          descrizione: args.descrizione ?? null,
          scuola: args.scuola ?? null,
          livello: args.livello ?? 1,
          tempoLancio: args.tempoLancio ?? null,
          gittata: args.gittata ?? null,
          durata: args.durata ?? null,
          componenti: args.componenti ?? null,
        }).returning();
        await tx.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id, groupId });
        return toGql(spell, user.id, true, groupId, null);
      });
    },

    updateSpell: async (
      _: unknown,
      args: { id: string; nome?: string; descrizione?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw new GraphQLError("Solo il creatore può modificare l'incantesimo", { extensions: { code: "FORBIDDEN" } });
      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.scuola !== undefined) updates.scuola = args.scuola;
      if (args.livello !== undefined) updates.livello = args.livello;
      if (args.tempoLancio !== undefined) updates.tempoLancio = args.tempoLancio;
      if (args.gittata !== undefined) updates.gittata = args.gittata;
      if (args.durata !== undefined) updates.durata = args.durata;
      if (args.componenti !== undefined) updates.componenti = args.componenti;
      const [updated] = await db.update(spells).set(updates).where(eq(spells.id, spell.id)).returning();
      return toGql(updated, user.id, true);
    },

    deleteSpell: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw new GraphQLError("Solo il creatore può eliminare l'incantesimo", { extensions: { code: "FORBIDDEN" } });
      await db.delete(userSpellLibrary).where(eq(userSpellLibrary.spellId, spell.id));
      await db.delete(campaignSpellLibrary).where(eq(campaignSpellLibrary.spellId, spell.id));
      await db.delete(spells).where(eq(spells.id, spell.id));
      return true;
    },

    addSrdSpellToLibrary: async (_: unknown, args: { spellId: string; groupId?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      if (!spell.isSystem) throw new GraphQLError("Non è uno spell SRD", { extensions: { code: "BAD_USER_INPUT" } });
      const [existing] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!existing) {
        const groupId = args.groupId
          ? Number(args.groupId)
          : await getOrCreateGroup(user.id, "ufficiali", "Ufficiali");
        await db.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id, groupId });
      }
      return true;
    },

    removeSrdSpellFromLibrary: async (_: unknown, args: { spellId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      if (!spell.isSystem) throw new GraphQLError("Non è uno spell SRD", { extensions: { code: "BAD_USER_INPUT" } });
      await db.delete(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id)));
      return true;
    },

    shareSpellWithUser: async (_: unknown, args: { spellId: string; email: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw new GraphQLError("Non hai questo incantesimo in raccolta", { extensions: { code: "FORBIDDEN" } });
      const { users } = await import("@/db/schema");
      const [target] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (!target) throw new GraphQLError("Utente non trovato", { extensions: { code: "NOT_FOUND" } });
      const [existing] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, target.id))).limit(1);
      if (!existing) await db.insert(userSpellLibrary).values({ userId: target.id, spellId: spell.id });
      return true;
    },

    shareSpellWithCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw new GraphQLError("Non hai questo incantesimo in raccolta", { extensions: { code: "FORBIDDEN" } });
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw new GraphQLError("Non sei membro di questa campagna", { extensions: { code: "FORBIDDEN" } });
      const [existing] = await db.select().from(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, spell.id), eq(campaignSpellLibrary.campaignId, Number(args.campaignId)))).limit(1);
      if (!existing) await db.insert(campaignSpellLibrary).values({ spellId: spell.id, campaignId: Number(args.campaignId), sharedById: user.id });
      return true;
    },

    removeSpellFromCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member || (member.ruolo !== "master" && member.ruolo !== "owner")) {
        throw new GraphQLError("Non autorizzato", { extensions: { code: "FORBIDDEN" } });
      }
      await db.delete(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, Number(args.spellId)), eq(campaignSpellLibrary.campaignId, Number(args.campaignId))));
      return true;
    },

    upsertSpellTranslation: async (_: unknown, args: { spellId: string; locale: string; nome: string; descrizione?: string }, context: Context) => {
      assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const existing = ((spell.translations ?? {}) as TranslationsMap);
      const updated: TranslationsMap = { ...existing, [args.locale]: { nome: args.nome, descrizione: args.descrizione ?? undefined } };
      const [result] = await db.update(spells).set({ translations: updated }).where(eq(spells.id, spell.id)).returning();
      return toGql(result, null, false);
    },
  },
};
