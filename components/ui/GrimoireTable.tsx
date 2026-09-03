"use client";

import { useAppSelector } from "@/store/hooks";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type Props<T extends { id: string | number }> = {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
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

export default function GrimoireTable<T extends { id: string | number }>({
  columns,
  data,
  actions,
  skeleton = false,
  skeletonRows = 3,
  emptyMessage = "Nessun elemento.",
}: Props<T>) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const colCount = columns.length + (actions ? 1 : 0);

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
            {actions && (
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
            data.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={String(col.key)} style={cellStyle}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
                {actions && (
                  <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
