// Valori in mo (monete d'oro) con i decimali, come sono salvati nel database:
// 1 mo = 10 ma (argento) = 100 mr (rame). Si mostrano nella moneta più comoda:
//   300 → "300 mo", 0.5 → "5 ma", 0.01 → "1 mr", 1.5 → "1 mo 5 ma"
// Il platino (1 mp = 10 mo) non si usa: "1.000 mo" è più chiaro di "100 mp".
export function formatCoins(valueMo: number, locale: string) {
  const totalCp = Math.round(valueMo * 100); // tutto in rame, senza errori di arrotondamento
  const mo = Math.floor(totalCp / 100);
  const ma = Math.floor((totalCp % 100) / 10);
  const mr = totalCp % 10;
  const fmt = (n: number) => n.toLocaleString(locale === "en" ? "en-US" : "it-IT");
  const units = locale === "en" ? { mo: "gp", ma: "sp", mr: "cp" } : { mo: "mo", ma: "ma", mr: "mr" };
  const parts = [
    mo ? `${fmt(mo)} ${units.mo}` : "",
    ma ? `${ma} ${units.ma}` : "",
    mr ? `${mr} ${units.mr}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : `0 ${units.mo}`;
}
