import { gql } from "graphql-tag";

export const ME = gql`
  query Me { me { id email nome } }
`;

export const ME_ID = gql`
  query MeId { me { id } }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { id email nome }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $nome: String!) {
    register(email: $email, password: $password, nome: $nome) { id email nome }
  }
`;

export const LOGOUT = gql`
  mutation Logout { logout }
`;
