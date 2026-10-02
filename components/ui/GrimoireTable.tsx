"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import GrimoireButton, { type Variant } from "./GrimoireButton";
import GrimoireBadge from "./GrimoireBadge";

type BadgeVariant = "secondary" | "primary" | "success" | "danger" | "warning";

export type Column<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  type?: "badge";
  badgeColors?: Partial<Record<string, BadgeVariant>>;
  render?: (value: T[keyof T], row: T, meta: Record<string, unknown>) => React.ReactNode;
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

type SortDir = "asc" | "desc";

function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  const aVal = a == null ? "" : a;
  const bVal = b == null ? "" : b;
  let result = 0;
  if (typeof aVal === "number" && typeof bVal === "number") {
    result = aVal - bVal;
  } else {
    result = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
  }
  return dir === "asc" ? result : -result;
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
}: Props<T>) {
  const t = useTranslations("ui");
  const dark = useAppSelector((s) => s.theme.value === "dark");
  const empty = emptyMessage ?? t("empty");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
    return [...data].sort((a, b) => compareValues(a[sortKey], b[sortKey], sortDir));
  }, [data, sortKey, sortDir]);

  const hasActions = !!(actions || renderActions);
  const colCount = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="table-responsive">
      <table className={`table table-hover mb-0${dark ? " g-dark" : ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
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
              <th scope="col" style={{ ...headerStyle, width: "1px", whiteSpace: "nowrap" }}>
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
            <tr>
              <td colSpan={colCount} className="text-center py-4" style={cellStyle}>
                <span style={{ color: "var(--g-text-muted)" }}>{empty}</span>
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const rawActions = actions?.(row);
              const rowActions = Array.isArray(rawActions) ? rawActions.filter((a) => !a.hidden) : [];
              return (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={String(col.key)} style={cellStyle}>
                      {col.render
                        ? col.render(row[col.key], row, meta)
                        : col.type === "badge"
                        ? <GrimoireBadge variant={col.badgeColors?.[String(row[col.key])] ?? "secondary"}>{String(row[col.key] ?? "")}</GrimoireBadge>
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {hasActions && (
                    <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
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
    </div>
  );
}
