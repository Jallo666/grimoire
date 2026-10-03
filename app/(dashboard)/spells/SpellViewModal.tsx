"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { SPELL } from "@/lib/queries/spells";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireSkeletonText from "@/components/ui/GrimoireSkeletonText";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import styles from "./SpellViewModal.module.css";
import { translateClassi } from "@/lib/spellClasses";
import { damageKey } from "@/lib/damageTypes";

type Translation = {
  locale: string;
  nome: string;
  descrizione: string | null;
  highLevel: string | null;
  material: string | null;
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
  classi: string | null;
  tipiDanno: string[] | null;
  isOwner: boolean;
  isSystem: boolean;
  translations: Translation[];
};

type Props = {
  spellId: string | null;
  onClose: () => void;
  // Facoltativi: vai all'incantesimo precedente/successivo della lista (assente = freccia disattivata)
  onPrev?: () => void;
  onNext?: () => void;
  // Posizione nella lista, mostrata come "3 / 42"
  position?: { current: number; total: number };
};

function Field({ label, value, multiline = false }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <div style={{ fontSize: "0.75rem", color: "var(--g-text-muted)", fontWeight: 500, marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ color: "var(--g-text)", fontSize: "0.925rem", whiteSpace: multiline ? "pre-wrap" : undefined, lineHeight: multiline ? 1.65 : undefined }}>
        {value}
      </div>
    </div>
  );
}

export default function SpellViewModal({ spellId, onClose, onPrev, onNext, position }: Props) {
  const t = useTranslations("spells");
  const tDetail = useTranslations("spellDetail");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const secondaryLocale = locale === "it" ? "en" : "it";
  const router = useRouter();
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const tRange = (key: string) => t(`range${key.charAt(0).toUpperCase()}${key.slice(1)}` as Parameters<typeof t>[0]);

  const [viewLang, setViewLang] = useState<string>(locale);

  useEffect(() => {
    setViewLang(locale);
  }, [spellId, locale]);

  const { data, loading } = useQuery<{ spell: SpellFull | null }>(SPELL, {
    variables: { id: spellId! },
    skip: !spellId,
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

  // Swipe: dito verso sinistra = successivo, verso destra = precedente.
  // Conta solo se il movimento è lungo almeno 60px e chiaramente orizzontale
  // (così scorrere in giù una descrizione lunga non cambia incantesimo).
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  function getLangData(lang: string) {
    if (!spell) return null;
    const trans = spell.translations.find((tr) => tr.locale === lang);
    if (trans) {
      return { nome: trans.nome, descrizione: trans.descrizione, highLevel: trans.highLevel, material: trans.material };
    }
    // Fallback to base fields
    return { nome: spell.nome, descrizione: spell.descrizione, highLevel: spell.higherLevel, material: null };
  }

  // La scuola è salvata in italiano (es. "Evocazione"): si mostra tradotta (chiave scuolaEvocazione)
  function scuolaLabel(scuola: string | null) {
    if (!scuola) return null;
    const key = `scuola${scuola}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : scuola;
  }

  // Classi salvate in inglese (es. "Bard, Wizard"): si mostrano tradotte (chiavi classBard, …)
  function classLabel(cls: string) {
    const key = `class${cls}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : cls;
  }

  // Tipi di danno salvati in inglese (es. "fire"): si mostrano tradotti (chiavi damageFire, …)
  function damageLabel(type: string) {
    const key = damageKey(type) as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : type;
  }

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
        <div className="d-flex gap-2 justify-content-between align-items-center w-100">
          <div>
            {spell?.isOwner && (
              <GrimoireButton
                variant="outline-secondary"
                mobileIcon="pencil"
                onClick={() => { close(); router.push(`/spells/${spell.id}`); }}
              >
                {tDetail("editButton")}
              </GrimoireButton>
            )}
          </div>
          {position && (
            <div className="d-flex align-items-center gap-2">
              <GrimoireButton variant="outline-secondary" icon="chevron-left" tooltip={tUi("previous")} disabled={!onPrev} onClick={goPrev} />
              <small style={{ color: "var(--g-text-muted)", whiteSpace: "nowrap" }}>{position.current} / {position.total}</small>
              <GrimoireButton variant="outline-secondary" icon="chevron-right" tooltip={tUi("next")} disabled={!onNext} onClick={goNext} />
            </div>
          )}
          <GrimoireButton variant="outline-secondary" onClick={close}>
            {tUi("close")}
          </GrimoireButton>
        </div>
      }
    >
      {/* key: cambiando incantesimo il contenuto si ricrea e l'animazione di entrata riparte */}
      <div
        key={spellId ?? ""}
        className={direction === "next" ? styles.fromRight : direction === "prev" ? styles.fromLeft : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: "100%" }}
      >
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

            {/* Language-specific fields */}
            <Field label={t("fieldDescrizione")} value={langData?.descrizione} multiline />
            <Field label={t("fieldHigherLevel")} value={langData?.highLevel} multiline />
            <Field label={t("fieldMaterial")} value={langData?.material} multiline />

            <hr style={{ borderColor: "var(--g-card-border)", margin: "1rem 0" }} />

            {/* Common metadata */}
            <div className="row g-0 mb-1">
              <div className="col-6">
                <Field label={t("fieldScuola")} value={scuolaLabel(spell.scuola)} />
              </div>
              <div className="col-6">
                <Field
                  label={t("fieldLivello")}
                  value={spell.livello === 0 ? t("trucchetto") : t("livelloShort", { n: spell.livello })}
                />
              </div>
            </div>
            <div className="row g-0 mb-1">
              <div className="col-6">
                <Field label={t("fieldTempoLancio")} value={spell.tempoLancio} />
              </div>
              <div className="col-6">
                <Field label={t("fieldGittata")} value={formatRange(spell.gittata, unitSystem, tRange)} />
              </div>
            </div>
            <Field label={t("fieldDurata")} value={spell.durata} />
            <Field label={t("fieldComponenti")} value={spell.componenti} />
            <div className="row g-0">
              {spell.concentration !== null && (
                <div className="col-6">
                  <Field label={t("colConcentrazione")} value={spell.concentration ? t("si") : t("no")} />
                </div>
              )}
              {spell.ritual !== null && (
                <div className="col-6">
                  <Field label={t("colRituale")} value={spell.ritual ? t("si") : t("no")} />
                </div>
              )}
            </div>
            <Field label={t("fieldDanno")} value={(spell.tipiDanno ?? []).map(damageLabel).join(", ")} />
            <Field label={t("colClassi")} value={translateClassi(spell.classi, classLabel)} />
          </>
        ) : null}
      </div>
    </GrimoireModal>
  );
}
