import { gql } from "graphql-tag";

// Oggetti usabili come ingredienti: quelli di base e quelli dell'utente (nome nella lingua richiesta)
export const ITEMS = gql`
  query Items($locale: String) {
    items { id nome(locale: $locale) categoria isSystem isOwner }
  }
`;

export const CREATE_ITEM = gql`
  mutation CreateItem($nome: String!, $categoria: String, $traduzioneLocale: String, $traduzioneNome: String) {
    createItem(nome: $nome, categoria: $categoria, traduzioneLocale: $traduzioneLocale, traduzioneNome: $traduzioneNome) { id }
  }
`;

// Pagina oggetti
const ITEM_FIELDS = `id nome(locale: $locale) categoria isSystem isOwner usoCount`;

export const ITEM_LIST = gql`
  query ItemList($tab: String, $search: String, $categorie: [String!], $locale: String) {
    itemList(tab: $tab, search: $search, categorie: $categorie, locale: $locale) { ${ITEM_FIELDS} }
  }
`;

// Dettaglio: nome originale e traduzioni (per il form), e gli incantesimi che lo usano
export const ITEM = gql`
  query Item($id: ID!, $locale: String) {
    item(id: $id) {
      ${ITEM_FIELDS}
      nomeOriginale: nome
      translations { locale nome }
      incantesimi(locale: $locale) { spellId nome livello quantita valoreMinimo valoreTotaleMinimo consumato }
    }
  }
`;

export const UPDATE_ITEM = gql`
  mutation UpdateItem($id: ID!, $nome: String!, $categoria: String, $traduzioneLocale: String, $traduzioneNome: String) {
    updateItem(id: $id, nome: $nome, categoria: $categoria, traduzioneLocale: $traduzioneLocale, traduzioneNome: $traduzioneNome) { id }
  }
`;

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) { deleteItem(id: $id) }
`;
