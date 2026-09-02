import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Campaign {
    id: ID!
    nome: String!
    ownerId: Int!
  }

  type User {
    id: ID!
    email: String!
    nome: String
  }

  type Query {
    campaigns: [Campaign!]!
    me: User
  }

  type Mutation {
    createCampaign(nome: String!): Campaign!
    register(email: String!, password: String!, nome: String!): User!
    login(email: String!, password: String!): User!
    logout: Boolean!
  }
`;
