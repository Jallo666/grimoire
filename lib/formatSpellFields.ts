// Maps SRD English values → i18n key suffix (used in "spells" namespace)
export const CASTING_TIME_MAP: Record<string, string> = {
  "1 action": "ct1Action",
  "1 bonus action": "ct1BonusAction",
  "1 reaction": "ct1Reaction",
  "1 minute": "ct1Minute",
  "10 minutes": "ct10Minutes",
  "1 hour": "ct1Hour",
  "8 hours": "ct8Hours",
  "12 hours": "ct12Hours",
  "24 hours": "ct24Hours",
};

export const DURATION_MAP: Record<string, string> = {
  "instantaneous": "durInstantaneous",
  "special": "durSpecial",
  "until dispelled": "durUntilDispelled",
  "1 round": "dur1Round",
  "1 minute": "dur1Minute",
  "10 minutes": "dur10Minutes",
  "1 hour": "dur1Hour",
  "2 hours": "dur2Hours",
  "8 hours": "dur8Hours",
  "24 hours": "dur24Hours",
  "7 days": "dur7Days",
  "10 days": "dur10Days",
  "30 days": "dur30Days",
  "up to 1 round": "durUpTo1Round",
  "up to 1 minute": "durUpTo1Minute",
  "up to 10 minutes": "durUpTo10Minutes",
  "up to 1 hour": "durUpTo1Hour",
  "up to 2 hours": "durUpTo2Hours",
  "up to 8 hours": "durUpTo8Hours",
  "up to 24 hours": "durUpTo24Hours",
};

export function translateField(
  value: string | null | undefined,
  map: Record<string, string>,
  t: (key: string) => string
): string {
  if (!value) return "—";
  const key = map[value.toLowerCase().trim()];
  return key ? t(key) : value;
}
