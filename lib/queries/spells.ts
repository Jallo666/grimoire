import { gql } from "graphql-tag";

const SPELL_FIELDS = `id nome scuola livello gittata isOwner isSystem inLibrary concentration ritual classi { id nome } tipiDanno { id nome } groupId groupNome createdAt`;
const SPELL_FULL_FIELDS = `id nome descrizione scuola livello tempoLancio gittata durata componenti higherLevel concentration ritual classi(locale: $tagsLocale) { id nome } sottoclassi tipiDanno(locale: $tagsLocale) { id nome } creatorId isOwner isSystem inLibrary groupId groupNome createdAt lingua translations { locale nome descrizione highLevel } materiale { testo perBersaglio translations { locale testo } opzioni { valoreTotaleMinimo ingredienti { quantita valoreMinimo consumato item { id nome(locale: $tagsLocale) } } } }`;

export const MY_SPELLS = gql`
  query MySpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $ingredienti: [ID!], $componenti: [String!], $concentration: Boolean, $ritual: Boolean, $groupIds: [ID!], $locale: String) {
    mySpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, ingredienti: $ingredienti, componenti: $componenti, concentration: $concentration, ritual: $ritual, groupIds: $groupIds, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const SRD_SPELLS = gql`
  query SrdSpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $ingredienti: [ID!], $componenti: [String!], $concentration: Boolean, $ritual: Boolean, $locale: String) {
    srdSpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, ingredienti: $ingredienti, componenti: $componenti, concentration: $concentration, ritual: $ritual, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const ALL_SPELLS = gql`
  query AllSpells($search: String, $scuole: [String!], $livelli: [Int!], $classi: [ID!], $tipiDanno: [ID!], $ingredienti: [ID!], $componenti: [String!], $concentration: Boolean, $ritual: Boolean, $locale: String) {
    allSpells(search: $search, scuole: $scuole, livelli: $livelli, classi: $classi, tipiDanno: $tipiDanno, ingredienti: $ingredienti, componenti: $componenti, concentration: $concentration, ritual: $ritual, locale: $locale) { ${SPELL_FIELDS} }
  }
`;

export const SPELL = gql`
  # $tagsLocale: lingua dei nomi di classi e tipi di danno (nome e descrizione restano in $locale)
  query Spell($id: ID!, $locale: String, $tagsLocale: String) {
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

// Creazione e modifica restituiscono solo l'id: i campi originali (non tradotti) finirebbero
// nella cache sopra a quelli tradotti delle liste. Le liste si ricaricano dopo il salvataggio.
export const CREATE_SPELL = gql`
  mutation CreateSpell(
    $nome: String!
    $lingua: String
    $descrizione: String
    $higherLevel: String
    $scuola: String
    $livello: Int
    $tempoLancio: String
    $gittata: String
    $durata: String
    $componenti: String
    $materiale: String
    $materialePerBersaglio: Boolean
    $materialeOpzioni: [MaterialOptionInput!]
    $groupId: ID
    $translationLocale: String
    $translationNome: String
    $translationDescrizione: String
    $translationHigherLevel: String
    $translationMateriale: String
    $classIds: [ID!]
    $damageTypeIds: [ID!]
  ) {
    createSpell(
      nome: $nome lingua: $lingua descrizione: $descrizione higherLevel: $higherLevel scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
      materiale: $materiale materialePerBersaglio: $materialePerBersaglio materialeOpzioni: $materialeOpzioni
      groupId: $groupId
      translationLocale: $translationLocale translationNome: $translationNome
      translationDescrizione: $translationDescrizione translationHigherLevel: $translationHigherLevel
      translationMateriale: $translationMateriale
      classIds: $classIds damageTypeIds: $damageTypeIds
    ) { id }
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
    $materiale: String
    $materialePerBersaglio: Boolean
    $materialeLocale: String
    $materialeTraduzione: String
    $materialeOpzioni: [MaterialOptionInput!]
    $classIds: [ID!]
    $damageTypeIds: [ID!]
  ) {
    updateSpell(
      id: $id nome: $nome descrizione: $descrizione higherLevel: $higherLevel scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
      materiale: $materiale materialePerBersaglio: $materialePerBersaglio
      materialeLocale: $materialeLocale materialeTraduzione: $materialeTraduzione materialeOpzioni: $materialeOpzioni
      classIds: $classIds damageTypeIds: $damageTypeIds
    ) { id }
  }
`;

export const UPSERT_SPELL_TRANSLATION = gql`
  mutation UpsertSpellTranslation($spellId: ID!, $locale: String!, $nome: String!, $descrizione: String, $highLevel: String) {
    upsertSpellTranslation(spellId: $spellId, locale: $locale, nome: $nome, descrizione: $descrizione, highLevel: $highLevel) {
      id translations { locale nome descrizione highLevel }
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
