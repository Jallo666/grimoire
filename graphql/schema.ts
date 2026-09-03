import { gql } from "graphql-tag";

export const typeDefs = gql`
  type CampaignMember {
    id: ID!
    userId: Int!
    ruolo: String!
    user: User!
  }

  type Campaign {
    id: ID!
    nome: String!
    descrizione: String
    stato: String!
    createdAt: String!
    unitaMisuraDefault: String!
    masterPuoModificarePersonaggi: Boolean!
    ownerId: Int!
    owner: User
    members: [CampaignMember!]!
  }

  type User {
    id: ID!
    email: String!
    nome: String
  }

  type Query {
    campaigns: [Campaign!]!
    campaign(id: ID!): Campaign
    users: [User!]!
    me: User
  }

  type Mutation {
    createCampaign(
      nome: String!
      descrizione: String
      stato: String
      unitaMisuraDefault: String
      masterPuoModificarePersonaggi: Boolean
    ): Campaign!
    updateCampaign(
      id: ID!
      nome: String
      descrizione: String
      stato: String
      unitaMisuraDefault: String
      masterPuoModificarePersonaggi: Boolean
    ): Campaign!
    deleteCampaign(id: ID!): Boolean!
    addMember(campaignId: ID!, email: String!, ruolo: String!): CampaignMember!
    removeMember(memberId: ID!): Boolean!
    updateMemberRole(memberId: ID!, ruolo: String!): CampaignMember!
    register(email: String!, password: String!, nome: String!): User!
    login(email: String!, password: String!): User!
    logout: Boolean!
  }
`;
