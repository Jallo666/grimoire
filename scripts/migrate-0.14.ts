import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.14.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Fa (in una transazione: o tutto o niente):
//   1. aggiunge la colonna spells.tipi_danno e le tabelle classes e spell_classes
//   2. riempie i tipi di danno degli incantesimi SRD (da scripts/srd-spells.json)
//   3. crea le 8 classi SRD con traduzioni e collega gli incantesimi alle loro classi
//      (leggendo la vecchia colonna di testo spells.classi, es. "Bard, Wizard")
//
// È rilanciabile: se tabelle, colonna, classi o collegamenti ci sono già, non fa doppioni.
// Se fallisce, fallisce il build: Vercel non pubblica la nuova versione e il database resta com'era.
// I nomi dei vincoli sono quelli che userebbe drizzle-kit, così un futuro "drizzle-kit push"
// non vede differenze.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type SrdSpell = { name: string; damage?: { damage_type?: { index: string } }[] };

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
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.14] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  const client = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    await client.begin(async (sql) => {
      // 1. Struttura
      await sql`ALTER TABLE spells ADD COLUMN IF NOT EXISTS tipi_danno text[]`;
      await sql`
        CREATE TABLE IF NOT EXISTS classes (
          id serial PRIMARY KEY,
          nome text NOT NULL,
          translations jsonb DEFAULT '{}'::jsonb,
          is_system boolean NOT NULL DEFAULT false,
          creator_id integer CONSTRAINT classes_creator_id_users_id_fk REFERENCES users(id),
          created_at timestamp with time zone NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS spell_classes (
          spell_id integer NOT NULL CONSTRAINT spell_classes_spell_id_spells_id_fk REFERENCES spells(id),
          class_id integer NOT NULL CONSTRAINT spell_classes_class_id_classes_id_fk REFERENCES classes(id),
          CONSTRAINT spell_classes_spell_id_class_id_pk PRIMARY KEY (spell_id, class_id)
        )`;

      // 2. Tipi di danno degli incantesimi SRD
      const raw = JSON.parse(readFileSync(resolve("scripts/srd-spells.json"), "utf-8")) as { spells: SrdSpell[] };
      let damaged = 0;
      for (const s of raw.spells) {
        const types = [...new Set((s.damage ?? []).map((d) => d.damage_type?.index).filter((x): x is string => !!x))];
        if (types.length === 0) continue;
        const rows = await sql`
          UPDATE spells SET tipi_danno = ${sql.array(types)}
          WHERE is_system = true AND nome = ${s.name}
          RETURNING id`;
        damaged += rows.length;
      }

      // 3. Classi SRD (solo quelle che mancano) e collegamenti
      for (const [nome, tr] of Object.entries(SRD_CLASSES)) {
        await sql`
          INSERT INTO classes (nome, translations, is_system)
          SELECT ${nome}, ${sql.json({ it: { nome: tr.it }, en: { nome: tr.en } })}, true
          WHERE NOT EXISTS (SELECT 1 FROM classes WHERE is_system = true AND nome = ${nome})`;
      }
      // "Bard, Wizard" contiene ", Wizard, " se lo si racchiude tra ", " e ", "
      const links = await sql`
        INSERT INTO spell_classes (spell_id, class_id)
        SELECT s.id, c.id
        FROM spells s
        JOIN classes c ON c.is_system = true AND (', ' || s.classi || ', ') LIKE ('%, ' || c.nome || ', %')
        WHERE s.is_system = true AND s.classi IS NOT NULL
        ON CONFLICT DO NOTHING
        RETURNING spell_id`;

      console.log(`[migrate-0.14] ok: ${damaged} incantesimi con tipo di danno, ${links.length} nuovi collegamenti incantesimo-classe`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.14] ERRORE, build interrotto:", e);
  process.exit(1);
});
