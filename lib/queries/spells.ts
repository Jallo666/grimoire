import { gql } from "graphql-tag";

const SPELL_FIELDS = `id nome scuola livello gittata isOwner isSystem inLibrary concentration ritual classi createdAt`;
const SPELL_FULL_FIELDS = `id nome descrizione scuola livello tempoLancio gittata durata componenti higherLevel concentration ritual classi sottoclassi creatorId isOwner isSystem inLibrary createdAt`;

export const MY_SPELLS = gql`
  query MySpells($search: String, $scuola: String, $livello: Int, $concentration: Boolean, $ritual: Boolean) {
    mySpells(search: $search, scuola: $scuola, livello: $livello, concentration: $concentration, ritual: $ritual) { ${SPELL_FIELDS} }
  }
`;

export const SRD_SPELLS = gql`
  query SrdSpells($search: String, $scuola: String, $livello: Int, $concentration: Boolean, $ritual: Boolean) {
    srdSpells(search: $search, scuola: $scuola, livello: $livello, concentration: $concentration, ritual: $ritual) { ${SPELL_FIELDS} }
  }
`;

export const ALL_SPELLS = gql`
  query AllSpells($search: String, $scuola: String, $livello: Int, $concentration: Boolean, $ritual: Boolean) {
    allSpells(search: $search, scuola: $scuola, livello: $livello, concentration: $concentration, ritual: $ritual) { ${SPELL_FIELDS} }
  }
`;

export const SPELL = gql`
  query Spell($id: ID!) {
    spell(id: $id) { ${SPELL_FULL_FIELDS} }
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
  ) {
    createSpell(
      nome: $nome descrizione: $descrizione scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
    ) { id nome }
  }
`;

export const UPDATE_SPELL = gql`
  mutation UpdateSpell(
    $id: ID!
    $nome: String
    $descrizione: String
    $scuola: String
    $livello: Int
    $tempoLancio: String
    $gittata: String
    $durata: String
    $componenti: String
  ) {
    updateSpell(
      id: $id nome: $nome descrizione: $descrizione scuola: $scuola livello: $livello
      tempoLancio: $tempoLancio gittata: $gittata durata: $durata componenti: $componenti
    ) { id nome descrizione scuola livello tempoLancio gittata durata componenti isOwner }
  }
`;

export const DELETE_SPELL = gql`
  mutation DeleteSpell($id: ID!) { deleteSpell(id: $id) }
`;

export const ADD_SRD_SPELL = gql`
  mutation AddSrdSpellToLibrary($spellId: ID!) { addSrdSpellToLibrary(spellId: $spellId) }
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
