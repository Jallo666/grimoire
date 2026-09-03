"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoireModal from "@/components/ui/GrimoireModal";

type UserRow = { id: string; email: string; nome: string | null };

type Member = {
  id: string;
  userId: number;
  ruolo: string;
  user: UserRow;
};

type CampaignDetail = {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: string;
  unitaMisuraDefault: string;
  masterPuoModificarePersonaggi: boolean;
  ownerId: number;
  owner: UserRow | null;
  members: Member[];
};

const CAMPAIGN = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi ownerId
      owner { id email nome }
      members { id userId ruolo user { id email nome } }
    }
    me { id }
    users { id email nome }
  }
`;

const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaignDetail($id: ID!, $nome: String, $descrizione: String, $stato: String, $unitaMisuraDefault: String, $masterPuoModificarePersonaggi: Boolean) {
    updateCampaign(id: $id, nome: $nome, descrizione: $descrizione, stato: $stato, unitaMisuraDefault: $unitaMisuraDefault, masterPuoModificarePersonaggi: $masterPuoModificarePersonaggi) {
      id nome descrizione stato unitaMisuraDefault masterPuoModificarePersonaggi
    }
  }
`;

const ADD_MEMBER = gql`
  mutation AddMember($campaignId: ID!, $email: String!, $ruolo: String!) {
    addMember(campaignId: $campaignId, email: $email, ruolo: $ruolo) {
      id userId ruolo user { id email nome }
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation RemoveMember($memberId: ID!) { removeMember(memberId: $memberId) }
`;

const UPDATE_ROLE = gql`
  mutation UpdateMemberRole($memberId: ID!, $ruolo: String!) {
    updateMemberRole(memberId: $memberId, ruolo: $ruolo) { id ruolo }
  }
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

const RUOLO_OPTIONS = [
  { value: "master", label: "Master" },
  { value: "giocatore", label: "Giocatore" },
  { value: "spettatore", label: "Spettatore" },
];

const EDIT_FIELDS: FieldConfig[] = [
  { name: "nome", label: "Nome", type: "text", required: true },
  { name: "descrizione", label: "Descrizione", type: "text" },
  { name: "stato", label: "Stato", type: "select", options: STATO_OPTIONS },
  { name: "unitaMisuraDefault", label: "Unità di misura", type: "select", options: UNITA_OPTIONS },
  { name: "masterPuoModificarePersonaggi", label: "Il master può modificare i personaggi", type: "checkbox" },
];

const MEMBER_COLUMNS: Column<Member>[] = [
  { key: "user", label: "Nome", render: (v) => { const u = v as UserRow; return u.nome ?? "—"; } },
  { key: "user", label: "Email", render: (v) => (v as UserRow).email },
  { key: "ruolo", label: "Ruolo", render: (v) => <GrimoireBadge>{String(v)}</GrimoireBadge> },
];

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerRoles, setPickerRoles] = useState<Record<string, string>>({});

  const { data, loading, refetch } = useQuery<{
    campaign: CampaignDetail;
    me: { id: string } | null;
    users: UserRow[];
  }>(CAMPAIGN, { variables: { id } });

  const [updateCampaign, { loading: updating, error: updateError }] = useMutation(UPDATE_CAMPAIGN, {
    onCompleted: () => refetch(),
  });
  const [addMember, { loading: adding }] = useMutation(ADD_MEMBER, {
    onCompleted: () => { refetch(); setShowPicker(false); },
  });
  const [removeMember] = useMutation(REMOVE_MEMBER, { onCompleted: () => refetch() });
  const [updateRole] = useMutation(UPDATE_ROLE, { onCompleted: () => refetch() });

  const campaign = data?.campaign;
  const meId = data?.me?.id;
  const allUsers = data?.users ?? [];

  const memberIds = new Set(campaign?.members.map((m) => String(m.user.id)) ?? []);
  const isMasterOrOwner =
    !!meId &&
    !!campaign &&
    (String(campaign.ownerId) === meId ||
      campaign.members.some((m) => String(m.user.id) === meId && m.ruolo === "master"));

  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const PICKER_COLUMNS: Column<UserRow>[] = [
    { key: "nome", label: "Nome", render: (v) => String(v ?? "—") },
    { key: "email", label: "Email" },
    {
      key: "id",
      label: "Ruolo",
      render: (_, row) => (
        <select
          className="form-select form-select-sm"
          value={pickerRoles[row.id] ?? "giocatore"}
          onChange={(e) => setPickerRoles((r) => ({ ...r, [row.id]: e.target.value }))}
          style={{ minWidth: "130px" }}
        >
          {RUOLO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ),
    },
  ];

  async function handleUpdate(values: Record<string, string>) {
    await updateCampaign({
      variables: {
        id,
        nome: values.nome,
        descrizione: values.descrizione || null,
        stato: values.stato,
        unitaMisuraDefault: values.unitaMisuraDefault,
        masterPuoModificarePersonaggi: values.masterPuoModificarePersonaggi === "true",
      },
    });
  }

  if (loading || !campaign) {
    return (
      <main className="container py-5">
        <div className="placeholder-glow mb-4">
          <span className="placeholder col-4 rounded" style={{ height: "32px" }} />
        </div>
        <GrimoireForm title="Dettagli campagna" fields={EDIT_FIELDS} onSubmit={() => {}} fetching />
      </main>
    );
  }

  const initialValues: Record<string, string> = {
    nome: campaign.nome,
    descrizione: campaign.descrizione ?? "",
    stato: campaign.stato,
    unitaMisuraDefault: campaign.unitaMisuraDefault,
    masterPuoModificarePersonaggi: campaign.masterPuoModificarePersonaggi ? "true" : "false",
  };

  const isOwner = String(campaign.ownerId) === meId;

  return (
    <main className="container py-5">
      <GrimoirePageTitle showBack>Gestione Campagna: {campaign.nome}</GrimoirePageTitle>

      <div className="row g-4 mb-5">
        {isOwner && (
          <div className="col-12 col-lg-6">
            <GrimoireForm
              key={campaign.id}
              title="Dettagli campagna"
              fields={EDIT_FIELDS}
              initialValues={initialValues}
              onSubmit={handleUpdate}
              submitLabel="Salva modifiche"
              loading={updating}
              error={updateError?.message}
            />
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0" style={{ color: "var(--g-text)" }}>
          Membri ({campaign.members.length})
        </h5>
        {isMasterOrOwner && (
          <GrimoireButton size="sm" onClick={() => setShowPicker(true)}>
            + Aggiungi membro
          </GrimoireButton>
        )}
      </div>

      <GrimoireTable
        columns={MEMBER_COLUMNS}
        data={campaign.members}
        emptyMessage="Nessun membro."
        actions={(m) => {
          if (!isMasterOrOwner) return null;

          const isSelf = String(m.user.id) === meId;
          const isTargetOwner = m.userId === campaign.ownerId;

          // Il master non può agire sull'owner (tranne se stesso è l'owner)
          if (!isOwner && isTargetOwner) return null;

          // Opzioni ruolo: solo owner può assegnare master
          const roleOptions = isOwner
            ? RUOLO_OPTIONS
            : RUOLO_OPTIONS.filter((o) => o.value !== "master");

          return (
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select form-select-sm"
                value={m.ruolo}
                onChange={(e) =>
                  updateRole({ variables: { memberId: m.id, ruolo: e.target.value } })
                }
                style={{
                  minWidth: "130px",
                  backgroundColor: "var(--g-input-bg)",
                  color: "var(--g-input-text)",
                  borderColor: "var(--g-input-border)",
                }}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {!isSelf && (
                <GrimoireButton
                  size="sm"
                  variant="danger"
                  onClick={() => removeMember({ variables: { memberId: m.id } })}
                >
                  Rimuovi
                </GrimoireButton>
              )}
            </div>
          );
        }}
      />

      <GrimoireModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        title="Aggiungi membro"
        size="lg"
      >
        {availableUsers.length === 0 ? (
          <p style={{ color: "var(--g-text-muted)" }}>Nessun utente disponibile da aggiungere.</p>
        ) : (
          <GrimoireTable
            columns={PICKER_COLUMNS}
            data={availableUsers}
            emptyMessage="Nessun utente disponibile."
            actions={(u) => (
              <GrimoireButton
                size="sm"
                loading={adding}
                onClick={() =>
                  addMember({
                    variables: {
                      campaignId: id,
                      email: u.email,
                      ruolo: pickerRoles[u.id] ?? "giocatore",
                    },
                  })
                }
              >
                Aggiungi
              </GrimoireButton>
            )}
          />
        )}
      </GrimoireModal>
    </main>
  );
}
