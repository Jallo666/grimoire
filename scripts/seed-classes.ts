import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classes, spellClasses, spells } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// Crea le classi SRD da scripts/srd-classes.json (se mancano, altrimenti ne aggiorna le
// traduzioni) e collega gli incantesimi SRD alle loro classi, leggendo da srd-spells.json.
// Si può rilanciare senza problemi: non crea doppioni.
// Prima: npx drizzle-kit push e npx tsx scripts/seed-spells.ts
// Uso: npx tsx scripts/seed-classes.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdClass = { name: string; translations: Record<string, { nome: string }> };
type SrdSpell = { name: string; classes: { name: string }[] };

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // 1. Classi
  const srdClasses = (JSON.parse(readFileSync(resolve("scripts/srd-classes.json"), "utf-8")) as { classes: SrdClass[] }).classes;
  const classIds = new Map<string, number>();
  for (const c of srdClasses) {
    const [existing] = await db.select().from(classes)
      .where(and(eq(classes.isSystem, true), eq(classes.nome, c.name))).limit(1);
    if (existing) {
      await db.update(classes).set({ translations: c.translations }).where(eq(classes.id, existing.id));
      classIds.set(c.name, existing.id);
    } else {
      const [created] = await db.insert(classes)
        .values({ nome: c.name, translations: c.translations, isSystem: true })
        .returning({ id: classes.id });
      classIds.set(c.name, created.id);
    }
  }
  console.log(`Classi SRD: ${classIds.size}`);

  // 2. Collegamenti incantesimo ↔ classe
  const srdSpells = (JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] }).spells;
  let links = 0;
  for (const s of srdSpells) {
    const [spell] = await db.select({ id: spells.id }).from(spells)
      .where(and(eq(spells.isSystem, true), eq(spells.nome, s.name))).limit(1);
    if (!spell) continue;
    const values = s.classes
      .map((c) => classIds.get(c.name))
      .filter((id): id is number => id !== undefined)
      .map((classId) => ({ spellId: spell.id, classId }));
    if (values.length === 0) continue;
    const inserted = await db.insert(spellClasses).values(values).onConflictDoNothing().returning({ spellId: spellClasses.spellId });
    links += inserted.length;
  }
  console.log(`Nuovi collegamenti incantesimo-classe: ${links}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
