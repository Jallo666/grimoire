"use client";

import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";
import styles from "./GrimoireSelectionBar.module.css";

type Props = {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExit: () => void;
  // Bottoni delle azioni in blocco (es. Aggiungi, Sposta, Elimina)
  children: React.ReactNode;
};

// Barra fissa in basso durante la modalità selezione: ✕ per uscire, quanti sono selezionati,
// "Seleziona tutti / Deseleziona tutti" e le azioni da fare su tutti i selezionati.
export default function GrimoireSelectionBar({ count, allSelected, onToggleAll, onExit, children }: Props) {
  const t = useTranslations("ui");

  return (
    <div className={styles.bar} role="toolbar" aria-label={t("selectedCount", { count })}>
      <button
        type="button"
        className="btn btn-sm border-0 p-1 d-inline-flex"
        style={{ color: "var(--g-text)" }}
        onClick={onExit}
        aria-label={t("exitSelection")}
        title={t("exitSelection")}
      >
        <GrimoireIcon name="x-lg" size={18} />
      </button>
      <span className={styles.count}>{t("selectedCount", { count })}</span>
      <button type="button" className="btn btn-link btn-sm p-0" onClick={onToggleAll}>
        {allSelected ? t("deselectAll") : t("selectAll")}
      </button>
      <div className={styles.actions}>{children}</div>
    </div>
  );
}
