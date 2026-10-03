import { gql } from "graphql-tag";
import { eq, or, and, asc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, spells, spellMaterials, materialOptions, materialIngredients, userSpellLibrary } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import type { Context } from "./context";
import { appError } from "./errors";

// Oggetti (es. Diamante), usati come ingredienti dei componenti materiali.
// Quelli di base (SRD) li vedono tutti; quelli creati da un utente li vede lui, e chiunque veda
// un incantesimo che li usa (arrivano insieme al materiale dell'incantesimo).
export const itemTypeDefs = gql`
  type Item {
    id: ID!
    # nome nella lingua richiesta, se tradotto; altrimenti quello originale
    nome(locale: String): String!
    translations: [ItemTranslation!]!
    categoria: String
    isSystem: Boolean!
    isOwner: Boolean!
    # quanti incantesimi visibili all'utente lo usano come ingrediente
    usoCount: Int!
    # gli incantesimi visibili all'utente che lo usano, con il requisito
    incantesimi(locale: String): [ItemSpellUse!]!
  }

  type ItemTranslation {
    locale: String!
    nome: String!
  }

  type ItemSpellUse {
    spellId: ID!
    nome: String!
    livello: Int!
    quantita: Int!
    valoreMinimo: Float
    valoreTotaleMinimo: Float
    consumato: Boolean!
  }

  type Query {
    # oggetti che l'utente può usare come ingredienti: quelli di base e i suoi
    items: [Item!]!
    # pagina oggetti: tab "all" (base + miei), "srd" (base), "mine" (miei); ricerca sul nome tradotto
    itemList(tab: String, search: String, categorie: [String!], locale: String): [Item!]!
    item(id: ID!): Item
  }

  type Mutation {
    # traduzioneLocale/traduzioneNome: il nome nell'altra lingua (facoltativo)
    createItem(nome: String!, categoria: String, traduzioneLocale: String, traduzioneNome: String): Item!
    updateItem(id: ID!, nome: String!, categoria: String, traduzioneLocale: String, traduzioneNome: String): Item!
    deleteItem(id: ID!): Boolean!
  }
`;

type ItemRow = typeof items.$inferSelect;

// Oggetto per GraphQL (isOwner rispetto all'utente che chiede)
export function itemToGql(item: ItemRow, userId: number | null) {
  return { ...item, isOwner: item.creatorId != null && item.creatorId === userId };
}

const localized = (item: ItemRow, locale?: string | null) => (locale && item.translations?.[locale]?.nome) || item.nome;

// Incantesimi che l'utente vede: quelli di base e quelli della sua raccolta
function visibleSpell(userId: number) {
  return or(
    eq(spells.isSystem, true),
    inArray(spells.id, db.select({ id: userSpellLibrary.spellId }).from(userSpellLibrary).where(eq(userSpellLibrary.userId, userId))),
  );
}

// Per ogni oggetto, quanti incantesimi visibili lo usano
async function countUses(itemIds: number[], userId: number) {
  if (itemIds.length === 0) return new Map<number, number>();
  const rows = await db
    .select({ itemId: materialIngredients.itemId, n: sql<number>`count(distinct ${spells.id})::int` })
    .from(materialIngredients)
    .innerJoin(materialOptions, eq(materialIngredients.optionId, materialOptions.id))
    .innerJoin(spellMaterials, eq(materialOptions.materialId, spellMaterials.id))
    .innerJoin(spells, eq(spellMaterials.spellId, spells.id))
    .where(and(inArray(materialIngredients.itemId, itemIds), visibleSpell(userId)))
    .groupBy(materialIngredients.itemId);
  return new Map(rows.map((r) => [r.itemId, r.n]));
}

// Traduzione del nome: la si mette (o la si toglie se vuota) per quella lingua
function withTranslation(existing: ItemRow["translations"], locale?: string | null, nome?: string | null) {
  const translations = { ...(existing ?? {}) };
  if (locale) {
    if (nome?.trim()) translations[locale] = { nome: nome.trim() };
    else delete translations[locale];
  }
  return translations;
}

async function getOwnItemOrThrow(id: number, userId: number) {
  const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!item) throw appError("ITEM_NOT_FOUND");
  if (item.creatorId !== userId) throw appError("ONLY_CREATOR_EDITS_ITEM");
  return item;
}

export const itemResolvers = {
  Item: {
    nome: (parent: ItemRow, args: { locale?: string }) => localized(parent, args.locale),
    translations: (parent: ItemRow) =>
      Object.entries(parent.translations ?? {}).map(([locale, v]) => ({ locale, nome: v.nome })),
    usoCount: async (parent: ItemRow & { _usoCount?: number }, _: unknown, context: Context) => {
      if (parent._usoCount !== undefined) return parent._usoCount;
      const user = assertAuthenticated(context);
      return (await countUses([parent.id], user.id)).get(parent.id) ?? 0;
    },
    incantesimi: async (parent: ItemRow, args: { locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const rows = await db
        .select({ spell: spells, ing: materialIngredients, opt: materialOptions })
        .from(materialIngredients)
        .innerJoin(materialOptions, eq(materialIngredients.optionId, materialOptions.id))
        .innerJoin(spellMaterials, eq(materialOptions.materialId, spellMaterials.id))
        .innerJoin(spells, eq(spellMaterials.spellId, spells.id))
        .where(and(eq(materialIngredients.itemId, parent.id), visibleSpell(user.id)));
      return rows
        .map((r) => ({
          spellId: String(r.spell.id),
          nome: (args.locale && r.spell.translations?.[args.locale]?.nome) || r.spell.nome,
          livello: r.spell.livello,
          quantita: r.ing.quantita,
          valoreMinimo: r.ing.valoreMinimo,
          valoreTotaleMinimo: r.opt.valoreTotaleMinimo,
          consumato: r.ing.consumato,
        }))
        .sort((a, b) => a.livello - b.livello || a.nome.localeCompare(b.nome));
    },
  },

  Query: {
    items: async (_: unknown, __: unknown, context: Context) => {
      const user = assertAuthenticated(context);
      const rows = await db.select().from(items)
        .where(or(eq(items.isSystem, true), eq(items.creatorId, user.id)))
        .orderBy(asc(items.nome));
      return rows.map((i) => itemToGql(i, user.id));
    },

    itemList: async (
      _: unknown,
      args: { tab?: string; search?: string; categorie?: string[]; locale?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const visible = args.tab === "srd" ? eq(items.isSystem, true)
        : args.tab === "mine" ? eq(items.creatorId, user.id)
        : or(eq(items.isSystem, true), eq(items.creatorId, user.id));
      const conditions = [visible];
      if (args.categorie?.length) conditions.push(inArray(items.categoria, args.categorie));
      let rows = await db.select().from(items).where(and(...conditions));
      // ricerca sul nome nella lingua dell'interfaccia (e su quello originale)
      const q = args.search?.trim().toLowerCase();
      if (q) rows = rows.filter((i) => localized(i, args.locale).toLowerCase().includes(q) || i.nome.toLowerCase().includes(q));
      const counts = await countUses(rows.map((i) => i.id), user.id);
      return rows.map((i) => ({ ...itemToGql(i, user.id), _usoCount: counts.get(i.id) ?? 0 }));
    },

    item: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [item] = await db.select().from(items).where(eq(items.id, Number(args.id))).limit(1);
      if (!item) return null;
      // di base, mio, o usato da un incantesimo che vedo
      if (!item.isSystem && item.creatorId !== user.id && !(await countUses([item.id], user.id)).get(item.id)) {
        throw appError("FORBIDDEN");
      }
      return itemToGql(item, user.id);
    },
  },

  Mutation: {
    createItem: async (
      _: unknown,
      args: { nome: string; categoria?: string; traduzioneLocale?: string; traduzioneNome?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const nome = args.nome.trim();
      if (!nome) throw appError("ITEM_NAME_REQUIRED");
      const [item] = await db.insert(items).values({
        nome,
        categoria: args.categoria?.trim() || null,
        translations: withTranslation({}, args.traduzioneLocale, args.traduzioneNome),
        creatorId: user.id,
      }).returning();
      return itemToGql(item, user.id);
    },

    updateItem: async (
      _: unknown,
      args: { id: string; nome: string; categoria?: string; traduzioneLocale?: string; traduzioneNome?: string },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const item = await getOwnItemOrThrow(Number(args.id), user.id);
      const nome = args.nome.trim();
      if (!nome) throw appError("ITEM_NAME_REQUIRED");
      const [updated] = await db.update(items).set({
        nome,
        categoria: args.categoria?.trim() || null,
        translations: withTranslation(item.translations, args.traduzioneLocale, args.traduzioneNome),
      }).where(eq(items.id, item.id)).returning();
      return itemToGql(updated, user.id);
    },

    // Solo chi l'ha creato, e solo se nessun incantesimo lo usa
    deleteItem: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const item = await getOwnItemOrThrow(Number(args.id), user.id);
      const [used] = await db.select({ id: materialIngredients.id }).from(materialIngredients)
        .where(eq(materialIngredients.itemId, item.id)).limit(1);
      if (used) throw appError("ITEM_IN_USE");
      await db.delete(items).where(eq(items.id, item.id));
      return true;
    },
  },
};
