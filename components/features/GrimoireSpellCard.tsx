"use client";

import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { SCUOLA_BADGE_COLORS } from "@/lib/spellSchools";
import { damageKey } from "@/lib/damageTypes";
import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireBadge from "@/components/ui/GrimoireBadge";

type Props = {
  nome: string;
  scuola: string | null;
  livello: number;
  gittata: string | null;
  concentration: boolean | null;
  ritual: boolean | null;
  tipiDanno?: string[] | null;
  groupNome?: string | null;
};

// Card di un incantesimo (vista a card della pagina incantesimi):
// nome e livello in alto, badge della scuola, poi gittata, concentrazione/rituale ed eventuale gruppo.
export default function GrimoireSpellCard({ nome, scuola, livello, gittata, concentration, ritual, tipiDanno, groupNome }: Props) {
  const t = useTranslations("spells");
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const tRange = (key: string) => t(`range${key.charAt(0).toUpperCase()}${key.slice(1)}` as Parameters<typeof t>[0]);

  // La scuola è salvata in italiano (es. "Evocazione"): si mostra tradotta
  const scuolaKey = `scuola${scuola}` as Parameters<typeof t>[0];
  const scuolaLabel = scuola && t.has(scuolaKey) ? t(scuolaKey) : scuola;

  // Tipi di danno tradotti (es. "Fuoco, Radioso")
  const danno = (tipiDanno ?? []).map((d) => {
    const key = damageKey(d) as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : d;
  }).join(", ");

  const details = [
    formatRange(gittata, unitSystem, tRange),
    danno || null,
    concentration ? t("colConcentrazione") : null,
    ritual ? t("colRituale") : null,
  ].filter(Boolean).join(" · ");

  return (
    <GrimoireCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <h5 style={{ margin: 0, color: "var(--g-text)", fontWeight: 600 }}>{nome}</h5>
        <small style={{ color: "var(--g-text-muted)", whiteSpace: "nowrap" }}>
          {livello === 0 ? t("trucchetto") : t("livelloShort", { n: livello })}
        </small>
      </div>
      {scuola && (
        <GrimoireBadge variant={SCUOLA_BADGE_COLORS[scuola] ?? "secondary"}>{scuolaLabel}</GrimoireBadge>
      )}
      {details && (
        <div style={{ color: "var(--g-text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>{details}</div>
      )}
      {groupNome && (
        <div style={{ marginTop: "0.5rem" }}>
          <GrimoireBadge variant="primary">{groupNome}</GrimoireBadge>
        </div>
      )}
    </GrimoireCard>
  );
}
