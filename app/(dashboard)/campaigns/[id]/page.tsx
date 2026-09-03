"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { CAMPAIGN, UPDATE_CAMPAIGN } from "@/lib/queries/campaigns";
import { ADD_MEMBER, REMOVE_MEMBER, UPDATE_ROLE } from "@/lib/queries/members";
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

const PICKER_COLUMNS: Column<UserRow>[] = [
  { key: "nome", label: "Nome", render: (v) => String(v ?? "—") },
  { key: "email", label: "Email" },
];

const MEMBER_COLUMNS: Column<Member>[] = [
  {
    key: "user",
    label: "Nome",
    render: (v, row, meta) => {
      const u = v as UserRow;
      return (
        <span className="d-flex align-items-center gap-2">
          {u.nome ?? "—"}
          {row.userId === (meta.ownerId as number) && (
            <GrimoireBadge>Owner</GrimoireBadge>
          )}
        </span>
      );
    },
  },
  { key: "user", label: "Email", render: (v) => (v as UserRow).email },
  { key: "ruolo", label: "Ruolo", type: "badge", badgeColors: { master: "primary", giocatore: "success", spettatore: "secondary" } },
];

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerRoles, setPickerRoles] = useState<Record<string, string>>({});
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingRole, setEditingRole] = useState("");

  const { data, loading, error, refetch } = useQuery<{
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
  const [updateRole, { loading: updatingRole }] = useMutation(UPDATE_ROLE, {
    onCompleted: () => { refetch(); setEditingMember(null); },
  });

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

  if (error) throw error;

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

  const isOwner = String(campaign.ownerId) === meId;

  // Opzioni ruolo nel picker: solo owner può assegnare master
  const pickerRoleOptions = isOwner
    ? RUOLO_OPTIONS
    : RUOLO_OPTIONS.filter((o) => o.value !== "master");

  // Opzioni ruolo nel modale cambia ruolo
  const changeRoleOptions = isOwner
    ? RUOLO_OPTIONS
    : RUOLO_OPTIONS.filter((o) => o.value !== "master");

  const initialValues: Record<string, string> = {
    nome: campaign.nome,
    descrizione: campaign.descrizione ?? "",
    stato: campaign.stato,
    unitaMisuraDefault: campaign.unitaMisuraDefault,
    masterPuoModificarePersonaggi: campaign.masterPuoModificarePersonaggi ? "true" : "false",
  };

  return (
    <main className="container py-5">
      <GrimoirePageTitle showBack>Gestione Campagna: {campaign.nome}</GrimoirePageTitle>

      <div className="row g-4 mb-5">
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
            view={!isOwner}
          />
        </div>
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
        meta={{ ownerId: campaign.ownerId }}
        emptyMessage="Nessun membro."
        actions={(m) => {
          const isSelf = String(m.user.id) === meId;
          const isTargetOwner = m.userId === campaign.ownerId;
          const canAct = isMasterOrOwner && (isOwner || !isTargetOwner);
          return [
            {
              label: "Cambia ruolo",
              variant: "outline-secondary",
              onClick: () => { setEditingMember(m); setEditingRole(m.ruolo); },
              hidden: !canAct,
            },
            {
              icon: "trash",
              tooltip: "Rimuovi",
              variant: "danger",
              onClick: () => removeMember({ variables: { memberId: m.id } }),
              hidden: !canAct || isSelf,
            },
          ];
        }}
      />

      {/* Modale cambia ruolo */}
      <GrimoireModal
        show={!!editingMember}
        onClose={() => setEditingMember(null)}
        title={`Cambia ruolo — ${editingMember?.user.nome ?? editingMember?.user.email ?? ""}`}
      >
        <div className="mb-4">
          <label className="form-label" style={{ color: "var(--g-label)" }}>Ruolo</label>
          <select
            className="form-select"
            value={editingRole}
            onChange={(e) => setEditingRole(e.target.value)}
            style={{
              backgroundColor: "var(--g-input-bg)",
              borderColor: "var(--g-input-border)",
              color: "var(--g-input-text)",
            }}
          >
            {changeRoleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <GrimoireButton variant="outline-secondary" onClick={() => setEditingMember(null)}>
            Annulla
          </GrimoireButton>
          <GrimoireButton
            loading={updatingRole}
            onClick={() =>
              updateRole({ variables: { memberId: editingMember!.id, ruolo: editingRole } })
            }
          >
            Salva
          </GrimoireButton>
        </div>
      </GrimoireModal>

      {/* Modale aggiungi membro */}
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
            renderActions={(u) => (
              <div className="d-flex gap-2 align-items-center">
                <select
                  className="form-select form-select-sm"
                  value={pickerRoles[u.id] ?? "giocatore"}
                  onChange={(e) => setPickerRoles((r) => ({ ...r, [u.id]: e.target.value }))}
                  style={{
                    minWidth: "130px",
                    backgroundColor: "var(--g-input-bg)",
                    color: "var(--g-input-text)",
                    borderColor: "var(--g-input-border)",
                  }}
                >
                  {pickerRoleOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
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
              </div>
            )}
          />
        )}
      </GrimoireModal>
    </main>
  );
}
