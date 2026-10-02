"use client";

import { useAppSelector } from "@/store/hooks";

type Option = { value: string; label: string };

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  size?: "sm";
  style?: React.CSSProperties;
};

export default function GrimoireSelect({ id, label, value, onChange, options, size, style }: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  return (
    <div className={label ? "mb-3" : undefined}>
      {label && (
        <label htmlFor={id} className="form-label" style={{ color: "var(--g-label)" }}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-select${size ? ` form-select-${size}` : ""}${dark ? " g-dark" : ""}`}
        value={value}
        onChange={onChange}
        style={{
          backgroundColor: "var(--g-input-bg)",
          borderColor: "var(--g-input-border)",
          color: "var(--g-input-text)",
          ...style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
