"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/campaigns", label: "Campagne" },
];

export default function GrimoireNavbar() {
  const pathname = usePathname();
  const { data } = useQuery<{ me: Pick<User, "id" | "email" | "nome"> | null }>(ME);
  const [logout] = useMutation(LOGOUT, {
    onCompleted: () => { window.location.href = "/login"; },
  });

  const user = data?.me;

  return (
    <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
      <div className="container">
        <Link className="navbar-brand" href="/">Grimoire</Link>

        <div className="navbar-nav flex-row gap-1 me-auto ms-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link px-3 text-white${pathname === link.href ? " fw-bold" : " opacity-75"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

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
