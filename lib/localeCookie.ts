// Salva la lingua scelta nel cookie NEXT_LOCALE (letto da next-intl), valido un anno.
// Sta fuori dai componenti: React non vuole che un componente modifichi direttamente "document".
export function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

// Lingua salvata nel cookie NEXT_LOCALE (undefined se non c'è)
export function getLocaleCookie(): string | undefined {
  return document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
}
