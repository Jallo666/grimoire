"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { SPELL } from "@/lib/queries/spells";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import { spellMainLocale } from "@/lib/spellLocale";
import { formatIngredients } from "@/components/features/spells/formatIngredients";
import type { MaterialOption } from "@/components/features/spells/materialTypes";
import GrimoireSkeletonText from "@/components/ui/GrimoireSkeletonText";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireField from "@/components/ui/GrimoireField";
import GrimoireFieldGrid from "@/components/ui/GrimoireFieldGrid";
import GrimoireDivider from "@/components/ui/GrimoireDivider";
import GrimoirePager from "@/components/ui/GrimoirePager";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireSwipeArea from "@/components/ui/GrimoireSwipeArea";
import { CASTING_TIME_MAP, DURATION_MAP, translateField } from "@/lib/formatSpellFields";

type Translation = {
  locale: string;
  nome: string;
  descrizione: string | null;
  highLevel: string | null;
};

type SpellFull = {
  id: string;
  nome: string;
  descrizione: string | null;
  scuola: string | null;
  livello: number;
  tempoLancio: string | null;
  gittata: string | null;
  durata: string | null;
  componenti: string | null;
  higherLevel: string | null;
  concentration: boolean | null;
  ritual: boolean | null;
  classi: { id: string; nome: string }[];
  tipiDanno: { id: string; nome: string }[];
  isOwner: boolean;
  isSystem: boolean;
  lingua: string | null;
  translations: Translation[];
  materiale: { testo: string; perBersaglio: boolean; translations: { locale: string; testo: string }[]; opzioni: MaterialOption[] } | null;
};

type Props = {
  spellId: string | null;
  onClose: () => void;
  // Facoltativi: vai all'incantesimo precedente/successivo della lista (assente = freccia disattivata)
  onPrev?: () => void;
  onNext?: () => void;
  // Posizione nella lista, mostrata come "3 / 42"
  position?: { current: number; total: number };
  // Solo per chi l'ha creato: apri la modifica / la condivisione (la modale di dettaglio si chiude).
  // lang: tab della lingua da aprire nella modifica (es. "Traduci")
  onEdit: (id: string, lang?: string) => void;
  onShare: (id: string) => void;
};

export default function SpellViewModal({ spellId, onClose, onPrev, onNext, position, onEdit, onShare }: Props) {
  const t = useTranslations("spells");
  const tDetail = useTranslations("spellDetail");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const secondaryLocale = locale === "it" ? "en" : "it";
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const tRange = (key: string) => t(`range${key.charAt(0).toUpperCase()}${key.slice(1)}` as Parameters<typeof t>[0]);

  const [viewLang, setViewLang] = useState<string>(locale);

  // Cambiando incantesimo o lingua dell'interfaccia, la tab della lingua torna a quella dell'interfaccia
  const viewKey = `${spellId}|${locale}`;
  const [lastViewKey, setLastViewKey] = useState(viewKey);
  if (viewKey !== lastViewKey) {
    setLastViewKey(viewKey);
    setViewLang(locale);
  }

  const { data, loading } = useQuery<{ spell: SpellFull | null }>(SPELL, {
    // tagsLocale: classi e tipi di danno tradotti nella lingua dell'interfaccia
    // (nome e descrizione invece li sceglie la modale, con le tab della lingua)
    variables: { id: spellId!, tagsLocale: locale },
    skip: !spellId,
    // Il risultato non va nella cache condivisa: qui "nome" è quello originale (non tradotto)
    // e sovrascriverebbe il nome tradotto della lista, che si riordinerebbe mentre la modale è aperta
    fetchPolicy: "no-cache",
  });

  const spell = data?.spell;

  // Da che lato arriva il nuovo incantesimo, per l'animazione di entrata
  const [direction, setDirection] = useState<"prev" | "next" | null>(null);

  // Chiudendo si azzera il lato: il prossimo incantesimo aperto dalla lista non deve scivolare
  function close() {
    setDirection(null);
    onClose();
  }

  function goPrev() {
    if (!onPrev) return;
    setDirection("prev");
    onPrev();
  }

  function goNext() {
    if (!onNext) return;
    setDirection("next");
    onNext();
  }

  // Frecce ← → della tastiera: incantesimo precedente / successivo
  useEffect(() => {
    if (!spellId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Testi nella lingua della tab: quelli originali se è la lingua principale, altrimenti la
  // traduzione; null se in quella lingua l'incantesimo non è ancora tradotto
  const mainLang = spell ? spellMainLocale(spell, locale) : locale;
  function getLangData(lang: string) {
    if (!spell) return null;
    if (lang === mainLang) {
      return { nome: spell.nome, descrizione: spell.descrizione, highLevel: spell.higherLevel, material: spell.materiale?.testo ?? null };
    }
    const trans = spell.translations.find((tr) => tr.locale === lang);
    if (!trans) return null;
    const material = spell.materiale?.translations.find((tr) => tr.locale === lang)?.testo ?? null;
    return { nome: trans.nome, descrizione: trans.descrizione, highLevel: trans.highLevel, material };
  }

  // La scuola è salvata in italiano (es. "Evocazione"): si mostra tradotta (chiave scuolaEvocazione)
  function scuolaLabel(scuola: string | null) {
    if (!scuola) return null;
    const key = `scuola${scuola}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : scuola;
  }

  // Tempo di lancio e durata sono salvati in inglese (es. "1 action", "Instantaneous"):
  // si mostrano tradotti con le stesse chiavi delle tendine del form (ct1Action, durInstantaneous, …)
  const tKey = (key: string) => t(key as Parameters<typeof t>[0]);

  const langData = getLangData(viewLang);
  const title = langData?.nome ?? spell?.nome ?? "—";

  return (
    <GrimoireModal
      show={!!spellId}
      onClose={close}
      title={title}
      titleSkeleton={loading}
      size="lg"
      fullscreenOnMobile
      footer={
        <GrimoireModalFooter
          start={spell?.isOwner && (
            <GrimoireInlineGroup>
              <GrimoireButton variant="outline-secondary" mobileIcon="pencil" onClick={() => { close(); onEdit(spell.id); }}>
                {tDetail("editButton")}
              </GrimoireButton>
              <GrimoireButton variant="outline-secondary" mobileIcon="share" onClick={() => { close(); onShare(spell.id); }}>
                {tDetail("shareButton")}
              </GrimoireButton>
            </GrimoireInlineGroup>
          )}
          center={position && (
            <GrimoirePager current={position.current} total={position.total} onPrev={onPrev && goPrev} onNext={onNext && goNext} />
          )}
        >
          <GrimoireButton variant="outline-secondary" onClick={close}>
            {tUi("close")}
          </GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      {/* key: cambiando incantesimo il contenuto si ricrea e l'animazione di entrata riparte */}
      <GrimoireSwipeArea key={spellId ?? ""} enterFrom={direction} onSwipeLeft={goNext} onSwipeRight={goPrev}>
        {loading ? (
          // Skeleton con la stessa forma del contenuto: descrizione, poi scuola, livello, tempo, gittata, durata
          <>
            <GrimoireSkeletonText lines={6} />
            <GrimoireSkeletonText />
            <GrimoireSkeletonText />
            <GrimoireSkeletonText />
            <GrimoireSkeletonText />
            <GrimoireSkeletonText />
          </>
        ) : spell ? (
          <>
            {/* Tab della lingua */}
            <GrimoireTabs
              tabs={[
                { key: locale, label: locale.toUpperCase() },
                { key: secondaryLocale, label: secondaryLocale.toUpperCase() },
              ]}
              active={viewLang}
              onChange={setViewLang}
            />

            {/* Testi nella lingua scelta, o l'avviso che non è ancora tradotto */}
            {langData ? (
              <>
                <GrimoireField label={t("fieldDescrizione")} value={langData.descrizione} multiline />
                <GrimoireField label={t("fieldHigherLevel")} value={langData.highLevel} multiline />
              </>
            ) : (
              <>
                <GrimoireAlert variant="info">{t("notTranslated", { lingua: t(`langName_${viewLang}` as Parameters<typeof t>[0]) })}</GrimoireAlert>
                {spell.isOwner && (
                  <GrimoireButton variant="outline-secondary" onClick={() => { close(); onEdit(spell.id, viewLang); }}>
                    {t("translateButton")}
                  </GrimoireButton>
                )}
              </>
            )}

            <GrimoireDivider />

            {/* Dati comuni: due colonne anche su telefono (valori brevi) */}
            <GrimoireFieldGrid alwaysTwoColumns>
              <GrimoireField label={t("fieldScuola")} value={scuolaLabel(spell.scuola)} />
              <GrimoireField
                label={t("fieldLivello")}
                value={spell.livello === 0 ? t("trucchetto") : t("livelloShort", { n: spell.livello })}
              />
              <GrimoireField label={t("fieldTempoLancio")} value={spell.tempoLancio && translateField(spell.tempoLancio, CASTING_TIME_MAP, tKey)} />
              <GrimoireField label={t("fieldGittata")} value={formatRange(spell.gittata, unitSystem, tRange)} />
            </GrimoireFieldGrid>
            <GrimoireField label={t("fieldDurata")} value={spell.durata && translateField(spell.durata, DURATION_MAP, tKey)} />
            <GrimoireField label={t("fieldComponenti")} value={spell.componenti} />
            {/* Materiale subito sotto V, S, M, nella lingua della tab scelta;
                se in quella lingua manca, il testo originale con la sua lingua nell'etichetta */}
            <GrimoireField
              label={[
                t("fieldMaterial"),
                spell.materiale?.perBersaglio && `(${t("materialPerTargetShort")})`,
                !langData?.material && spell.materiale && `(${t("materialOriginal", { lingua: t(`langName_${mainLang}` as Parameters<typeof t>[0]) })})`,
              ].filter(Boolean).join(" ")}
              value={langData?.material ?? spell.materiale?.testo}
              multiline
            />
            {/* Ingredienti con costo o consumati (oggetti, valori, alternative) */}
            {!!spell.materiale?.opzioni.length && (
              <GrimoireField
                label={t("ingredients")}
                value={formatIngredients(spell.materiale.opzioni, (k, v) => t(k as Parameters<typeof t>[0], v), locale)}
                multiline
              />
            )}
            <GrimoireFieldGrid alwaysTwoColumns>
              {spell.concentration !== null && (
                <GrimoireField label={t("colConcentrazione")} value={spell.concentration ? t("si") : t("no")} />
              )}
              {spell.ritual !== null && (
                <GrimoireField label={t("colRituale")} value={spell.ritual ? t("si") : t("no")} />
              )}
            </GrimoireFieldGrid>
            <GrimoireField label={t("fieldDanno")} value={spell.tipiDanno.map((d) => d.nome).join(", ")} />
            <GrimoireField label={t("colClassi")} value={spell.classi.map((c) => c.nome).join(", ")} />
          </>
        ) : null}
      </GrimoireSwipeArea>
    </GrimoireModal>
  );
}
