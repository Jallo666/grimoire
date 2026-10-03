import { GraphQLError } from "graphql";

// Errori dell'app. Il server manda alla pagina un codice ("reason", es. SPELL_NOT_FOUND) e la
// pagina mostra il testo tradotto (messages/*.json, gruppo "errors"; vedi GrimoireAlert).
// "message" in italiano serve solo per i log del server.
const ERRORS = {
  UNAUTHENTICATED: { code: "UNAUTHENTICATED", message: "Non autenticato" },
  FORBIDDEN: { code: "FORBIDDEN", message: "Non autorizzato" },
  INVALID_CREDENTIALS: { code: "UNAUTHENTICATED", message: "Credenziali non valide" },
  EMAIL_IN_USE: { code: "CONFLICT", message: "Email già in uso" },
  PASSWORD_TOO_SHORT: { code: "BAD_USER_INPUT", message: "La nuova password deve essere di almeno 8 caratteri" },
  WRONG_PASSWORD: { code: "FORBIDDEN", message: "Password non corretta" },
  USER_NOT_FOUND: { code: "NOT_FOUND", message: "Utente non trovato" },
  CAMPAIGN_NOT_FOUND: { code: "NOT_FOUND", message: "Campagna non trovata" },
  NOT_CAMPAIGN_MEMBER: { code: "FORBIDDEN", message: "Non sei membro di questa campagna" },
  MEMBER_NOT_FOUND: { code: "NOT_FOUND", message: "Membro non trovato" },
  ALREADY_MEMBER: { code: "CONFLICT", message: "Utente già membro" },
  ONLY_OWNER_ADDS_MASTER: { code: "FORBIDDEN", message: "Solo l'owner può aggiungere un master" },
  CANNOT_REMOVE_OWNER: { code: "FORBIDDEN", message: "Non puoi rimuovere l'owner dalla campagna" },
  LAST_MEMBER: { code: "FORBIDDEN", message: "Deve rimanere almeno un membro nella campagna" },
  CANNOT_CHANGE_OWNER_ROLE: { code: "FORBIDDEN", message: "Non puoi modificare il ruolo dell'owner" },
  ONLY_OWNER_ASSIGNS_MASTER: { code: "FORBIDDEN", message: "Solo l'owner può assegnare il ruolo master" },
  SPELL_NOT_FOUND: { code: "NOT_FOUND", message: "Incantesimo non trovato" },
  SPELL_NOT_IN_LIBRARY: { code: "FORBIDDEN", message: "Non hai questo incantesimo in raccolta" },
  NOT_SRD_SPELL: { code: "BAD_USER_INPUT", message: "Non è un incantesimo SRD" },
  ONLY_CREATOR_EDITS: { code: "FORBIDDEN", message: "Solo il creatore può modificare l'incantesimo" },
  ONLY_CREATOR_DELETES: { code: "FORBIDDEN", message: "Solo il creatore può eliminare l'incantesimo" },
  GROUP_NOT_FOUND: { code: "NOT_FOUND", message: "Gruppo non trovato" },
  GROUP_EXISTS: { code: "BAD_USER_INPUT", message: "Gruppo già esistente" },
  ITEM_NAME_REQUIRED: { code: "BAD_USER_INPUT", message: "Il nome dell'oggetto è obbligatorio" },
  ITEM_NOT_ALLOWED: { code: "FORBIDDEN", message: "Oggetto non utilizzabile" },
  ITEM_NOT_FOUND: { code: "NOT_FOUND", message: "Oggetto non trovato" },
  ONLY_CREATOR_EDITS_ITEM: { code: "FORBIDDEN", message: "Solo il creatore può modificare l'oggetto" },
  ITEM_IN_USE: { code: "CONFLICT", message: "Oggetto usato da un incantesimo" },
} as const;

export type ErrorReason = keyof typeof ERRORS;

// Uso: throw appError("SPELL_NOT_FOUND")
export function appError(reason: ErrorReason) {
  const { code, message } = ERRORS[reason];
  return new GraphQLError(message, { extensions: { code, reason } });
}
