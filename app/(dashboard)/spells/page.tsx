"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { MY_SPELLS, CREATE_SPELL, DELETE_SPELL } from "@/lib/queries/spells";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";

type SpellRow = {
  id: string;
  nome: string;
  scuola: string | null;
  livello: number;
  descrizione: string | null;
  isOwner: boolean;
};

export default function SpellsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const t = useTranslations("spells");

  const scuolaOptions = [
    { value: "", label: t("scuolaEmpty") },
    { value: "Abiurazione", label: t("scuolaAbiurazione") },
    { value: "Ammaliamento", label: t("scuolaAmmaliamento") },
    { value: "Divinazione", label: t("scuolaDivinazione") },
    { value: "Evocazione", label: t("scuolaEvocazione") },
    { value: "Illusione", label: t("scuolaIllusione") },
    { value: "Invocazione", label: t("scuolaInvocazione") },
    { value: "Necromanzia", label: t("scuolaNecromanzia") },
    { value: "Trasmutazione", label: t("scuolaTrasmutazione") },
  ];

  const livelloOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? t("livelloOption0") : t("livelloOptionN", { n: i }),
  }));

  const createFields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text", required: true },
    { name: "scuola", label: t("fieldScuola"), type: "select", options: scuolaOptions },
    { name: "livello", label: t("fieldLivello"), type: "select", defaultValue: "1", options: livelloOptions },
    { name: "descrizione", label: t("fieldDescrizione"), type: "text" },
    { name: "tempoLancio", label: t("fieldTempoLancio"), type: "text" },
    { name: "gittata", label: t("fieldGittata"), type: "text" },
    { name: "durata", label: t("fieldDurata"), type: "text" },
    { name: "componenti", label: t("fieldComponenti"), type: "text" },
  ];

  const columns: Column<SpellRow>[] = [
    { key: "nome", label: t("colNome") },
    {
      key: "scuola",
      label: t("colScuola"),
      type: "badge",
      badgeColors: {
        Abiurazione: "primary", Ammaliamento: "warning", Divinazione: "success",
        Evocazione: "danger", Illusione: "secondary", Invocazione: "primary",
        Necromanzia: "danger", Trasmutazione: "success",
      },
    },
    {
      key: "livello",
      label: t("colLivello"),
      render: (v) => (v === 0 ? t("trucchetto") : t("livelloShort", { n: v as number })),
    },
  ];

  const { data, refetch } = useQuery<{ mySpells: SpellRow[] }>(MY_SPELLS);
  const spells = data?.mySpells ?? [];

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL, {
    onCompleted: () => { refetch(); setShowCreate(false); },
  });
  const [deleteSpell] = useMutation(DELETE_SPELL, { onCompleted: () => refetch() });

  async function handleCreate(values: Record<string, string>) {
    await createSpell({
      variables: {
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
      <GrimoirePageTitle action={<GrimoireButton onClick={() => setShowCreate(true)}>{t("newButton")}</GrimoireButton>}>
        {t("pageTitle")}
      </GrimoirePageTitle>

      <GrimoireTable
        columns={columns}
        data={spells}
        emptyMessage={t("tableEmpty")}
        actions={(s) => [
          { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", href: `/spells/${s.id}` },
          { icon: "trash", tooltip: t("tooltipDelete"), variant: "danger", onClick: () => deleteSpell({ variables: { id: s.id } }), hidden: !s.isOwner },
        ]}
      />

      <GrimoireModal show={showCreate} onClose={() => setShowCreate(false)} title={t("createModalTitle")} size="lg">
        <GrimoireForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel={t("createSubmit")}
          loading={creating}
          error={createError?.message}
          actions={[{ label: t("cancelButton"), onClick: () => setShowCreate(false) }]}
        />
      </GrimoireModal>
    </GrimoirePage>
  );
}
