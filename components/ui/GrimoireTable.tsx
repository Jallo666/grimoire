"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import GrimoireButton, { type Variant } from "./GrimoireButton";
import GrimoireBadge from "./GrimoireBadge";
import GrimoireActionSheet, { type SheetAction } from "./GrimoireActionSheet";
import styles from "./GrimoireTable.module.css";
import { compareValues, type SortDir } from "@/lib/compareValues";

type BadgeVariant = "secondary" | "primary" | "success" | "danger" | "warning";

export type Column<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  type?: "badge";
  badgeColors?: Partial<Record<string, BadgeVariant>>;
  // Testo da mostrare nel badge per ogni valore (es. traduzioni); il riordino usa questo testo
  badgeLabels?: Partial<Record<string, string>>;
  render?: (value: T[keyof T], row: T, meta: Record<string, unknown>) => React.ReactNode;
  // Solo sotto i 992px: la colonna resta ferma a sinistra e le altre scorrono di lato.
  // Da usare su una sola colonna, di solito la prima (es. il nome).
  leader?: boolean;
};

export type TableAction = {
  icon?: string;
  label?: string;
  tooltip?: string;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  hidden?: boolean;
};

type Props<T extends { id: string | number }> = {
  columns: Column<T>[];
  data: T[];
  meta?: Record<string, unknown>;
  actions?: (row: T) => TableAction[];
  renderActions?: (row: T) => React.ReactNode;
  skeleton?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  // Solo sotto i 992px, dentro una GrimoirePage con fillHeight: la tabella prende lo spazio
  // rimasto e scorre al suo interno, con i titoli delle colonne fermi in alto
  fillHeight?: boolean;
  // Ordinamento iniziale (es. { key: "livello", dir: "asc" }); l'utente può poi cambiarlo dai titoli
  defaultSort?: { key: keyof T; dir: SortDir };
  // Avvisa quando cambia l'ordine delle righe mostrate (filtri, riordino): serve per
  // scorrere al precedente/successivo nel dettaglio. Passare una funzione stabile (useCallback)
  onOrderChange?: (rows: T[]) => void;
};

const cellStyle = {
  backgroundColor: "var(--g-table-bg)",
  borderColor: "var(--g-table-border)",
  color: "var(--g-table-text)",
};

const headerStyle = {
  backgroundColor: "var(--g-table-header-bg)",
  borderColor: "var(--g-table-border)",
  color: "var(--g-table-header-text)",
};

// Trasforma le azioni della tabella nelle voci del menu dal basso (GrimoireActionSheet):
// il testo è label o tooltip, le azioni "danger" sono in rosso
export function toSheetActions(actions: TableAction[]): SheetAction[] {
  return actions.filter((a) => !a.hidden).map((a) => ({
    label: a.label ?? a.tooltip ?? "",
    icon: a.icon,
    danger: a.variant === "danger",
    href: a.href,
    onClick: a.onClick,
  }));
}

function ActionButton({ action }: { action: TableAction }) {
  const btn = (
    <GrimoireButton
      icon={action.icon}
      tooltip={action.tooltip}
      variant={action.variant ?? "outline-secondary"}
      size="sm"
      onClick={action.href ? undefined : action.onClick}
    >
      {action.label}
    </GrimoireButton>
  );

  if (action.href) {
    return <Link href={action.href}>{btn}</Link>;
  }
  return btn;
}

export default function GrimoireTable<T extends { id: string | number }>({
  columns,
  data,
  meta = {},
  actions,
  renderActions,
  skeleton = false,
  skeletonRows = 3,
  emptyMessage,
  fillHeight = false,
  defaultSort,
  onOrderChange,
}: Props<T>) {
  const t = useTranslations("ui");
  const empty = emptyMessage ?? t("empty");
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSort?.dir ?? "asc");

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    // Con badgeLabels si riordina per il testo mostrato (es. il nome tradotto), non per il valore salvato
    const labels = columns.find((c) => c.key === sortKey)?.badgeLabels;
    const valueOf = (row: T) => (labels ? labels[String(row[sortKey])] ?? row[sortKey] : row[sortKey]);
    // A parità di valore, ordine alfabetico sulla colonna leader (es. il nome)
    const tieKey = columns.find((c) => c.leader)?.key;
    return [...data].sort((a, b) =>
      compareValues(valueOf(a), valueOf(b), sortDir) ||
      (tieKey && tieKey !== sortKey ? compareValues(a[tieKey], b[tieKey], "asc") : 0)
    );
  }, [data, columns, sortKey, sortDir]);

  useEffect(() => {
    onOrderChange?.(sorted);
  }, [sorted, onOrderChange]);

  const hasActions = !!(actions || renderActions);

  // Tabella a tutta altezza e vuota: su mobile il messaggio va al centro dello spazio
  const showCenteredEmpty = fillHeight && !skeleton && sorted.length === 0;

  // Sotto i 992px la colonna Azioni è nascosta: toccando una riga sale dal basso
  // un menu con le stesse azioni (solo per le azioni definite con "actions")
  const sheetEnabled = !!actions && !renderActions;
  const [sheetRow, setSheetRow] = useState<T | null>(null);
  const titleColumn = columns.find((c) => c.leader) ?? columns[0];

  function handleRowClick(row: T) {
    if (!sheetEnabled || !window.matchMedia("(max-width: 991.98px)").matches) return;
    if (visibleActions(row).length > 0) setSheetRow(row);
  }

  function visibleActions(row: T) {
    return (actions?.(row) ?? []).filter((a) => !a.hidden);
  }
  const colCount = columns.length + (hasActions ? 1 : 0);

  return (
    <div className={`table-responsive${fillHeight ? ` ${styles.fill}` : ""}${showCenteredEmpty ? ` ${styles.fillEmpty}` : ""}`}>
      <table className={`table table-hover mb-0 ${styles.table}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={col.leader ? styles.leader : undefined}
                style={{
                  ...headerStyle,
                  cursor: col.sortable ? "pointer" : undefined,
                  userSelect: col.sortable ? "none" : undefined,
                }}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: "4px", fontSize: "0.7rem" }}>
                    {sortDir === "asc" ? "▲" : "▼"}
                  </span>
                )}
                {col.sortable && sortKey !== col.key && (
                  <span style={{ marginLeft: "4px", fontSize: "0.7rem", opacity: 0.3 }}>▲▼</span>
                )}
              </th>
            ))}
            {hasActions && (
              <th scope="col" className={sheetEnabled ? styles.actionsColumn : undefined} style={{ ...headerStyle, width: "1px", whiteSpace: "nowrap" }}>
                {t("actions")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {skeleton ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: colCount }).map((__, j) => (
                  <td key={j} style={cellStyle}>
                    <div className="placeholder-glow">
                      <span className="placeholder col-8 rounded" style={{ height: "16px" }} />
                    </div>
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr className={showCenteredEmpty ? styles.emptyRow : undefined}>
              <td colSpan={colCount} className="text-center py-4" style={cellStyle}>
                <span style={{ color: "var(--g-text-muted)" }}>{empty}</span>
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const rawActions = actions?.(row);
              const rowActions = Array.isArray(rawActions) ? rawActions.filter((a) => !a.hidden) : [];
              return (
                <tr key={row.id} className={sheetEnabled ? styles.tappableRow : undefined} onClick={() => handleRowClick(row)}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className={col.leader ? styles.leader : undefined} style={cellStyle}>
                      {col.render
                        ? col.render(row[col.key], row, meta)
                        : col.type === "badge"
                        ? <GrimoireBadge variant={col.badgeColors?.[String(row[col.key])] ?? "secondary"}>{col.badgeLabels?.[String(row[col.key])] ?? String(row[col.key] ?? "")}</GrimoireBadge>
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {hasActions && (
                    <td className={sheetEnabled ? styles.actionsColumn : undefined} style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                      {renderActions ? (
                        renderActions(row)
                      ) : (
                        <div className="d-flex gap-1">
                          {rowActions.map((a, i) => (
                            <ActionButton key={i} action={a} />
                          ))}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showCenteredEmpty && <div className={styles.emptyMessage}>{empty}</div>}

      {sheetRow && (
        <GrimoireActionSheet
          title={String(sheetRow[titleColumn.key] ?? "")}
          actions={toSheetActions(visibleActions(sheetRow))}
          onClose={() => setSheetRow(null)}
        />
      )}
    </div>
  );
}
