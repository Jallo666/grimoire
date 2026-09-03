"use client";

import { useState } from "react";
import GrimoireCard from "./GrimoireCard";
import GrimoireInput from "./GrimoireInput";
import GrimoireButton from "./GrimoireButton";
import GrimoireAlert from "./GrimoireAlert";

export type FieldConfig = {
  name: string;
  label?: string;
  type?: "text" | "email" | "password" | "checkbox" | "select";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
};

export type FormAction = {
  label: string;
  onClick: () => void;
  variant?: "outline-secondary" | "danger";
};

type Props = {
  title?: string;
  subtitle?: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string>;
  error?: string;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  fetching?: boolean;
  actions?: FormAction[];
};

export default function GrimoireForm({
  title,
  subtitle,
  fields,
  initialValues,
  error,
  onSubmit,
  submitLabel = "Salva",
  loading = false,
  fetching = false,
  actions = [],
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, initialValues?.[f.name] ?? f.defaultValue ?? ""]))
  );

  function handleChange(name: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <GrimoireCard bare>
      {(title || subtitle) && (
        <div
          className="card-header border-bottom px-4 pt-4 pb-3"
          style={{ backgroundColor: "var(--g-card-bg)", borderColor: "var(--g-card-border)" }}
        >
          {fetching ? (
            <div className="placeholder-glow">
              <span className="placeholder col-5 rounded mb-2 d-block" style={{ height: "24px" }} />
              {subtitle && (
                <span className="placeholder col-7 rounded" style={{ height: "16px" }} />
              )}
            </div>
          ) : (
            <>
              {title && (
                <h5 className="mb-0" style={{ color: "var(--g-text)" }}>
                  {title}
                </h5>
              )}
              {subtitle && (
                <small style={{ color: "var(--g-text-muted)" }}>{subtitle}</small>
              )}
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card-body px-4 py-3">
          {error && <GrimoireAlert>{error}</GrimoireAlert>}
          {fields.map((f) => (
            <GrimoireInput
              key={f.name}
              id={f.name}
              label={f.label}
              type={f.type}
              placeholder={f.placeholder}
              required={f.required}
              value={values[f.name] ?? ""}
              onChange={handleChange(f.name)}
              skeleton={fetching}
              options={f.options}
            />
          ))}
        </div>

        <div
          className="card-footer px-4 py-3 d-flex justify-content-between align-items-center border-top"
          style={{ backgroundColor: "var(--g-card-bg)", borderColor: "var(--g-card-border)" }}
        >
          {fetching ? (
            <div className="placeholder-glow w-100 d-flex justify-content-between">
              <span className="placeholder col-2 rounded" style={{ height: "36px" }} />
              <span className="placeholder col-2 rounded" style={{ height: "36px" }} />
            </div>
          ) : (
            <>
              <div className="d-flex gap-2">
                {actions.map((a) => (
                  <GrimoireButton
                    key={a.label}
                    variant={a.variant ?? "outline-secondary"}
                    onClick={a.onClick}
                  >
                    {a.label}
                  </GrimoireButton>
                ))}
              </div>
              <GrimoireButton type="submit" loading={loading}>
                {submitLabel}
              </GrimoireButton>
            </>
          )}
        </div>
      </form>
    </GrimoireCard>
  );
}
