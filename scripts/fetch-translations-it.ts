/**
 * Scarica le traduzioni italiane degli incantesimi SRD da dungeonedraghi.it
 * e genera scripts/srd-translations-it.json.
 *
 * I dati sono basati sull'SRD 5.1 ufficiale in italiano:
 * © Wizards of the Coast LLC — CC BY 4.0
 * https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_IT.pdf
 *
 * Uso: npx ts-node -r tsconfig-paths/register scripts/fetch-translations-it.ts
 */

import * as fs from "fs";
import * as path from "path";

const BASE = "https://dungeonedraghi.it/compendio/incantesimi";
const OUTPUT = path.join(__dirname, "srd-translations-it.json");
const DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractText(html: string, afterTag: string): string {
  const idx = html.indexOf(afterTag);
  if (idx === -1) return "";
  const after = html.slice(idx + afterTag.length);
  const match = after.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!match) return "";
  return match[1].replace(/<[^>]+>/g, "").trim();
}

function extractAllParagraphs(html: string, afterTag: string, stopTag: string): string {
  const idx = html.indexOf(afterTag);
  if (idx === -1) return "";
  const stopIdx = html.indexOf(stopTag, idx + afterTag.length);
  const section = stopIdx === -1 ? html.slice(idx + afterTag.length) : html.slice(idx + afterTag.length, stopIdx);
  return section
    .match(/<p[^>]*>([\s\S]*?)<\/p>/g)
    ?.map((p) => p.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n\n") ?? "";
}

async function fetchSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  while (true) {
    const url = page === 1 ? `${BASE}/` : `${BASE}/page/${page}/`;
    console.log(`  lista pagina ${page}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) break;
    const html = await res.text();
    const found = [...html.matchAll(/href="\/compendio\/incantesimi\/([^\/\?"]+)\/"/g)]
      .map((m) => m[1])
      .filter((s) => s !== "page" && !s.startsWith("categoria"));
    if (found.length === 0) break;
    slugs.push(...found);
    page++;
    await sleep(DELAY_MS);
  }
  return [...new Set(slugs)];
}

async function fetchDetail(slug: string): Promise<{ nameEn: string; nameIt: string; descrizione: string } | null> {
  const res = await fetch(`${BASE}/${slug}/`);
  if (!res.ok) return null;
  const html = await res.text();

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const nameIt = h1 ? h1[1].trim() : "";

  const nameEn = extractText(html, "<h4>Nome Inglese</h4>");
  const descrizione = extractAllParagraphs(html, "<h3>Effetto</h3>", "<h3>");

  return { nameEn, nameIt, descrizione };
}

async function main() {
  console.log("Recupero lista incantesimi...");
  const slugs = await fetchSlugs();
  console.log(`Trovati ${slugs.length} slug\n`);

  const result: Record<string, unknown> = {
    _source: "D&D 5e SRD 5.1 in italiano © Wizards of the Coast LLC — CC BY 4.0 — https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_IT.pdf",
  };

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    process.stdout.write(`[${i + 1}/${slugs.length}] ${slug} ... `);
    const detail = await fetchDetail(slug);
    if (detail?.nameEn) {
      result[detail.nameEn] = { nome: detail.nameIt, descrizione: detail.descrizione };
      console.log(`→ ${detail.nameIt}`);
    } else {
      console.log("skip (no nome inglese)");
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf-8");
  const count = Object.keys(result).length - 1; // escludi _source
  console.log(`\nSalvate ${count} traduzioni in ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
