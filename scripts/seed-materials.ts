import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { spellMaterials, spells, items, materialOptions, materialIngredients } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// Crea i componenti materiali degli incantesimi SRD da scripts/srd-materials.json
// (testo inglese come testo originale, le altre lingue come traduzioni) con le loro opzioni e
// ingredienti (oggetti di srd-items.json: prima va lanciato seed-items.ts); quelli che ci sono
// vengono aggiornati ai dati del file. Si può rilanciare senza problemi: non crea doppioni.
// Di solito si lancia con tutti gli altri: npm run db:seed (oppure npm run db:setup da zero).
// Uso: npx tsx scripts/seed-materials.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdIngredient = { item: string; quantita: number; valoreMinimo?: number; consumato: boolean };
type SrdMaterial = {
  index: string;
  perBersaglio: boolean;
  translations: Record<string, { testo: string }>;
  opzioni?: { valoreTotaleMinimo?: number; ingredienti: SrdIngredient[] }[];
};
type SrdSpell = { index: string; name: string };

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const materials = (JSON.parse(readFileSync(resolve("scripts/srd-materials.json"), "utf-8")) as { materials: SrdMaterial[] }).materials;
  // index SRD → nome inglese, che è il "nome" degli incantesimi SRD nel database
  const srdSpells = (JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] }).spells;
  const nameByIndex = new Map(srdSpells.map((s) => [s.index, s.name]));

  // codice dell'oggetto → id
  const itemIds = new Map((await db.select({ id: items.id, codice: items.codice }).from(items)).map((i) => [i.codice, i.id]));

  let saved = 0;
  for (const m of materials) {
    const name = nameByIndex.get(m.index);
    const { en, ...others } = m.translations;
    if (!name || !en) continue;
    const [spell] = await db.select({ id: spells.id }).from(spells)
      .where(and(eq(spells.isSystem, true), eq(spells.nome, name))).limit(1);
    if (!spell) continue;
    const values = { testo: en.testo, translations: others, perBersaglio: m.perBersaglio };
    const [mat] = await db.insert(spellMaterials)
      .values({ spellId: spell.id, ...values })
      .onConflictDoUpdate({ target: spellMaterials.spellId, set: values })
      .returning({ id: spellMaterials.id });

    // opzioni e ingredienti: si riscrivono da capo
    const old = await db.select({ id: materialOptions.id }).from(materialOptions).where(eq(materialOptions.materialId, mat.id));
    if (old.length) await db.delete(materialIngredients).where(inArray(materialIngredients.optionId, old.map((o) => o.id)));
    await db.delete(materialOptions).where(eq(materialOptions.materialId, mat.id));
    let ordine = 1;
    for (const o of m.opzioni ?? []) {
      const [opt] = await db.insert(materialOptions)
        .values({ materialId: mat.id, ordine: ordine++, valoreTotaleMinimo: o.valoreTotaleMinimo ?? null })
        .returning({ id: materialOptions.id });
      await db.insert(materialIngredients).values(o.ingredienti.map((i) => {
        const itemId = itemIds.get(i.item);
        if (!itemId) throw new Error(`Oggetto "${i.item}" mancante: lancia prima seed-items.ts`);
        return { optionId: opt.id, itemId, quantita: i.quantita, valoreMinimo: i.valoreMinimo ?? null, consumato: i.consumato };
      }));
    }
    saved++;
  }
  console.log(`Materiali SRD: ${saved}/${materials.length}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
