import { gql } from "graphql-tag";

// Oggetti usabili come ingredienti: quelli di base e quelli dell'utente (nome nella lingua richiesta)
export const ITEMS = gql`
  query Items($locale: String) {
    items { id nome(locale: $locale) categoria isSystem isOwner }
  }
`;

export const CREATE_ITEM = gql`
  mutation CreateItem($nome: String!, $categoria: String) {
    createItem(nome: $nome, categoria: $categoria) { id }
  }
`;
