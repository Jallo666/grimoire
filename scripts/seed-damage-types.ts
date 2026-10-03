import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { damageTypes, spellDamageTypes, spells } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// Crea i tipi di danno SRD da scripts/srd-damage-types.json (se mancano, altrimenti ne aggiorna
// le traduzioni) e collega gli incantesimi SRD ai loro tipi di danno, leggendo da srd-spells.json.
// Si può rilanciare senza problemi: non crea doppioni.
// Prima: npx drizzle-kit push e npx tsx scripts/seed-spells.ts
// Uso: npx tsx scripts/seed-damage-types.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdDamageType = { name: string; translations: Record<string, { nome: string }> };
type SrdSpell = { name: string; damage?: { damage_type?: { name: string } }[] };

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // 1. Tipi di danno
  const srdTypes = (JSON.parse(readFileSync(resolve("scripts/srd-damage-types.json"), "utf-8")) as { damageTypes: SrdDamageType[] }).damageTypes;
  const typeIds = new Map<string, number>();
  for (const d of srdTypes) {
    const [existing] = await db.select().from(damageTypes)
      .where(and(eq(damageTypes.isSystem, true), eq(damageTypes.nome, d.name))).limit(1);
    if (existing) {
      await db.update(damageTypes).set({ translations: d.translations }).where(eq(damageTypes.id, existing.id));
      typeIds.set(d.name, existing.id);
    } else {
      const [created] = await db.insert(damageTypes)
        .values({ nome: d.name, translations: d.translations, isSystem: true })
        .returning({ id: damageTypes.id });
      typeIds.set(d.name, created.id);
    }
  }
  console.log(`Tipi di danno SRD: ${typeIds.size}`);

  // 2. Collegamenti incantesimo ↔ tipo di danno
  const srdSpells = (JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] }).spells;
  let links = 0;
  for (const s of srdSpells) {
    const ids = [...new Set((s.damage ?? []).map((d) => d.damage_type && typeIds.get(d.damage_type.name)).filter((id): id is number => !!id))];
    if (ids.length === 0) continue;
    const [spell] = await db.select({ id: spells.id }).from(spells)
      .where(and(eq(spells.isSystem, true), eq(spells.nome, s.name))).limit(1);
    if (!spell) continue;
    const inserted = await db.insert(spellDamageTypes)
      .values(ids.map((damageTypeId) => ({ spellId: spell.id, damageTypeId })))
      .onConflictDoNothing()
      .returning({ spellId: spellDamageTypes.spellId });
    links += inserted.length;
  }
  console.log(`Nuovi collegamenti incantesimo-tipo di danno: ${links}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
