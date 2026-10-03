"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Option = { value: string; label: string };

type Props = {
  id: string;
  placeholder: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  // larghezza minima in px (es. nei filtri affiancati)
  minWidth?: number;
};

// Select a scelta multipla: un pulsante che sembra una select e apre un elenco di caselle da spuntare.
// Nessuna voce spuntata = mostra il placeholder (es. "Tutte le scuole").
// Una voce = mostra quella voce. Più voci = mostra la prima e quante altre (es. "Evocazione +2").
export default function GrimoireMultiSelect({ id, placeholder, options, value, onChange, minWidth }: Props) {
  const t = useTranslations("ui");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Chiude l'elenco quando si tocca fuori o si preme Esc
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) onChange(value.filter((v) => v !== optionValue));
    else onChange([...value, optionValue]);
  }

  const selected = options.filter((o) => value.includes(o.value));
  const text =
    selected.length === 0 ? placeholder
    : selected.length === 1 ? selected[0].label
    : `${selected[0].label} +${selected.length - 1}`;

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>
      <button
        id={id}
        type="button"
        className="form-select text-start text-truncate"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          backgroundColor: "var(--g-input-bg)",
          borderColor: "var(--g-input-border)",
          color: "var(--g-input-text)",
        }}
      >
        {text}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 1050,
            backgroundColor: "var(--g-card-bg)",
            border: "1px solid var(--g-card-border)",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "0.25rem 0",
          }}
        >
          {options.map((o) => (
            <label
              key={o.value}
              className="d-flex align-items-center gap-2 px-3 py-2 m-0 text-nowrap"
              style={{ color: "var(--g-text)", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={value.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              {o.label}
            </label>
          ))}

          {value.length > 0 && (
            <button
              type="button"
              className="btn btn-link btn-sm w-100 text-start px-3"
              onClick={() => onChange([])}
              style={{ borderTop: "1px solid var(--g-card-border)", borderRadius: 0 }}
            >
              {t("clearSelection")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
