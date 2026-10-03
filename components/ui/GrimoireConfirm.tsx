"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import GrimoireModal from "./GrimoireModal";
import GrimoireButton from "./GrimoireButton";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  // true = azione distruttiva (bottone rosso)
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

type Props = {
  request: ConfirmRequest | null;
  onClose: () => void;
};

// Modale di conferma prima di un'azione importante (es. eliminare).
// Si mostra quando "request" non è null; "Annulla" o la ✕ chiudono senza fare niente.
// Mentre l'azione è in corso il bottone mostra la rotellina; finita, la modale si chiude.
export default function GrimoireConfirm({ request, onClose }: Props) {
  const t = useTranslations("ui");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!request) return;
    setBusy(true);
    try {
      await request.onConfirm();
    } finally {
      setBusy(false);
    }
    onClose();
  }

  return (
    <GrimoireModal
      show={!!request}
      onClose={onClose}
      title={request?.title ?? ""}
      size="sm"
      onTop
      footer={
        <>
          <GrimoireButton variant="outline-secondary" onClick={onClose}>{t("cancel")}</GrimoireButton>
          <GrimoireButton variant={request?.danger ? "danger" : "primary"} loading={busy} onClick={confirm}>
            {request?.confirmLabel}
          </GrimoireButton>
        </>
      }
    >
      <p className="mb-0" style={{ color: "var(--g-text)" }}>{request?.message}</p>
    </GrimoireModal>
  );
}
