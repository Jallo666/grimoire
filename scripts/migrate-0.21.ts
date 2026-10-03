import { config } from "dotenv";
import postgres from "postgres";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.21.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Fa (in una transazione: o tutto o niente):
//   1. aggiunge, se manca, la colonna spells.lingua (lingua del testo principale)
//   2. incantesimi SRD: lingua = "en"
//   3. incantesimi degli utenti ancora senza lingua, dedotta così:
//      - c'è solo la traduzione inglese → il testo principale è italiano ("it")
//      - c'è solo la traduzione italiana → il testo principale è inglese ("en")
//      - altrimenti la lingua preferita di chi l'ha creato, o "it" se non c'è
//
// Non cancella niente e non tocca le righe che hanno già una lingua: è rilanciabile.
// Se fallisce, fallisce il build: Vercel non pubblica la nuova versione e il database resta com'era.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.21] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  // Nei controlli su GitHub il database è finto: si salta (su Vercel questa variabile non c'è)
  if (process.env.SKIP_DB_MIGRATIONS === "1") {
    console.log("[migrate-0.21] SKIP_DB_MIGRATIONS=1: migrazione saltata");
    return;
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      // 1. Colonna
      await sql`ALTER TABLE spells ADD COLUMN IF NOT EXISTS lingua text`;

      // 2. SRD: testi originali in inglese
      const srd = await sql`UPDATE spells SET lingua = 'en' WHERE is_system = true AND lingua IS NULL RETURNING id`;

      // 3. Incantesimi degli utenti
      const users = await sql`
        UPDATE spells s SET lingua = CASE
          WHEN (s.translations ? 'en') AND NOT (s.translations ? 'it') THEN 'it'
          WHEN (s.translations ? 'it') AND NOT (s.translations ? 'en') THEN 'en'
          ELSE COALESCE((SELECT u.default_locale FROM users u WHERE u.id = s.creator_id AND u.default_locale IN ('it', 'en')), 'it')
        END
        WHERE s.is_system = false AND s.lingua IS NULL
        RETURNING s.id`;

      console.log(`[migrate-0.21] ok: lingua impostata per ${srd.length} incantesimi SRD e ${users.length} incantesimi utente`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.21] ERRORE, build interrotto:", e);
  process.exit(1);
});
