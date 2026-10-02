"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { formatRange, type UnitSystem } from "@/lib/formatRange";
import { CASTING_TIME_MAP, DURATION_MAP } from "@/lib/formatSpellFields";
import { MY_SPELLS, SRD_SPELLS, ALL_SPELLS, CREATE_SPELL, DELETE_SPELL, ADD_SRD_SPELL, REMOVE_SRD_SPELL } from "@/lib/queries/spells";
import { MY_SPELL_GROUPS, CREATE_SPELL_GROUP, RENAME_SPELL_GROUP, DELETE_SPELL_GROUP, MOVE_SPELL_TO_GROUP } from "@/lib/queries/spellGroups";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalActions from "@/components/ui/GrimoireModalActions";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireSelect from "@/components/ui/GrimoireSelect";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireAlert from "@/components/ui/GrimoireAlert";

type SpellGroup = { id: string; nome: string };

type SpellRow = {
  id: string;
  nome: string;
  scuola: string | null;
  livello: number;
  gittata: string | null;
  isOwner: boolean;
  isSystem: boolean;
  inLibrary: boolean;
  concentration: boolean | null;
  ritual: boolean | null;
  classi: string | null;
  groupId: string | null;
  groupNome: string | null;
};

type TabKey = "miei" | "srd" | "tutti";

const TAB_FROM_PARAM: Record<string, TabKey> = { mine: "miei", srd: "srd", all: "tutti" };
const TAB_TO_PARAM: Record<TabKey, string> = { miei: "mine", srd: "srd", tutti: "all" };

export default function SpellsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab: TabKey = TAB_FROM_PARAM[searchParams.get("tab") ?? ""] ?? "miei";
  const search = searchParams.get("search") ?? "";
  const scuola = searchParams.get("scuola") ?? "";
  const livello = searchParams.get("livello") ?? "";
  const concentration = searchParams.get("concentration") ?? "";
  const ritual = searchParams.get("ritual") ?? "";
  const groupFilter = searchParams.get("group") ?? "";

  const [showCreate, setShowCreate] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [showGroups, setShowGroups] = useState(false);
  const [moveSpell, setMoveSpell] = useState<SpellRow | null>(null);
  const [moveGroupId, setMoveGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  const t = useTranslations("spells");
  const locale = useLocale();
  const unitSystem = useAppSelector((s) => s.prefs.unitSystem) as UnitSystem;
  const tRange = (key: string) => t(`range${key.charAt(0).toUpperCase()}${key.slice(1)}` as Parameters<typeof t>[0]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleTabChange(k: string) {
    const next = k as TabKey;
    router.replace(`${pathname}?tab=${TAB_TO_PARAM[next]}`);
  }

  const tabs = [
    { key: "miei", label: t("tabMiei") },
    { key: "srd", label: t("tabSrd") },
    { key: "tutti", label: t("tabTutti") },
  ];

  const { data: groupsData, refetch: refetchGroups } = useQuery<{ mySpellGroups: SpellGroup[] }>(MY_SPELL_GROUPS);
  const groups = groupsData?.mySpellGroups ?? [];

  const scuolaOptions = [
    { value: "", label: t("filterAll") },
    { value: "Abiurazione", label: t("scuolaAbiurazione") },
    { value: "Ammaliamento", label: t("scuolaAmmaliamento") },
    { value: "Divinazione", label: t("scuolaDivinazione") },
    { value: "Evocazione", label: t("scuolaEvocazione") },
    { value: "Illusione", label: t("scuolaIllusione") },
    { value: "Invocazione", label: t("scuolaInvocazione") },
    { value: "Necromanzia", label: t("scuolaNecromanzia") },
    { value: "Trasmutazione", label: t("scuolaTrasmutazione") },
  ];

  const livelloOptions = [
    { value: "", label: t("filterAllLevels") },
    { value: "0", label: t("livelloOption0") },
    ...Array.from({ length: 9 }, (_, i) => ({
      value: String(i + 1),
      label: t("livelloOptionN", { n: i + 1 }),
    })),
  ];

  const castingTimeOptions = Object.entries(CASTING_TIME_MAP).map(([value, key]) => ({
    value, label: t(key as Parameters<typeof t>[0]),
  }));
  const durationOptions = Object.entries(DURATION_MAP).map(([value, key]) => ({
    value, label: t(key as Parameters<typeof t>[0]),
  }));

  const boolOptions = (label: string) => [
    { value: "", label },
    { value: "true", label: t("si") },
  ];

  const groupOptions = [
    { value: "", label: t("filterAllGroups") },
    ...groups.map((g) => ({ value: g.id, label: g.nome })),
  ];

  const groupSelectOptions = [
    { value: "", label: t("groupAutoLabel") },
    ...groups.map((g) => ({ value: g.id, label: g.nome })),
  ];

  const createFields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text", required: true },
    { name: "groupId", label: t("groupLabel"), type: "select", options: groupSelectOptions },
    { name: "scuola", label: t("fieldScuola"), type: "select", required: true, options: [
      { value: "", label: t("scuolaEmpty") },
      { value: "Abiurazione", label: t("scuolaAbiurazione") },
      { value: "Ammaliamento", label: t("scuolaAmmaliamento") },
      { value: "Divinazione", label: t("scuolaDivinazione") },
      { value: "Evocazione", label: t("scuolaEvocazione") },
      { value: "Illusione", label: t("scuolaIllusione") },
      { value: "Invocazione", label: t("scuolaInvocazione") },
      { value: "Necromanzia", label: t("scuolaNecromanzia") },
      { value: "Trasmutazione", label: t("scuolaTrasmutazione") },
    ]},
    { name: "livello", label: t("fieldLivello"), type: "select", required: true, defaultValue: "1", options: Array.from({ length: 10 }, (_, i) => ({
      value: String(i), label: i === 0 ? t("livelloOption0") : t("livelloOptionN", { n: i }),
    }))},
    { name: "descrizione", label: t("fieldDescrizione"), type: "textarea", required: true, rows: 5 },
    { name: "tempoLancio", label: t("fieldTempoLancio"), type: "selectOrText", required: true, options: castingTimeOptions, customLabel: t("ctCustom") },
    { name: "gittata", label: t("fieldGittata"), type: "range", required: true },
    { name: "durata", label: t("fieldDurata"), type: "selectOrText", required: true, options: durationOptions, customLabel: t("durCustom") },
    { name: "componenti", label: t("fieldComponenti"), type: "components" },
  ];

  const vars = {
    search: search || undefined,
    scuola: scuola || undefined,
    livello: livello !== "" ? Number(livello) : undefined,
    concentration: concentration === "true" ? true : undefined,
    ritual: ritual === "true" ? true : undefined,
  };

  const localeVar = { locale };

  const { data: myData, refetch: refetchMy } = useQuery<{ mySpells: SpellRow[] }>(MY_SPELLS, {
    variables: { ...vars, ...localeVar, groupId: groupFilter || undefined },
    skip: tab !== "miei",
  });
  const { data: srdData, refetch: refetchSrd } = useQuery<{ srdSpells: SpellRow[] }>(SRD_SPELLS, {
    variables: { ...vars, ...localeVar },
    skip: tab !== "srd",
  });
  const { data: allData, refetch: refetchAll } = useQuery<{ allSpells: SpellRow[] }>(ALL_SPELLS, {
    variables: { ...vars, ...localeVar },
    skip: tab !== "tutti",
  });

  const mySpells = myData?.mySpells ?? [];
  const srdSpells = srdData?.srdSpells ?? [];
  const allSpells = allData?.allSpells ?? [];

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL, {
    onCompleted: () => { refetchMy(); refetchAll(); refetchGroups(); setShowCreate(false); },
  });
  const [deleteSpell] = useMutation(DELETE_SPELL, {
    onCompleted: () => { refetchMy(); refetchAll(); },
  });
  const [addSrdSpell] = useMutation(ADD_SRD_SPELL, {
    onCompleted: () => { refetchMy(); refetchSrd(); refetchAll(); refetchGroups(); },
  });
  const [removeSrdSpell] = useMutation(REMOVE_SRD_SPELL, {
    onCompleted: () => { refetchMy(); refetchSrd(); refetchAll(); },
  });
  const [moveToGroup] = useMutation(MOVE_SPELL_TO_GROUP, {
    onCompleted: () => { refetchMy(); setMoveSpell(null); },
  });
  const [createGroup, { loading: creatingGroup }] = useMutation(CREATE_SPELL_GROUP, {
    onCompleted: () => { refetchGroups(); setNewGroupName(""); },
  });
  const [renameGroup] = useMutation(RENAME_SPELL_GROUP, {
    onCompleted: () => { refetchGroups(); setRenameId(""); setRenameName(""); },
  });
  const [deleteGroup] = useMutation(DELETE_SPELL_GROUP, {
    onCompleted: () => { refetchGroups(); refetchMy(); },
  });

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
        groupId: values.groupId || null,
      },
    });
  }

  const baseColumns: Column<SpellRow>[] = [
    { key: "nome", label: t("colNome"), sortable: true },
    { key: "scuola", label: t("colScuola"), sortable: true, type: "badge", badgeColors: {
      Abiurazione: "primary", Ammaliamento: "warning", Divinazione: "success",
      Evocazione: "danger", Illusione: "secondary", Invocazione: "primary",
      Necromanzia: "danger", Trasmutazione: "success",
    }},
    { key: "livello", label: t("colLivello"), sortable: true, render: (v) => (v === 0 ? t("trucchetto") : t("livelloShort", { n: v as number })) },
    { key: "gittata", label: t("colGittata"), render: (v) => formatRange(v as string | null, unitSystem, tRange) },
  ];

  const meiColumns: Column<SpellRow>[] = [
    ...baseColumns,
    { key: "groupNome", label: t("colGruppo"), render: (v) => v ? <GrimoireBadge variant="primary">{String(v)}</GrimoireBadge> : null },
  ];

  const extraColumns: Column<SpellRow>[] = [
    { key: "concentration", label: t("colConcentrazione"), render: (v) => v ? <GrimoireBadge variant="warning">{t("si")}</GrimoireBadge> : null },
    { key: "ritual", label: t("colRituale"), render: (v) => v ? <GrimoireBadge variant="secondary">{t("si")}</GrimoireBadge> : null },
    { key: "classi", label: t("colClassi"), render: (v) => <span style={{ fontSize: "0.8rem", color: "var(--g-text-muted)" }}>{String(v ?? "")}</span> },
  ];

  const filters = (
    <GrimoireInlineGroup style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
      <GrimoireInput id="spell-search" type="text" value={search} onChange={(e) => setParam("search", e.target.value)} placeholder={t("searchPlaceholder")} />
      {tab === "miei" && (
        <GrimoireSelect id="spell-group" value={groupFilter} onChange={(e) => setParam("group", e.target.value)} options={groupOptions} style={{ minWidth: "150px" }} />
      )}
      <GrimoireSelect id="spell-scuola" value={scuola} onChange={(e) => setParam("scuola", e.target.value)} options={scuolaOptions} style={{ minWidth: "160px" }} />
      <GrimoireSelect id="spell-livello" value={livello} onChange={(e) => setParam("livello", e.target.value)} options={livelloOptions} style={{ minWidth: "130px" }} />
      <GrimoireSelect id="spell-concentration" value={concentration} onChange={(e) => setParam("concentration", e.target.value)} options={boolOptions(t("filterConcentrazione"))} style={{ minWidth: "155px" }} />
      <GrimoireSelect id="spell-ritual" value={ritual} onChange={(e) => setParam("ritual", e.target.value)} options={boolOptions(t("filterRituale"))} style={{ minWidth: "120px" }} />
    </GrimoireInlineGroup>
  );

  return (
    <GrimoirePage>
      <GrimoirePageTitle action={
        <GrimoireInlineGroup>
          <GrimoireButton variant="outline-secondary" onClick={() => setShowGroups(true)}>{t("manageGroups")}</GrimoireButton>
          <GrimoireButton onClick={() => setShowCreate(true)}>{t("newButton")}</GrimoireButton>
        </GrimoireInlineGroup>
      }>
        {t("pageTitle")}
      </GrimoirePageTitle>

      <GrimoireTabs tabs={tabs} active={tab} onChange={handleTabChange} />

      {filters}

      {tab === "miei" && (
        <GrimoireTable
          columns={meiColumns}
          data={mySpells}
          emptyMessage={t("tableEmpty")}
          actions={(s) => [
            { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", href: `/spells/${s.id}` },
            { label: t("moveToGroup"), variant: "outline-secondary", onClick: () => { setMoveSpell(s); setMoveGroupId(s.groupId ?? ""); } },
            { label: t("removeFromLibrary"), variant: "danger", onClick: () => removeSrdSpell({ variables: { spellId: s.id } }), hidden: !s.isSystem },
            { icon: "trash", tooltip: t("tooltipDelete"), variant: "danger", onClick: () => deleteSpell({ variables: { id: s.id } }), hidden: !s.isOwner },
          ]}
        />
      )}

      {tab === "srd" && (
        <>
          <GrimoireTable
            columns={[...baseColumns, ...extraColumns]}
            data={srdSpells}
            emptyMessage={t("tableEmpty")}
            actions={(s) => [
              { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", href: `/spells/${s.id}` },
              { label: s.inLibrary ? t("removeFromLibrary") : t("addToLibrary"), variant: s.inLibrary ? "danger" : "outline-secondary", onClick: () => s.inLibrary ? removeSrdSpell({ variables: { spellId: s.id } }) : addSrdSpell({ variables: { spellId: s.id } }) },
            ]}
          />
          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--g-text-muted)" }}>
            {t("srdAttribution")} —{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" style={{ color: "var(--g-text-muted)" }}>CC BY 4.0</a>
          </p>
        </>
      )}

      {tab === "tutti" && (
        <GrimoireTable
          columns={[...baseColumns, ...extraColumns]}
          data={allSpells}
          emptyMessage={t("tableEmpty")}
          actions={(s) => [
            { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", href: `/spells/${s.id}` },
            { label: s.inLibrary ? t("removeFromLibrary") : t("addToLibrary"), variant: s.inLibrary ? "danger" : "outline-secondary", onClick: () => s.isSystem ? (s.inLibrary ? removeSrdSpell({ variables: { spellId: s.id } }) : addSrdSpell({ variables: { spellId: s.id } })) : undefined, hidden: !s.isSystem },
            { icon: "trash", tooltip: t("tooltipDelete"), variant: "danger", onClick: () => deleteSpell({ variables: { id: s.id } }), hidden: !s.isOwner },
          ]}
        />
      )}

      {/* Create spell modal */}
      <GrimoireModal
        show={showCreate}
        onClose={() => { setShowCreate(false); setCreateFormError(null); }}
        title={t("createModalTitle")}
        size="lg"
        footer={
          <div className="d-flex flex-column gap-2 w-100">
            {(createFormError || createError?.message) && (
              <GrimoireAlert>{createFormError ?? createError?.message}</GrimoireAlert>
            )}
            <div className="d-flex gap-2 justify-content-end">
              <GrimoireButton variant="outline-secondary" onClick={() => { setShowCreate(false); setCreateFormError(null); }}>{t("cancelButton")}</GrimoireButton>
              <GrimoireButton type="submit" form="create-spell-form" loading={creating}>{t("createSubmit")}</GrimoireButton>
            </div>
          </div>
        }
      >
        <GrimoireForm
          id="create-spell-form"
          hideFooter
          fields={createFields}
          onSubmit={handleCreate}
          onValidationError={setCreateFormError}
        />
      </GrimoireModal>

      {/* Move to group modal */}
      <GrimoireModal show={!!moveSpell} onClose={() => setMoveSpell(null)} title={t("moveModalTitle")}>
        <GrimoireSelect
          id="move-group"
          label={t("groupLabel")}
          value={moveGroupId}
          onChange={(e) => setMoveGroupId(e.target.value)}
          options={groupSelectOptions}
        />
        <GrimoireModalActions>
          <GrimoireButton variant="outline-secondary" onClick={() => setMoveSpell(null)}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton onClick={() => moveSpell && moveGroupId && moveToGroup({ variables: { spellId: moveSpell.id, groupId: moveGroupId } })}>
            {t("groupSave")}
          </GrimoireButton>
        </GrimoireModalActions>
      </GrimoireModal>

      {/* Manage groups modal */}
      <GrimoireModal show={showGroups} onClose={() => setShowGroups(false)} title={t("groupsModalTitle")}>
        <div style={{ marginBottom: "1rem" }}>
          {groups.map((g) => (
            <div key={g.id} className="d-flex gap-2 align-items-center mb-2">
              {renameId === g.id ? (
                <>
                  <GrimoireInput id={`rename-${g.id}`} type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
                  <GrimoireButton onClick={() => renameGroup({ variables: { id: g.id, nome: renameName } })}>{t("groupRename")}</GrimoireButton>
                  <GrimoireButton variant="outline-secondary" onClick={() => setRenameId("")}>{t("cancelButton")}</GrimoireButton>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: "var(--g-text)" }}>{g.nome}</span>
                  <GrimoireButton variant="outline-secondary" onClick={() => { setRenameId(g.id); setRenameName(g.nome); }}>{t("groupRename")}</GrimoireButton>
                  <GrimoireButton variant="danger" onClick={() => deleteGroup({ variables: { id: g.id } })}>{t("groupDelete")}</GrimoireButton>
                </>
              )}
            </div>
          ))}
        </div>
        {groups.length === 0 && (
          <GrimoireAlert variant="info">{t("tableEmpty")}</GrimoireAlert>
        )}
        <div className="d-flex gap-2 mt-3">
          <GrimoireInput id="new-group" type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder={t("groupNamePlaceholder")} />
          <GrimoireButton loading={creatingGroup} onClick={() => newGroupName && createGroup({ variables: { nome: newGroupName } })}>{t("groupCreate")}</GrimoireButton>
        </div>
      </GrimoireModal>
    </GrimoirePage>
  );
}
