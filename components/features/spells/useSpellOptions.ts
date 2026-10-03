"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { CASTING_TIME_MAP, DURATION_MAP } from "@/lib/formatSpellFields";
import { SCUOLA_BADGE_COLORS } from "@/lib/spellSchools";
import { SPELL_CLASSES, DAMAGE_TYPES } from "@/lib/queries/spells";
import type { Option } from "./spellTypes";

type Tag = { id: string; nome: string };

// Opzioni (valore + etichetta tradotta) usate dai filtri e dal form di creazione.
// Classi e tipi di danno arrivano dal database col nome già tradotto.
export function useSpellOptions() {
  const t = useTranslations("spells");
  const locale = useLocale();

  const { data: classesData } = useQuery<{ spellClasses: Tag[] }>(SPELL_CLASSES, { variables: { locale } });
  const { data: damageData } = useQuery<{ damageTypes: Tag[] }>(DAMAGE_TYPES, { variables: { locale } });

  // Scuole: valori in italiano come nel database, etichette tradotte (chiavi scuola<Nome>)
  const schoolOptions: Option[] = Object.keys(SCUOLA_BADGE_COLORS).map((s) => ({
    value: s,
    label: t(`scuola${s}` as Parameters<typeof t>[0]),
  }));

  // Livelli: 0 = trucchetto, poi 1…9
  const levelOptions: Option[] = Array.from({ length: 10 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? t("livelloOption0") : t("livelloOptionN", { n: i }),
  }));

  // Tempo di lancio e durata: valori in inglese come nei dati SRD, etichette tradotte
  const castingTimeOptions: Option[] = Object.entries(CASTING_TIME_MAP).map(([value, key]) => ({
    value, label: t(key as Parameters<typeof t>[0]),
  }));
  const durationOptions: Option[] = Object.entries(DURATION_MAP).map(([value, key]) => ({
    value, label: t(key as Parameters<typeof t>[0]),
  }));

  const classOptions: Option[] = (classesData?.spellClasses ?? []).map((c) => ({ value: c.id, label: c.nome }));
  const damageOptions: Option[] = (damageData?.damageTypes ?? []).map((d) => ({ value: d.id, label: d.nome }));

  return { schoolOptions, levelOptions, castingTimeOptions, durationOptions, classOptions, damageOptions };
}

export type SpellOptions = ReturnType<typeof useSpellOptions>;
