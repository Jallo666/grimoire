"use client";

import { useTranslations } from "next-intl";
import GrimoireFilterPanel from "@/components/ui/GrimoireFilterPanel";
import GrimoireFilterModal from "@/components/ui/GrimoireFilterModal";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireSearchInput from "@/components/ui/GrimoireSearchInput";
import GrimoireMultiSelect from "@/components/ui/GrimoireMultiSelect";
import GrimoireSelect from "@/components/ui/GrimoireSelect";
import GrimoireChips from "@/components/ui/GrimoireChips";
import type { SpellFiltersApi } from "./useSpellFilters";
import type { SpellOptions } from "./useSpellOptions";
import type { Option, SpellTab } from "./spellTypes";

type Props = {
  tab: SpellTab;
  api: SpellFiltersApi;
  options: SpellOptions;
  groupOptions: Option[];
  // modale dei filtri su mobile (si apre dall'icona accanto alle tab)
  showModal: boolean;
  onCloseModal: () => void;
};

// Filtri della pagina incantesimi.
// Desktop: riga di tendine sempre visibile. Tablet e telefono: modale con pillole.
// Il filtro per gruppo c'è solo nella tab "Miei".
export default function SpellFilters({ tab, api, options, groupOptions, showModal, onCloseModal }: Props) {
  const t = useTranslations("spells");
  const { filters, setParams, setParam, setList, setFlag, resetFilters } = api;
  const showGroups = tab === "miei";

  // Concentrazione e Rituale: "Sì" oppure tutti
  const yesOrAll = (label: string): Option[] => [
    { value: "", label },
    { value: "true", label: t("si") },
  ];

  // Nella modale Concentrazione e Rituale sono un gruppo di pillole "Altro"
  const otherValues = [filters.concentration && "concentration", filters.ritual && "ritual"].filter((v): v is string => !!v);

  return (
    <>
      <GrimoireFilterPanel>
        <GrimoireInlineGroup wrap spaced>
          <GrimoireSearchInput id="spell-search" value={filters.search} onSearch={(v) => setParam("search", v)} placeholder={t("searchPlaceholder")} />
          {showGroups && (
            <GrimoireMultiSelect id="spell-group" placeholder={t("filterAllGroups")} value={filters.groups} onChange={(v) => setList("group", v)} options={groupOptions} minWidth={150} />
          )}
          <GrimoireMultiSelect id="spell-school" placeholder={t("filterAll")} value={filters.schools} onChange={(v) => setList("school", v)} options={options.schoolOptions} minWidth={160} />
          <GrimoireMultiSelect id="spell-level" placeholder={t("filterAllLevels")} value={filters.levels} onChange={(v) => setList("level", v)} options={options.levelOptions} minWidth={130} />
          <GrimoireMultiSelect id="spell-class" placeholder={t("filterAllClasses")} value={filters.classes} onChange={(v) => setList("class", v)} options={options.classOptions} minWidth={150} />
          <GrimoireMultiSelect id="spell-damage" placeholder={t("filterAllDamage")} value={filters.damageTypes} onChange={(v) => setList("damage", v)} options={options.damageOptions} minWidth={150} />
          <GrimoireSelect id="spell-concentration" value={filters.concentration ? "true" : ""} onChange={(e) => setFlag("concentration", e.target.value === "true")} options={yesOrAll(t("filterConcentrazione"))} minWidth={155} />
          <GrimoireSelect id="spell-ritual" value={filters.ritual ? "true" : ""} onChange={(e) => setFlag("ritual", e.target.value === "true")} options={yesOrAll(t("filterRituale"))} minWidth={120} />
        </GrimoireInlineGroup>
      </GrimoireFilterPanel>

      <GrimoireFilterModal show={showModal} onClose={onCloseModal} onReset={resetFilters}>
        <GrimoireSearchInput id="spell-search-mobile" value={filters.search} onSearch={(v) => setParam("search", v)} placeholder={t("searchPlaceholder")} />
        {showGroups && groupOptions.length > 0 && (
          <GrimoireChips label={t("colGruppo")} options={groupOptions} value={filters.groups} onChange={(v) => setList("group", v)} />
        )}
        <GrimoireChips label={t("colLivello")} options={options.levelOptions} value={filters.levels} onChange={(v) => setList("level", v)} />
        <GrimoireChips label={t("colScuola")} options={options.schoolOptions} value={filters.schools} onChange={(v) => setList("school", v)} />
        <GrimoireChips label={t("colClassi")} options={options.classOptions} value={filters.classes} onChange={(v) => setList("class", v)} />
        <GrimoireChips label={t("fieldDanno")} options={options.damageOptions} value={filters.damageTypes} onChange={(v) => setList("damage", v)} />
        {/* Concentrazione e Rituale cambiano insieme: due modifiche separate di fila si sovrascriverebbero */}
        <GrimoireChips
          label={t("filterOther")}
          options={[
            { value: "concentration", label: t("colConcentrazione") },
            { value: "ritual", label: t("colRituale") },
          ]}
          value={otherValues}
          onChange={(v) => setParams({
            concentration: v.includes("concentration") ? "true" : "",
            ritual: v.includes("ritual") ? "true" : "",
          })}
        />
      </GrimoireFilterModal>
    </>
  );
}
