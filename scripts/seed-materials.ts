import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { spellMaterials, spells } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// Crea i componenti materiali degli incantesimi SRD da scripts/srd-materials.json
// (testo inglese come testo originale, le altre lingue come traduzioni); quelli che ci sono
// vengono aggiornati ai dati del file. Si può rilanciare senza problemi: non crea doppioni.
// Di solito si lancia con tutti gli altri: npm run db:seed (oppure npm run db:setup da zero).
// Uso: npx tsx scripts/seed-materials.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdMaterial = { index: string; perBersaglio: boolean; translations: Record<string, { testo: string }> };
type SrdSpell = { index: string; name: string };

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const materials = (JSON.parse(readFileSync(resolve("scripts/srd-materials.json"), "utf-8")) as { materials: SrdMaterial[] }).materials;
  // index SRD → nome inglese, che è il "nome" degli incantesimi SRD nel database
  const srdSpells = (JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] }).spells;
  const nameByIndex = new Map(srdSpells.map((s) => [s.index, s.name]));

  let saved = 0;
  for (const m of materials) {
    const name = nameByIndex.get(m.index);
    const { en, ...others } = m.translations;
    if (!name || !en) continue;
    const [spell] = await db.select({ id: spells.id }).from(spells)
      .where(and(eq(spells.isSystem, true), eq(spells.nome, name))).limit(1);
    if (!spell) continue;
    const values = { testo: en.testo, translations: others, perBersaglio: m.perBersaglio };
    await db.insert(spellMaterials)
      .values({ spellId: spell.id, ...values })
      .onConflictDoUpdate({ target: spellMaterials.spellId, set: values });
    saved++;
  }
  console.log(`Materiali SRD: ${saved}/${materials.length}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
