"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { SPELL, UPDATE_SPELL, SHARE_SPELL_USER, UPSERT_SPELL_TRANSLATION } from "@/lib/queries/spells";
import { CASTING_TIME_MAP, DURATION_MAP } from "@/lib/formatSpellFields";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireFormSection from "@/components/ui/GrimoireFormSection";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalActions from "@/components/ui/GrimoireModalActions";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireCard from "@/components/ui/GrimoireCard";

type SpellTranslation = { locale: string; nome: string; descrizione: string | null };

type SpellDetail = {
  id: string;
  nome: string;
  descrizione: string | null;
  scuola: string | null;
  livello: number;
  tempoLancio: string | null;
  gittata: string | null;
  durata: string | null;
  componenti: string | null;
  isOwner: boolean;
  translations: SpellTranslation[];
};

export default function SpellDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [transNome, setTransNome] = useState("");
  const [transDescrizione, setTransDescrizione] = useState("");
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

  const fields: FieldConfig[] = [
    { name: "nome", label: ts("fieldNome"), type: "text", required: true },
    { name: "scuola", label: ts("fieldScuola"), type: "select", options: scuolaOptions },
    { name: "livello", label: ts("fieldLivello"), type: "select", options: livelloOptions },
    { name: "descrizione", label: ts("fieldDescrizione"), type: "textarea", rows: 5 },
    { name: "tempoLancio", label: ts("fieldTempoLancio"), type: "selectOrText", options: castingTimeOptions, customLabel: ts("ctCustom") },
    { name: "gittata", label: ts("fieldGittata"), type: "range" },
    { name: "durata", label: ts("fieldDurata"), type: "selectOrText", options: durationOptions, customLabel: ts("durCustom") },
    { name: "componenti", label: ts("fieldComponenti"), type: "components" },
  ];

  const { data, loading, error, refetch } = useQuery<{ spell: SpellDetail }>(SPELL, {
    variables: { id, locale },
  });
  const [updateSpell, { loading: updating, error: updateError }] = useMutation(UPDATE_SPELL, { onCompleted: () => refetch() });
  type UpsertResult = { upsertSpellTranslation: { id: string; translations: SpellTranslation[] } };
  const [upsertTranslation, { loading: savingTrans, error: transError }] = useMutation<UpsertResult>(UPSERT_SPELL_TRANSLATION, {
    onCompleted: (data) => {
      const saved = data?.upsertSpellTranslation?.translations?.find((tr) => tr.locale === locale);
      if (saved) { setTransNome(saved.nome); setTransDescrizione(saved.descrizione ?? ""); }
      refetch();
    },
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

  // Pre-populate translation fields from loaded data
  const existingTrans = spell.translations.find((tr) => tr.locale === locale);
  const initTransNome = transNome || existingTrans?.nome || "";
  const initTransDescrizione = transDescrizione || existingTrans?.descrizione || "";

  const initialValues: Record<string, string> = {
    nome: spell.nome,
    descrizione: spell.descrizione ?? "",
    scuola: spell.scuola ?? "",
    livello: String(spell.livello),
    tempoLancio: spell.tempoLancio ?? "",
    gittata: spell.gittata ?? "",
    durata: spell.durata ?? "",
    componenti: spell.componenti ?? "",
  };

  async function handleUpdate(values: Record<string, string>) {
    await updateSpell({
      variables: {
        id,
        nome: values.nome,
        descrizione: values.descrizione || null,
        scuola: values.scuola || null,
        livello: Number(values.livello),
        tempoLancio: values.tempoLancio || null,
        gittata: values.gittata || null,
        durata: values.durata || null,
        componenti: values.componenti || null,
      },
    });
  }

  async function handleSaveTranslation() {
    if (!initTransNome) return;
    await upsertTranslation({
      variables: {
        spellId: id,
        locale,
        nome: initTransNome,
        descrizione: initTransDescrizione || null,
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
          error={updateError?.message}
          view={!spell.isOwner}
        />
      </GrimoireFormSection>

      {/* Translation card */}
      <GrimoireFormSection full>
        <GrimoireCard bare>
          <div
            className="card-header border-bottom px-4 pt-4 pb-3"
            style={{ backgroundColor: "var(--g-card-bg)", borderColor: "var(--g-card-border)" }}
          >
            <h5 className="mb-0" style={{ color: "var(--g-text)" }}>{t("translationTitle", { locale: locale.toUpperCase() })}</h5>
          </div>
          <div className="card-body px-4 py-3">
            {transError && <GrimoireAlert>{transError.message}</GrimoireAlert>}
            <GrimoireInput
              id="trans-nome"
              label={t("translationNome")}
              type="text"
              value={initTransNome}
              onChange={(e) => setTransNome((e.target as HTMLInputElement).value)}
            />
            <GrimoireInput
              id="trans-descrizione"
              label={t("translationDescrizione")}
              type="textarea"
              rows={5}
              value={initTransDescrizione}
              onChange={(e) => setTransDescrizione((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div
            className="card-footer px-4 py-3 d-flex justify-content-end border-top"
            style={{ backgroundColor: "var(--g-card-bg)", borderColor: "var(--g-card-border)" }}
          >
            <GrimoireButton loading={savingTrans} onClick={handleSaveTranslation}>
              {t("translationSave")}
            </GrimoireButton>
          </div>
        </GrimoireCard>
      </GrimoireFormSection>

      <GrimoireModal show={showShare} onClose={() => setShowShare(false)} title={t("shareModalTitle")}>
        {shareSuccess && <GrimoireAlert variant="success">{t("shareSuccess")}</GrimoireAlert>}
        {shareError && <GrimoireAlert>{shareError.message}</GrimoireAlert>}
        <GrimoireInput
          id="share-email"
          label={t("shareEmailLabel")}
          type="email"
          value={shareEmail}
          onChange={(e) => setShareEmail((e.target as HTMLInputElement).value)}
          placeholder={t("shareEmailPlaceholder")}
        />
        <GrimoireModalActions>
          <GrimoireButton variant="outline-secondary" onClick={() => setShowShare(false)}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton loading={sharing} onClick={() => shareSpell({ variables: { spellId: id, email: shareEmail } })}>
            {t("shareButton")}
          </GrimoireButton>
        </GrimoireModalActions>
      </GrimoireModal>
    </GrimoirePage>
  );
}
