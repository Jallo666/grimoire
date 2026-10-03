"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { CREATE_SPELL } from "@/lib/queries/spells";
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
import type { SpellOptions } from "./useSpellOptions";
import type { SpellGroup } from "./spellTypes";

type Props = {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
  groups: SpellGroup[];
  options: SpellOptions;
};

const EMPTY_TEXTS = { nome: "", descrizione: "" };
const EMPTY_COMMON = { scuola: "", livello: "1", tempoLancio: "", gittata: "", durata: "", componenti: "", groupId: "" };
const EMPTY_TAGS = { classIds: [] as string[], damageTypeIds: [] as string[] };

// Creazione di un incantesimo. Nome e descrizione nella lingua dell'interfaccia (obbligatori)
// e, facoltativi, nell'altra lingua; poi i dati comuni, le classi e i tipi di danno.
export default function CreateSpellModal({ show, onClose, onCreated, groups, options }: Props) {
  const t = useTranslations("spells");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const secondaryLocale = locale === "it" ? "en" : "it";

  const [activeLang, setActiveLang] = useState<string>(locale);
  const [primary, setPrimary] = useState(EMPTY_TEXTS);
  const [secondary, setSecondary] = useState(EMPTY_TEXTS);
  const [common, setCommon] = useState(EMPTY_COMMON);
  const [tags, setTags] = useState(EMPTY_TAGS);
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setPrimary(EMPTY_TEXTS);
    setSecondary(EMPTY_TEXTS);
    setCommon(EMPTY_COMMON);
    setTags(EMPTY_TAGS);
    setActiveLang(locale);
    setFormError(null);
  }

  function close() {
    reset();
    onClose();
  }

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL, {
    onCompleted: () => { onCreated(); close(); },
  });

  const schoolOptions = [{ value: "", label: t("scuolaEmpty") }, ...options.schoolOptions];
  const groupOptions = [{ value: "", label: t("groupAutoLabel") }, ...groups.map((g) => ({ value: g.id, label: g.nome }))];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!primary.nome.trim()) missing.push(t("fieldNome"));
    if (!primary.descrizione.trim()) missing.push(t("fieldDescrizione"));
    if (!common.scuola) missing.push(t("fieldScuola"));
    if (!common.tempoLancio) missing.push(t("fieldTempoLancio"));
    if (!common.gittata) missing.push(t("fieldGittata"));
    if (!common.durata) missing.push(t("fieldDurata"));
    if (missing.length > 0) {
      // Se mancano nome o descrizione nella lingua principale, si torna a quella tab
      if ((!primary.nome.trim() || !primary.descrizione.trim()) && activeLang !== locale) setActiveLang(locale);
      setFormError(tUi("requiredFields", { fields: missing.join(", ") }));
      return;
    }
    setFormError(null);
    await createSpell({
      variables: {
        nome: primary.nome,
        descrizione: primary.descrizione || null,
        scuola: common.scuola || null,
        livello: Number(common.livello),
        tempoLancio: common.tempoLancio || null,
        gittata: common.gittata || null,
        durata: common.durata || null,
        componenti: common.componenti || null,
        groupId: common.groupId || null,
        translationLocale: secondary.nome.trim() ? secondaryLocale : undefined,
        translationNome: secondary.nome.trim() || undefined,
        translationDescrizione: secondary.descrizione.trim() || undefined,
        classIds: tags.classIds,
        damageTypeIds: tags.damageTypeIds,
      },
    });
  }

  return (
    <GrimoireModal
      show={show}
      onClose={close}
      title={t("createModalTitle")}
      size="lg"
      fullscreenOnMobile
      footer={
        <GrimoireModalFooter error={formError ?? createError}>
          <GrimoireButton variant="outline-secondary" onClick={close}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton type="submit" form="create-spell-form" loading={creating}>{t("createSubmit")}</GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      <form id="create-spell-form" onSubmit={handleSubmit} noValidate>
        {/* Tab della lingua: la seconda lingua è facoltativa */}
        <GrimoireTabs
          tabs={[
            { key: locale, label: locale.toUpperCase() },
            { key: secondaryLocale, label: `${secondaryLocale.toUpperCase()} ${t("langTabOptional")}` },
          ]}
          active={activeLang}
          onChange={setActiveLang}
        />

        {activeLang === locale ? (
          <>
            <GrimoireInput id="create-nome" label={t("fieldNome")} type="text" required value={primary.nome} onChange={(e) => setPrimary((v) => ({ ...v, nome: e.target.value }))} />
            <GrimoireInput id="create-desc" label={t("fieldDescrizione")} type="textarea" required rows={5} value={primary.descrizione} onChange={(e) => setPrimary((v) => ({ ...v, descrizione: e.target.value }))} />
          </>
        ) : (
          <>
            <GrimoireInput id="create-nome-alt" label={`${t("fieldNome")} (${secondaryLocale.toUpperCase()})`} type="text" value={secondary.nome} onChange={(e) => setSecondary((v) => ({ ...v, nome: e.target.value }))} />
            <GrimoireInput id="create-desc-alt" label={`${t("fieldDescrizione")} (${secondaryLocale.toUpperCase()})`} type="textarea" rows={5} value={secondary.descrizione} onChange={(e) => setSecondary((v) => ({ ...v, descrizione: e.target.value }))} />
          </>
        )}

        <GrimoireDivider />

        {/* Campi comuni: due colonne da tablet in su */}
        <GrimoireFieldGrid>
          <GrimoireInput id="create-scuola" label={t("fieldScuola")} type="select" required value={common.scuola} onChange={(e) => setCommon((v) => ({ ...v, scuola: e.target.value }))} options={schoolOptions} />
          <GrimoireInput id="create-livello" label={t("fieldLivello")} type="select" value={common.livello} onChange={(e) => setCommon((v) => ({ ...v, livello: e.target.value }))} options={options.levelOptions} />
          <GrimoireSelectOrText id="create-tempo" label={t("fieldTempoLancio")} value={common.tempoLancio} onChange={(val) => setCommon((v) => ({ ...v, tempoLancio: val }))} options={options.castingTimeOptions} customLabel={t("ctCustom")} />
          <GrimoireRangeInput id="create-gittata" label={t("fieldGittata")} value={common.gittata} onChange={(val) => setCommon((v) => ({ ...v, gittata: val }))} />
          <GrimoireSelectOrText id="create-durata" label={t("fieldDurata")} value={common.durata} onChange={(val) => setCommon((v) => ({ ...v, durata: val }))} options={options.durationOptions} customLabel={t("durCustom")} />
          <GrimoireInput id="create-group" label={t("groupLabel")} type="select" value={common.groupId} onChange={(e) => setCommon((v) => ({ ...v, groupId: e.target.value }))} options={groupOptions} />
        </GrimoireFieldGrid>
        <GrimoireComponentsInput id="create-componenti" label={t("fieldComponenti")} value={common.componenti} onChange={(val) => setCommon((v) => ({ ...v, componenti: val }))} />
        <GrimoireStack>
          <GrimoireChips label={t("colClassi")} options={options.classOptions} value={tags.classIds} onChange={(ids) => setTags((v) => ({ ...v, classIds: ids }))} />
          <GrimoireChips label={t("fieldDanno")} options={options.damageOptions} value={tags.damageTypeIds} onChange={(ids) => setTags((v) => ({ ...v, damageTypeIds: ids }))} />
        </GrimoireStack>
      </form>
    </GrimoireModal>
  );
}
