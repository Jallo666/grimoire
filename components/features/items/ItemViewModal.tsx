"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations, useLocale } from "next-intl";
import { ITEM } from "@/lib/queries/items";
import { formatCoins } from "@/lib/formatCoins";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireModalFooter from "@/components/ui/GrimoireModalFooter";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInlineGroup from "@/components/ui/GrimoireInlineGroup";
import GrimoireField from "@/components/ui/GrimoireField";
import GrimoireSkeletonText from "@/components/ui/GrimoireSkeletonText";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireSectionHeader from "@/components/ui/GrimoireSectionHeader";
import GrimoireDivider from "@/components/ui/GrimoireDivider";
import type { ItemToEdit } from "./ItemFormModal";

type SpellUse = { spellId: string; nome: string; livello: number; quantita: number; valoreMinimo: number | null; valoreTotaleMinimo: number | null; consumato: boolean };
type ItemDetail = ItemToEdit & { nome: string; isSystem: boolean; isOwner: boolean; usoCount: number; incantesimi: SpellUse[] };
type Row = SpellUse & { id: string; requisito: string };

type Props = {
  itemId: string | null;
  onClose: () => void;
  onEdit: (item: ItemToEdit) => void;
  onDelete: (item: ItemDetail) => void;
  // apre il dettaglio di un incantesimo che usa l'oggetto
  onOpenSpell: (spellId: string) => void;
};

// Dettaglio di un oggetto: categoria e incantesimi che lo usano, con il requisito
// (quantità, valore minimo, consumato). Chi l'ha creato può modificarlo o eliminarlo.
export default function ItemViewModal({ itemId, onClose, onEdit, onDelete, onOpenSpell }: Props) {
  const t = useTranslations("items");
  const ts = useTranslations("spells");
  const tUi = useTranslations("ui");
  const locale = useLocale();

  const { data, loading } = useQuery<{ item: ItemDetail | null }>(ITEM, {
    variables: { id: itemId!, locale },
    skip: !itemId,
    fetchPolicy: "network-only",
  });
  const item = data?.item;

  // Requisito leggibile: "2× — almeno 50 mo — consumato (totale almeno 300 mo)"
  const requisito = (u: SpellUse) => [
    u.quantita > 1 && `${u.quantita}×`,
    u.valoreMinimo != null && ts("atLeast", { valore: formatCoins(u.valoreMinimo, locale) }),
    u.consumato && ts("consumed"),
    u.valoreTotaleMinimo != null && `(${ts("totalAtLeast", { valore: formatCoins(u.valoreTotaleMinimo, locale) })})`,
  ].filter(Boolean).join(" — ");

  const rows: Row[] = (item?.incantesimi ?? []).map((u, i) => ({ ...u, id: `${u.spellId}-${i}`, requisito: requisito(u) }));
  const columns: Column<Row>[] = [
    { key: "nome", label: ts("colNome"), leader: true },
    { key: "livello", label: ts("colLivello"), render: (v) => (v === 0 ? ts("trucchetto") : ts("livelloShort", { n: v as number })) },
    { key: "requisito", label: t("colRequisito"), muted: true },
  ];

  return (
    <GrimoireModal
      show={!!itemId}
      onClose={onClose}
      title={item?.nome ?? "—"}
      titleSkeleton={loading}
      size="lg"
      fullscreenOnMobile
      footer={
        <GrimoireModalFooter
          start={item?.isOwner && (
            <GrimoireInlineGroup>
              <GrimoireButton variant="outline-secondary" mobileIcon="pencil" onClick={() => onEdit(item)}>{t("editButton")}</GrimoireButton>
              <GrimoireButton variant="danger" mobileIcon="trash" onClick={() => onDelete(item)}>{tUi("delete")}</GrimoireButton>
            </GrimoireInlineGroup>
          )}
        >
          <GrimoireButton variant="outline-secondary" onClick={onClose}>{tUi("close")}</GrimoireButton>
        </GrimoireModalFooter>
      }
    >
      {loading || !item ? (
        <GrimoireSkeletonText lines={4} />
      ) : (
        <>
          <GrimoireField label={t("fieldCategoria")} value={item.categoria ? t(`categoria_${item.categoria}` as Parameters<typeof t>[0]) : null} />
          <GrimoireField label={t("fieldOrigine")} value={item.isSystem ? t("origineBase") : item.isOwner ? t("origineMio") : t("origineAltri")} />
          <GrimoireDivider />
          <GrimoireSectionHeader>{t("usedBy", { n: item.usoCount })}</GrimoireSectionHeader>
          <GrimoireTable
            columns={columns}
            data={rows}
            emptyMessage={t("notUsed")}
            actions={(r) => [{ icon: "eye", tooltip: ts("tooltipDetail"), variant: "outline-secondary", onClick: () => onOpenSpell(r.spellId) }]}
          />
        </>
      )}
    </GrimoireModal>
  );
}
