"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";

type Props = {
  activeCount: number;
  children: React.ReactNode;
};

// Contenitore dei filtri di una pagina.
// Tablet e telefono (sotto i 992px): filtri nascosti, si aprono col pulsante "Filtri (n)",
// dove n è il numero di filtri attivi.
// Desktop (da 992px): nessun pulsante, filtri sempre visibili come prima.
export default function GrimoireFilterPanel({ activeCount, children }: Props) {
  const t = useTranslations("ui");
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-secondary w-100 mb-3 d-flex d-lg-none justify-content-between align-items-center"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          <GrimoireIcon name="funnel" /> {t("filters")}
          {activeCount > 0 && ` (${activeCount})`}
        </span>
        <GrimoireIcon name={open ? "chevron-up" : "chevron-down"} />
      </button>

      {/* d-lg-block: su desktop i filtri sono sempre visibili */}
      <div className={open ? "d-block" : "d-none d-lg-block"}>{children}</div>
    </div>
  );
}
