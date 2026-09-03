"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import GrimoireButton from "./GrimoireButton";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export type TableAction = {
  icon?: string;
  label?: string;
  tooltip?: string;
  variant?: "primary" | "outline-secondary" | "danger" | "outline-light";
  href?: string;
  onClick?: () => void;
  hidden?: boolean;
};

type Props<T extends { id: string | number }> = {
  columns: Column<T>[];
  data: T[];
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

export default function GrimoireTable<T extends { id: string | number }>({
  columns,
  data,
  actions,
  renderActions,
  skeleton = false,
  skeletonRows = 3,
  emptyMessage = "Nessun elemento.",
}: Props<T>) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const hasActions = !!(actions || renderActions);
  const colCount = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="table-responsive">
      <table className={`table table-hover mb-0${dark ? " g-dark" : ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} scope="col" style={headerStyle}>
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th scope="col" style={{ ...headerStyle, width: "1px", whiteSpace: "nowrap" }}>
                Azioni
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
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="text-center py-4" style={cellStyle}>
                <span style={{ color: "var(--g-text-muted)" }}>{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowActions = actions?.(row).filter((a) => !a.hidden) ?? [];
              return (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={String(col.key)} style={cellStyle}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
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
