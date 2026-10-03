// Classi degli incantesimi SRD, come sono salvate nel database (in inglese).
// La traduzione è nelle chiavi "class<Nome>" del namespace "spells" (es. classWizard).
export const SPELL_CLASSES = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"] as const;

// "Bard, Wizard" → "Bardo, Mago": traduce ogni classe con la funzione data (se la conosce)
export function translateClassi(classi: string | null, translate: (cls: string) => string): string {
  if (!classi) return "";
  return classi.split(",").map((c) => translate(c.trim())).join(", ");
}
