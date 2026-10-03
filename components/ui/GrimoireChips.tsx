"use client";

type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  // sola lettura: si vedono le scelte ma non si possono cambiare
  disabled?: boolean;
};

// Gruppo di "pillole" a scelta multipla: si toccano per accenderle o spegnerle.
// Accesa = blu pieno, spenta = solo bordo. Comodo su telefono: tutte le scelte sono visibili.
export default function GrimoireChips({ label, options, value, onChange, disabled = false }: Props) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) onChange(value.filter((v) => v !== optionValue));
    else onChange([...value, optionValue]);
  }

  return (
    <div role="group" aria-label={label}>
      <div className="mb-2 small" style={{ color: "var(--g-label)" }}>{label}</div>
      <div className="d-flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`btn btn-sm rounded-pill ${selected ? "btn-primary" : "btn-outline-secondary"}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
