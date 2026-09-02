"use client";

import { useAppSelector } from "@/store/hooks";

type Props = {
  title?: string;
  children: React.ReactNode;
  bare?: boolean;
};

export default function GrimoireCard({ title, children, bare = false }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const cardStyle = {
    backgroundColor: "var(--g-card-bg)",
    borderColor: "var(--g-card-border)",
    color: "var(--g-text)",
  };

  return (
    <div className={`card shadow-sm${dark ? " g-dark" : ""}`} style={cardStyle}>
      {bare ? (
        children
      ) : (
        <div className="card-body p-4">
          {title && (
            <h1 className="card-title h4 mb-4" style={{ color: "var(--g-text)" }}>
              {title}
            </h1>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
