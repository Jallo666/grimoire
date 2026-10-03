import { config } from "dotenv";
import postgres from "postgres";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.17.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Cancella la vecchia colonna di testo spells.classi (es. "Bard, Wizard"): dalla 0.14 le
// classi sono nella tabella spell_classes e dalla 0.16 il codice non la usa più.
// Con questa si chiude la pulizia del database iniziata nella 0.16.
//
// È rilanciabile (IF EXISTS). Se fallisce, fallisce il build e la versione online non cambia.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.17] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client`ALTER TABLE spells DROP COLUMN IF EXISTS classi`;
    console.log("[migrate-0.17] ok: colonna spells.classi cancellata (o già assente)");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.17] ERRORE, build interrotto:", e);
  process.exit(1);
});
