// Tipi di danno degli incantesimi, come sono salvati nel database (in inglese, dai dati SRD).
// La traduzione è nelle chiavi "damage<Tipo>" del namespace "spells" (es. damageFire).
export const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
  "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
] as const;

// "fire" → "damageFire": chiave di traduzione del tipo di danno
export function damageKey(type: string): string {
  return `damage${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}
