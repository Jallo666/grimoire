import { gql } from "graphql-tag";

export const MY_SPELL_GROUPS = gql`
  query MySpellGroups {
    mySpellGroups { id nome }
  }
`;

export const CREATE_SPELL_GROUP = gql`
  mutation CreateSpellGroup($nome: String!) {
    createSpellGroup(nome: $nome) { id nome }
  }
`;

export const RENAME_SPELL_GROUP = gql`
  mutation RenameSpellGroup($id: ID!, $nome: String!) {
    renameSpellGroup(id: $id, nome: $nome) { id nome }
  }
`;

export const DELETE_SPELL_GROUP = gql`
  mutation DeleteSpellGroup($id: ID!) { deleteSpellGroup(id: $id) }
`;

export const MOVE_SPELL_TO_GROUP = gql`
  mutation MoveSpellToGroup($spellId: ID!, $groupId: ID!) { moveSpellToGroup(spellId: $spellId, groupId: $groupId) }
`;

export const MOVE_SPELLS_TO_GROUP = gql`
  mutation MoveSpellsToGroup($spellIds: [ID!]!, $groupId: ID!) {
    moveSpellsToGroup(spellIds: $spellIds, groupId: $groupId)
  }
`;
