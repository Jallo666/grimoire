"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { parseFeetString, toFeetString, type UnitSystem } from "@/lib/formatRange";

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  skeleton?: boolean;
};

const SPECIAL_OPTIONS = ["touch", "self", "sight", "special", "unlimited"] as const;

export default function GrimoireRangeInput({ id, label, value, onChange, disabled = false, skeleton = false }: Props) {
  const t = useTranslations("spells");
  const dark = useAppSelector((s) => s.theme.value === "dark");
  // Con il tema scuro, data-bs-theme="dark" fa usare a Bootstrap i suoi colori scuri
  // per placeholder, freccette delle select, checkbox e menu a tendina.
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const defaultUnit: UnitSystem = unitSystem || "piedi";

  const [special, setSpecial] = useState("");
  const [valore, setValore] = useState("");
  const [unita, setUnita] = useState<UnitSystem>(defaultUnit);

  useEffect(() => {
    const parsed = parseFeetString(value ?? "", defaultUnit);
    setSpecial(parsed.special);
    setValore(parsed.valore);
    setUnita(parsed.unita);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emitSpecial(val: string) {
    setSpecial(val);
    if (val) {
      const cap = val.charAt(0).toUpperCase() + val.slice(1);
      onChange(cap);
    } else {
      const feet = toFeetString(valore, unita);
      onChange(feet);
    }
  }

  function emitNumeric(newValore: string, newUnita: UnitSystem) {
    setValore(newValore);
    setUnita(newUnita);
    if (!special) onChange(toFeetString(newValore, newUnita));
  }

  const inputStyle = {
    backgroundColor: "var(--g-input-bg)",
    borderColor: "var(--g-input-border)",
    color: "var(--g-input-text)",
  };

  if (skeleton) {
    return (
      <div className="mb-3">
        {label && <div className="placeholder-glow mb-1"><span className="placeholder col-3 rounded" style={{ height: "14px" }} /></div>}
        <div className="placeholder-glow"><span className="placeholder col-12 rounded" style={{ height: "38px" }} /></div>
      </div>
    );
  }

  const unitOptions: { value: UnitSystem; label: string }[] = [
    { value: "piedi", label: t("rangeUnitPiedi") },
    { value: "metri", label: t("rangeUnitMetri") },
    { value: "quadretti", label: t("rangeUnitQuadretti") },
  ];

  const specialOptions = [
    { value: "", label: t("rangeSpecialNone") },
    ...SPECIAL_OPTIONS.map((k) => ({ value: k, label: t(`range${k.charAt(0).toUpperCase()}${k.slice(1)}` as Parameters<typeof t>[0]) })),
  ];

  return (
    <div className="mb-3" data-bs-theme={dark ? "dark" : undefined}>
      {label && (
        <label htmlFor={`${id}-special`} className="form-label" style={{ color: "var(--g-label)" }}>
          {label}
        </label>
      )}
      <div className="d-flex gap-2 flex-wrap">
        <select
          id={`${id}-special`}
          className={`form-select${dark ? " g-dark" : ""}`}
          value={special}
          onChange={(e) => emitSpecial(e.target.value)}
          disabled={disabled}
          style={{ ...inputStyle, flex: "1 1 150px", minWidth: "130px", maxWidth: special ? "100%" : "200px" }}
        >
          {specialOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {!special && (
          <>
            <input
              id={`${id}-valore`}
              type="number"
              min={0}
              className={`form-control${dark ? " g-dark" : ""}`}
              value={valore}
              onChange={(e) => emitNumeric(e.target.value, unita)}
              disabled={disabled}
              style={{ ...inputStyle, flex: "1 1 80px", minWidth: "70px" }}
            />
            <select
              id={`${id}-unita`}
              className={`form-select${dark ? " g-dark" : ""}`}
              value={unita}
              onChange={(e) => emitNumeric(valore, e.target.value as UnitSystem)}
              disabled={disabled}
              style={{ ...inputStyle, flex: "1 1 110px", minWidth: "100px" }}
            >
              {unitOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
