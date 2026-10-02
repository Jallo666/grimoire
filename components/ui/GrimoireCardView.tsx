"use client";

import { useMemo, useState } from "react";
import GrimoireCard from "./GrimoireCard";
import GrimoireActionSheet from "./GrimoireActionSheet";
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
}: Props<T>) {
  const [sheetRow, setSheetRow] = useState<T | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) =>
      compareValues(a[sort.key], b[sort.key], sort.dir) ||
      (sort.thenBy ? compareValues(a[sort.thenBy], b[sort.thenBy], "asc") : 0)
    );
  }, [data, sort]);

  function sheetActions(row: T) {
    return toSheetActions(actions?.(row) ?? []);
  }

  function open(row: T) {
    if (sheetActions(row).length > 0) setSheetRow(row);
  }

  return (
    <div className={fillHeight ? styles.fill : undefined}>
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
              className={styles.card}
              onClick={() => open(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(row);
                }
              }}
            >
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
