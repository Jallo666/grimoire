"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { ME, LOGOUT } from "@/lib/queries/users";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireHamburger from "@/components/ui/GrimoireHamburger";
import GrimoireSidenav from "@/components/ui/GrimoireSidenav";
import GrimoireSidenavLink from "@/components/ui/GrimoireSidenavLink";
import AppLogo from "@/components/ui/AppLogo";
import { MOBILE_HEADER_ID } from "@/components/ui/GrimoirePageTitle";
import ThemeToggle from "./ThemeToggle";
import LocaleToggle from "./LocaleToggle";
import { THEME_STORAGE_KEY } from "./ThemeSync";
import styles from "./GrimoireNavbar.module.css";
import type { User } from "@/db/types";

const NAV_LINKS: { href: string; tKey: "home" | "campaigns" | "spells" | "items" }[] = [
  { href: "/", tKey: "home" },
  { href: "/campaigns", tKey: "campaigns" },
  { href: "/spells", tKey: "spells" },
  { href: "/items", tKey: "items" },
];

export default function GrimoireNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("nav");
  const { data } = useQuery<{ me: Pick<User, "id" | "email" | "nome"> | null }>(ME);
  const [logout] = useMutation(LOGOUT, {
    onCompleted: () => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      window.location.href = "/login";
    },
  });

  const user = data?.me;
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className={`navbar navbar-expand-lg bg-primary ${styles.navbar}`} data-bs-theme="dark">
        <div className="container">
          {/* Mobile: ☰ e poi titolo e bottoni della pagina (li mette GrimoirePageTitle nel posto qui sotto).
              Desktop: solo il nome "Grimoire", il ☰ e il posto per il titolo sono nascosti */}
          <div className="d-flex align-items-center gap-2 flex-grow-1 flex-lg-grow-0" style={{ minWidth: 0 }}>
            <GrimoireHamburger onClick={() => setMenuOpen(true)} />
            <Link className="navbar-brand d-none d-lg-inline-block" href="/">Grimoire</Link>
            <div id={MOBILE_HEADER_ID} className="d-flex d-lg-none flex-grow-1 align-items-center" style={{ minWidth: 0 }} />
          </div>

          {/* Desktop (da 992px): link e azioni nella barra, come prima. Sotto i 992px sono nel menu laterale */}
          <div className="navbar-nav flex-row gap-1 me-auto ms-4 d-none d-lg-flex">
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

          <div className="d-none d-lg-flex align-items-center gap-3">
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

      <GrimoireSidenav
        show={menuOpen}
        onClose={closeMenu}
        title="Grimoire"
        subtitle={user ? t("greeting", { name: user.nome ?? user.email }) : undefined}
        logo={<AppLogo width={32} />}
        footer={
          <>
            <div className="d-flex justify-content-between align-items-center">
              <ThemeToggle />
              <LocaleToggle />
            </div>
            <GrimoireButton variant="outline-light" fullWidth onClick={() => logout()}>
              {t("logout")}
            </GrimoireButton>
          </>
        }
      >
        {NAV_LINKS.map((link) => (
          <GrimoireSidenavLink key={link.href} href={link.href} active={pathname === link.href} onClick={closeMenu}>
            {t(link.tKey)}
          </GrimoireSidenavLink>
        ))}
        <GrimoireSidenavLink href="/profile" active={pathname === "/profile"} onClick={closeMenu}>
          {t("profile")}
        </GrimoireSidenavLink>
      </GrimoireSidenav>
    </>
  );
}
