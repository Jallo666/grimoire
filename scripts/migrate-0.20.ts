import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.20.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Fa (in una transazione: o tutto o niente):
//   1. crea, se manca, la tabella spell_materials (componente materiale, uno per incantesimo)
//   2. materiali SRD da scripts/srd-materials.json (testo inglese + traduzione italiana):
//      crea quelli che mancano e aggiorna gli altri ai dati ufficiali
//   3. incantesimi creati dagli utenti: il testo tra parentesi in "componenti"
//      ("V, S, M (testo)") diventa il loro materiale, con le traduzioni salvate in
//      spells.translations[lingua].material. Quelli che hanno già un materiale non si toccano.
//
// Non cancella niente: "componenti" e spells.translations restano come sono, perché la versione
// online (0.19) li legge ancora durante il build, e per poter tornare indietro.
// È rilanciabile: non crea doppioni. Se fallisce, fallisce il build: Vercel non pubblica la
// nuova versione e il database resta com'era. I nomi dei vincoli sono quelli di drizzle-kit,
// così un futuro "drizzle-kit push" non vede differenze.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type SrdMaterial = { index: string; perBersaglio: boolean; translations: Record<string, { testo: string }> };
type SrdSpell = { index: string; name: string };
type SpellTranslations = Record<string, { material?: string }> | null;

const readJson = <T>(file: string) => JSON.parse(readFileSync(resolve(file), "utf-8")) as T;

// "V, S, M (un pizzico di sale)" → "un pizzico di sale" (dalla prima parentesi all'ultima)
function materialText(componenti: string) {
  const m = componenti.match(/\(([\s\S]*)\)\s*$/);
  return m ? m[1].trim() : "";
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.20] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  // Nei controlli su GitHub il database è finto: si salta (su Vercel questa variabile non c'è)
  if (process.env.SKIP_DB_MIGRATIONS === "1") {
    console.log("[migrate-0.20] SKIP_DB_MIGRATIONS=1: migrazione saltata");
    return;
  }
  const srdMaterials = readJson<{ materials: SrdMaterial[] }>("scripts/srd-materials.json").materials;
  // index SRD → nome inglese, che è il "nome" degli incantesimi SRD nel database
  const nameByIndex = new Map(readJson<{ spells: SrdSpell[] }>("scripts/srd-spells.json").spells.map((s) => [s.index, s.name]));

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      // 1. Tabella
      await sql`
        CREATE TABLE IF NOT EXISTS spell_materials (
          id serial PRIMARY KEY,
          spell_id integer NOT NULL CONSTRAINT spell_materials_spell_id_spells_id_fk REFERENCES spells(id),
          testo text NOT NULL,
          translations jsonb DEFAULT '{}'::jsonb,
          per_bersaglio boolean NOT NULL DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          CONSTRAINT spell_materials_spell_id_unique UNIQUE (spell_id)
        )`;

      // 2. Materiali SRD: testo inglese come testo originale, le altre lingue come traduzioni
      let srdCount = 0;
      const srdMissing: string[] = [];
      for (const m of srdMaterials) {
        const name = nameByIndex.get(m.index);
        const { en, ...others } = m.translations;
        if (!name || !en) { srdMissing.push(m.index); continue; }
        const rows = await sql`
          INSERT INTO spell_materials (spell_id, testo, translations, per_bersaglio)
          SELECT id, ${en.testo}, ${sql.json(others)}, ${m.perBersaglio}
          FROM spells WHERE is_system = true AND nome = ${name}
          ON CONFLICT (spell_id) DO UPDATE
            SET testo = EXCLUDED.testo, translations = EXCLUDED.translations, per_bersaglio = EXCLUDED.per_bersaglio
          RETURNING id`;
        if (rows.length) srdCount++;
        else srdMissing.push(m.index);
      }

      // 3. Incantesimi degli utenti con un testo tra parentesi e ancora senza materiale
      const userSpells = await sql<{ id: number; componenti: string; translations: SpellTranslations }[]>`
        SELECT s.id, s.componenti, s.translations FROM spells s
        WHERE s.is_system = false AND s.componenti LIKE '%(%'
          AND NOT EXISTS (SELECT 1 FROM spell_materials m WHERE m.spell_id = s.id)`;
      let userCount = 0;
      const userSkipped: number[] = [];
      for (const s of userSpells) {
        const testo = materialText(s.componenti);
        const hasM = s.componenti.replace(/\([\s\S]*\)/, "").split(",").map((p) => p.trim()).includes("M");
        if (!testo || !hasM) { userSkipped.push(s.id); continue; }
        const translations: Record<string, { testo: string }> = {};
        for (const [locale, t] of Object.entries(s.translations ?? {})) {
          if (t?.material?.trim()) translations[locale] = { testo: t.material.trim() };
        }
        await sql`
          INSERT INTO spell_materials (spell_id, testo, translations)
          VALUES (${s.id}, ${testo}, ${sql.json(translations)})
          ON CONFLICT (spell_id) DO NOTHING`;
        userCount++;
      }

      console.log(`[migrate-0.20] ok: ${srdCount}/${srdMaterials.length} materiali SRD, ${userCount} materiali di incantesimi utente`);
      if (srdMissing.length) console.log(`[migrate-0.20] materiali SRD senza incantesimo nel database: ${srdMissing.join(", ")}`);
      if (userSkipped.length) console.log(`[migrate-0.20] incantesimi utente con parentesi ma senza materiale riconoscibile (id): ${userSkipped.join(", ")}`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.20] ERRORE, build interrotto:", e);
  process.exit(1);
});
