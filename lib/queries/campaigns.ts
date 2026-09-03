import { gql } from "graphql-tag";

// Query usata nella home dashboard (card senza members)
export const CAMPAIGNS_HOME = gql`
  query CampaignsHome {
    campaigns {
      id nome descrizione stato unitaMisuraDefault
      owner { nome email }
    }
  }
`;

// Query usata nella lista campagne con controllo membership
export const CAMPAIGNS = gql`
  query Campaigns {
    campaigns {
      id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi
      owner { id email nome }
      members { userId }
    }
  }
`;

// Query dettaglio campagna (include me e users per il picker)
export const CAMPAIGN = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi ownerId
      owner { id email nome }
      members { id userId ruolo user { id email nome } }
    }
    me { id }
    users { id email nome }
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $nome: String!
    $descrizione: String
    $stato: String
    $unitaMisuraDefault: String
    $masterPuoModificarePersonaggi: Boolean
  ) {
    createCampaign(
      nome: $nome
      descrizione: $descrizione
      stato: $stato
      unitaMisuraDefault: $unitaMisuraDefault
      masterPuoModificarePersonaggi: $masterPuoModificarePersonaggi
    ) { id nome }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaignDetail(
    $id: ID!
    $nome: String
    $descrizione: String
    $stato: String
    $unitaMisuraDefault: String
    $masterPuoModificarePersonaggi: Boolean
  ) {
    updateCampaign(
      id: $id
      nome: $nome
      descrizione: $descrizione
      stato: $stato
      unitaMisuraDefault: $unitaMisuraDefault
      masterPuoModificarePersonaggi: $masterPuoModificarePersonaggi
    ) { id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi }
  }
`;

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) { deleteCampaign(id: $id) }
`;
