"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { MOVE_SPELL_TO_GROUP } from "@/lib/queries/spellGroups";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireSelect from "@/components/ui/GrimoireSelect";
import type { SpellGroup, SpellRow } from "./spellTypes";

type Props = {
  // incantesimo da spostare (null = modale chiusa)
  spell: SpellRow | null;
  groups: SpellGroup[];
  onClose: () => void;
  onMoved: () => void;
};

// Sposta un incantesimo della libreria in un altro gruppo
export default function MoveSpellModal({ spell, groups, onClose, onMoved }: Props) {
  const t = useTranslations("spells");
  const [groupId, setGroupId] = useState("");
  const [moveToGroup, { loading, error }] = useMutation(MOVE_SPELL_TO_GROUP, {
    onCompleted: () => { onMoved(); onClose(); },
  });

  // Aprendo la modale per un altro incantesimo si parte dal suo gruppo attuale
  const [lastSpellId, setLastSpellId] = useState<string | null>(null);
  if (spell && spell.id !== lastSpellId) {
    setLastSpellId(spell.id);
    setGroupId(spell.groupId ?? "");
  }

  const options = [
    { value: "", label: t("groupAutoLabel") },
    ...groups.map((g) => ({ value: g.id, label: g.nome })),
  ];

  return (
    <GrimoireModal
      show={!!spell}
      onClose={onClose}
      title={t("moveModalTitle")}
      footer={
        <GrimoireModalFooter error={error}>
          <GrimoireButton variant="outline-secondary" onClick={onClose}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton loading={loading} onClick={() => spell && groupId && moveToGroup({ variables: { spellId: spell.id, groupId } })}>
            {t("groupSave")}
          </GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      <GrimoireSelect id="move-group" label={t("groupLabel")} value={groupId} onChange={(e) => setGroupId(e.target.value)} options={options} />
    </GrimoireModal>
  );
}
