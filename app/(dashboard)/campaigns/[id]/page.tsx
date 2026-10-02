"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
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

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerRoles, setPickerRoles] = useState<Record<string, string>>({});
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingRole, setEditingRole] = useState("");
  const t = useTranslations("campaignDetail");
  const tUi = useTranslations("ui");

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

  const ruoloOptions = [
    { value: "master", label: t("ruoloMaster") },
    { value: "giocatore", label: t("ruoloGiocatore") },
    { value: "spettatore", label: t("ruoloSpettatore") },
  ];

  const editFields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text", required: true },
    { name: "descrizione", label: t("fieldDescrizione"), type: "text" },
    { name: "stato", label: t("fieldStato"), type: "select", options: statoOptions },
    { name: "unitaMisuraDefault", label: t("fieldUnita"), type: "select", options: unitaOptions },
    { name: "masterPuoModificarePersonaggi", label: t("fieldMasterEdit"), type: "checkbox" },
  ];

  const pickerColumns: Column<UserRow>[] = [
    { key: "nome", label: t("colNome"), render: (v) => String(v ?? "—") },
    { key: "email", label: t("colEmail") },
  ];

  const memberColumns: Column<Member>[] = [
    {
      key: "user",
      label: t("colNome"),
      render: (v, row, meta) => {
        const u = v as UserRow;
        return (
          <span className="d-flex align-items-center gap-2">
            {u.nome ?? "—"}
            {row.userId === (meta.ownerId as number) && (
              <GrimoireBadge>{tUi("owner")}</GrimoireBadge>
            )}
          </span>
        );
      },
    },
    { key: "user", label: t("colEmail"), render: (v) => (v as UserRow).email },
    { key: "ruolo", label: t("colRuolo"), type: "badge", badgeColors: { master: "primary", giocatore: "success", spettatore: "secondary" } },
  ];

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
        <GrimoireForm title={t("formTitle")} fields={editFields} onSubmit={() => {}} fetching />
      </main>
    );
  }

  const isOwner = String(campaign.ownerId) === meId;

  const pickerRoleOptions = isOwner ? ruoloOptions : ruoloOptions.filter((o) => o.value !== "master");
  const changeRoleOptions = isOwner ? ruoloOptions : ruoloOptions.filter((o) => o.value !== "master");

  const initialValues: Record<string, string> = {
    nome: campaign.nome,
    descrizione: campaign.descrizione ?? "",
    stato: campaign.stato,
    unitaMisuraDefault: campaign.unitaMisuraDefault,
    masterPuoModificarePersonaggi: campaign.masterPuoModificarePersonaggi ? "true" : "false",
  };

  return (
    <main className="container py-5">
      <GrimoirePageTitle showBack>{t("pageTitle", { name: campaign.nome })}</GrimoirePageTitle>

      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-6">
          <GrimoireForm
            key={campaign.id}
            title={t("formTitle")}
            fields={editFields}
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel={t("saveButton")}
            loading={updating}
            error={updateError?.message}
            view={!isOwner}
          />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0" style={{ color: "var(--g-text)" }}>
          {t("membersHeading", { count: campaign.members.length })}
        </h5>
        {isMasterOrOwner && (
          <GrimoireButton size="sm" onClick={() => setShowPicker(true)}>
            {t("addMemberButton")}
          </GrimoireButton>
        )}
      </div>

      <GrimoireTable
        columns={memberColumns}
        data={campaign.members}
        meta={{ ownerId: campaign.ownerId }}
        emptyMessage={t("membersEmpty")}
        actions={isMasterOrOwner ? (m) => {
          const isSelf = String(m.user.id) === meId;
          const isTargetOwner = m.userId === campaign.ownerId;
          const canAct = isOwner || !isTargetOwner;
          return [
            {
              label: t("changeRoleAction"),
              variant: "outline-secondary",
              onClick: () => { setEditingMember(m); setEditingRole(m.ruolo); },
              hidden: !canAct,
            },
            {
              icon: "trash",
              tooltip: t("removeTooltip"),
              variant: "danger",
              onClick: () => removeMember({ variables: { memberId: m.id } }),
              hidden: !canAct || isSelf,
            },
          ];
        } : undefined}
      />

      <GrimoireModal
        show={!!editingMember}
        onClose={() => setEditingMember(null)}
        title={t("changeRoleModalTitle", { name: editingMember?.user.nome ?? editingMember?.user.email ?? "" })}
      >
        <div className="mb-4">
          <label className="form-label" style={{ color: "var(--g-label)" }}>{t("roleLabel")}</label>
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
            {t("cancelButton")}
          </GrimoireButton>
          <GrimoireButton
            loading={updatingRole}
            onClick={() =>
              updateRole({ variables: { memberId: editingMember!.id, ruolo: editingRole } })
            }
          >
            {t("saveRoleButton")}
          </GrimoireButton>
        </div>
      </GrimoireModal>

      <GrimoireModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        title={t("addMemberModalTitle")}
        size="lg"
      >
        {availableUsers.length === 0 ? (
          <p style={{ color: "var(--g-text-muted)" }}>{t("noAvailableUsers")}</p>
        ) : (
          <GrimoireTable
            columns={pickerColumns}
            data={availableUsers}
            emptyMessage={t("usersEmpty")}
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
                  {t("addButton")}
                </GrimoireButton>
              </div>
            )}
          />
        )}
      </GrimoireModal>
    </main>
  );
}
