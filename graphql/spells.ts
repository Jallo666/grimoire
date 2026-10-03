import { GraphQLError } from "graphql";
import { gql } from "graphql-tag";
import { eq, and, ilike, isNull, inArray } from "drizzle-orm";
import { db } from "@/db";
import { spells, userSpellLibrary, campaignSpellLibrary, campaignMembers, spellGroups, classes, spellClasses, damageTypes, spellDamageTypes } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import { getOrCreateGroup } from "./spellGroups";
import type { Context } from "./context";

export const spellTypeDefs = gql`
  type SpellTranslation {
    locale: String!
    nome: String!
    descrizione: String
    highLevel: String
    material: String
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
    # locale facoltativo: lingua dei nomi di classi e tipi di danno, se diversa da quella della query
    classi(locale: String): [SpellClass!]!
    sottoclassi: String
    tipiDanno(locale: String): [DamageType!]!
    creatorId: Int
    createdAt: String!
    isOwner: Boolean!
    isSystem: Boolean!
    inLibrary: Boolean!
    groupId: ID
    groupNome: String
    translations: [SpellTranslation!]!
  }

  # Classe di un personaggio (es. Mago), con il nome già tradotto nella lingua richiesta
  type SpellClass {
    id: ID!
    nome: String!
  }

  # Tipo di danno (es. Fuoco), con il nome già tradotto nella lingua richiesta
  type DamageType {
    id: ID!
    nome: String!
  }

  type Query {
    spellClasses(locale: String): [SpellClass!]!
    damageTypes(locale: String): [DamageType!]!
    mySpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, groupIds: [ID!], locale: String): [Spell!]!
    spell(id: ID!, locale: String): Spell
    srdSpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    allSpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    campaignSpells(campaignId: ID!): [Spell!]!
  }

  type Mutation {
    upsertSpellTranslation(spellId: ID!, locale: String!, nome: String!, descrizione: String, highLevel: String, material: String): Spell!

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
      translationLocale: String
      translationNome: String
      translationDescrizione: String
    ): Spell!

    updateSpell(
      id: ID!
      nome: String
      descrizione: String
      higherLevel: String
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

    # Operazioni in blocco: restituiscono quanti incantesimi sono stati davvero cambiati
    addSrdSpellsToLibrary(spellIds: [ID!]!, groupId: ID): Int!
    removeSrdSpellsFromLibrary(spellIds: [ID!]!): Int!
    deleteSpells(ids: [ID!]!): Int!
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

type TranslationsMap = Record<string, { nome: string; descrizione?: string; highLevel?: string; material?: string }>;

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
  const translations = Object.entries(map).map(([l, v]) => ({
    locale: l,
    nome: v.nome,
    descrizione: v.descrizione ?? null,
    highLevel: v.highLevel ?? null,
    material: v.material ?? null,
  }));
  return {
    ...spell,
    nome: t?.nome ?? spell.nome,
    descrizione: t?.descrizione ?? spell.descrizione,
    higherLevel: (t?.highLevel ?? spell.higherLevel) || null,
    createdAt: spell.createdAt.toISOString(),
    isOwner: spell.creatorId != null && spell.creatorId === userId,
    isSystem: spell.isSystem,
    inLibrary,
    groupId: groupId ?? null,
    groupNome: groupNome ?? null,
    translations,
    // classi e tipi di danno li aggiunge withTags (liste) o i resolver Spell.* (singolo incantesimo)
    classi: undefined as TagGql[] | undefined,
    tipiDanno: undefined as TagGql[] | undefined,
    _locale: locale ?? null,
  };
}

// Filtri per classe e per tipo di danno: l'incantesimo è collegato ad almeno uno degli id scelti
function classiCondition(classIds: string[]) {
  return inArray(
    spells.id,
    db.select({ id: spellClasses.spellId }).from(spellClasses).where(inArray(spellClasses.classId, classIds.map(Number)))
  );
}

function tipiDannoCondition(damageTypeIds: string[]) {
  return inArray(
    spells.id,
    db.select({ id: spellDamageTypes.spellId }).from(spellDamageTypes).where(inArray(spellDamageTypes.damageTypeId, damageTypeIds.map(Number)))
  );
}

// Classe o tipo di danno per GraphQL: id e nome già tradotto
type TagGql = { id: string; nome: string };

// Nome nella lingua richiesta (se c'è la traduzione), altrimenti quello inglese
function localizedName(c: { nome: string; translations: Record<string, { nome: string }> | null }, locale?: string | null) {
  return (locale && c.translations?.[locale]?.nome) || c.nome;
}

// Righe { spellId, id, nome, translations } → id incantesimo → lista (in ordine alfabetico)
function groupBySpell(
  rows: { spellId: number; id: number; nome: string; translations: Record<string, { nome: string }> | null }[],
  locale?: string | null
) {
  const map = new Map<number, TagGql[]>();
  for (const r of rows) {
    const list = map.get(r.spellId) ?? [];
    list.push({ id: String(r.id), nome: localizedName(r, locale) });
    map.set(r.spellId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.nome.localeCompare(b.nome));
  return map;
}

// Classi di tanti incantesimi con una sola query
async function loadClasses(spellIds: number[], locale?: string | null) {
  if (spellIds.length === 0) return new Map<number, TagGql[]>();
  const rows = await db
    .select({ spellId: spellClasses.spellId, id: classes.id, nome: classes.nome, translations: classes.translations })
    .from(spellClasses)
    .innerJoin(classes, eq(spellClasses.classId, classes.id))
    .where(inArray(spellClasses.spellId, spellIds));
  return groupBySpell(rows, locale);
}

// Tipi di danno di tanti incantesimi con una sola query
async function loadDamageTypes(spellIds: number[], locale?: string | null) {
  if (spellIds.length === 0) return new Map<number, TagGql[]>();
  const rows = await db
    .select({ spellId: spellDamageTypes.spellId, id: damageTypes.id, nome: damageTypes.nome, translations: damageTypes.translations })
    .from(spellDamageTypes)
    .innerJoin(damageTypes, eq(spellDamageTypes.damageTypeId, damageTypes.id))
    .where(inArray(spellDamageTypes.spellId, spellIds));
  return groupBySpell(rows, locale);
}

// Aggiunge classi e tipi di danno a una lista di incantesimi già pronti per GraphQL
async function withTags<S extends { id: number }>(list: S[], locale?: string | null) {
  const ids = list.map((s) => s.id);
  const [classMap, damageMap] = await Promise.all([loadClasses(ids, locale), loadDamageTypes(ids, locale)]);
  return list.map((s) => ({ ...s, classi: classMap.get(s.id) ?? [], tipiDanno: damageMap.get(s.id) ?? [] }));
}

export const spellResolvers = {
  Spell: {
    // Già caricati dalle liste (withTags); per un singolo incantesimo, o se si chiede
    // un'altra lingua col parametro locale, si leggono qui
    classi: async (parent: { id: number; classi?: TagGql[]; _locale?: string | null }, args: { locale?: string }) =>
      (!args.locale && parent.classi) ||
      (await loadClasses([parent.id], args.locale ?? parent._locale)).get(parent.id) || [],
    tipiDanno: async (parent: { id: number; tipiDanno?: TagGql[]; _locale?: string | null }, args: { locale?: string }) =>
      (!args.locale && parent.tipiDanno) ||
      (await loadDamageTypes([parent.id], args.locale ?? parent._locale)).get(parent.id) || [],
  },

  Query: {
    spellClasses: async (_: unknown, args: { locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const rows = await db.select().from(classes);
      return rows
        .map((c) => ({ id: String(c.id), nome: localizedName(c, args.locale) }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    damageTypes: async (_: unknown, args: { locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const rows = await db.select().from(damageTypes);
      return rows
        .map((d) => ({ id: String(d.id), nome: localizedName(d, args.locale) }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    mySpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; groupIds?: string[]; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const conditions = [eq(userSpellLibrary.userId, user.id)];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));
      if (args.groupIds?.length) conditions.push(inArray(userSpellLibrary.groupId, args.groupIds.map(Number)));
      const rows = await db
        .select({ spell: spells, lib: userSpellLibrary, group: spellGroups })
        .from(userSpellLibrary)
        .innerJoin(spells, eq(userSpellLibrary.spellId, spells.id))
        .leftJoin(spellGroups, eq(userSpellLibrary.groupId, spellGroups.id))
        .where(and(...conditions));
      return withTags(rows.map((r) => toGql(r.spell, user.id, true, r.lib.groupId, r.group?.nome, args.locale)), args.locale);
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

    srdSpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const user = context.user!;

      const conditions = [eq(spells.isSystem, true), isNull(spells.creatorId)];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = await db.select().from(spells).where(and(...conditions));

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return withTags(rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale)), args.locale);
    },

    allSpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);

      const conditions = [];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = conditions.length
        ? await db.select().from(spells).where(and(...conditions))
        : await db.select().from(spells);

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return withTags(rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale)), args.locale);
    },

    campaignSpells: async (_: unknown, args: { campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw new GraphQLError("Non sei membro di questa campagna", { extensions: { code: "FORBIDDEN" } });
      const rows = await db.select({ spell: spells }).from(campaignSpellLibrary)
        .innerJoin(spells, eq(campaignSpellLibrary.spellId, spells.id))
        .where(eq(campaignSpellLibrary.campaignId, Number(args.campaignId)));
      return withTags(rows.map((r) => toGql(r.spell, user.id, false)));
    },
  },

  Mutation: {
    createSpell: async (
      _: unknown,
      args: { nome: string; descrizione?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string; groupId?: string; translationLocale?: string; translationNome?: string; translationDescrizione?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const groupId = args.groupId
        ? Number(args.groupId)
        : await getOrCreateGroup(user.id, "generale", "Generale");
      return db.transaction(async (tx) => {
        const translationsData: TranslationsMap = {};
        if (args.translationLocale && args.translationNome?.trim()) {
          translationsData[args.translationLocale] = {
            nome: args.translationNome,
            ...(args.translationDescrizione?.trim() ? { descrizione: args.translationDescrizione } : {}),
          };
        }
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
          ...(Object.keys(translationsData).length > 0 ? { translations: translationsData } : {}),
        }).returning();
        await tx.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id, groupId });
        return toGql(spell, user.id, true, groupId, null);
      });
    },

    updateSpell: async (
      _: unknown,
      args: { id: string; nome?: string; descrizione?: string; higherLevel?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw new GraphQLError("Solo il creatore può modificare l'incantesimo", { extensions: { code: "FORBIDDEN" } });
      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.higherLevel !== undefined) updates.higherLevel = args.higherLevel || null;
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
      await db.delete(spellClasses).where(eq(spellClasses.spellId, spell.id));
      await db.delete(spellDamageTypes).where(eq(spellDamageTypes.spellId, spell.id));
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

    // Aggiunge alla libreria gli incantesimi SRD della lista (salta quelli già presenti e i non SRD)
    addSrdSpellsToLibrary: async (_: unknown, args: { spellIds: string[]; groupId?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.spellIds.map(Number);
      if (ids.length === 0) return 0;
      const srd = await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.isSystem, true)));
      const already = await db.select({ spellId: userSpellLibrary.spellId }).from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.userId, user.id), inArray(userSpellLibrary.spellId, ids)));
      const alreadySet = new Set(already.map((r) => r.spellId));
      const toAdd = srd.map((r) => r.id).filter((id) => !alreadySet.has(id));
      if (toAdd.length === 0) return 0;
      let groupId: number;
      if (args.groupId) {
        groupId = Number(args.groupId);
        const [group] = await db.select().from(spellGroups)
          .where(and(eq(spellGroups.id, groupId), eq(spellGroups.userId, user.id))).limit(1);
        if (!group) throw new GraphQLError("Gruppo non trovato", { extensions: { code: "NOT_FOUND" } });
      } else {
        groupId = await getOrCreateGroup(user.id, "ufficiali", "Ufficiali");
      }
      await db.insert(userSpellLibrary).values(toAdd.map((spellId) => ({ userId: user.id, spellId, groupId })));
      return toAdd.length;
    },
    // Toglie dalla libreria gli incantesimi SRD della lista (i non SRD vengono ignorati)
    removeSrdSpellsFromLibrary: async (_: unknown, args: { spellIds: string[] }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.spellIds.map(Number);
      if (ids.length === 0) return 0;
      const srd = await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.isSystem, true)));
      if (srd.length === 0) return 0;
      const removed = await db.delete(userSpellLibrary)
        .where(and(eq(userSpellLibrary.userId, user.id), inArray(userSpellLibrary.spellId, srd.map((r) => r.id))))
        .returning({ spellId: userSpellLibrary.spellId });
      return removed.length;
    },
    // Elimina gli incantesimi della lista creati dall'utente (gli altri vengono ignorati), tutto o niente
    deleteSpells: async (_: unknown, args: { ids: string[] }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.ids.map(Number);
      if (ids.length === 0) return 0;
      const own = (await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.creatorId, user.id)))).map((r) => r.id);
      if (own.length === 0) return 0;
      await db.transaction(async (tx) => {
        await tx.delete(spellClasses).where(inArray(spellClasses.spellId, own));
        await tx.delete(spellDamageTypes).where(inArray(spellDamageTypes.spellId, own));
        await tx.delete(userSpellLibrary).where(inArray(userSpellLibrary.spellId, own));
        await tx.delete(campaignSpellLibrary).where(inArray(campaignSpellLibrary.spellId, own));
        await tx.delete(spells).where(inArray(spells.id, own));
      });
      return own.length;
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

    upsertSpellTranslation: async (_: unknown, args: { spellId: string; locale: string; nome: string; descrizione?: string; highLevel?: string; material?: string }, context: Context) => {
      assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const existing = ((spell.translations ?? {}) as TranslationsMap);
      const updated: TranslationsMap = {
        ...existing,
        [args.locale]: {
          nome: args.nome,
          descrizione: args.descrizione ?? undefined,
          highLevel: args.highLevel ?? undefined,
          material: args.material ?? undefined,
        },
      };
      const [result] = await db.update(spells).set({ translations: updated }).where(eq(spells.id, spell.id)).returning();
      return toGql(result, null, false);
    },
  },
};
