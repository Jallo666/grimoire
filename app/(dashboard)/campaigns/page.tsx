"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import Link from "next/link";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
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
};

const ME = gql`
  query MeCampaigns { me { id } }
`;

const CAMPAIGNS = gql`
  query Campaigns {
    campaigns {
      id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi
      owner { id email nome }
    }
  }
`;

const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($nome: String!, $descrizione: String, $stato: String, $unitaMisuraDefault: String, $masterPuoModificarePersonaggi: Boolean) {
    createCampaign(nome: $nome, descrizione: $descrizione, stato: $stato, unitaMisuraDefault: $unitaMisuraDefault, masterPuoModificarePersonaggi: $masterPuoModificarePersonaggi) {
      id nome
    }
  }
`;

const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) { deleteCampaign(id: $id) }
`;

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
  { key: "stato", label: "Stato", render: (v) => <GrimoireBadge>{String(v)}</GrimoireBadge> },
  { key: "unitaMisuraDefault", label: "Unità" },
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

  const { data: meData } = useQuery<{ me: { id: string } | null }>(ME);
  const meId = meData?.me?.id;

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
          const isOwner = meId !== undefined && c.owner?.id === meId;
          return (
            <div className="d-flex gap-2">
              <Link href={`/campaigns/${c.id}`}>
                <GrimoireButton size="sm" variant="outline-secondary">Gestisci</GrimoireButton>
              </Link>
              {isOwner && (
                <GrimoireButton
                  size="sm"
                  variant="danger"
                  onClick={() => deleteCampaign({ variables: { id: c.id } })}
                >
                  Elimina
                </GrimoireButton>
              )}
            </div>
          );
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
