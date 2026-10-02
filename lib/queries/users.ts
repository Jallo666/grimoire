import { gql } from "graphql-tag";

export const ME = gql`
  query Me { me { id email nome defaultTheme defaultLocale } }
`;

export const ME_ID = gql`
  query MeId { me { id } }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { id email nome defaultTheme defaultLocale }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $nome: String!) {
    register(email: $email, password: $password, nome: $nome) { id email nome defaultTheme defaultLocale }
  }
`;

export const LOGOUT = gql`
  mutation Logout { logout }
`;

export const UPDATE_EMAIL = gql`
  mutation UpdateEmail($newEmail: String!, $password: String!) {
    updateEmail(newEmail: $newEmail, password: $password) { id email nome defaultTheme defaultLocale }
  }
`;

export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($defaultTheme: String, $defaultLocale: String) {
    updatePreferences(defaultTheme: $defaultTheme, defaultLocale: $defaultLocale) {
      id email nome defaultTheme defaultLocale
    }
  }
`;
