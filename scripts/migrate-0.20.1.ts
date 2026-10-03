import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.20.1. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Allinea l'italiano degli incantesimi SRD al PDF ufficiale SRD 5.1 in italiano
// (scripts/srd-translations-it.json): per ogni incantesimo SRD sostituisce nome, descrizione
// e "ai livelli superiori" in translations.it. Gli altri campi di translations.it
// (es. material) e le altre lingue restano come sono. Gli incantesimi degli utenti non si toccano.
//
// In una transazione: o tutto o niente. È rilanciabile: riscrive sempre gli stessi testi.
// Se fallisce, fallisce il build: Vercel non pubblica la nuova versione e il database resta com'era.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type Entry = { nome: string; descrizione?: string; highLevel?: string };

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.20.1] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  // Nei controlli su GitHub il database è finto: si salta (su Vercel questa variabile non c'è)
  if (process.env.SKIP_DB_MIGRATIONS === "1") {
    console.log("[migrate-0.20.1] SKIP_DB_MIGRATIONS=1: migrazione saltata");
    return;
  }
  const file = JSON.parse(readFileSync(resolve("scripts/srd-translations-it.json"), "utf-8")) as Record<string, Entry | string>;
  // le chiavi che iniziano con "_" sono note sul file, non incantesimi
  const entries = Object.entries(file).filter((e): e is [string, Entry] => !e[0].startsWith("_"));

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      let updated = 0;
      const missing: string[] = [];
      for (const [nameEn, t] of entries) {
        // solo i campi presenti nel file (un null farebbe sparire il ripiego sul testo inglese)
        const it: Entry = { nome: t.nome };
        if (t.descrizione) it.descrizione = t.descrizione;
        if (t.highLevel) it.highLevel = t.highLevel;
        // jsonb: translations.it = (translations.it esistente) || (nuovi testi)
        const rows = await sql`
          UPDATE spells
          SET translations = jsonb_set(
            COALESCE(translations, '{}'::jsonb),
            '{it}',
            COALESCE(translations->'it', '{}'::jsonb) || ${sql.json(it)}
          )
          WHERE is_system = true AND nome = ${nameEn}
          RETURNING id`;
        if (rows.length) updated++;
        else missing.push(nameEn);
      }
      console.log(`[migrate-0.20.1] ok: italiano aggiornato per ${updated}/${entries.length} incantesimi SRD`);
      if (missing.length) console.log(`[migrate-0.20.1] incantesimi SRD non trovati nel database: ${missing.join(", ")}`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.20.1] ERRORE, build interrotto:", e);
  process.exit(1);
});
