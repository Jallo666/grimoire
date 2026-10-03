"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { MY_SPELLS, SRD_SPELLS, ALL_SPELLS, DELETE_SPELL, ADD_SRD_SPELL, REMOVE_SRD_SPELL } from "@/lib/queries/spells";
import { MY_SPELL_GROUPS } from "@/lib/queries/spellGroups";
import SpellViewModal from "./SpellViewModal";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireViewToggle from "@/components/ui/GrimoireViewToggle";
import GrimoireFilterButton from "@/components/ui/GrimoireFilterButton";
import GrimoireText from "@/components/ui/GrimoireText";
import GrimoireExternalLink from "@/components/ui/GrimoireExternalLink";
import GrimoireConfirm, { type ConfirmRequest } from "@/components/ui/GrimoireConfirm";
import GrimoireToast from "@/components/ui/GrimoireToast";
import type { TableAction } from "@/components/ui/GrimoireTable";
import { useSpellFilters } from "@/components/features/spells/useSpellFilters";
import { useSpellOptions } from "@/components/features/spells/useSpellOptions";
import SpellFilters from "@/components/features/spells/SpellFilters";
import SpellList from "@/components/features/spells/SpellList";
import SpellBulkActions from "@/components/features/spells/SpellBulkActions";
import CreateSpellModal from "@/components/features/spells/CreateSpellModal";
import MoveSpellModal from "@/components/features/spells/MoveSpellModal";
import SpellGroupsModal from "@/components/features/spells/SpellGroupsModal";
import type { SpellGroup, SpellRow, SpellTab } from "@/components/features/spells/spellTypes";

// Pagina incantesimi: collega i pezzi di components/features/spells/
// (filtri, lista, selezione, modali) e tiene le liste, il dettaglio e le conferme.
export default function SpellsPage() {
  const t = useTranslations("spells");
  const tUi = useTranslations("ui");
  const locale = useLocale();

  const filtersApi = useSpellFilters();
  const { tab, view, filters, queryVars } = filtersApi;
  const options = useSpellOptions();

  // ── Liste (una per tab; si carica solo quella della tab aperta) ──
  const { data: groupsData, refetch: refetchGroups } = useQuery<{ mySpellGroups: SpellGroup[] }>(MY_SPELL_GROUPS);
  const groups = groupsData?.mySpellGroups ?? [];
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.nome }));

  const { data: myData, loading: loadingMy, refetch: refetchMy } = useQuery<{ mySpells: SpellRow[] }>(MY_SPELLS, {
    variables: { ...queryVars, locale, groupIds: filters.groups.length ? filters.groups : undefined },
    skip: tab !== "miei",
  });
  const { data: srdData, loading: loadingSrd, refetch: refetchSrd } = useQuery<{ srdSpells: SpellRow[] }>(SRD_SPELLS, {
    variables: { ...queryVars, locale },
    skip: tab !== "srd",
  });
  const { data: allData, loading: loadingAll, refetch: refetchAll } = useQuery<{ allSpells: SpellRow[] }>(ALL_SPELLS, {
    variables: { ...queryVars, locale },
    skip: tab !== "tutti",
  });

  function refetchEverything() {
    refetchMy(); refetchSrd(); refetchAll(); refetchGroups();
  }

  // Skeleton solo finché non ci sono ancora dati da mostrare
  // (dopo un'aggiunta o una cancellazione la lista resta visibile mentre si aggiorna)
  const lists: Record<SpellTab, { spells: SpellRow[]; loading: boolean }> = {
    miei: { spells: myData?.mySpells ?? [], loading: loadingMy && !myData },
    srd: { spells: srdData?.srdSpells ?? [], loading: loadingSrd && !srdData },
    tutti: { spells: allData?.allSpells ?? [], loading: loadingAll && !allData },
  };

  // ── Modali, conferme, messaggi ──
  const [viewSpellId, setViewSpellId] = useState<string | null>(null);
  const [moveSpell, setMoveSpell] = useState<SpellRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  // ── Ordine mostrato (per ‹ › nel dettaglio e per "seleziona tutti") ──
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const handleOrderChange = useCallback((rows: SpellRow[]) => {
    const ids = rows.map((r) => r.id);
    // stesso ordine di prima: nessun aggiornamento (evita di ridisegnare la pagina per niente)
    setVisibleIds((prev) => (prev.join() === ids.join() ? prev : ids));
  }, []);

  // ── Selezione ──
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Contano solo i selezionati ancora visibili (cambiando i filtri alcuni possono sparire)
  const selectedVisible = selectedIds.filter((id) => visibleIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  function exitSelection() {
    setSelecting(false);
    setSelectedIds([]);
  }

  function changeTab(key: string) {
    exitSelection();
    filtersApi.changeTab(key as SpellTab);
  }

  // ── Azioni sulla singola riga ──
  const [deleteSpell] = useMutation(DELETE_SPELL, { onCompleted: refetchEverything });
  const [addSrdSpell] = useMutation(ADD_SRD_SPELL, { onCompleted: refetchEverything });
  const [removeSrdSpell] = useMutation(REMOVE_SRD_SPELL, { onCompleted: refetchEverything });

  function askDeleteSpell(s: SpellRow) {
    setConfirm({
      title: t("confirmDeleteTitle"),
      message: t("confirmDeleteMessage", { name: s.nome }),
      confirmLabel: tUi("delete"),
      danger: true,
      onConfirm: async () => { await deleteSpell({ variables: { id: s.id } }); },
    });
  }

  const toggleLibrary = (s: SpellRow) =>
    s.inLibrary ? removeSrdSpell({ variables: { spellId: s.id } }) : addSrdSpell({ variables: { spellId: s.id } });

  // Azioni di ogni tab (bottoni della tabella su desktop, menu dal basso su mobile e nelle card)
  const detail = (s: SpellRow): TableAction => ({ icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", onClick: () => setViewSpellId(s.id) });
  const remove = (s: SpellRow): TableAction => ({ icon: "trash", tooltip: t("tooltipDelete"), variant: "danger", onClick: () => askDeleteSpell(s), hidden: !s.isOwner });
  const library = (s: SpellRow): TableAction => ({ label: s.inLibrary ? t("removeFromLibrary") : t("addToLibrary"), variant: s.inLibrary ? "danger" : "outline-secondary", onClick: () => toggleLibrary(s), hidden: !s.isSystem });
  const actions: Record<SpellTab, (s: SpellRow) => TableAction[]> = {
    miei: (s) => [
      detail(s),
      { label: t("moveToGroup"), variant: "outline-secondary", onClick: () => setMoveSpell(s) },
      { label: t("removeFromLibrary"), variant: "danger", onClick: () => removeSrdSpell({ variables: { spellId: s.id } }), hidden: !s.isSystem },
      remove(s),
    ],
    srd: (s) => [detail(s), library(s)],
    tutti: (s) => [detail(s), library(s), remove(s)],
  };

  // ── Dettaglio: precedente / successivo nell'ordine mostrato ──
  const viewIndex = viewSpellId ? visibleIds.indexOf(viewSpellId) : -1;
  const prevSpellId = viewIndex > 0 ? visibleIds[viewIndex - 1] : null;
  const nextSpellId = viewIndex >= 0 && viewIndex < visibleIds.length - 1 ? visibleIds[viewIndex + 1] : null;

  const tabs = [
    { key: "miei", label: t("tabMiei"), shortLabel: t("tabMieiShort") },
    { key: "srd", label: t("tabSrd"), shortLabel: t("tabSrdShort") },
    { key: "tutti", label: t("tabTutti"), shortLabel: t("tabTuttiShort") },
  ];

  return (
    <GrimoirePage fillHeight>
      <GrimoirePageTitle action={
        <GrimoireInlineGroup>
          <GrimoireButton variant="outline-secondary" mobileIcon="collection" onClick={() => setShowGroups(true)}>{t("manageGroups")}</GrimoireButton>
          <GrimoireButton variant={selecting ? "primary" : "outline-secondary"} mobileIcon="check2-square" onClick={() => (selecting ? exitSelection() : setSelecting(true))}>{tUi("select")}</GrimoireButton>
          <GrimoireButton mobileIcon="plus-lg" onClick={() => setShowCreate(true)}>{t("newButton")}</GrimoireButton>
        </GrimoireInlineGroup>
      }>
        {t("pageTitle")}
      </GrimoirePageTitle>

      <GrimoireTabs
        tabs={tabs}
        active={tab}
        onChange={changeTab}
        action={
          <GrimoireInlineGroup>
            <GrimoireViewToggle value={view} onChange={filtersApi.setView} />
            <GrimoireFilterButton activeCount={filtersApi.activeCount} onClick={() => setShowFilters(true)} />
          </GrimoireInlineGroup>
        }
      />

      <SpellFilters
        tab={tab}
        api={filtersApi}
        options={options}
        groupOptions={groupOptions}
        showModal={showFilters}
        onCloseModal={() => setShowFilters(false)}
      />

      <SpellList
        tab={tab}
        view={view}
        spells={lists[tab].spells}
        loading={lists[tab].loading}
        actions={actions[tab]}
        onOrderChange={handleOrderChange}
        selectable={selecting}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {tab === "srd" && (
        <GrimoireText muted small>
          {t("srdAttribution")} —{" "}
          <GrimoireExternalLink href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</GrimoireExternalLink>
        </GrimoireText>
      )}

      {selecting && (
        <SpellBulkActions
          tab={tab}
          selectedIds={selectedVisible}
          allSelected={allVisibleSelected}
          onToggleAll={() => setSelectedIds(allVisibleSelected ? [] : visibleIds)}
          onExit={exitSelection}
          groups={groups}
          onAskConfirm={setConfirm}
          onDone={(message) => { setToast(message); exitSelection(); refetchEverything(); }}
        />
      )}

      <CreateSpellModal show={showCreate} onClose={() => setShowCreate(false)} onCreated={refetchEverything} groups={groups} options={options} />
      <MoveSpellModal spell={moveSpell} groups={groups} onClose={() => setMoveSpell(null)} onMoved={refetchMy} />
      <SpellGroupsModal show={showGroups} onClose={() => setShowGroups(false)} groups={groups} onChanged={refetchEverything} onAskConfirm={setConfirm} />

      <SpellViewModal
        spellId={viewSpellId}
        onClose={() => setViewSpellId(null)}
        onPrev={prevSpellId ? () => setViewSpellId(prevSpellId) : undefined}
        onNext={nextSpellId ? () => setViewSpellId(nextSpellId) : undefined}
        position={viewIndex >= 0 ? { current: viewIndex + 1, total: visibleIds.length } : undefined}
      />

      <GrimoireConfirm request={confirm} onClose={() => setConfirm(null)} />
      <GrimoireToast message={toast} onHide={hideToast} />
    </GrimoirePage>
  );
}
