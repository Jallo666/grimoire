"use client";

import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";

type Props = { onClick: () => void };

// Pulsante ☰ per aprire il menu, solo icona senza bordo.
// Visibile solo sotto i 992px (d-lg-none): su desktop non esiste.
export default function GrimoireHamburger({ onClick }: Props) {
  const t = useTranslations("ui");

  return (
    <button
      type="button"
      className="btn btn-sm border-0 p-1 d-inline-flex d-lg-none align-items-center"
      style={{ color: "var(--g-page-title)" }}
      onClick={onClick}
      aria-label={t("openMenu")}
      title={t("openMenu")}
    >
      <GrimoireIcon name="list" size={26} />
    </button>
  );
}
