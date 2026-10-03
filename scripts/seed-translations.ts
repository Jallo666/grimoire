/**
 * Importa le traduzioni da scripts/srd-translations-it.json nel DB.
 * Fa match per nome inglese (spell.nome) — aggiorna solo le spell SRD (isSystem=true).
 *
 * Di solito si lancia con tutti gli altri: npm run db:seed (oppure npm run db:setup da zero).
 * Da solo: npx tsx scripts/seed-translations.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { spells } from "@/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const INPUT = path.join(__dirname, "srd-translations-it.json");

type TranslationEntry = { nome: string; descrizione?: string; highLevel?: string; material?: string };
type TranslationsFile = Record<string, TranslationEntry>;

async function main() {
  const raw = fs.readFileSync(INPUT, "utf-8");
  const data = JSON.parse(raw) as TranslationsFile;

  const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  console.log(`Trovate ${entries.length} traduzioni nel file\n`);

  let updated = 0;
  let notFound = 0;

  for (const [nameEn, trans] of entries) {
    const [spell] = await db
      .select()
      .from(spells)
      .where(and(eq(spells.nome, nameEn), eq(spells.isSystem, true)))
      .limit(1);

    if (!spell) {
      console.log(`  NON TROVATO: ${nameEn}`);
      notFound++;
      continue;
    }

    const existing = (spell.translations ?? {}) as Record<string, TranslationEntry>;
    // il materiale tradotto (se c'è) si conserva: i testi del file sostituiscono il resto
    const merged = { ...existing, it: { ...existing.it, nome: trans.nome, descrizione: trans.descrizione ?? undefined, highLevel: trans.highLevel ?? undefined } };
    await db.update(spells).set({ translations: merged }).where(eq(spells.id, spell.id));
    updated++;
    process.stdout.write(`  ✓ ${nameEn} → ${trans.nome}\n`);
  }

  console.log(`\nAggiornati: ${updated}, Non trovati: ${notFound}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
