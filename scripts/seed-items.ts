import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { items } from "@/db/schema";
import { readFileSync } from "fs";
import { resolve } from "path";

// Crea gli oggetti SRD da scripts/srd-items.json (se mancano, altrimenti li aggiorna, per "codice").
// Vanno caricati prima dei materiali (seed-materials.ts), che li usano come ingredienti.
// Si può rilanciare senza problemi: non crea doppioni.
// Di solito si lancia con tutti gli altri: npm run db:seed (oppure npm run db:setup da zero).
// Uso: npx tsx scripts/seed-items.ts

// dotenv must run before we create the postgres client
config({ path: ".env.local" });

type SrdItem = { index: string; name: string; categoria: string; translations: Record<string, { nome: string }> };

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const srdItems = (JSON.parse(readFileSync(resolve("scripts/srd-items.json"), "utf-8")) as { items: SrdItem[] }).items;
  for (const it of srdItems) {
    const values = { nome: it.name, translations: it.translations, categoria: it.categoria, isSystem: true };
    await db.insert(items).values({ codice: it.index, ...values })
      .onConflictDoUpdate({ target: items.codice, set: values });
  }
  console.log(`Oggetti SRD: ${srdItems.length}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
