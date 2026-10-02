"use client";

export type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
};

export default function GrimoireTabs({ tabs, active, onChange }: Props) {
  return (
    <ul className="nav nav-tabs mb-4" style={{ borderColor: "var(--g-card-border)" }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <li key={tab.key} className="nav-item">
            <button
              className={`nav-link${isActive ? " active" : ""}`}
              onClick={() => onChange(tab.key)}
              style={{
                color: isActive ? "var(--g-text)" : "var(--g-text-muted)",
                backgroundColor: isActive ? "var(--g-card-bg)" : "transparent",
                borderColor: isActive ? `var(--g-card-border) var(--g-card-border) var(--g-card-bg)` : "transparent",
                borderBottom: isActive ? `2px solid var(--bs-primary)` : undefined,
              }}
            >
              {tab.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
