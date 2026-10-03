"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type State = { v: boolean; s: boolean; m: boolean };

// "V, S, M" → caselle. Un eventuale "(testo)" vecchio stile viene ignorato:
// il testo del materiale ha il suo campo, nelle tab della lingua del form.
function parse(value: string): State {
  const base = value.replace(/\([\s\S]*\)/, "").trim();
  const parts = base.split(",").map((p) => p.trim());
  return { v: parts.includes("V"), s: parts.includes("S"), m: parts.includes("M") };
}

function format({ v, s, m }: State): string {
  const parts: string[] = [];
  if (v) parts.push("V");
  if (s) parts.push("S");
  if (m) parts.push("M");
  return parts.join(", ");
}

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  skeleton?: boolean;
};

export default function GrimoireComponentsInput({ id, label, value, onChange, disabled = false, skeleton = false }: Props) {
  const t = useTranslations("spells");
  const [state, setState] = useState<State>(() => parse(value));

  // Se il valore cambia da fuori (es. dati caricati), riallinea le caselle
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setState(parse(value));
  }

  function update(patch: Partial<State>) {
    const next = { ...state, ...patch };
    setState(next);
    onChange(format(next));
  }

  if (skeleton) {
    return (
      <div className="mb-3">
        {label && <div className="placeholder-glow mb-1"><span className="placeholder col-4 rounded" style={{ height: "14px" }} /></div>}
        <div className="placeholder-glow"><span className="placeholder col-8 rounded" style={{ height: "38px" }} /></div>
      </div>
    );
  }

  const checks: { key: keyof Pick<State, "v" | "s" | "m">; labelKey: string }[] = [
    { key: "v", labelKey: "compV" },
    { key: "s", labelKey: "compS" },
    { key: "m", labelKey: "compM" },
  ];

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label d-block" style={{ color: "var(--g-label)" }}>
          {label}
        </label>
      )}
      <div className="d-flex gap-3 flex-wrap" style={{ padding: "0.375rem 0" }}>
        {checks.map(({ key, labelKey }) => (
          <div key={key} className="form-check form-check-inline m-0">
            <input
              id={`${id}-${key}`}
              type="checkbox"
              className="form-check-input"
              checked={state[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
              disabled={disabled}
            />
            <label htmlFor={`${id}-${key}`} className="form-check-label" style={{ color: "var(--g-text)", userSelect: "none" }}>
              {t(labelKey as Parameters<typeof t>[0])}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
