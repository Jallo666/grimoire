import { config } from "dotenv";
import postgres from "postgres";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.21.1. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Pulizia dopo il passaggio dei materiali a spell_materials (0.20). In una transazione:
//   1. rete di sicurezza: un incantesimo con "V, S, M (testo)" ancora senza materiale lo riceve
//      (con le traduzioni salvate in spells.translations[lingua].material)
//   2. "componenti" resta con le sole lettere: "V, S, M (testo)" → "V, S, M"
//   3. le vecchie copie del materiale tradotto (spells.translations[lingua].material) si tolgono
//
// Non tocca colonne (nessuna cancellata) ed è rilanciabile: la seconda volta non trova niente da fare.
// Se fallisce, fallisce il build: Vercel non pubblica la nuova versione e il database resta com'era.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type SpellTranslations = Record<string, { material?: string }> | null;

// "V, S, M (un pizzico di sale)" → "un pizzico di sale" (dalla prima parentesi all'ultima)
function materialText(componenti: string) {
  const m = componenti.match(/\(([\s\S]*)\)\s*$/);
  return m ? m[1].trim() : "";
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.21.1] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  // Nei controlli su GitHub il database è finto: si salta (su Vercel questa variabile non c'è)
  if (process.env.SKIP_DB_MIGRATIONS === "1") {
    console.log("[migrate-0.21.1] SKIP_DB_MIGRATIONS=1: migrazione saltata");
    return;
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      // 1. Materiali rimasti solo nella colonna
      const orphans = await sql<{ id: number; componenti: string; translations: SpellTranslations }[]>`
        SELECT s.id, s.componenti, s.translations FROM spells s
        WHERE s.componenti LIKE '%(%'
          AND NOT EXISTS (SELECT 1 FROM spell_materials m WHERE m.spell_id = s.id)`;
      let rescued = 0;
      for (const s of orphans) {
        const testo = materialText(s.componenti);
        if (!testo) continue;
        const translations: Record<string, { testo: string }> = {};
        for (const [locale, t] of Object.entries(s.translations ?? {})) {
          if (t?.material?.trim()) translations[locale] = { testo: t.material.trim() };
        }
        await sql`
          INSERT INTO spell_materials (spell_id, testo, translations)
          VALUES (${s.id}, ${testo}, ${sql.json(translations)})
          ON CONFLICT (spell_id) DO NOTHING`;
        rescued++;
      }

      // 2. Solo lettere nella colonna (in PostgreSQL "." prende anche gli a capo)
      const stripped = await sql`
        UPDATE spells SET componenti = NULLIF(trim(regexp_replace(componenti, '\\s*\\(.*\\)\\s*$', '')), '')
        WHERE componenti LIKE '%(%'
        RETURNING id`;

      // 3. Via le vecchie copie del materiale tradotto
      const cleaned = await sql`
        UPDATE spells
        SET translations = (SELECT jsonb_object_agg(key, value - 'material') FROM jsonb_each(translations))
        WHERE jsonb_typeof(translations) = 'object' AND translations::text LIKE '%"material"%'
        RETURNING id`;

      console.log(`[migrate-0.21.1] ok: ${rescued} materiali recuperati, ${stripped.length} colonne componenti pulite, ` +
        `${cleaned.length} traduzioni senza più la vecchia copia del materiale`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.21.1] ERRORE, build interrotto:", e);
  process.exit(1);
});
