import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Migrazione TEMPORANEA per la versione 0.15.0. Parte da sola durante il build
// ("build" in package.json) e va tolta al push successivo, insieme alla riga nel build.
//
// Fa (in una transazione: o tutto o niente):
//   1. crea, se mancano, le tabelle classes / spell_classes e damage_types / spell_damage_types
//   2. classi SRD da scripts/srd-classes.json e tipi di danno SRD da scripts/srd-damage-types.json:
//      crea quelli che mancano e aggiorna le traduzioni di quelli che ci sono
//   3. collega gli incantesimi SRD alle loro classi e ai loro tipi di danno (da srd-spells.json)
//
// È rilanciabile: non crea doppioni. Se fallisce, fallisce il build: Vercel non pubblica la
// nuova versione e il database resta com'era. I nomi dei vincoli sono quelli di drizzle-kit,
// così un futuro "drizzle-kit push" non vede differenze.
// La vecchia colonna spells.tipi_danno (0.14) non si tocca qui: la usa ancora la versione online
// durante il build. Si toglierà più avanti insieme a spells.classi.
// ─────────────────────────────────────────────────────────────────────────────

// in locale legge .env.local; su Vercel DATABASE_URL arriva dalle variabili d'ambiente
config({ path: ".env.local" });

type Tag = { name: string; translations: Record<string, { nome: string }> };
type SrdSpell = { name: string; classes: { name: string }[]; damage?: { damage_type?: { name: string } }[] };

const readJson = <T>(file: string) => JSON.parse(readFileSync(resolve(file), "utf-8")) as T;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate-0.15] DATABASE_URL non impostata: migrazione saltata");
    return;
  }
  const srdClasses = readJson<{ classes: Tag[] }>("scripts/srd-classes.json").classes;
  const srdDamageTypes = readJson<{ damageTypes: Tag[] }>("scripts/srd-damage-types.json").damageTypes;
  const srdSpells = readJson<{ spells: SrdSpell[] }>("scripts/srd-spells.json").spells;

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await client.begin(async (sql) => {
      // 1. Tabelle
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
      await sql`
        CREATE TABLE IF NOT EXISTS damage_types (
          id serial PRIMARY KEY,
          nome text NOT NULL,
          translations jsonb DEFAULT '{}'::jsonb,
          is_system boolean NOT NULL DEFAULT false,
          creator_id integer CONSTRAINT damage_types_creator_id_users_id_fk REFERENCES users(id),
          created_at timestamp with time zone NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS spell_damage_types (
          spell_id integer NOT NULL CONSTRAINT spell_damage_types_spell_id_spells_id_fk REFERENCES spells(id),
          damage_type_id integer NOT NULL CONSTRAINT spell_damage_types_damage_type_id_damage_types_id_fk REFERENCES damage_types(id),
          CONSTRAINT spell_damage_types_spell_id_damage_type_id_pk PRIMARY KEY (spell_id, damage_type_id)
        )`;

      // 2. Classi e tipi di danno SRD: crea quelli che mancano, aggiorna le traduzioni degli altri
      for (const c of srdClasses) {
        const tr = sql.json(c.translations);
        const updated = await sql`UPDATE classes SET translations = ${tr} WHERE is_system = true AND nome = ${c.name} RETURNING id`;
        if (updated.length === 0) await sql`INSERT INTO classes (nome, translations, is_system) VALUES (${c.name}, ${tr}, true)`;
      }
      for (const d of srdDamageTypes) {
        const tr = sql.json(d.translations);
        const updated = await sql`UPDATE damage_types SET translations = ${tr} WHERE is_system = true AND nome = ${d.name} RETURNING id`;
        if (updated.length === 0) await sql`INSERT INTO damage_types (nome, translations, is_system) VALUES (${d.name}, ${tr}, true)`;
      }

      // 3. Collegamenti degli incantesimi SRD
      let classLinks = 0;
      let damageLinks = 0;
      for (const s of srdSpells) {
        const classNames = s.classes.map((c) => c.name);
        if (classNames.length) {
          const rows = await sql`
            INSERT INTO spell_classes (spell_id, class_id)
            SELECT sp.id, c.id FROM spells sp
            JOIN classes c ON c.is_system = true AND c.nome = ANY(${sql.array(classNames)})
            WHERE sp.is_system = true AND sp.nome = ${s.name}
            ON CONFLICT DO NOTHING
            RETURNING spell_id`;
          classLinks += rows.length;
        }
        const damageNames = [...new Set((s.damage ?? []).map((d) => d.damage_type?.name).filter((x): x is string => !!x))];
        if (damageNames.length) {
          const rows = await sql`
            INSERT INTO spell_damage_types (spell_id, damage_type_id)
            SELECT sp.id, d.id FROM spells sp
            JOIN damage_types d ON d.is_system = true AND d.nome = ANY(${sql.array(damageNames)})
            WHERE sp.is_system = true AND sp.nome = ${s.name}
            ON CONFLICT DO NOTHING
            RETURNING spell_id`;
          damageLinks += rows.length;
        }
      }

      console.log(`[migrate-0.15] ok: ${srdClasses.length} classi, ${srdDamageTypes.length} tipi di danno, ` +
        `${classLinks} nuovi collegamenti incantesimo-classe, ${damageLinks} nuovi collegamenti incantesimo-danno`);
    });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[migrate-0.15] ERRORE, build interrotto:", e);
  process.exit(1);
});
