import { gql } from "graphql-tag";

export const MY_SPELLS = gql`
  query MySpells {
    mySpells {
      id nome descrizione scuola livello
      tempoLancio gittata durata componenti
      creatorId isOwner createdAt
    }
  }
`;

export const SPELL = gql`
  query Spell($id: ID!) {
    spell(id: $id) {
      id nome descrizione scuola livello
      tempoLancio gittata durata componenti
      creatorId isOwner createdAt
    }
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
