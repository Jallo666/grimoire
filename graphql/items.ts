import { gql } from "graphql-tag";
import { eq, or, asc } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
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
    categoria: String
    isSystem: Boolean!
    isOwner: Boolean!
  }

  type Query {
    # oggetti che l'utente può usare come ingredienti: quelli di base e i suoi
    items: [Item!]!
  }

  type Mutation {
    createItem(nome: String!, categoria: String): Item!
  }
`;

type ItemRow = typeof items.$inferSelect;

// Oggetto per GraphQL (isOwner rispetto all'utente che chiede)
export function itemToGql(item: ItemRow, userId: number | null) {
  return { ...item, isOwner: item.creatorId != null && item.creatorId === userId };
}

export const itemResolvers = {
  Item: {
    nome: (parent: ItemRow, args: { locale?: string }) =>
      (args.locale && parent.translations?.[args.locale]?.nome) || parent.nome,
  },

  Query: {
    items: async (_: unknown, __: unknown, context: Context) => {
      const user = assertAuthenticated(context);
      const rows = await db.select().from(items)
        .where(or(eq(items.isSystem, true), eq(items.creatorId, user.id)))
        .orderBy(asc(items.nome));
      return rows.map((i) => itemToGql(i, user.id));
    },
  },

  Mutation: {
    createItem: async (_: unknown, args: { nome: string; categoria?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const nome = args.nome.trim();
      if (!nome) throw appError("ITEM_NAME_REQUIRED");
      const [item] = await db.insert(items)
        .values({ nome, categoria: args.categoria?.trim() || null, creatorId: user.id })
        .returning();
      return itemToGql(item, user.id);
    },
  },
};
