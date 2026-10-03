"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ViewMode } from "@/components/ui/GrimoireViewToggle";
import type { SpellTab } from "./spellTypes";

// Tab nell'URL (?tab=mine) ↔ tab nel codice
const TAB_FROM_PARAM: Record<string, SpellTab> = { mine: "miei", srd: "srd", all: "tutti" };
const TAB_TO_PARAM: Record<SpellTab, string> = { miei: "mine", srd: "srd", tutti: "all" };

// Parametri dei filtri nell'URL. I filtri a scelta multipla hanno i valori separati da virgola,
// es. ?level=0,3&school=Evocazione&class=12,14
const FILTER_PARAMS = ["search", "group", "school", "level", "class", "damage", "concentration", "ritual"];

// Filtri, tab e vista della pagina incantesimi, letti e scritti nell'URL
// (così un link condiviso o una pagina ricaricata mantengono tutto).
export function useSpellFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const list = (key: string) => (searchParams.get(key) ?? "").split(",").filter(Boolean);

  const tab: SpellTab = TAB_FROM_PARAM[searchParams.get("tab") ?? ""] ?? "miei";
  const view: ViewMode = searchParams.get("view") === "cards" ? "cards" : "table";

  const filters = {
    search: searchParams.get("search") ?? "",
    groups: list("group"),
    schools: list("school"),
    levels: list("level"),
    classes: list("class"),
    damageTypes: list("damage"),
    concentration: searchParams.get("concentration") === "true",
    ritual: searchParams.get("ritual") === "true",
  };

  // Cambia uno o più parametri in un colpo solo (valore vuoto = parametro tolto).
  // Legge l'URL attuale (non quello del render): la ricerca parte 300ms dopo
  // e nel frattempo potrebbe essere cambiato un altro filtro.
  function setParams(updates: Record<string, string>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setParam(key: string, value: string) {
    setParams({ [key]: value });
  }

  // Filtri a scelta multipla: lista di valori → "a,b,c"
  function setList(key: string, values: string[]) {
    setParam(key, values.join(","));
  }

  function setFlag(key: "concentration" | "ritual", on: boolean) {
    setParam(key, on ? "true" : "");
  }

  // Toglie tutti i filtri (tab e vista restano)
  function resetFilters() {
    setParams(Object.fromEntries(FILTER_PARAMS.map((k) => [k, ""])));
  }

  // Cambiando tab i filtri si azzerano, la vista scelta resta
  function changeTab(next: SpellTab) {
    router.replace(`${pathname}?tab=${TAB_TO_PARAM[next]}${view === "cards" ? "&view=cards" : ""}`);
  }

  function setView(next: ViewMode) {
    setParam("view", next === "cards" ? "cards" : "");
  }

  // Quanti filtri sono attivi (numero sull'icona dei filtri su mobile)
  const activeCount = [
    filters.search, filters.groups.length, filters.schools.length, filters.levels.length,
    filters.classes.length, filters.damageTypes.length, filters.concentration, filters.ritual,
  ].filter(Boolean).length;

  // Variabili per le query GraphQL delle liste
  const queryVars = {
    search: filters.search || undefined,
    scuole: filters.schools.length ? filters.schools : undefined,
    livelli: filters.levels.length ? filters.levels.map(Number) : undefined,
    classi: filters.classes.length ? filters.classes : undefined,
    tipiDanno: filters.damageTypes.length ? filters.damageTypes : undefined,
    concentration: filters.concentration || undefined,
    ritual: filters.ritual || undefined,
  };

  return { tab, view, filters, setParams, setParam, setList, setFlag, resetFilters, changeTab, setView, activeCount, queryVars };
}

export type SpellFiltersApi = ReturnType<typeof useSpellFilters>;
