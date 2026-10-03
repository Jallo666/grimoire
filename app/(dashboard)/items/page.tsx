"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { ITEM_LIST, DELETE_ITEM } from "@/lib/queries/items";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTabs from "@/components/ui/GrimoireTabs";
import GrimoireFilterButton from "@/components/ui/GrimoireFilterButton";
import GrimoireFilterPanel from "@/components/ui/GrimoireFilterPanel";
import GrimoireFilterModal from "@/components/ui/GrimoireFilterModal";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireSearchInput from "@/components/ui/GrimoireSearchInput";
import GrimoireMultiSelect from "@/components/ui/GrimoireMultiSelect";
import GrimoireChips from "@/components/ui/GrimoireChips";
import GrimoireTable, { type Column, type TableAction } from "@/components/ui/GrimoireTable";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoireConfirm, { type ConfirmRequest } from "@/components/ui/GrimoireConfirm";
import GrimoireToast from "@/components/ui/GrimoireToast";
import { useItemFilters, type ItemTab } from "@/components/features/items/useItemFilters";
import { ITEM_CATEGORIES } from "@/components/features/items/itemCategories";
import ItemViewModal from "@/components/features/items/ItemViewModal";
import ItemFormModal, { type ItemToEdit } from "@/components/features/items/ItemFormModal";
import SpellViewModal from "@/components/features/spells/SpellViewModal";

type ItemRow = { id: string; nome: string; categoria: string | null; isSystem: boolean; isOwner: boolean; usoCount: number };

// Pagina oggetti: quelli di base (SRD) e i propri, con gli incantesimi che li usano come ingredienti.
// Da qui partirà anche l'inventario.
export default function ItemsPage() {
  const t = useTranslations("items");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const { tab, search, categories, setParam, changeTab, resetFilters, activeCount } = useItemFilters();

  const { data, loading, refetch } = useQuery<{ itemList: ItemRow[] }>(ITEM_LIST, {
    variables: { tab, search: search || undefined, categorie: categories.length ? categories : undefined, locale },
  });
  const itemList = data?.itemList ?? [];

  const [viewItemId, setViewItemId] = useState<string | null>(null);
  // dettaglio di un incantesimo aperto dal dettaglio di un oggetto: chiudendolo si torna all'oggetto
  const [viewSpell, setViewSpell] = useState<{ spellId: string; fromItemId: string } | null>(null);
  // modale di creazione/modifica: null = chiusa, item null = nuovo oggetto
  const [form, setForm] = useState<{ item: ItemToEdit | null } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const [deleteItem] = useMutation(DELETE_ITEM);

  function askDelete(item: { id: string; nome: string }) {
    setConfirm({
      title: t("confirmDeleteTitle"),
      message: t("confirmDeleteMessage", { name: item.nome }),
      confirmLabel: tUi("delete"),
      danger: true,
      onConfirm: async () => {
        try {
          await deleteItem({ variables: { id: item.id } });
          setViewItemId(null);
          refetch();
        } catch {
          // di solito: l'oggetto è ancora usato da un incantesimo
          setToast(t("deleteFailed"));
        }
      },
    });
  }

  const categoryOptions = ITEM_CATEGORIES.map((c) => ({ value: c, label: t(`categoria_${c}`) }));
  const categoryLabels = Object.fromEntries(categoryOptions.map((o) => [o.value, o.label]));

  const columns: Column<ItemRow>[] = [
    { key: "nome", label: t("colNome"), sortable: true, leader: true },
    // senza categoria: niente badge
    { key: "categoria", label: t("fieldCategoria"), sortable: true, render: (v) => (v ? <GrimoireBadge variant="secondary">{categoryLabels[v as string] ?? String(v)}</GrimoireBadge> : null) },
    { key: "usoCount", label: t("colUso"), sortable: true, render: (v) => t("spellCount", { n: v as number }) },
  ];

  // Azioni: dettaglio per tutti, modifica ed eliminazione solo per i propri oggetti
  const actions = (row: ItemRow): TableAction[] => [
    { icon: "eye", tooltip: t("tooltipDetail"), variant: "outline-secondary", onClick: () => setViewItemId(row.id) },
    { icon: "trash", tooltip: tUi("delete"), variant: "danger", onClick: () => askDelete(row), hidden: !row.isOwner },
  ];

  const tabs = [
    { key: "all", label: t("tabAll") },
    { key: "srd", label: t("tabSrd") },
    { key: "mine", label: t("tabMine") },
  ];

  return (
    <GrimoirePage fillHeight>
      <GrimoirePageTitle action={
        <GrimoireButton mobileIcon="plus-lg" onClick={() => setForm({ item: null })}>{t("newButton")}</GrimoireButton>
      }>
        {t("pageTitle")}
      </GrimoirePageTitle>

      <GrimoireTabs
        tabs={tabs}
        active={tab}
        onChange={(key) => changeTab(key as ItemTab)}
        action={<GrimoireFilterButton activeCount={activeCount} onClick={() => setShowFilters(true)} />}
      />

      <GrimoireFilterPanel>
        <GrimoireInlineGroup wrap spaced>
          <GrimoireSearchInput id="item-search" value={search} onSearch={(v) => setParam("search", v)} placeholder={t("searchPlaceholder")} />
          <GrimoireMultiSelect id="item-category" placeholder={t("filterAllCategories")} value={categories} onChange={(v) => setParam("category", v.join(","))} options={categoryOptions} minWidth={170} />
        </GrimoireInlineGroup>
      </GrimoireFilterPanel>

      <GrimoireFilterModal show={showFilters} onClose={() => setShowFilters(false)} onReset={resetFilters}>
        <GrimoireSearchInput id="item-search-mobile" value={search} onSearch={(v) => setParam("search", v)} placeholder={t("searchPlaceholder")} />
        <GrimoireChips label={t("fieldCategoria")} options={categoryOptions} value={categories} onChange={(v) => setParam("category", v.join(","))} />
      </GrimoireFilterModal>

      <GrimoireTable
        columns={columns}
        data={itemList}
        skeleton={loading && !data}
        skeletonRows={8}
        fillHeight
        defaultSort={{ key: "nome", dir: "asc" }}
        emptyMessage={t("tableEmpty")}
        actions={actions}
      />

      <ItemViewModal
        itemId={viewItemId}
        onClose={() => setViewItemId(null)}
        onEdit={(item) => { setViewItemId(null); setForm({ item }); }}
        onDelete={askDelete}
        onOpenSpell={(spellId) => { if (viewItemId) setViewSpell({ spellId, fromItemId: viewItemId }); setViewItemId(null); }}
      />
      {/* Chiudendo la modifica si torna al dettaglio dell'oggetto */}
      <ItemFormModal
        show={!!form}
        item={form?.item}
        onClose={() => { if (form?.item) setViewItemId(form.item.id); setForm(null); }}
        onSaved={() => refetch()}
      />
      {/* Dettaglio di un incantesimo che usa l'oggetto (senza modifica: quella si fa dagli incantesimi) */}
      <SpellViewModal
        spellId={viewSpell?.spellId ?? null}
        onClose={() => { if (viewSpell) setViewItemId(viewSpell.fromItemId); setViewSpell(null); }}
      />

      <GrimoireConfirm request={confirm} onClose={() => setConfirm(null)} />
      <GrimoireToast message={toast} onHide={hideToast} />
    </GrimoirePage>
  );
}
