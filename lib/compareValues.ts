export type SortDir = "asc" | "desc";

// Confronta due valori per il riordino: numeri come numeri, il resto come testo
// ("Livello 2" prima di "Livello 10"). Vuoti/null contano come testo vuoto.
export function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  const aVal = a == null ? "" : a;
  const bVal = b == null ? "" : b;
  let result = 0;
  if (typeof aVal === "number" && typeof bVal === "number") {
    result = aVal - bVal;
  } else {
    result = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
  }
  return dir === "asc" ? result : -result;
}
