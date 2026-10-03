"use client";

import { useTranslations } from "next-intl";
import GrimoireModal from "./GrimoireModal";
import GrimoireButton from "./GrimoireButton";
import GrimoireModalFooter from "./GrimoireModalFooter";

type Props = {
  show: boolean;
  onClose: () => void;
  onReset: () => void;
  children: React.ReactNode;
};

// Modale dei filtri per tablet e telefono (si apre da GrimoireFilterButton).
// I filtri si applicano subito; "Azzera" li toglie tutti, "Mostra risultati" chiude la modale.
export default function GrimoireFilterModal({ show, onClose, onReset, children }: Props) {
  const t = useTranslations("ui");

  return (
    <GrimoireModal
      show={show}
      onClose={onClose}
      title={t("filters")}
      footer={
        <GrimoireModalFooter start={<GrimoireButton variant="outline-secondary" onClick={onReset}>{t("clearSelection")}</GrimoireButton>}>
          <GrimoireButton onClick={onClose}>{t("showResults")}</GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      <div className="d-flex flex-column gap-4">{children}</div>
    </GrimoireModal>
  );
}
