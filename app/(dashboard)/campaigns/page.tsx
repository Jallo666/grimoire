"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
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


const STATO_OPTIONS = [
  { value: "attiva", label: "Attiva" },
  { value: "in_pausa", label: "In pausa" },
  { value: "conclusa", label: "Conclusa" },
];

const UNITA_OPTIONS = [
  { value: "piedi", label: "Piedi (ft)" },
  { value: "metri", label: "Metri (m)" },
  { value: "quadretti", label: "Quadretti" },
];

const CREATE_FIELDS: FieldConfig[] = [
  { name: "nome", label: "Nome", type: "text", required: true },
  { name: "descrizione", label: "Descrizione", type: "text" },
  { name: "stato", label: "Stato", type: "select", defaultValue: "attiva", options: STATO_OPTIONS },
  { name: "unitaMisuraDefault", label: "Unità di misura", type: "select", defaultValue: "piedi", options: UNITA_OPTIONS },
  { name: "masterPuoModificarePersonaggi", label: "Il master può modificare i personaggi", type: "checkbox", defaultValue: "true" },
];

const COLUMNS: Column<CampaignRow>[] = [
  { key: "nome", label: "Nome" },
  { key: "stato", label: "Stato", type: "badge", badgeColors: { attiva: "success", in_pausa: "warning", conclusa: "secondary" } },
  {
    key: "owner",
    label: "Creatore",
    render: (v) => {
      const o = v as CampaignRow["owner"];
      return o ? (o.nome ?? o.email) : "—";
    },
  },
];

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);

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
        <GrimoirePageTitle>Le tue campagne</GrimoirePageTitle>
        <GrimoireButton onClick={() => setShowCreate(true)}>+ Nuova campagna</GrimoireButton>
      </div>

      <GrimoireTable
        columns={COLUMNS}
        data={campaigns}
        emptyMessage="Nessuna campagna ancora."
        actions={(c) => {
          const isOwner = meId !== undefined && c.owner?.id === String(meId);
          const isMember = meId !== undefined && c.members.some((m) => m.userId === meId);
          return [
            {
              icon: "gear",
              tooltip: "Gestisci",
              variant: "outline-secondary",
              href: `/campaigns/${c.id}`,
              hidden: !isOwner && !isMember,
            },
            {
              icon: "trash",
              tooltip: "Elimina",
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
        title="Nuova campagna"
        size="lg"
      >
        <GrimoireForm
          fields={CREATE_FIELDS}
          onSubmit={handleCreate}
          submitLabel="Crea campagna"
          loading={creating}
          error={createError?.message}
          actions={[{ label: "Annulla", onClick: () => setShowCreate(false) }]}
        />
      </GrimoireModal>
    </main>
  );
}
