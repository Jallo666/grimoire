"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { CAMPAIGNS, CREATE_CAMPAIGN, DELETE_CAMPAIGN } from "@/lib/queries/campaigns";
import { ME_ID } from "@/lib/queries/users";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireModal from "@/components/ui/GrimoireModal";

type CampaignRow = {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: string;
  unitaMisuraDefault: string;
  masterPuoModificarePersonaggi: boolean;
  owner: { id: string; email: string; nome: string | null } | null;
  members: { userId: number }[];
};

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const t = useTranslations("campaigns");

  const statoOptions = [
    { value: "attiva", label: t("statoAttiva") },
    { value: "in_pausa", label: t("statoInPausa") },
    { value: "conclusa", label: t("statoConclusa") },
  ];

  const unitaOptions = [
    { value: "piedi", label: t("unitaPiedi") },
    { value: "metri", label: t("unitaMetri") },
    { value: "quadretti", label: t("unitaQuadretti") },
  ];

  const createFields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text", required: true },
    { name: "descrizione", label: t("fieldDescrizione"), type: "text" },
    { name: "stato", label: t("fieldStato"), type: "select", defaultValue: "attiva", options: statoOptions },
    { name: "unitaMisuraDefault", label: t("fieldUnita"), type: "select", defaultValue: "piedi", options: unitaOptions },
    { name: "masterPuoModificarePersonaggi", label: t("fieldMasterEdit"), type: "checkbox", defaultValue: "true" },
  ];

  const columns: Column<CampaignRow>[] = [
    { key: "nome", label: t("colNome") },
    { key: "stato", label: t("colStato"), type: "badge", badgeColors: { attiva: "success", in_pausa: "warning", conclusa: "secondary" } },
    {
      key: "owner",
      label: t("colCreatore"),
      render: (v) => {
        const o = v as CampaignRow["owner"];
        return o ? (o.nome ?? o.email) : "—";
      },
    },
  ];

  const { data: meData } = useQuery<{ me: { id: string } | null }>(ME_ID);
  const meId = meData?.me?.id ? Number(meData.me.id) : undefined;

  const { data, refetch } = useQuery<{ campaigns: CampaignRow[] }>(CAMPAIGNS);
  const [createCampaign, { loading: creating, error: createError }] = useMutation(CREATE_CAMPAIGN, {
    onCompleted: () => { refetch(); setShowCreate(false); },
  });
  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN, { onCompleted: () => refetch() });

  const campaigns: CampaignRow[] = data?.campaigns ?? [];

  async function handleCreate(values: Record<string, string>) {
    await createCampaign({
      variables: {
        nome: values.nome,
        descrizione: values.descrizione || null,
        stato: values.stato,
        unitaMisuraDefault: values.unitaMisuraDefault,
        masterPuoModificarePersonaggi: values.masterPuoModificarePersonaggi === "true",
      },
    });
  }

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <GrimoirePageTitle>{t("pageTitle")}</GrimoirePageTitle>
        <GrimoireButton onClick={() => setShowCreate(true)}>{t("newButton")}</GrimoireButton>
      </div>

      <GrimoireTable
        columns={columns}
        data={campaigns}
        emptyMessage={t("tableEmpty")}
        actions={(c) => {
          const isOwner = meId !== undefined && c.owner?.id === String(meId);
          const isMember = meId !== undefined && c.members.some((m) => m.userId === meId);
          return [
            {
              icon: "gear",
              tooltip: t("tooltipManage"),
              variant: "outline-secondary",
              href: `/campaigns/${c.id}`,
              hidden: !isOwner && !isMember,
            },
            {
              icon: "trash",
              tooltip: t("tooltipDelete"),
              variant: "danger",
              onClick: () => deleteCampaign({ variables: { id: c.id } }),
              hidden: !isOwner,
            },
          ];
        }}
      />

      <GrimoireModal
        show={showCreate}
        onClose={() => setShowCreate(false)}
        title={t("createModalTitle")}
        size="lg"
      >
        <GrimoireForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel={t("createSubmit")}
          loading={creating}
          error={createError?.message}
          actions={[{ label: t("cancelButton"), onClick: () => setShowCreate(false) }]}
        />
      </GrimoireModal>
    </main>
  );
}
