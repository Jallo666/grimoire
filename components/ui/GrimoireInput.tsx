"use client";

import { useAppSelector } from "@/store/hooks";

export type InputOption = { value: string; label: string };

type Props = {
  id: string;
  label?: string;
  type?: "text" | "email" | "password" | "checkbox" | "select";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  skeleton?: boolean;
  disabled?: boolean;
  options?: InputOption[];
};

export default function GrimoireInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  skeleton = false,
  disabled = false,
  options = [],
}: Props) {
  const dark = useAppSelector((s) => s.theme.value === "dark");

  if (skeleton) {
    return (
      <div className={`mb-3${dark ? " g-dark" : ""}`}>
        {label && (
          <div className="placeholder-glow mb-1">
            <span className="placeholder col-3 rounded" style={{ height: "14px" }} />
          </div>
        )}
        <div className="placeholder-glow">
          <span className="placeholder col-12 rounded" style={{ height: "38px" }} />
        </div>
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div className={`form-check mb-3${dark ? " g-dark" : ""}`}>
        <input
          id={id}
          type="checkbox"
          className="form-check-input"
          checked={value === "true"}
          onChange={(e) => {
            const synthetic = {
              ...e,
              target: { ...e.target, value: e.target.checked ? "true" : "false" },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(synthetic);
          }}
          required={required}
          disabled={disabled}
        />
        {label && (
          <label htmlFor={id} className="form-check-label" style={{ color: "var(--g-label)" }}>
            {label}
          </label>
        )}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="mb-3">
        {label && (
          <label htmlFor={id} className="form-label" style={{ color: "var(--g-label)" }}>
            {label}
          </label>
        )}
        <select
          id={id}
          className={`form-select${dark ? " g-dark" : ""}`}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          style={{
            backgroundColor: "var(--g-input-bg)",
            borderColor: "var(--g-input-border)",
            color: "var(--g-input-text)",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={label ? "mb-3" : undefined}>
      {label && (
        <label htmlFor={id} className="form-label" style={{ color: "var(--g-label)" }}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`form-control${dark ? " g-dark" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          backgroundColor: "var(--g-input-bg)",
          borderColor: "var(--g-input-border)",
          color: "var(--g-input-text)",
        }}
      />
    </div>
  );
}
