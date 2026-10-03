"use client";

import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { SCUOLA_BADGE_COLORS } from "@/lib/spellSchools";
import GrimoireTable, { type Column, type TableAction } from "@/components/ui/GrimoireTable";
import GrimoireCardView from "@/components/ui/GrimoireCardView";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import type { ViewMode } from "@/components/ui/GrimoireViewToggle";
import GrimoireSpellCard from "@/components/features/GrimoireSpellCard";
import type { SpellRow, SpellTab } from "./spellTypes";

type Props = {
  tab: SpellTab;
  view: ViewMode;
  spells: SpellRow[];
  loading: boolean;
  actions: (s: SpellRow) => TableAction[];
  onOrderChange: (rows: SpellRow[]) => void;
  // modalità selezione
  selectable: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

// Righe dello skeleton mentre la lista si carica
const SKELETON_ROWS = 8;

// Lista degli incantesimi nella vista scelta: tabella o card.
// Entrambe partono ordinate per livello, poi per nome. Le colonne dipendono dalla tab:
// "Miei" mostra il gruppo, SRD e Tutti mostrano concentrazione, rituale e classi.
export default function SpellList({ tab, view, spells, loading, actions, onOrderChange, selectable, selectedIds, onSelectionChange }: Props) {
  const t = useTranslations("spells");
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const tRange = (key: string) => t(`range${key.charAt(0).toUpperCase()}${key.slice(1)}` as Parameters<typeof t>[0]);
  const toStrings = (ids: (string | number)[]) => onSelectionChange(ids.map(String));

  // Nomi tradotti delle scuole, per i badge e per il riordino
  const schoolLabels = Object.fromEntries(
    Object.keys(SCUOLA_BADGE_COLORS).map((s) => [s, t(`scuola${s}` as Parameters<typeof t>[0])])
  );

  const baseColumns: Column<SpellRow>[] = [
    { key: "nome", label: t("colNome"), sortable: true, leader: true },
    { key: "scuola", label: t("colScuola"), sortable: true, type: "badge", badgeColors: SCUOLA_BADGE_COLORS, badgeLabels: schoolLabels },
    { key: "livello", label: t("colLivello"), sortable: true, render: (v) => (v === 0 ? t("trucchetto") : t("livelloShort", { n: v as number })) },
    { key: "gittata", label: t("colGittata"), render: (v) => formatRange(v as string | null, unitSystem, tRange) },
    { key: "tipiDanno", label: t("colDanno"), render: (v) => (v as SpellRow["tipiDanno"]).map((d) => d.nome).join(", ") },
  ];

  const columns: Column<SpellRow>[] = tab === "miei"
    ? [
        ...baseColumns,
        { key: "groupNome", label: t("colGruppo"), render: (v) => v ? <GrimoireBadge variant="primary">{String(v)}</GrimoireBadge> : null },
      ]
    : [
        ...baseColumns,
        { key: "concentration", label: t("colConcentrazione"), render: (v) => v ? <GrimoireBadge variant="warning">{t("si")}</GrimoireBadge> : null },
        { key: "ritual", label: t("colRituale"), render: (v) => v ? <GrimoireBadge variant="secondary">{t("si")}</GrimoireBadge> : null },
        { key: "classi", label: t("colClassi"), muted: true, render: (v) => (v as SpellRow["classi"]).map((c) => c.nome).join(", ") },
      ];

  if (view === "cards") {
    return (
      <GrimoireCardView
        data={spells}
        renderCard={(s) => (
          <GrimoireSpellCard
            nome={s.nome}
            scuola={s.scuola}
            livello={s.livello}
            gittata={s.gittata}
            concentration={s.concentration}
            ritual={s.ritual}
            tipiDanno={s.tipiDanno.map((d) => d.nome)}
            groupNome={tab === "miei" ? s.groupNome : null}
          />
        )}
        title={(s) => s.nome}
        actions={actions}
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={toStrings}
        sort={{ key: "livello", dir: "asc", thenBy: "nome" }}
        skeleton={loading}
        emptyMessage={t("tableEmpty")}
        fillHeight
        onOrderChange={onOrderChange}
      />
    );
  }

  return (
    <GrimoireTable
      columns={columns}
      data={spells}
      skeleton={loading}
      skeletonRows={SKELETON_ROWS}
      fillHeight
      defaultSort={{ key: "livello", dir: "asc" }}
      emptyMessage={t("tableEmpty")}
      actions={actions}
      onOrderChange={onOrderChange}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={toStrings}
    />
  );
}
