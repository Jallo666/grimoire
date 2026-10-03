"use client";

import styles from "./GrimoireTabs.module.css";

// shortLabel (facoltativa): etichetta corta usata sotto i 992px al posto di label
export type Tab = { key: string; label: string; shortLabel?: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  // Facoltativo: qualcosa da mettere a destra delle tab (es. l'icona dei filtri)
  action?: React.ReactNode;
};

export default function GrimoireTabs({ tabs, active, onChange, action }: Props) {
  return (
    <ul className={`nav nav-tabs mb-4 ${styles.tabs}`} style={{ borderColor: "var(--g-card-border)" }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <li key={tab.key} className={`nav-item ${styles.tab}`}>
            <button
              type="button"
              className={`nav-link${isActive ? " active" : ""}`}
              onClick={() => onChange(tab.key)}
              style={{
                color: isActive ? "var(--g-text)" : "var(--g-text-muted)",
                backgroundColor: isActive ? "var(--g-card-bg)" : "transparent",
                borderColor: isActive ? `var(--g-card-border) var(--g-card-border) var(--g-card-bg)` : "transparent",
                borderBottom: isActive ? `2px solid var(--bs-primary)` : undefined,
              }}
            >
              <span className="d-lg-none">{tab.shortLabel ?? tab.label}</span>
              <span className="d-none d-lg-inline">{tab.label}</span>
            </button>
          </li>
        );
      })}
      {action && <li className="nav-item ms-auto ps-2 d-flex align-items-center">{action}</li>}
    </ul>
  );
}
