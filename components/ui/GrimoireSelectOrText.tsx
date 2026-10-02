"use client";

import { useState, useEffect } from "react";

type Option = { value: string; label: string };

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  customLabel: string;
  placeholder?: string;
  disabled?: boolean;
  skeleton?: boolean;
};

export default function GrimoireSelectOrText({
  id, label, value, onChange, options, customLabel, placeholder, disabled = false, skeleton = false,
}: Props) {
  const isKnown = options.some((o) => o.value === value);
  const [isCustom, setIsCustom] = useState(!isKnown && value !== "");

  useEffect(() => {
    const known = options.some((o) => o.value === value);
    setIsCustom(!known && value !== "");
  }, [value, options]);

  const inputStyle = {
    backgroundColor: "var(--g-input-bg)",
    borderColor: "var(--g-input-border)",
    color: "var(--g-input-text)",
  };

  if (skeleton) {
    return (
      <div className="mb-3">
        {label && <div className="placeholder-glow mb-1"><span className="placeholder col-4 rounded" style={{ height: "14px" }} /></div>}
        <div className="placeholder-glow"><span className="placeholder col-12 rounded" style={{ height: "38px" }} /></div>
      </div>
    );
  }

  const allOptions: Option[] = [
    ...options,
    { value: "__custom__", label: customLabel },
  ];

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(val);
    }
  }

  const selectValue = isCustom ? "__custom__" : (value || "");

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label" style={{ color: "var(--g-label)" }}>
          {label}
        </label>
      )}
      <select
        id={id}
        className="form-select mb-1"
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        style={inputStyle}
      >
        <option value=""></option>
        {allOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {isCustom && (
        <input
          id={`${id}-custom`}
          type="text"
          className="form-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
        />
      )}
    </div>
  );
}
