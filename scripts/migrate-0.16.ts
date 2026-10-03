import { config } from "dotenv";
import postgres from "postgres";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.16.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Cancella la vecchia colonna spells.tipi_danno (dalla 0.15 i tipi di danno sono nella
// tabella spell_damage_types e il codice non la usa più).
//
// La vecchia colonna spells.classi NON si cancella qui: la versione 0.15, online durante
// il build, la legge ancora. Dalla 0.16 il codice non la usa più, quindi si cancella al
// push successivo.
//
// È rilanciabile (IF EXISTS). Se fallisce, fallisce il build e la versione online non cambia.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.16] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client`ALTER TABLE spells DROP COLUMN IF EXISTS tipi_danno`;
    console.log("[migrate-0.16] ok: colonna spells.tipi_danno cancellata (o già assente)");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.16] ERRORE, build interrotto:", e);
  process.exit(1);
});
