import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.22.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Fa (in una transazione: o tutto o niente):
//   1. crea, se mancano, le tabelle items, material_options, material_ingredients
//   2. oggetti SRD da scripts/srd-items.json: crea quelli che mancano, aggiorna gli altri (per "codice")
//   3. ingredienti dei materiali SRD da scripts/srd-materials.json ("opzioni"): per ogni materiale
//      SRD le opzioni vengono riscritte dai dati del file (gli utenti non possono modificarle)
//
// Non cancella colonne ed è rilanciabile. Se fallisce, fallisce il build: Vercel non pubblica la
// nuova versione e il database resta com'era. I nomi dei vincoli sono quelli di drizzle-kit.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type SrdItem = { index: string; name: string; categoria: string; translations: Record<string, { nome: string }> };
type SrdIngredient = { item: string; quantita: number; valoreMinimo?: number; consumato: boolean };
type SrdOption = { valoreTotaleMinimo?: number; ingredienti: SrdIngredient[] };
type SrdMaterial = { index: string; opzioni?: SrdOption[] };
type SrdSpell = { index: string; name: string };

const readJson = <T>(file: string) => JSON.parse(readFileSync(resolve(file), "utf-8")) as T;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.22] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  // Nei controlli su GitHub il database è finto: si salta (su Vercel questa variabile non c'è)
  if (process.env.SKIP_DB_MIGRATIONS === "1") {
    console.log("[migrate-0.22] SKIP_DB_MIGRATIONS=1: migrazione saltata");
    return;
  }
  // Su Vercel solo il build di produzione (main) tocca il database, non le anteprime dei branch
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    console.log(`[migrate-0.22] build ${process.env.VERCEL_ENV}: migrazione saltata (parte solo in produzione)`);
    return;
  }

  const srdItems = readJson<{ items: SrdItem[] }>("scripts/srd-items.json").items;
  const srdMaterials = readJson<{ materials: SrdMaterial[] }>("scripts/srd-materials.json").materials.filter((m) => m.opzioni?.length);
  const nameByIndex = new Map(readJson<{ spells: SrdSpell[] }>("scripts/srd-spells.json").spells.map((s) => [s.index, s.name]));

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      // 1. Tabelle
      await sql`
        CREATE TABLE IF NOT EXISTS items (
          id serial PRIMARY KEY,
          codice text CONSTRAINT items_codice_unique UNIQUE,
          nome text NOT NULL,
          translations jsonb DEFAULT '{}'::jsonb,
          categoria text,
          valore_base numeric(12, 2),
          peso numeric(10, 2),
          is_system boolean NOT NULL DEFAULT false,
          creator_id integer CONSTRAINT items_creator_id_users_id_fk REFERENCES users(id),
          created_at timestamp with time zone NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS material_options (
          id serial PRIMARY KEY,
          material_id integer NOT NULL CONSTRAINT material_options_material_id_spell_materials_id_fk REFERENCES spell_materials(id),
          ordine integer NOT NULL DEFAULT 1,
          valore_totale_minimo numeric(12, 2)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS material_ingredients (
          id serial PRIMARY KEY,
          option_id integer NOT NULL CONSTRAINT material_ingredients_option_id_material_options_id_fk REFERENCES material_options(id),
          item_id integer NOT NULL CONSTRAINT material_ingredients_item_id_items_id_fk REFERENCES items(id),
          quantita integer NOT NULL DEFAULT 1,
          valore_minimo numeric(12, 2),
          consumato boolean NOT NULL DEFAULT false
        )`;

      // 2. Oggetti SRD (nome inglese come nome originale, traduzioni dal file)
      const itemIds = new Map<string, number>();
      for (const it of srdItems) {
        const [row] = await sql<{ id: number }[]>`
          INSERT INTO items (codice, nome, translations, categoria, is_system)
          VALUES (${it.index}, ${it.name}, ${sql.json(it.translations)}, ${it.categoria}, true)
          ON CONFLICT (codice) DO UPDATE
            SET nome = EXCLUDED.nome, translations = EXCLUDED.translations, categoria = EXCLUDED.categoria, is_system = true
          RETURNING id`;
        itemIds.set(it.index, row.id);
      }

      // 3. Opzioni e ingredienti dei materiali SRD, riscritte dal file
      let materials = 0;
      const missing: string[] = [];
      for (const m of srdMaterials) {
        const [mat] = await sql<{ id: number }[]>`
          SELECT sm.id FROM spell_materials sm JOIN spells s ON s.id = sm.spell_id
          WHERE s.is_system = true AND s.nome = ${nameByIndex.get(m.index) ?? ""}`;
        if (!mat) { missing.push(m.index); continue; }
        await sql`DELETE FROM material_ingredients WHERE option_id IN (SELECT id FROM material_options WHERE material_id = ${mat.id})`;
        await sql`DELETE FROM material_options WHERE material_id = ${mat.id}`;
        let ordine = 1;
        for (const o of m.opzioni ?? []) {
          const [opt] = await sql<{ id: number }[]>`
            INSERT INTO material_options (material_id, ordine, valore_totale_minimo)
            VALUES (${mat.id}, ${ordine++}, ${o.valoreTotaleMinimo ?? null})
            RETURNING id`;
          for (const i of o.ingredienti) {
            const itemId = itemIds.get(i.item);
            if (!itemId) throw new Error(`oggetto sconosciuto "${i.item}" nel materiale ${m.index}`);
            await sql`
              INSERT INTO material_ingredients (option_id, item_id, quantita, valore_minimo, consumato)
              VALUES (${opt.id}, ${itemId}, ${i.quantita}, ${i.valoreMinimo ?? null}, ${i.consumato})`;
          }
        }
        materials++;
      }

      console.log(`[migrate-0.22] ok: ${itemIds.size} oggetti SRD, ingredienti per ${materials}/${srdMaterials.length} materiali SRD`);
      if (missing.length) console.log(`[migrate-0.22] materiali SRD non trovati nel database: ${missing.join(", ")}`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.22] ERRORE, build interrotto:", e);
  process.exit(1);
});
