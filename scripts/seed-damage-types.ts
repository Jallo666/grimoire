import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { spells } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

// Riempie la colonna tipi_danno degli incantesimi SRD già presenti nel database,
// leggendo i tipi di danno da scripts/srd-spells.json. Si può rilanciare senza problemi.
// Prima va creata la colonna: npx drizzle-kit push
// Uso: npx tsx scripts/seed-damage-types.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdSpell = {
  name: string;
  damage?: { damage_type?: { index: string } }[];
};

// Tipi di danno dell'incantesimo, senza doppioni (es. ["fire", "radiant"]); null se non fa danni
function damageTypes(s: SrdSpell): string[] | null {
  const types = [...new Set((s.damage ?? []).map((d) => d.damage_type?.index).filter((x): x is string => !!x))];
  return types.length ? types : null;
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const raw = JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] };
  let updated = 0;

  for (const s of raw.spells) {
    const types = damageTypes(s);
    if (!types) continue;
    const rows = await db.update(spells)
      .set({ tipiDanno: types })
      .where(and(eq(spells.isSystem, true), eq(spells.nome, s.name)))
      .returning({ id: spells.id });
    updated += rows.length;
    process.stdout.write(`\r${updated} incantesimi aggiornati`);
  }

  console.log(`\nFatto. Incantesimi SRD con tipo di danno: ${updated}`);
  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
