// Legge il codice di un errore arrivato dal server GraphQL (vedi graphql/errors.ts).
// Apollo 4 mette gli errori in "errors", le versioni precedenti in "graphQLErrors":
// si guardano entrambi. Restituisce prima "reason" (es. SPELL_NOT_FOUND), altrimenti "code"
// (es. FORBIDDEN); undefined se non è un errore del server (es. connessione assente).
type Extensions = { reason?: string; code?: string };
type MaybeGraphQLError = { errors?: { extensions?: Extensions }[]; graphQLErrors?: { extensions?: Extensions }[] };

export function errorExtensions(error: unknown): Extensions | undefined {
  if (!error || typeof error !== "object") return undefined;
  const e = error as MaybeGraphQLError;
  return (e.errors ?? e.graphQLErrors)?.[0]?.extensions;
}

export function errorReason(error: unknown): string | undefined {
  const ext = errorExtensions(error);
  return ext?.reason ?? ext?.code;
}
