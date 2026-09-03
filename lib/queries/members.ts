import { gql } from "graphql-tag";

export const ADD_MEMBER = gql`
  mutation AddMember($campaignId: ID!, $email: String!, $ruolo: String!) {
    addMember(campaignId: $campaignId, email: $email, ruolo: $ruolo) {
      id userId ruolo user { id email nome }
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($memberId: ID!) { removeMember(memberId: $memberId) }
`;

export const UPDATE_ROLE = gql`
  mutation UpdateMemberRole($memberId: ID!, $ruolo: String!) {
    updateMemberRole(memberId: $memberId, ruolo: $ruolo) { id ruolo }
  }
`;
