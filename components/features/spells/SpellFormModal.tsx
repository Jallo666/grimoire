"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { CREATE_SPELL, UPDATE_SPELL, UPSERT_SPELL_TRANSLATION, SPELL } from "@/lib/queries/spells";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireDivider from "@/components/ui/GrimoireDivider";
import GrimoireFieldGrid from "@/components/ui/GrimoireFieldGrid";
import GrimoireSelectOrText from "@/components/ui/GrimoireSelectOrText";
import GrimoireRangeInput from "@/components/ui/GrimoireRangeInput";
import GrimoireComponentsInput from "@/components/ui/GrimoireComponentsInput";
import GrimoireStack from "@/components/ui/GrimoireStack";
import GrimoireChips from "@/components/ui/GrimoireChips";
import GrimoireSkeletonText from "@/components/ui/GrimoireSkeletonText";
import type { SpellOptions } from "./useSpellOptions";
import type { SpellGroup } from "./spellTypes";

type Props = {
  show: boolean;
  // id dell'incantesimo da modificare; assente = nuovo incantesimo
  spellId?: string | null;
  onClose: () => void;
  onSaved: () => void;
  groups: SpellGroup[];
  options: SpellOptions;
};

type Texts = { nome: string; descrizione: string; higherLevel: string; materiale: string };
type Translation = { locale: string; nome: string; descrizione: string | null; highLevel: string | null };
type Material = { testo: string; perBersaglio: boolean; translations: { locale: string; testo: string }[] };
type SpellToEdit = {
  id: string;
  nome: string;
  descrizione: string | null;
  higherLevel: string | null;
  scuola: string | null;
  livello: number;
  tempoLancio: string | null;
  gittata: string | null;
  durata: string | null;
  componenti: string | null;
  classi: { id: string }[];
  tipiDanno: { id: string }[];
  translations: Translation[];
  materiale: Material | null;
};

const EMPTY_TEXTS: Texts = { nome: "", descrizione: "", higherLevel: "", materiale: "" };
const EMPTY_COMMON = { scuola: "", livello: "1", tempoLancio: "", gittata: "", durata: "", componenti: "", groupId: "" };
const EMPTY_TAGS = { classIds: [] as string[], damageTypeIds: [] as string[] };

const otherLocale = (l: string) => (l === "it" ? "en" : "it");

// "V, S, M" contiene la M?
const hasM = (componenti: string) => componenti.split(",").map((p) => p.trim()).includes("M");

// Lingua del testo principale (campi base dell'incantesimo): è quella in cui è stato creato,
// l'altra lingua sta nelle traduzioni. Se c'è solo la traduzione nella lingua dell'interfaccia,
// il testo principale è nell'altra; altrimenti si considera quella dell'interfaccia.
function mainLocaleOf(spell: SpellToEdit, locale: string) {
  const has = (l: string) => spell.translations.some((tr) => tr.locale === l);
  return has(locale) && !has(otherLocale(locale)) ? otherLocale(locale) : locale;
}

// Creazione e modifica di un incantesimo: stessa modale, stessi campi.
// Nome, descrizione, "ai livelli superiori" e componente materiale in due lingue (la principale
// obbligatoria), poi i dati comuni, le classi e i tipi di danno. Il gruppo si sceglie solo creando
// (dopo si sposta con "Sposta nel gruppo").
export default function SpellFormModal({ show, spellId, onClose, onSaved, groups, options }: Props) {
  const t = useTranslations("spells");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const editing = !!spellId;

  const [mainLocale, setMainLocale] = useState(locale);
  const secondaryLocale = otherLocale(mainLocale);
  const [activeLang, setActiveLang] = useState<string>(locale);
  const [main, setMain] = useState(EMPTY_TEXTS);
  const [secondary, setSecondary] = useState(EMPTY_TEXTS);
  // Componente materiale "per bersaglio" (la quantità si moltiplica)
  const [perBersaglio, setPerBersaglio] = useState(false);
  const [common, setCommon] = useState(EMPTY_COMMON);
  const [tags, setTags] = useState(EMPTY_TAGS);
  // Con la M tra i componenti compaiono il testo del materiale (per lingua) e "per bersaglio"
  const withMaterial = hasM(common.componenti);
  const [formError, setFormError] = useState<string | null>(null);

  // Modifica: l'incantesimo con i testi originali (senza locale) e tutte le traduzioni.
  // Fuori dalla cache condivisa, come nel dettaglio: non deve toccare i nomi tradotti delle liste.
  const { data, loading: loadingSpell, error: loadError } = useQuery<{ spell: SpellToEdit | null }>(SPELL, {
    variables: { id: spellId!, tagsLocale: locale },
    skip: !show || !editing,
    fetchPolicy: "no-cache",
  });

  // Arrivato l'incantesimo, si riempie il form (una volta per apertura)
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const spell = data?.spell;
  if (show && !loadingSpell && spell && spell.id !== loadedId) {
    const mainLang = mainLocaleOf(spell, locale);
    const tr = spell.translations.find((x) => x.locale === otherLocale(mainLang));
    setLoadedId(spell.id);
    setMainLocale(mainLang);
    setActiveLang(mainLang);
    const secondaryMaterial = spell.materiale?.translations.find((x) => x.locale === otherLocale(mainLang));
    setMain({ nome: spell.nome, descrizione: spell.descrizione ?? "", higherLevel: spell.higherLevel ?? "", materiale: spell.materiale?.testo ?? "" });
    setSecondary({ nome: tr?.nome ?? "", descrizione: tr?.descrizione ?? "", higherLevel: tr?.highLevel ?? "", materiale: secondaryMaterial?.testo ?? "" });
    setPerBersaglio(spell.materiale?.perBersaglio ?? false);
    setCommon({
      scuola: spell.scuola ?? "",
      livello: String(spell.livello),
      tempoLancio: spell.tempoLancio ?? "",
      gittata: spell.gittata ?? "",
      durata: spell.durata ?? "",
      componenti: spell.componenti ?? "",
      groupId: "",
    });
    setTags({ classIds: spell.classi.map((c) => c.id), damageTypeIds: spell.tipiDanno.map((d) => d.id) });
  }

  function close() {
    setMainLocale(locale);
    setActiveLang(locale);
    setMain(EMPTY_TEXTS);
    setSecondary(EMPTY_TEXTS);
    setPerBersaglio(false);
    setCommon(EMPTY_COMMON);
    setTags(EMPTY_TAGS);
    setFormError(null);
    setLoadedId(null);
    onClose();
  }

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL);
  const [updateSpell, { loading: updating, error: updateError }] = useMutation(UPDATE_SPELL);
  const [upsertTranslation, { loading: translating, error: translationError }] = useMutation(UPSERT_SPELL_TRANSLATION);
  const saving = creating || updating || translating;

  const schoolOptions = [{ value: "", label: t("scuolaEmpty") }, ...options.schoolOptions];
  const groupOptions = [{ value: "", label: t("groupAutoLabel") }, ...groups.map((g) => ({ value: g.id, label: g.nome }))];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!main.nome.trim()) missing.push(t("fieldNome"));
    if (!main.descrizione.trim()) missing.push(t("fieldDescrizione"));
    if (!common.scuola) missing.push(t("fieldScuola"));
    if (!common.tempoLancio) missing.push(t("fieldTempoLancio"));
    if (!common.gittata) missing.push(t("fieldGittata"));
    if (!common.durata) missing.push(t("fieldDurata"));
    if (missing.length > 0) {
      // Se mancano nome o descrizione nella lingua principale, si torna a quella tab
      if (!main.nome.trim() || !main.descrizione.trim()) setActiveLang(mainLocale);
      setFormError(tUi("requiredFields", { fields: missing.join(", ") }));
      return;
    }
    setFormError(null);

    const shared = {
      nome: main.nome,
      descrizione: main.descrizione || null,
      higherLevel: main.higherLevel || null,
      scuola: common.scuola || null,
      livello: Number(common.livello),
      tempoLancio: common.tempoLancio || null,
      gittata: common.gittata || null,
      durata: common.durata || null,
      componenti: common.componenti || null,
      // senza la M il materiale si toglie
      materiale: withMaterial ? main.materiale.trim() || null : null,
      materialePerBersaglio: withMaterial && perBersaglio,
      classIds: tags.classIds,
      damageTypeIds: tags.damageTypeIds,
    };
    const hasTranslation = !!secondary.nome.trim();
    const secondaryMaterial = withMaterial ? secondary.materiale.trim() || null : null;

    try {
      if (editing) {
        await updateSpell({ variables: { id: spellId, ...shared } });
        // La traduzione si salva solo se ha almeno il nome
        if (hasTranslation) {
          await upsertTranslation({
            variables: {
              spellId,
              locale: secondaryLocale,
              nome: secondary.nome,
              descrizione: secondary.descrizione.trim() || null,
              highLevel: secondary.higherLevel.trim() || null,
              material: secondaryMaterial,
            },
          });
        }
      } else {
        await createSpell({
          variables: {
            ...shared,
            groupId: common.groupId || null,
            translationLocale: hasTranslation ? secondaryLocale : undefined,
            translationNome: hasTranslation ? secondary.nome : undefined,
            translationDescrizione: secondary.descrizione.trim() || undefined,
            translationHigherLevel: secondary.higherLevel.trim() || undefined,
            translationMateriale: secondaryMaterial ?? undefined,
          },
        });
      }
    } catch {
      // L'errore lo mostra il footer (createError / updateError / translationError)
      return;
    }
    onSaved();
    close();
  }

  // Campi testo di una lingua: la principale ha nome e descrizione obbligatori
  function textFields(lang: string, texts: Texts, setTexts: (fn: (v: Texts) => Texts) => void) {
    const isMain = lang === mainLocale;
    const suffix = isMain ? "" : ` (${lang.toUpperCase()})`;
    return (
      <>
        <GrimoireInput id={`spell-nome-${lang}`} label={`${t("fieldNome")}${suffix}`} type="text" required={isMain} value={texts.nome} onChange={(e) => setTexts((v) => ({ ...v, nome: e.target.value }))} />
        <GrimoireInput id={`spell-desc-${lang}`} label={`${t("fieldDescrizione")}${suffix}`} type="textarea" required={isMain} rows={5} value={texts.descrizione} onChange={(e) => setTexts((v) => ({ ...v, descrizione: e.target.value }))} />
        <GrimoireInput id={`spell-higher-${lang}`} label={`${t("fieldHigherLevel")}${suffix}`} type="textarea" rows={2} value={texts.higherLevel} onChange={(e) => setTexts((v) => ({ ...v, higherLevel: e.target.value }))} />
        {/* Testo del componente materiale: solo se tra i componenti c'è la M */}
        {withMaterial && (
          <GrimoireInput id={`spell-material-${lang}`} label={`${t("fieldMaterial")}${suffix}`} type="textarea" rows={2} value={texts.materiale} onChange={(e) => setTexts((v) => ({ ...v, materiale: e.target.value }))} />
        )}
      </>
    );
  }

  // Modifica: skeleton finché l'incantesimo non è caricato (se il caricamento fallisce, l'errore è nel footer)
  const waiting = editing && (loadingSpell || !loadedId);

  return (
    <GrimoireModal
      show={show}
      onClose={close}
      title={editing ? t("editModalTitle") : t("createModalTitle")}
      size="lg"
      fullscreenOnMobile
      footer={
        <GrimoireModalFooter error={formError ?? loadError ?? createError ?? updateError ?? translationError}>
          <GrimoireButton variant="outline-secondary" onClick={close}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton type="submit" form="spell-form" loading={saving} disabled={waiting}>
            {editing ? t("editSubmit") : t("createSubmit")}
          </GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      {waiting ? (
        <GrimoireSkeletonText lines={8} />
      ) : (
        <form id="spell-form" onSubmit={handleSubmit} noValidate>
          {/* Tab della lingua: la seconda lingua è facoltativa */}
          <GrimoireTabs
            tabs={[
              { key: mainLocale, label: mainLocale.toUpperCase() },
              { key: secondaryLocale, label: `${secondaryLocale.toUpperCase()} ${t("langTabOptional")}` },
            ]}
            active={activeLang}
            onChange={setActiveLang}
          />

          {activeLang === mainLocale ? textFields(mainLocale, main, setMain) : textFields(secondaryLocale, secondary, setSecondary)}

          <GrimoireDivider />

          {/* Campi comuni: due colonne da tablet in su */}
          <GrimoireFieldGrid>
            <GrimoireInput id="spell-scuola" label={t("fieldScuola")} type="select" required value={common.scuola} onChange={(e) => setCommon((v) => ({ ...v, scuola: e.target.value }))} options={schoolOptions} />
            <GrimoireInput id="spell-livello" label={t("fieldLivello")} type="select" value={common.livello} onChange={(e) => setCommon((v) => ({ ...v, livello: e.target.value }))} options={options.levelOptions} />
            <GrimoireSelectOrText id="spell-tempo" label={t("fieldTempoLancio")} value={common.tempoLancio} onChange={(val) => setCommon((v) => ({ ...v, tempoLancio: val }))} options={options.castingTimeOptions} customLabel={t("ctCustom")} />
            <GrimoireRangeInput id="spell-gittata" label={t("fieldGittata")} value={common.gittata} onChange={(val) => setCommon((v) => ({ ...v, gittata: val }))} />
            <GrimoireSelectOrText id="spell-durata" label={t("fieldDurata")} value={common.durata} onChange={(val) => setCommon((v) => ({ ...v, durata: val }))} options={options.durationOptions} customLabel={t("durCustom")} />
            {!editing && (
              <GrimoireInput id="spell-group" label={t("groupLabel")} type="select" value={common.groupId} onChange={(e) => setCommon((v) => ({ ...v, groupId: e.target.value }))} options={groupOptions} />
            )}
          </GrimoireFieldGrid>
          <GrimoireComponentsInput id="spell-componenti" label={t("fieldComponenti")} value={common.componenti} onChange={(val) => setCommon((v) => ({ ...v, componenti: val }))} />
          {withMaterial && (
            <GrimoireInput id="spell-per-bersaglio" label={t("materialPerTarget")} type="checkbox" value={String(perBersaglio)} onChange={(e) => setPerBersaglio(e.target.value === "true")} />
          )}
          <GrimoireStack>
            <GrimoireChips label={t("colClassi")} options={options.classOptions} value={tags.classIds} onChange={(ids) => setTags((v) => ({ ...v, classIds: ids }))} />
            <GrimoireChips label={t("fieldDanno")} options={options.damageOptions} value={tags.damageTypeIds} onChange={(ids) => setTags((v) => ({ ...v, damageTypeIds: ids }))} />
          </GrimoireStack>
        </form>
      )}
    </GrimoireModal>
  );
}
