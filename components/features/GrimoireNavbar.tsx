"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { ME, LOGOUT } from "@/lib/queries/users";
import GrimoireButton from "@/components/ui/GrimoireButton";
import ThemeToggle from "./ThemeToggle";
import LocaleToggle from "./LocaleToggle";
import { THEME_STORAGE_KEY } from "./ThemeSync";
import type { User } from "@/db/types";

const NAV_LINKS: { href: string; tKey: "home" | "campaigns" | "spells" }[] = [
  { href: "/", tKey: "home" },
  { href: "/campaigns", tKey: "campaigns" },
  { href: "/spells", tKey: "spells" },
];

export default function GrimoireNavbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data } = useQuery<{ me: Pick<User, "id" | "email" | "nome"> | null }>(ME);
  const [logout] = useMutation(LOGOUT, {
    onCompleted: () => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      window.location.href = "/login";
    },
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
              {t(link.tKey)}
            </Link>
          ))}
        </div>

        <div className="d-flex align-items-center gap-3">
          <ThemeToggle />
          <LocaleToggle />
          {user && (
            <Link
              href="/profile"
              className={`nav-link text-white small${pathname === "/profile" ? " fw-bold" : " opacity-75"}`}
              title={t("profile")}
            >
              {t("greeting", { name: user.nome ?? user.email })}
            </Link>
          )}
          <GrimoireButton variant="outline-light" size="sm" onClick={() => logout()}>
            {t("logout")}
          </GrimoireButton>
        </div>
      </div>
    </nav>
  );
}
