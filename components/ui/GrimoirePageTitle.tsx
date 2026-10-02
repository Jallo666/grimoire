"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./GrimoirePageTitle.module.css";

// id del posto nella barra in alto (GrimoireNavbar) dove, su mobile, vanno titolo e bottoni della pagina
export const MOBILE_HEADER_ID = "g-mobile-header";

type Props = {
  children: React.ReactNode;
  showBack?: boolean;
  action?: React.ReactNode;
};

// Legge dal DOM il posto nella barra in alto. useSyncExternalStore lo ricontrolla dopo che la
// barra è comparsa, e sul server (dove il DOM non c'è) restituisce null.
const noSubscription = () => () => {};

function useMobileHeaderSlot() {
  return useSyncExternalStore(
    noSubscription,
    () => document.getElementById(MOBILE_HEADER_ID),
    () => null
  );
}

// Titolo della pagina con eventuali bottoni (action) e freccia indietro (showBack).
// Desktop (da 992px): riga sotto la barra, titolo a sinistra e bottoni a destra.
// Tablet e telefono (sotto i 992px): titolo e bottoni vanno dentro la barra in alto, accanto al ☰,
// e la riga sotto sparisce (più spazio per il contenuto). I bottoni usano mobileIcon (solo icona).
export default function GrimoirePageTitle({ children, showBack = false, action }: Props) {
  const t = useTranslations("ui");
  const router = useRouter();
  const slot = useMobileHeaderSlot();

  const backButton = showBack && (
    <button
      onClick={() => router.back()}
      className="btn btn-outline-secondary btn-sm"
      aria-label={t("back")}
    >
      ←
    </button>
  );

  // Versione per la barra in alto (mobile)
  const mobileHeader = slot && createPortal(
    <div className={styles.header}>
      {backButton}
      <h1 className={styles.headerTitle}>{children}</h1>
      {action !== undefined && <div className={styles.headerAction}>{action}</div>}
    </div>,
    slot
  );

  // Versione nella pagina (desktop)
  const titleBlock = (
    <div className="d-flex align-items-center gap-3">
      {backButton}
      <h2
        className="mb-0"
        style={{ color: "var(--g-page-title)", fontWeight: 700 }}
      >
        {children}
      </h2>
    </div>
  );

  return (
    <>
      {mobileHeader}
      {action !== undefined ? (
        <div className="d-none d-lg-flex justify-content-between align-items-center mb-4">
          {titleBlock}
          <div>{action}</div>
        </div>
      ) : (
        <div className="d-none d-lg-block mb-4">{titleBlock}</div>
      )}
    </>
  );
}
