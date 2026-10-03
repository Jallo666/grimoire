"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { SPELL, UPDATE_SPELL, SHARE_SPELL_USER, UPSERT_SPELL_TRANSLATION, SPELL_CLASSES, DAMAGE_TYPES } from "@/lib/queries/spells";
import { CASTING_TIME_MAP, DURATION_MAP } from "@/lib/formatSpellFields";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireFormSection from "@/components/ui/GrimoireFormSection";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireInput from "@/components/ui/GrimoireInput";

type SpellTranslation = { locale: string; nome: string; descrizione: string | null; highLevel: string | null; material: string | null };

type SpellDetail = {
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
  classi: { id: string; nome: string }[];
  tipiDanno: { id: string; nome: string }[];
  isOwner: boolean;
  translations: SpellTranslation[];
};

export default function SpellDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const t = useTranslations("spellDetail");
  const ts = useTranslations("spells");
  const locale = useLocale();

  const scuolaOptions = [
    { value: "", label: ts("scuolaEmpty") },
    { value: "Abiurazione", label: ts("scuolaAbiurazione") },
    { value: "Ammaliamento", label: ts("scuolaAmmaliamento") },
    { value: "Divinazione", label: ts("scuolaDivinazione") },
    { value: "Evocazione", label: ts("scuolaEvocazione") },
    { value: "Illusione", label: ts("scuolaIllusione") },
    { value: "Invocazione", label: ts("scuolaInvocazione") },
    { value: "Necromanzia", label: ts("scuolaNecromanzia") },
    { value: "Trasmutazione", label: ts("scuolaTrasmutazione") },
  ];

  const livelloOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? ts("livelloOption0") : ts("livelloOptionN", { n: i }),
  }));

  const castingTimeOptions = Object.entries(CASTING_TIME_MAP).map(([value, key]) => ({
    value,
    label: ts(key as Parameters<typeof ts>[0]),
  }));

  const durationOptions = Object.entries(DURATION_MAP).map(([value, key]) => ({
    value,
    label: ts(key as Parameters<typeof ts>[0]),
  }));

  // Classi e tipi di danno dal database (id e nome già tradotto)
  const { data: classesData } = useQuery<{ spellClasses: { id: string; nome: string }[] }>(SPELL_CLASSES, { variables: { locale } });
  const { data: damageData } = useQuery<{ damageTypes: { id: string; nome: string }[] }>(DAMAGE_TYPES, { variables: { locale } });
  const classOptions = (classesData?.spellClasses ?? []).map((c) => ({ value: c.id, label: c.nome }));
  const damageOptions = (damageData?.damageTypes ?? []).map((d) => ({ value: d.id, label: d.nome }));

  const fields: FieldConfig[] = [
    { name: "nome", label: ts("fieldNome"), type: "text", required: true },
    { name: "scuola", label: ts("fieldScuola"), type: "select", options: scuolaOptions },
    { name: "livello", label: ts("fieldLivello"), type: "select", options: livelloOptions },
    { name: "descrizione", label: ts("fieldDescrizione"), type: "textarea", rows: 5 },
    { name: "higherLevel", label: ts("fieldHigherLevel"), type: "textarea", rows: 2 },
    { name: "tempoLancio", label: ts("fieldTempoLancio"), type: "selectOrText", options: castingTimeOptions, customLabel: ts("ctCustom") },
    { name: "gittata", label: ts("fieldGittata"), type: "range" },
    { name: "durata", label: ts("fieldDurata"), type: "selectOrText", options: durationOptions, customLabel: ts("durCustom") },
    { name: "componenti", label: ts("fieldComponenti"), type: "components" },
    { name: "classIds", label: ts("colClassi"), type: "chips", options: classOptions },
    { name: "damageTypeIds", label: ts("fieldDanno"), type: "chips", options: damageOptions },
  ];

  const { data, loading, error, refetch } = useQuery<{ spell: SpellDetail }>(SPELL, {
    variables: { id, locale, tagsLocale: locale },
  });
  const [updateSpell, { loading: updating, error: updateError }] = useMutation(UPDATE_SPELL, { onCompleted: () => refetch() });
  type UpsertResult = { upsertSpellTranslation: { id: string; translations: SpellTranslation[] } };
  const [upsertTranslation, { loading: savingTrans, error: transError }] = useMutation<UpsertResult>(UPSERT_SPELL_TRANSLATION, {
    onCompleted: () => refetch(),
  });
  const [shareSpell, { loading: sharing, error: shareError }] = useMutation(SHARE_SPELL_USER, {
    onCompleted: () => { setShareSuccess(true); setShareEmail(""); },
  });

  if (error) throw error;

  if (loading || !data?.spell) {
    return (
      <GrimoirePage>
        <GrimoirePageTitle showBack> </GrimoirePageTitle>
        <GrimoireFormSection full>
          <GrimoireForm title={t("formTitle")} fields={fields} onSubmit={() => {}} fetching />
        </GrimoireFormSection>
      </GrimoirePage>
    );
  }

  const spell = data.spell;

  // Traduzione nella lingua dell'interfaccia: campi già riempiti se esiste
  const existingTrans = spell.translations.find((tr) => tr.locale === locale);
  const translationFields: FieldConfig[] = [
    { name: "nome", label: t("translationNome"), type: "text", required: true },
    { name: "descrizione", label: t("translationDescrizione"), type: "textarea", rows: 5 },
    { name: "highLevel", label: t("translationHigherLevel"), type: "textarea", rows: 2 },
    { name: "material", label: t("translationMaterial"), type: "text" },
  ];
  const translationValues: Record<string, string> = {
    nome: existingTrans?.nome ?? "",
    descrizione: existingTrans?.descrizione ?? "",
    highLevel: existingTrans?.highLevel ?? "",
    material: existingTrans?.material ?? "",
  };

  const initialValues: Record<string, string> = {
    nome: spell.nome,
    descrizione: spell.descrizione ?? "",
    higherLevel: spell.higherLevel ?? "",
    scuola: spell.scuola ?? "",
    livello: String(spell.livello),
    tempoLancio: spell.tempoLancio ?? "",
    gittata: spell.gittata ?? "",
    durata: spell.durata ?? "",
    componenti: spell.componenti ?? "",
    classIds: spell.classi.map((c) => c.id).join(","),
    damageTypeIds: spell.tipiDanno.map((d) => d.id).join(","),
  };

  async function handleUpdate(values: Record<string, string>) {
    await updateSpell({
      variables: {
        id,
        nome: values.nome,
        descrizione: values.descrizione || null,
        higherLevel: values.higherLevel || null,
        scuola: values.scuola || null,
        livello: Number(values.livello),
        tempoLancio: values.tempoLancio || null,
        gittata: values.gittata || null,
        durata: values.durata || null,
        componenti: values.componenti || null,
        classIds: values.classIds.split(",").filter(Boolean),
        damageTypeIds: values.damageTypeIds.split(",").filter(Boolean),
      },
    });
  }

  async function handleSaveTranslation(values: Record<string, string>) {
    await upsertTranslation({
      variables: {
        spellId: id,
        locale,
        nome: values.nome,
        descrizione: values.descrizione || null,
        highLevel: values.highLevel || null,
        material: values.material || null,
      },
    });
  }

  return (
    <GrimoirePage>
      <GrimoirePageTitle
        showBack
        action={<GrimoireButton icon="share" tooltip={t("tooltipShare")} variant="outline-secondary" onClick={() => { setShowShare(true); setShareSuccess(false); }} />}
      >
        {spell.nome}
      </GrimoirePageTitle>

      <GrimoireFormSection full>
        <GrimoireForm
          key={spell.id}
          title={t("formTitle")}
          fields={fields}
          initialValues={initialValues}
          onSubmit={handleUpdate}
          submitLabel={t("saveButton")}
          loading={updating}
          error={updateError}
          view={!spell.isOwner}
        />
      </GrimoireFormSection>

      {/* Traduzione nella lingua dell'interfaccia */}
      <GrimoireFormSection full>
        <GrimoireForm
          key={`${spell.id}-${locale}`}
          title={t("translationTitle", { locale: locale.toUpperCase() })}
          fields={translationFields}
          initialValues={translationValues}
          onSubmit={handleSaveTranslation}
          submitLabel={t("translationSave")}
          loading={savingTrans}
          error={transError}
        />
      </GrimoireFormSection>

      <GrimoireModal
        show={showShare}
        onClose={() => setShowShare(false)}
        title={t("shareModalTitle")}
        footer={
          <GrimoireModalFooter error={shareError}>
            <GrimoireButton variant="outline-secondary" onClick={() => setShowShare(false)}>{t("cancelButton")}</GrimoireButton>
            <GrimoireButton loading={sharing} onClick={() => shareSpell({ variables: { spellId: id, email: shareEmail } })}>
              {t("shareButton")}
            </GrimoireButton>
          </GrimoireModalFooter>
        }
      >
        {shareSuccess && <GrimoireAlert variant="success">{t("shareSuccess")}</GrimoireAlert>}
        <GrimoireInput
          id="share-email"
          label={t("shareEmailLabel")}
          type="email"
          value={shareEmail}
          onChange={(e) => setShareEmail((e.target as HTMLInputElement).value)}
          placeholder={t("shareEmailPlaceholder")}
        />
      </GrimoireModal>
    </GrimoirePage>
  );
}
