"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { MY_SPELLS, SRD_SPELLS, ALL_SPELLS, CREATE_SPELL, DELETE_SPELL, ADD_SRD_SPELL, REMOVE_SRD_SPELL } from "@/lib/queries/spells";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireSelect from "@/components/ui/GrimoireSelect";
import GrimoireInput from "@/components/ui/GrimoireInput";

type SpellRow = {
  id: string;
  nome: string;
  scuola: string | null;
  livello: number;
  isOwner: boolean;
  isSystem: boolean;
  inLibrary: boolean;
  concentration: boolean | null;
  ritual: boolean | null;
  classi: string | null;
};

type TabKey = "miei" | "srd" | "tutti";

export default function SpellsPage() {
  const [tab, setTab] = useState<TabKey>("miei");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [scuola, setScuola] = useState("");
  const [livello, setLivello] = useState("");
  const [concentration, setConcentration] = useState("");
  const [ritual, setRitual] = useState("");
  const t = useTranslations("spells");

  const tabs = [
    { key: "miei", label: t("tabMiei") },
    { key: "srd", label: t("tabSrd") },
    { key: "tutti", label: t("tabTutti") },
  ];

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

  const boolOptions = (label: string) => [
    { value: "", label },
    { value: "true", label: t("si") },
  ];

  const createFields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text", required: true },
    { name: "scuola", label: t("fieldScuola"), type: "select", options: [
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
    { name: "livello", label: t("fieldLivello"), type: "select", defaultValue: "1", options: Array.from({ length: 10 }, (_, i) => ({
      value: String(i), label: i === 0 ? t("livelloOption0") : t("livelloOptionN", { n: i }),
    }))},
    { name: "descrizione", label: t("fieldDescrizione"), type: "textarea", rows: 5 },
    { name: "tempoLancio", label: t("fieldTempoLancio"), type: "text" },
    { name: "gittata", label: t("fieldGittata"), type: "text" },
    { name: "durata", label: t("fieldDurata"), type: "text" },
    { name: "componenti", label: t("fieldComponenti"), type: "text" },
  ];

  const vars = {
    search: search || undefined,
    scuola: scuola || undefined,
    livello: livello !== "" ? Number(livello) : undefined,
    concentration: concentration === "true" ? true : undefined,
    ritual: ritual === "true" ? true : undefined,
  };

  const { data: myData, refetch: refetchMy } = useQuery<{ mySpells: SpellRow[] }>(MY_SPELLS, {
    variables: vars,
    skip: tab !== "miei",
  });
  const { data: srdData, refetch: refetchSrd } = useQuery<{ srdSpells: SpellRow[] }>(SRD_SPELLS, {
    variables: vars,
    skip: tab !== "srd",
  });
  const { data: allData, refetch: refetchAll } = useQuery<{ allSpells: SpellRow[] }>(ALL_SPELLS, {
    variables: vars,
    skip: tab !== "tutti",
  });

  const mySpells = myData?.mySpells ?? [];
  const srdSpells = srdData?.srdSpells ?? [];
  const allSpells = allData?.allSpells ?? [];

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL, {
    onCompleted: () => { refetchMy(); refetchAll(); setShowCreate(false); },
  });
  const [deleteSpell] = useMutation(DELETE_SPELL, {
    onCompleted: () => { refetchMy(); refetchAll(); },
  });
  const [addSrdSpell] = useMutation(ADD_SRD_SPELL, {
    onCompleted: () => { refetchMy(); refetchSrd(); refetchAll(); },
  });
  const [removeSrdSpell] = useMutation(REMOVE_SRD_SPELL, {
    onCompleted: () => { refetchMy(); refetchSrd(); refetchAll(); },
  });

  async function handleCreate(values: Record<string, string>) {
    await createSpell({
      variables: {
        nome: values.nome, descrizione: values.descrizione || null,
        scuola: values.scuola || null, livello: Number(values.livello),
        tempoLancio: values.tempoLancio || null, gittata: values.gittata || null,
        durata: values.durata || null, componenti: values.componenti || null,
      },
    });
  }

  function resetFilters() {
    setSearch(""); setScuola(""); setLivello(""); setConcentration(""); setRitual("");
  }

  const baseColumns: Column<SpellRow>[] = [
    { key: "nome", label: t("colNome") },
    { key: "scuola", label: t("colScuola"), type: "badge", badgeColors: {
      Abiurazione: "primary", Ammaliamento: "warning", Divinazione: "success",
      Evocazione: "danger", Illusione: "secondary", Invocazione: "primary",
      Necromanzia: "danger", Trasmutazione: "success",
    }},
    { key: "livello", label: t("colLivello"), render: (v) => (v === 0 ? t("trucchetto") : t("livelloShort", { n: v as number })) },
  ];

  const extraColumns: Column<SpellRow>[] = [
    { key: "concentration", label: t("colConcentrazione"), render: (v) => v ? <GrimoireBadge variant="warning">{t("si")}</GrimoireBadge> : null },
    { key: "ritual", label: t("colRituale"), render: (v) => v ? <GrimoireBadge variant="secondary">{t("si")}</GrimoireBadge> : null },
    { key: "classi", label: t("colClassi"), render: (v) => <span style={{ fontSize: "0.8rem", color: "var(--g-text-muted)" }}>{String(v ?? "")}</span> },
  ];

  const filters = (
    <GrimoireInlineGroup style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
      <GrimoireInput id="spell-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} />
      <GrimoireSelect id="spell-scuola" value={scuola} onChange={(e) => setScuola(e.target.value)} options={scuolaOptions} style={{ minWidth: "160px" }} />
      <GrimoireSelect id="spell-livello" value={livello} onChange={(e) => setLivello(e.target.value)} options={livelloOptions} style={{ minWidth: "130px" }} />
      <GrimoireSelect id="spell-concentration" value={concentration} onChange={(e) => setConcentration(e.target.value)} options={boolOptions(t("filterConcentrazione"))} style={{ minWidth: "155px" }} />
      <GrimoireSelect id="spell-ritual" value={ritual} onChange={(e) => setRitual(e.target.value)} options={boolOptions(t("filterRituale"))} style={{ minWidth: "120px" }} />
    </GrimoireInlineGroup>
  );

  return (
    <GrimoirePage>
      <GrimoirePageTitle action={
        <GrimoireButton onClick={() => setShowCreate(true)}>{t("newButton")}</GrimoireButton>
      }>
        {t("pageTitle")}
      </GrimoirePageTitle>

      <GrimoireTabs tabs={tabs} active={tab} onChange={(k) => { setTab(k as TabKey); resetFilters(); }} />

      {filters}

      {tab === "miei" && (
        <GrimoireTable
          columns={baseColumns}
          data={mySpells}
          emptyMessage={t("tableEmpty")}
          actions={(s) => [
            { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", href: `/spells/${s.id}` },
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
