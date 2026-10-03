"use client";

import { useTranslations } from "next-intl";
import GrimoireButton from "./GrimoireButton";

type Props = {
  current: number;
  total: number;
  // assente = freccia disattivata (primo o ultimo elemento)
  onPrev?: () => void;
  onNext?: () => void;
};

// Frecce per scorrere una lista uno alla volta, con la posizione in mezzo: ‹ 3 / 42 ›
export default function GrimoirePager({ current, total, onPrev, onNext }: Props) {
  const t = useTranslations("ui");

  return (
    <div className="d-flex align-items-center gap-2">
      <GrimoireButton variant="outline-secondary" icon="chevron-left" tooltip={t("previous")} disabled={!onPrev} onClick={onPrev} />
      <small style={{ color: "var(--g-text-muted)", whiteSpace: "nowrap" }}>{current} / {total}</small>
      <GrimoireButton variant="outline-secondary" icon="chevron-right" tooltip={t("next")} disabled={!onNext} onClick={onNext} />
    </div>
  );
}
