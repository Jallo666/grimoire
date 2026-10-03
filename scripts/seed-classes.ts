import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classes, spellClasses, spells } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// Crea le 8 classi SRD (se non ci sono già) e collega gli incantesimi SRD alle loro classi,
// leggendo la vecchia colonna di testo spells.classi (es. "Bard, Wizard").
// Si può rilanciare senza problemi: non crea doppioni.
// Prima vanno create le tabelle: npx drizzle-kit push
// Uso: npx tsx scripts/seed-classes.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

// Nome inglese (come nei dati SRD) → traduzioni
const SRD_CLASSES: Record<string, { it: string; en: string }> = {
  Bard: { it: "Bardo", en: "Bard" },
  Cleric: { it: "Chierico", en: "Cleric" },
  Druid: { it: "Druido", en: "Druid" },
  Paladin: { it: "Paladino", en: "Paladin" },
  Ranger: { it: "Ranger", en: "Ranger" },
  Sorcerer: { it: "Stregone", en: "Sorcerer" },
  Warlock: { it: "Warlock", en: "Warlock" },
  Wizard: { it: "Mago", en: "Wizard" },
};

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // 1. Classi SRD
  const classIds = new Map<string, number>();
  for (const [nome, tr] of Object.entries(SRD_CLASSES)) {
    const [existing] = await db.select().from(classes)
      .where(and(eq(classes.isSystem, true), eq(classes.nome, nome))).limit(1);
    if (existing) {
      classIds.set(nome, existing.id);
      continue;
    }
    const [created] = await db.insert(classes).values({
      nome,
      translations: { it: { nome: tr.it }, en: { nome: tr.en } },
      isSystem: true,
      creatorId: null,
    }).returning({ id: classes.id });
    classIds.set(nome, created.id);
  }
  console.log(`Classi SRD: ${classIds.size}`);

  // 2. Collegamenti incantesimo ↔ classe dalla vecchia colonna di testo
  const rows = await db.select({ id: spells.id, classi: spells.classi }).from(spells).where(eq(spells.isSystem, true));
  let links = 0;
  for (const s of rows) {
    if (!s.classi) continue;
    const values = s.classi.split(",")
      .map((c) => classIds.get(c.trim()))
      .filter((id): id is number => id !== undefined)
      .map((classId) => ({ spellId: s.id, classId }));
    if (values.length === 0) continue;
    const inserted = await db.insert(spellClasses).values(values).onConflictDoNothing().returning({ spellId: spellClasses.spellId });
    links += inserted.length;
  }
  console.log(`Collegamenti incantesimo-classe creati: ${links} (su ${rows.length} incantesimi SRD)`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
