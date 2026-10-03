"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { ADD_SRD_SPELLS, REMOVE_SRD_SPELLS, DELETE_SPELLS } from "@/lib/queries/spells";
import { MOVE_SPELLS_TO_GROUP } from "@/lib/queries/spellGroups";
import GrimoireSelectionBar from "@/components/ui/GrimoireSelectionBar";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireSelect from "@/components/ui/GrimoireSelect";
import type { ConfirmRequest } from "@/components/ui/GrimoireConfirm";
import type { SpellGroup, SpellTab } from "./spellTypes";

type Props = {
  tab: SpellTab;
  // incantesimi selezionati e ancora visibili (cambiando i filtri alcuni possono sparire)
  selectedIds: string[];
  allSelected: boolean;
  onToggleAll: () => void;
  onExit: () => void;
  groups: SpellGroup[];
  onAskConfirm: (request: ConfirmRequest) => void;
  // finita un'azione: messaggio col risultato (es. "12 eliminati · 3 ignorati")
  onDone: (message: string) => void;
};

type ResultKey = "resultAdded" | "resultRemoved" | "resultMoved" | "resultDeleted";

// Barra in basso della modalità selezione, con le azioni in blocco della tab:
// SRD: Aggiungi, Togli · Miei: Sposta, Togli, Elimina · Tutti: Aggiungi, Togli, Elimina.
// Aggiungi e Sposta chiedono il gruppo; Togli ed Elimina chiedono conferma.
export default function SpellBulkActions({ tab, selectedIds, allSelected, onToggleAll, onExit, groups, onAskConfirm, onDone }: Props) {
  const t = useTranslations("spells");
  const tUi = useTranslations("ui");
  const [groupMode, setGroupMode] = useState<"add" | "move" | null>(null);
  const [groupId, setGroupId] = useState("");

  const [addSrdSpells] = useMutation<{ addSrdSpellsToLibrary: number }>(ADD_SRD_SPELLS);
  const [removeSrdSpells] = useMutation<{ removeSrdSpellsFromLibrary: number }>(REMOVE_SRD_SPELLS);
  const [deleteSpells] = useMutation<{ deleteSpells: number }>(DELETE_SPELLS);
  const [moveSpellsToGroup] = useMutation<{ moveSpellsToGroup: number }>(MOVE_SPELLS_TO_GROUP);

  const count = selectedIds.length;
  const none = count === 0;

  // Messaggio col risultato: quanti cambiati e quanti ignorati (es. eliminare un SRD)
  function finish(done: number, key: ResultKey) {
    const ignored = count - done;
    onDone(t(key, { count: done }) + (ignored > 0 ? t("resultIgnored", { count: ignored }) : ""));
  }

  function openGroupModal(mode: "add" | "move") {
    setGroupMode(mode);
    // aggiunta: gruppo facoltativo ("automatico"); spostamento: serve un gruppo, si parte dal primo
    setGroupId(mode === "move" ? groups[0]?.id ?? "" : "");
  }

  async function confirmGroup() {
    if (groupMode === "add") {
      const { data } = await addSrdSpells({ variables: { spellIds: selectedIds, groupId: groupId || undefined } });
      finish(data?.addSrdSpellsToLibrary ?? 0, "resultAdded");
    } else if (groupMode === "move" && groupId) {
      const { data } = await moveSpellsToGroup({ variables: { spellIds: selectedIds, groupId } });
      finish(data?.moveSpellsToGroup ?? 0, "resultMoved");
    }
    setGroupMode(null);
  }

  function askRemove() {
    onAskConfirm({
      title: t("confirmRemoveManyTitle", { count }),
      message: t("confirmRemoveManyMessage"),
      confirmLabel: tUi("remove"),
      danger: true,
      onConfirm: async () => {
        const { data } = await removeSrdSpells({ variables: { spellIds: selectedIds } });
        finish(data?.removeSrdSpellsFromLibrary ?? 0, "resultRemoved");
      },
    });
  }

  function askDelete() {
    onAskConfirm({
      title: t("confirmDeleteManyTitle", { count }),
      message: t("confirmDeleteManyMessage"),
      confirmLabel: tUi("delete"),
      danger: true,
      onConfirm: async () => {
        const { data } = await deleteSpells({ variables: { ids: selectedIds } });
        finish(data?.deleteSpells ?? 0, "resultDeleted");
      },
    });
  }

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.nome }));
  const addGroupOptions = [{ value: "", label: t("groupAutoLabel") }, ...groupOptions];

  return (
    <>
      <GrimoireSelectionBar count={count} allSelected={allSelected} onToggleAll={onToggleAll} onExit={onExit}>
        {tab !== "miei" && <GrimoireButton size="sm" icon="plus-lg" disabled={none} onClick={() => openGroupModal("add")}>{t("bulkAdd")}</GrimoireButton>}
        {tab === "miei" && <GrimoireButton size="sm" variant="outline-secondary" icon="collection" disabled={none || groups.length === 0} onClick={() => openGroupModal("move")}>{t("bulkMove")}</GrimoireButton>}
        <GrimoireButton size="sm" variant="outline-secondary" icon="dash-circle" disabled={none} onClick={askRemove}>{t("bulkRemove")}</GrimoireButton>
        {tab !== "srd" && <GrimoireButton size="sm" variant="danger" icon="trash" disabled={none} onClick={askDelete}>{tUi("delete")}</GrimoireButton>}
      </GrimoireSelectionBar>

      {/* Scelta del gruppo: aggiungi alla libreria (facoltativo) / sposta (obbligatorio) */}
      <GrimoireModal
        show={!!groupMode}
        onClose={() => setGroupMode(null)}
        title={groupMode === "add" ? t("bulkAddTitle") : t("moveModalTitle")}
        footer={
          <GrimoireModalFooter>
            <GrimoireButton variant="outline-secondary" onClick={() => setGroupMode(null)}>{t("cancelButton")}</GrimoireButton>
            <GrimoireButton disabled={groupMode === "move" && !groupId} onClick={confirmGroup}>
              {groupMode === "add" ? t("bulkAdd") : t("groupSave")}
            </GrimoireButton>
          </GrimoireModalFooter>
        }
      >
        <GrimoireSelect id="bulk-group" label={t("groupLabel")} value={groupId} onChange={(e) => setGroupId(e.target.value)} options={groupMode === "add" ? addGroupOptions : groupOptions} />
      </GrimoireModal>
    </>
  );
}
