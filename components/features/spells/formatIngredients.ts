import { formatCoins } from "@/lib/formatCoins";
import type { MaterialOption } from "./materialTypes";

type T = (key: string, values?: Record<string, string>) => string;

// Ingredienti del materiale come testo, una riga per ingrediente, "oppure" tra le alternative:
//   Diamante — almeno 1.000 mo — consumato
//   Contenitore per clone — almeno 2.000 mo
export function formatIngredients(opzioni: MaterialOption[], t: T, locale: string) {
  return opzioni.map((o) => {
    const lines = o.ingredienti.map((i) => [
      `${i.quantita > 1 ? `${i.quantita}× ` : ""}${i.item.nome}`,
      i.valoreMinimo != null && t("atLeast", { valore: formatCoins(i.valoreMinimo, locale) }),
      i.consumato && t("consumed"),
    ].filter(Boolean).join(" — "));
    if (o.valoreTotaleMinimo != null) lines.push(t("totalAtLeast", { valore: formatCoins(o.valoreTotaleMinimo, locale) }));
    return lines.join("\n");
  }).join(`\n— ${t("orSeparator")} —\n`);
}
