"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { SPELL } from "@/lib/queries/spells";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireButton from "@/components/ui/GrimoireButton";

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
  isOwner: boolean;
  isSystem: boolean;
  translations: Translation[];
};

type Props = {
  spellId: string | null;
  onClose: () => void;
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

export default function SpellViewModal({ spellId, onClose }: Props) {
  const t = useTranslations("spells");
  const tDetail = useTranslations("spellDetail");
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

  function getLangData(lang: string) {
    if (!spell) return null;
    const trans = spell.translations.find((tr) => tr.locale === lang);
    if (trans) {
      return { nome: trans.nome, descrizione: trans.descrizione, highLevel: trans.highLevel, material: trans.material };
    }
    // Fallback to base fields
    return { nome: spell.nome, descrizione: spell.descrizione, highLevel: spell.higherLevel, material: null };
  }

  const langData = getLangData(viewLang);
  const title = langData?.nome ?? spell?.nome ?? "—";

  return (
    <GrimoireModal
      show={!!spellId}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="d-flex gap-2 justify-content-between w-100">
          <div>
            {spell?.isOwner && (
              <GrimoireButton
                variant="outline-secondary"
                onClick={() => { onClose(); router.push(`/spells/${spell.id}`); }}
              >
                {tDetail("editButton")}
              </GrimoireButton>
            )}
          </div>
          <GrimoireButton variant="outline-secondary" onClick={onClose}>
            {t("cancelButton")}
          </GrimoireButton>
        </div>
      }
    >
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <span className="spinner-border" style={{ color: "var(--g-text-muted)" }} aria-hidden="true" />
        </div>
      ) : spell ? (
        <>
          {/* Language tabs */}
          <ul className="nav nav-tabs mb-3" style={{ borderColor: "var(--g-card-border)" }}>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${viewLang === locale ? " active" : ""}`}
                onClick={() => setViewLang(locale)}
              >
                {locale.toUpperCase()}
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${viewLang === secondaryLocale ? " active" : ""}`}
                onClick={() => setViewLang(secondaryLocale)}
              >
                {secondaryLocale.toUpperCase()}
              </button>
            </li>
          </ul>

          {/* Language-specific fields */}
          <Field label={t("fieldDescrizione")} value={langData?.descrizione} multiline />
          <Field label={t("fieldHigherLevel")} value={langData?.highLevel} multiline />
          <Field label={t("fieldMaterial")} value={langData?.material} multiline />

          <hr style={{ borderColor: "var(--g-card-border)", margin: "1rem 0" }} />

          {/* Common metadata */}
          <div className="row g-0 mb-1">
            <div className="col-6">
              <Field label={t("fieldScuola")} value={spell.scuola} />
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
          <Field label={t("colClassi")} value={spell.classi} />
        </>
      ) : null}
    </GrimoireModal>
  );
}
