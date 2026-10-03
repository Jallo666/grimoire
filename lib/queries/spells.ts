import { gql } from "graphql-tag";

const SPELL_FIELDS = `id nome scuola livello gittata isOwner isSystem inLibrary concentration ritual classi { id nome } tipiDanno { id nome } groupId groupNome createdAt`;
const SPELL_FULL_FIELDS = `id nome descrizione scuola livello tempoLancio gittata durata componenti higherLevel concentration ritual classi { id nome } sottoclassi tipiDanno { id nome } creatorId isOwner isSystem inLibrary groupId groupNome createdAt translations { locale nome descrizione highLevel material }`;

export const MY_SPELLS = gql`
  query MySpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $concentration: Boolean, $ritual: Boolean, $groupIds: [ID!], $locale: String) {
    mySpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, concentration: $concentration, ritual: $ritual, groupIds: $groupIds, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const SRD_SPELLS = gql`
  query SrdSpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $concentration: Boolean, $ritual: Boolean, $locale: String) {
    srdSpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, concentration: $concentration, ritual: $ritual, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const ALL_SPELLS = gql`
  query AllSpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $concentration: Boolean, $ritual: Boolean, $locale: String) {
    allSpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, concentration: $concentration, ritual: $ritual, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const SPELL = gql`
  query Spell($id: ID!, $locale: String) {
    spell(id: $id, locale: $locale) { ${SPELL_FULL_FIELDS} }
  }
`;

export const CAMPAIGN_SPELLS = gql`
  query CampaignSpells($campaignId: ID!) {
    campaignSpells(campaignId: $campaignId) {
      id nome descrizione scuola livello isOwner
    }
  }
`;

export const CREATE_SPELL = gql`
  mutation CreateSpell(
    $nome: String!
    $descrizione: String
    $scuola: String
    $livello: Int
    $tempoLancio: String
    $gittata: String
    $durata: String
    $componenti: String
    $groupId: ID
    $translationLocale: String
    $translationNome: String
    $translationDescrizione: String
  ) {
    createSpell(
      nome: $nome descrizione: $descrizione scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
      groupId: $groupId
      translationLocale: $translationLocale translationNome: $translationNome translationDescrizione: $translationDescrizione
    ) { id nome }
  }
`;

export const UPDATE_SPELL = gql`
  mutation UpdateSpell(
    $id: ID!
    $nome: String
    $descrizione: String
    $higherLevel: String
    $scuola: String
    $livello: Int
    $tempoLancio: String
    $gittata: String
    $durata: String
    $componenti: String
  ) {
    updateSpell(
      id: $id nome: $nome descrizione: $descrizione higherLevel: $higherLevel scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
    ) { id nome descrizione higherLevel scuola livello tempoLancio gittata durata componenti isOwner }
  }
`;

export const UPSERT_SPELL_TRANSLATION = gql`
  mutation UpsertSpellTranslation($spellId: ID!, $locale: String!, $nome: String!, $descrizione: String, $highLevel: String, $material: String) {
    upsertSpellTranslation(spellId: $spellId, locale: $locale, nome: $nome, descrizione: $descrizione, highLevel: $highLevel, material: $material) {
      id translations { locale nome descrizione highLevel material }
    }
  }
`;

export const DELETE_SPELL = gql`
  mutation DeleteSpell($id: ID!) { deleteSpell(id: $id) }
`;

export const ADD_SRD_SPELL = gql`
  mutation AddSrdSpellToLibrary($spellId: ID!, $groupId: ID) { addSrdSpellToLibrary(spellId: $spellId, groupId: $groupId) }
`;

export const REMOVE_SRD_SPELL = gql`
  mutation RemoveSrdSpellFromLibrary($spellId: ID!) { removeSrdSpellFromLibrary(spellId: $spellId) }
`;

export const SHARE_SPELL_USER = gql`
  mutation ShareSpellWithUser($spellId: ID!, $email: String!) {
    shareSpellWithUser(spellId: $spellId, email: $email)
  }
`;

export const SHARE_SPELL_CAMPAIGN = gql`
  mutation ShareSpellWithCampaign($spellId: ID!, $campaignId: ID!) {
    shareSpellWithCampaign(spellId: $spellId, campaignId: $campaignId)
  }
`;

export const REMOVE_SPELL_CAMPAIGN = gql`
  mutation RemoveSpellFromCampaign($spellId: ID!, $campaignId: ID!) {
    removeSpellFromCampaign(spellId: $spellId, campaignId: $campaignId)
  }
`;

// Operazioni in blocco (restituiscono quanti incantesimi sono stati cambiati)
export const ADD_SRD_SPELLS = gql`
  mutation AddSrdSpellsToLibrary($spellIds: [ID!]!, $groupId: ID) {
    addSrdSpellsToLibrary(spellIds: $spellIds, groupId: $groupId)
  }
`;

export const REMOVE_SRD_SPELLS = gql`
  mutation RemoveSrdSpellsFromLibrary($spellIds: [ID!]!) {
    removeSrdSpellsFromLibrary(spellIds: $spellIds)
  }
`;

export const DELETE_SPELLS = gql`
  mutation DeleteSpells($ids: [ID!]!) {
    deleteSpells(ids: $ids)
  }
`;

// Classi (es. Mago) con il nome già tradotto: per il filtro per classe
export const SPELL_CLASSES = gql`
  query SpellClasses($locale: String) {
    spellClasses(locale: $locale) { id nome }
  }
`;

// Tipi di danno (es. Fuoco) con il nome già tradotto: per il filtro per tipo di danno
export const DAMAGE_TYPES = gql`
  query DamageTypes($locale: String) {
    damageTypes(locale: $locale) { id nome }
  }
`;
