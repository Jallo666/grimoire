"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { ITEMS, CREATE_ITEM } from "@/lib/queries/items";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireText from "@/components/ui/GrimoireText";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import styles from "./MaterialOptionsEditor.module.css";

// Bozze del form: i numeri restano stringhe finché non si salva
export type IngredientDraft = { itemId: string; quantita: string; valoreMinimo: string; consumato: boolean };
export type OptionDraft = { valoreTotaleMinimo: string; ingredienti: IngredientDraft[] };

const EMPTY_INGREDIENT: IngredientDraft = { itemId: "", quantita: "1", valoreMinimo: "", consumato: false };

type Props = {
  value: OptionDraft[];
  onChange: (value: OptionDraft[]) => void;
  // oggetti già usati dall'incantesimo che potrebbero non essere tra i "miei" (es. condivisi da altri)
  extraItems: { id: string; nome: string }[];
};

// Opzioni del componente materiale: alternative ("oppure"), ognuna con gli ingredienti che servono
// insieme (oggetto, quantità, valore minimo per pezzo in mo, consumato) e un eventuale valore totale.
// In fondo si può creare un oggetto nuovo: finisce subito in un ingrediente.
export default function MaterialOptionsEditor({ value, onChange, extraItems }: Props) {
  const t = useTranslations("spells");
  const locale = useLocale();

  const { data, refetch } = useQuery<{ items: { id: string; nome: string }[] }>(ITEMS, { variables: { locale } });
  const [createItem, { loading: creating, error: createError }] = useMutation<{ createItem: { id: string } }>(CREATE_ITEM);
  const [newItemName, setNewItemName] = useState("");

  // oggetti che si possono scegliere: i miei e quelli di base, più quelli già usati qui
  const known = data?.items ?? [];
  const itemOptions = [
    { value: "", label: t("chooseItem") },
    ...[...known, ...extraItems.filter((e) => !known.some((k) => k.id === e.id))]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((i) => ({ value: i.id, label: i.nome })),
  ];

  const setOption = (oi: number, patch: Partial<OptionDraft>) =>
    onChange(value.map((o, i) => (i === oi ? { ...o, ...patch } : o)));
  const setIngredient = (oi: number, ii: number, patch: Partial<IngredientDraft>) =>
    setOption(oi, { ingredienti: value[oi].ingredienti.map((g, j) => (j === ii ? { ...g, ...patch } : g)) });

  const addOption = () => onChange([...value, { valoreTotaleMinimo: "", ingredienti: [EMPTY_INGREDIENT] }]);
  const removeOption = (oi: number) => onChange(value.filter((_, i) => i !== oi));
  const addIngredient = (oi: number) => setOption(oi, { ingredienti: [...value[oi].ingredienti, EMPTY_INGREDIENT] });
  const removeIngredient = (oi: number, ii: number) =>
    setOption(oi, { ingredienti: value[oi].ingredienti.filter((_, j) => j !== ii) });

  async function handleCreateItem() {
    if (!newItemName.trim()) return;
    try {
      const res = await createItem({ variables: { nome: newItemName.trim() } });
      const id = res.data?.createItem.id;
      await refetch();
      setNewItemName("");
      if (!id) return;
      // il nuovo oggetto va in un ingrediente: nell'ultima alternativa, o in una nuova se non ce ne sono
      const ingredient = { ...EMPTY_INGREDIENT, itemId: id };
      if (value.length === 0) onChange([{ valoreTotaleMinimo: "", ingredienti: [ingredient] }]);
      else {
        const last = value.length - 1;
        const rows = value[last].ingredienti;
        // se l'ultima riga è ancora vuota la si riempie, altrimenti se ne aggiunge una
        const filled = rows.length && !rows[rows.length - 1].itemId
          ? rows.map((r, j) => (j === rows.length - 1 ? ingredient : r))
          : [...rows, ingredient];
        setOption(last, { ingredienti: filled });
      }
    } catch {
      // l'errore lo mostra l'avviso sotto
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.title}>{t("ingredients")}</div>
      <GrimoireText muted small>{t("ingredientsHint")}</GrimoireText>

      {value.map((o, oi) => (
        <div key={oi} className={styles.option}>
          {/* titolo dell'alternativa e bottone per toglierla */}
          <div className={styles.optionHeader}>
            <span className={styles.optionTitle}>{t("optionTitle", { n: oi + 1 })}</span>
            <GrimoireButton size="sm" variant="outline-secondary" icon="trash" tooltip={t("removeOption")} onClick={() => removeOption(oi)} />
          </div>

          {o.ingredienti.map((g, ii) => (
            <div key={ii} className={styles.row}>
              <select
                className="form-select form-select-sm"
                aria-label={t("ingredientItem")}
                value={g.itemId}
                onChange={(e) => setIngredient(oi, ii, { itemId: e.target.value })}
              >
                {itemOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input
                className="form-control form-control-sm"
                type="number" inputMode="numeric" min={1} step={1}
                aria-label={t("ingredientQuantity")} title={t("ingredientQuantity")}
                value={g.quantita}
                onChange={(e) => setIngredient(oi, ii, { quantita: e.target.value })}
              />
              <input
                className="form-control form-control-sm"
                type="number" inputMode="decimal" min={0} step="any"
                placeholder={t("ingredientMinValue")}
                aria-label={t("ingredientMinValue")} title={t("ingredientMinValue")}
                value={g.valoreMinimo}
                onChange={(e) => setIngredient(oi, ii, { valoreMinimo: e.target.value })}
              />
              <label className={styles.consumed}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={g.consumato}
                  onChange={(e) => setIngredient(oi, ii, { consumato: e.target.checked })}
                />
                {t("ingredientConsumed")}
              </label>
              <GrimoireButton size="sm" variant="outline-secondary" icon="x-lg" tooltip={t("removeIngredient")} onClick={() => removeIngredient(oi, ii)} />
            </div>
          ))}

          <GrimoireInlineGroup wrap spaced>
            <GrimoireButton size="sm" variant="outline-secondary" icon="plus-lg" onClick={() => addIngredient(oi)}>{t("addIngredient")}</GrimoireButton>
          </GrimoireInlineGroup>
          <GrimoireInput
            id={`option-total-${oi}`}
            label={t("optionTotalMin")}
            type="number"
            value={o.valoreTotaleMinimo}
            onChange={(e) => setOption(oi, { valoreTotaleMinimo: e.target.value })}
          />
        </div>
      ))}

      <GrimoireInlineGroup wrap spaced>
        <GrimoireButton size="sm" variant="outline-secondary" icon="plus-lg" onClick={addOption}>{t("addOption")}</GrimoireButton>
      </GrimoireInlineGroup>

      {/* Nuovo oggetto: nome e "Crea" */}
      <GrimoireInlineGroup fillFirst spaced>
        <GrimoireInput
          id="new-item-name"
          type="text"
          value={newItemName}
          placeholder={`${t("newItemLabel")} — ${t("newItemPlaceholder")}`}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <GrimoireButton size="sm" variant="outline-secondary" loading={creating} disabled={!newItemName.trim()} onClick={handleCreateItem}>
          {t("createItem")}
        </GrimoireButton>
      </GrimoireInlineGroup>
      {!!createError && <GrimoireAlert error={createError} />}
    </div>
  );
}
