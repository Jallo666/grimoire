"use client";

import { useAppSelector } from "@/store/hooks";

type Props = {
  title?: string;
  children?: React.ReactNode;
  bare?: boolean;
  skeleton?: boolean;
};

export default function GrimoireCard({ title, children, bare = false, skeleton = false }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  const cardStyle = {
    backgroundColor: "var(--g-card-bg)",
    borderColor: "var(--g-card-border)",
    color: "var(--g-text)",
  };

  if (skeleton) {
    return (
      <div className={`card shadow-sm h-100${dark ? " g-dark" : ""}`} style={cardStyle}>
        <div className="card-body p-4">
          <div className="placeholder-glow">
            <span className="placeholder col-7 rounded mb-3 d-block" style={{ height: "24px" }} />
            <span className="placeholder col-10 rounded mb-2 d-block" style={{ height: "14px" }} />
            <span className="placeholder col-5 rounded" style={{ height: "14px" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card shadow-sm h-100${dark ? " g-dark" : ""}`} style={cardStyle}>
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
