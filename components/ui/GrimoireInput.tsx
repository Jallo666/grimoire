"use client";

import { useAppSelector } from "@/store/hooks";

type Props = {
  id: string;
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  skeleton?: boolean;
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
        style={{
          backgroundColor: "var(--g-input-bg)",
          borderColor: "var(--g-input-border)",
          color: "var(--g-input-text)",
        }}
      />
    </div>
  );
}
