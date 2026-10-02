"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { SPELL, UPDATE_SPELL, SHARE_SPELL_USER } from "@/lib/queries/spells";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireFormSection from "@/components/ui/GrimoireFormSection";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalActions from "@/components/ui/GrimoireModalActions";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireInput from "@/components/ui/GrimoireInput";

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
};

export default function SpellDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const t = useTranslations("spellDetail");
  const ts = useTranslations("spells");

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

  const fields: FieldConfig[] = [
    { name: "nome", label: ts("fieldNome"), type: "text", required: true },
    { name: "scuola", label: ts("fieldScuola"), type: "select", options: scuolaOptions },
    { name: "livello", label: ts("fieldLivello"), type: "select", options: livelloOptions },
    { name: "descrizione", label: ts("fieldDescrizione"), type: "textarea", rows: 5 },
    { name: "tempoLancio", label: ts("fieldTempoLancio"), type: "text" },
    { name: "gittata", label: ts("fieldGittata"), type: "range" },
    { name: "durata", label: ts("fieldDurata"), type: "text" },
    { name: "componenti", label: ts("fieldComponenti"), type: "text" },
  ];

  const { data, loading, error, refetch } = useQuery<{ spell: SpellDetail }>(SPELL, { variables: { id } });
  const [updateSpell, { loading: updating, error: updateError }] = useMutation(UPDATE_SPELL, { onCompleted: () => refetch() });
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
