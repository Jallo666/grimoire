"use client";

import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";

export type ViewMode = "table" | "cards";

type Props = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

// Due icone affiancate per scegliere come vedere una lista: tabella (☰) o card (▦).
// Quella attiva è blu piena.
export default function GrimoireViewToggle({ value, onChange }: Props) {
  const t = useTranslations("ui");

  const options: { mode: ViewMode; icon: string; label: string }[] = [
    { mode: "table", icon: "list-ul", label: t("viewTable") },
    { mode: "cards", icon: "grid-3x2-gap", label: t("viewCards") },
  ];

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label={t("view")}>
      {options.map((o) => (
        <button
          key={o.mode}
          type="button"
          className={`btn d-inline-flex align-items-center ${value === o.mode ? "btn-primary" : "btn-outline-secondary"}`}
          aria-pressed={value === o.mode}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.mode)}
        >
          <GrimoireIcon name={o.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
