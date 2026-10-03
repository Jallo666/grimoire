"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { CREATE_ITEM, UPDATE_ITEM } from "@/lib/queries/items";
import { otherLocale } from "@/lib/spellLocale";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInput from "@/components/ui/GrimoireInput";
import { ITEM_CATEGORIES } from "./itemCategories";

// Oggetto da modificare: nome originale, traduzioni e categoria
export type ItemToEdit = { id: string; nomeOriginale: string; categoria: string | null; translations: { locale: string; nome: string }[] };

type Props = {
  show: boolean;
  // assente = nuovo oggetto
  item?: ItemToEdit | null;
  onClose: () => void;
  onSaved: () => void;
};

// Creazione e modifica di un oggetto: nome (obbligatorio), nome nell'altra lingua (facoltativo), categoria
export default function ItemFormModal({ show, item, onClose, onSaved }: Props) {
  const t = useTranslations("items");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const other = otherLocale(locale);

  const [nome, setNome] = useState("");
  const [nomeAltro, setNomeAltro] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Aprendo la modale si riempie il form (con l'oggetto da modificare, o vuoto)
  const openKey = show ? item?.id ?? "new" : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (openKey !== lastKey) {
    setLastKey(openKey);
    setNome(item?.nomeOriginale ?? "");
    setNomeAltro(item?.translations.find((tr) => tr.locale === other)?.nome ?? "");
    setCategoria(item?.categoria ?? "");
    setFormError(null);
  }

  const [createItem, { loading: creating, error: createError }] = useMutation(CREATE_ITEM);
  const [updateItem, { loading: updating, error: updateError }] = useMutation(UPDATE_ITEM);

  const categoryOptions = [
    { value: "", label: t("categoryNone") },
    ...ITEM_CATEGORIES.map((c) => ({ value: c, label: t(`categoria_${c}`) })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setFormError(tUi("requiredFields", { fields: t("fieldNome") }));
      return;
    }
    const variables = { nome: nome.trim(), categoria: categoria || null, traduzioneLocale: other, traduzioneNome: nomeAltro.trim() || null };
    try {
      if (item) await updateItem({ variables: { id: item.id, ...variables } });
      else await createItem({ variables });
    } catch {
      return; // l'errore lo mostra il footer
    }
    onSaved();
    onClose();
  }

  return (
    <GrimoireModal
      show={show}
      onClose={onClose}
      title={item ? t("editTitle") : t("createTitle")}
      footer={
        <GrimoireModalFooter error={formError ?? createError ?? updateError}>
          <GrimoireButton variant="outline-secondary" onClick={onClose}>{tUi("cancel")}</GrimoireButton>
          <GrimoireButton type="submit" form="item-form" loading={creating || updating}>{tUi("save")}</GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      <form id="item-form" onSubmit={handleSubmit} noValidate>
        <GrimoireInput id="item-nome" label={t("fieldNome")} type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <GrimoireInput id="item-nome-altro" label={t("fieldNomeAltraLingua", { lingua: other.toUpperCase() })} type="text" value={nomeAltro} onChange={(e) => setNomeAltro(e.target.value)} />
        <GrimoireInput id="item-categoria" label={t("fieldCategoria")} type="select" value={categoria} onChange={(e) => setCategoria(e.target.value)} options={categoryOptions} />
      </form>
    </GrimoireModal>
  );
}
