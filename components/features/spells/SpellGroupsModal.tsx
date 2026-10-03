"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { CREATE_SPELL_GROUP, RENAME_SPELL_GROUP, DELETE_SPELL_GROUP } from "@/lib/queries/spellGroups";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireTable from "@/components/ui/GrimoireTable";
import type { ConfirmRequest } from "@/components/ui/GrimoireConfirm";
import type { SpellGroup } from "./spellTypes";

type Props = {
  show: boolean;
  onClose: () => void;
  groups: SpellGroup[];
  // dopo una creazione, rinomina o eliminazione (per aggiornare le liste)
  onChanged: () => void;
  // chiede conferma prima di eliminare un gruppo
  onAskConfirm: (request: ConfirmRequest) => void;
};

// Gestione dei gruppi: "Nuovo gruppo" in alto e tabella dei gruppi.
// "Rinomina" cambia il contenuto della modale (niente modale sopra la modale).
export default function SpellGroupsModal({ show, onClose, groups, onChanged, onAskConfirm }: Props) {
  const t = useTranslations("spells");
  const tUi = useTranslations("ui");
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  const [createGroup, { loading: creating, error: createError }] = useMutation(CREATE_SPELL_GROUP, {
    onCompleted: () => { onChanged(); setNewName(""); },
  });
  const [renameGroup, { loading: renaming, error: renameError }] = useMutation(RENAME_SPELL_GROUP, {
    onCompleted: () => { onChanged(); setRenameId(""); setRenameName(""); },
  });
  const [deleteGroup] = useMutation(DELETE_SPELL_GROUP, { onCompleted: onChanged });

  function close() {
    setRenameId("");
    onClose();
  }

  return (
    <GrimoireModal
      show={show}
      onClose={close}
      title={renameId ? t("groupRenameTitle") : t("groupsModalTitle")}
      footer={
        <GrimoireModalFooter error={renameId ? renameError : createError}>
          {renameId ? (
            <>
              <GrimoireButton variant="outline-secondary" onClick={() => setRenameId("")}>{t("cancelButton")}</GrimoireButton>
              <GrimoireButton loading={renaming} onClick={() => renameName.trim() && renameGroup({ variables: { id: renameId, nome: renameName } })}>{t("groupRenameSave")}</GrimoireButton>
            </>
          ) : (
            <GrimoireButton variant="outline-secondary" onClick={close}>{tUi("close")}</GrimoireButton>
          )}
        </GrimoireModalFooter>
      }
    >
      {renameId ? (
        <GrimoireInput id="rename-group" label={t("colNome")} type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      ) : (
        <>
          <GrimoireInlineGroup spaced fillFirst>
            <GrimoireInput id="new-group" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("groupNamePlaceholder")} />
            <GrimoireButton loading={creating} onClick={() => newName.trim() && createGroup({ variables: { nome: newName } })}>{t("groupCreate")}</GrimoireButton>
          </GrimoireInlineGroup>
          <GrimoireTable
            columns={[{ key: "nome", label: t("colNome"), sortable: true, leader: true }]}
            data={groups}
            defaultSort={{ key: "nome", dir: "asc" }}
            emptyMessage={t("groupsEmpty")}
            actions={(g) => [
              { icon: "pencil", tooltip: t("groupRename"), variant: "outline-secondary", onClick: () => { setRenameId(g.id); setRenameName(g.nome); } },
              { icon: "trash", tooltip: t("groupDelete"), variant: "danger", onClick: () => onAskConfirm({
                title: t("confirmDeleteGroupTitle"),
                message: t("confirmDeleteGroupMessage", { name: g.nome }),
                confirmLabel: tUi("delete"),
                danger: true,
                onConfirm: async () => { await deleteGroup({ variables: { id: g.id } }); },
              }) },
            ]}
          />
        </>
      )}
    </GrimoireModal>
  );
}
