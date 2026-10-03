"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { SHARE_SPELL_USER } from "@/lib/queries/spells";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireInput from "@/components/ui/GrimoireInput";

type Props = {
  // incantesimo da condividere; null = modale chiusa
  spellId: string | null;
  onClose: () => void;
};

// Condivisione di un incantesimo con un altro utente, tramite la sua email
export default function ShareSpellModal({ spellId, onClose }: Props) {
  const t = useTranslations("spellDetail");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const [shareSpell, { loading, error, reset }] = useMutation(SHARE_SPELL_USER, {
    onCompleted: () => { setSuccess(true); setEmail(""); },
  });

  function close() {
    setEmail("");
    setSuccess(false);
    reset();
    onClose();
  }

  return (
    <GrimoireModal
      show={!!spellId}
      onClose={close}
      title={t("shareModalTitle")}
      footer={
        <GrimoireModalFooter error={error}>
          <GrimoireButton variant="outline-secondary" onClick={close}>{t("cancelButton")}</GrimoireButton>
          <GrimoireButton loading={loading} onClick={() => shareSpell({ variables: { spellId, email } }).catch(() => {})}>
            {t("shareButton")}
          </GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      {success && <GrimoireAlert variant="success">{t("shareSuccess")}</GrimoireAlert>}
      <GrimoireInput
        id="share-email"
        label={t("shareEmailLabel")}
        type="email"
        value={email}
        onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        placeholder={t("shareEmailPlaceholder")}
      />
    </GrimoireModal>
  );
}
