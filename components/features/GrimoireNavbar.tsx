"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import GrimoireButton from "@/components/ui/GrimoireButton";
import ThemeToggle from "./ThemeToggle";
import type { User } from "@/db/types";

const ME = gql`
  query Me {
    me {
      id
      email
      nome
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export default function GrimoireNavbar() {
  const { data } = useQuery<{ me: Pick<User, "id" | "email" | "nome"> | null }>(ME);
  const [logout] = useMutation(LOGOUT, {
    onCompleted: () => { window.location.href = "/login"; },
  });

  const user = data?.me;

  return (
    <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
      <div className="container">
        <a className="navbar-brand" href="/">Grimoire</a>
        <div className="d-flex align-items-center gap-3">
          <ThemeToggle />
          {user && (
            <span className="text-white small">Ciao, {user.nome ?? user.email}</span>
          )}
          <GrimoireButton variant="outline-light" size="sm" onClick={() => logout()}>
            Logout
          </GrimoireButton>
        </div>
      </div>
    </nav>
  );
}
