import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { spells } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdSpell = {
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  concentration: boolean;
  ritual: boolean;
  desc: string[];
  higher_level?: string[];
  classes: { name: string }[];
  subclasses?: { name: string }[];
};

const SCHOOL_MAP: Record<string, string> = {
  Abjuration: "Abiurazione",
  Conjuration: "Evocazione",
  Divination: "Divinazione",
  Enchantment: "Ammaliamento",
  Evocation: "Invocazione",
  Illusion: "Illusione",
  Necromancy: "Necromanzia",
  Transmutation: "Trasmutazione",
};

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const raw = JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] };
  const srdSpells = raw.spells;
  console.log(`Seeding ${srdSpells.length} SRD spells...`);

  const existing = await db.select({ nome: spells.nome }).from(spells).where(eq(spells.isSystem, true));
  const existingNames = new Set(existing.map((s) => s.nome));

  let inserted = 0;
  let skipped = 0;

  for (const s of srdSpells) {
    if (existingNames.has(s.name)) { skipped++; continue; }
    // solo le lettere: il testo del materiale va in spell_materials (seed-materials.ts)
    const componenti = s.components.join(", ");
    await db.insert(spells).values({
      nome: s.name,
      scuola: SCHOOL_MAP[s.school.name] ?? s.school.name,
      livello: s.level,
      tempoLancio: s.casting_time,
      gittata: s.range,
      durata: s.duration,
      componenti,
      descrizione: s.desc.join("\n\n"),
      higherLevel: s.higher_level?.join("\n\n") ?? null,
      concentration: s.concentration,
      ritual: s.ritual,
      sottoclassi: s.subclasses?.map((c) => c.name).join(", ") || null,
      isSystem: true,
      creatorId: null,
      lingua: "en",
    });
    inserted++;
    process.stdout.write(`\r${inserted + skipped}/${srdSpells.length}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, skipped: ${skipped}`);
  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
