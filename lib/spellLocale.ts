// Lingue degli incantesimi: il testo principale (nome, descrizione… nei campi base) è nella
// lingua salvata in "lingua"; le altre lingue stanno nelle traduzioni.

export const otherLocale = (l: string) => (l === "it" ? "en" : "it");

// Lingua del testo principale. Ripiego per i dati senza "lingua": se c'è solo la traduzione
// nella lingua indicata, il testo principale è nell'altra; altrimenti si assume quella indicata.
export function spellMainLocale(spell: { lingua?: string | null; translations: { locale: string }[] }, locale: string) {
  if (spell.lingua) return spell.lingua;
  const has = (l: string) => spell.translations.some((tr) => tr.locale === l);
  return has(locale) && !has(otherLocale(locale)) ? otherLocale(locale) : locale;
}
