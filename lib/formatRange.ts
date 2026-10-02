export type UnitSystem = "piedi" | "metri" | "quadretti" | "";

const SPECIAL_KEYWORDS: Record<string, string> = {
  touch: "touch",
  self: "self",
  sight: "sight",
  special: "special",
  unlimited: "unlimited",
};

function parseFeet(gittata: string): number | null {
  const m = gittata.match(/^(\d+(?:\.\d+)?)\s*feet?/i);
  return m ? Number(m[1]) : null;
}

function parseMiles(gittata: string): number | null {
  const m = gittata.match(/^(\d+(?:\.\d+)?)\s*miles?/i);
  return m ? Number(m[1]) : null;
}

function feetToDisplay(feet: number, unitSystem: UnitSystem): string {
  if (unitSystem === "metri") {
    const m = Math.round(feet * 0.3);
    return `${m} m`;
  }
  if (unitSystem === "quadretti") {
    const sq = Math.round(feet / 5);
    return `${sq} sq`;
  }
  return `${feet} ft`;
}

export function formatRange(
  gittata: string | null | undefined,
  unitSystem: UnitSystem,
  tSpecial: (key: string) => string
): string {
  if (!gittata) return "—";

  const lower = gittata.trim().toLowerCase();

  const key = SPECIAL_KEYWORDS[lower];
  if (key) return tSpecial(key);

  const feet = parseFeet(gittata);
  if (feet !== null) return feetToDisplay(feet, unitSystem);

  const miles = parseMiles(gittata);
  if (miles !== null) {
    const asFeet = miles * 5280;
    return feetToDisplay(asFeet, unitSystem);
  }

  return gittata;
}

export function toFeetString(valore: string, unita: UnitSystem): string {
  const n = Number(valore);
  if (!valore || isNaN(n)) return "";
  if (unita === "metri") return `${Math.round(n / 0.3)} feet`;
  if (unita === "quadretti") return `${n * 5} feet`;
  return `${n} feet`;
}

export function parseFeetString(
  gittata: string,
  targetUnit: UnitSystem
): { valore: string; unita: UnitSystem; special: string } {
  const lower = gittata.trim().toLowerCase();
  if (SPECIAL_KEYWORDS[lower]) {
    return { valore: "", unita: targetUnit || "piedi", special: lower };
  }

  const feet = parseFeet(gittata);
  if (feet !== null) {
    if (targetUnit === "metri") return { valore: String(Math.round(feet * 0.3)), unita: "metri", special: "" };
    if (targetUnit === "quadretti") return { valore: String(Math.round(feet / 5)), unita: "quadretti", special: "" };
    return { valore: String(feet), unita: "piedi", special: "" };
  }

  return { valore: "", unita: targetUnit || "piedi", special: "" };
}
