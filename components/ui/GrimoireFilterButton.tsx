"use client";

import { useTranslations } from "next-intl";
import GrimoireIcon from "./GrimoireIcon";

type Props = {
  activeCount: number;
  onClick: () => void;
};

// Icona a imbuto che apre la modale dei filtri. Visibile solo sotto i 992px (d-lg-none):
// su desktop i filtri sono sempre in vista. Il numero indica quanti filtri sono attivi.
export default function GrimoireFilterButton({ activeCount, onClick }: Props) {
  const t = useTranslations("ui");

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-inline-flex d-lg-none align-items-center gap-1"
      onClick={onClick}
      aria-label={activeCount > 0 ? `${t("filters")} (${activeCount})` : t("filters")}
      title={t("filters")}
    >
      <GrimoireIcon name="funnel" size={16} />
      {activeCount > 0 && <span className="badge rounded-pill text-bg-primary">{activeCount}</span>}
    </button>
  );
}
