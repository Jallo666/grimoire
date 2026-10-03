"use client";

import { useEffect, useMemo, useState } from "react";
import GrimoireCard from "./GrimoireCard";
import GrimoireActionSheet from "./GrimoireActionSheet";
import GrimoireIcon from "./GrimoireIcon";
import { toSheetActions, type TableAction } from "./GrimoireTable";
import { compareValues, type SortDir } from "@/lib/compareValues";
import styles from "./GrimoireCardView.module.css";

type Props<T extends { id: string | number }> = {
  data: T[];
  renderCard: (row: T) => React.ReactNode;
  // Titolo del menu delle azioni (es. il nome)
  title: (row: T) => string;
  actions?: (row: T) => TableAction[];
  // Ordine delle card: per "key", e a parità di valore per "thenBy"
  sort?: { key: keyof T; dir: SortDir; thenBy?: keyof T };
  skeleton?: boolean;
  skeletonCards?: number;
  emptyMessage: string;
  // Solo sotto i 992px, dentro una GrimoirePage con fillHeight: le card scorrono nello spazio rimasto
  fillHeight?: boolean;
  // Avvisa quando cambia l'ordine delle righe mostrate (filtri, riordino): serve per
  // scorrere al precedente/successivo nel dettaglio. Passare una funzione stabile (useCallback)
  onOrderChange?: (rows: T[]) => void;
  // Modalità selezione: tocco sulla card = seleziona (cerchio con spunta), niente menu
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
};

// Vista a card, alternativa a GrimoireTable con gli stessi dati.
// Toccando una card sale dal basso il menu con le sue azioni (le stesse della tabella).
export default function GrimoireCardView<T extends { id: string | number }>({
  data,
  renderCard,
  title,
  actions,
  sort,
  skeleton = false,
  skeletonCards = 6,
  emptyMessage,
  fillHeight = false,
  onOrderChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: Props<T>) {
  const [sheetRow, setSheetRow] = useState<T | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) =>
      compareValues(a[sort.key], b[sort.key], sort.dir) ||
      (sort.thenBy ? compareValues(a[sort.thenBy], b[sort.thenBy], "asc") : 0)
    );
  }, [data, sort]);

  useEffect(() => {
    onOrderChange?.(sorted);
  }, [sorted, onOrderChange]);

  function sheetActions(row: T) {
    return toSheetActions(actions?.(row) ?? []);
  }

  function open(row: T) {
    if (selectable) {
      const selected = selectedIds.includes(row.id);
      onSelectionChange?.(selected ? selectedIds.filter((id) => id !== row.id) : [...selectedIds, row.id]);
      return;
    }
    if (sheetActions(row).length > 0) setSheetRow(row);
  }

  return (
    <div className={[fillHeight ? styles.fill : "", selectable ? styles.selecting : ""].filter(Boolean).join(" ") || undefined}>
      {skeleton ? (
        <div className={styles.grid}>
          {Array.from({ length: skeletonCards }).map((_, i) => (
            <GrimoireCard key={i} skeleton />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <div className={styles.grid}>
          {sorted.map((row) => (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectable ? selectedIds.includes(row.id) : undefined}
              className={`${styles.card}${selectable && selectedIds.includes(row.id) ? ` ${styles.selected}` : ""}`}
              onClick={() => open(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(row);
                }
              }}
            >
              {selectable && (
                <span className={styles.check} aria-hidden="true">
                  {selectedIds.includes(row.id) && <GrimoireIcon name="check-lg" size={14} />}
                </span>
              )}
              {renderCard(row)}
            </div>
          ))}
        </div>
      )}

      {sheetRow && (
        <GrimoireActionSheet title={title(sheetRow)} actions={sheetActions(sheetRow)} onClose={() => setSheetRow(null)} />
      )}
    </div>
  );
}
