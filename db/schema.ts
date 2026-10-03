import { pgTable, serial, text, integer, boolean, timestamp, jsonb, primaryKey, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  nome: text("nome"),
  passwordHash: text("password_hash").notNull(),
  defaultTheme: text("default_theme"),
  defaultLocale: text("default_locale"),
  defaultUnitSystem: text("default_unit_system"),
  defaultCampaignLocale: text("default_campaign_locale"),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  stato: text("stato").notNull().default("attiva"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  unitaMisuraDefault: text("unita_misura_default").notNull().default("metri"),
  masterPuoModificarePersonaggi: boolean("master_puo_modificare_personaggi").notNull().default(true),
  ownerId: integer("owner_id").references(() => users.id),
});

export const campaignMembers = pgTable("campaign_members", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  userId: integer("user_id").references(() => users.id),
  ruolo: text("ruolo").notNull(),
});

export const spells = pgTable("spells", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id),
  nome: text("nome").notNull(),
  descrizione: text("descrizione"),
  scuola: text("scuola"),
  livello: integer("livello").notNull().default(1),
  tempoLancio: text("tempo_lancio"),
  gittata: text("gittata"),
  durata: text("durata"),
  componenti: text("componenti"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  concentration: boolean("concentration"),
  ritual: boolean("ritual"),
  higherLevel: text("higher_level"),
  sottoclassi: text("sottoclassi"),
  // lingua del testo principale ("it" / "en"): le altre lingue sono in "translations"
  lingua: text("lingua"),
  translations: jsonb("translations").$type<Record<string, { nome: string; descrizione?: string; highLevel?: string }>>().default({}),
});

// Componente materiale di un incantesimo (la "M"): uno per incantesimo.
// "testo" è la regola ufficiale nella lingua di creazione (SRD: inglese), le altre lingue in
// "translations" (es. { it: { testo: "…" } }). I dati SRD vengono da scripts/srd-materials.json.
// "perBersaglio": la quantità si moltiplica (per creatura, cadavere, Dado Vita…), i dettagli nel testo.
export const spellMaterials = pgTable("spell_materials", {
  id: serial("id").primaryKey(),
  spellId: integer("spell_id").references(() => spells.id).notNull().unique(),
  testo: text("testo").notNull(),
  translations: jsonb("translations").$type<Record<string, { testo: string }>>().default({}),
  perBersaglio: boolean("per_bersaglio").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Oggetti (es. Diamante): ingredienti dei componenti materiali, e in futuro dell'inventario.
// Quelli SRD (scripts/srd-items.json) sono di sistema, con "codice" = index del file;
// gli utenti possono crearne di loro. "nome" nella lingua di creazione (SRD: inglese), traduzioni in
// "translations". Valori in mo con i decimali (5 ma = 0.5): il front-end li mostra nella moneta adatta.
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  codice: text("codice").unique(),
  nome: text("nome").notNull(),
  translations: jsonb("translations").$type<Record<string, { nome: string }>>().default({}),
  categoria: text("categoria"),
  valoreBase: numeric("valore_base", { precision: 12, scale: 2, mode: "number" }),
  peso: numeric("peso", { precision: 10, scale: 2, mode: "number" }),
  isSystem: boolean("is_system").notNull().default(false),
  creatorId: integer("creator_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Alternative di un componente materiale ("acqua santa OPPURE polvere d'argento e ferro"): ne basta una.
// "valoreTotaleMinimo": valore minimo in mo sul totale degli ingredienti dell'opzione.
export const materialOptions = pgTable("material_options", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => spellMaterials.id).notNull(),
  ordine: integer("ordine").notNull().default(1),
  valoreTotaleMinimo: numeric("valore_totale_minimo", { precision: 12, scale: 2, mode: "number" }),
});

// Ingredienti di un'opzione: servono tutti insieme. "valoreMinimo" in mo, per pezzo.
export const materialIngredients = pgTable("material_ingredients", {
  id: serial("id").primaryKey(),
  optionId: integer("option_id").references(() => materialOptions.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantita: integer("quantita").notNull().default(1),
  valoreMinimo: numeric("valore_minimo", { precision: 12, scale: 2, mode: "number" }),
  consumato: boolean("consumato").notNull().default(false),
});

// Classi dei personaggi (es. Mago). Le 8 SRD (scripts/srd-classes.json) sono di sistema
// (isSystem, creatorId null); in futuro l'utente potrà crearne di sue. "nome" è in inglese come
// nei dati SRD ("Wizard"), le traduzioni in "translations" (es. { it: { nome: "Mago" } }).
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  translations: jsonb("translations").$type<Record<string, { nome: string }>>().default({}),
  isSystem: boolean("is_system").notNull().default(false),
  creatorId: integer("creator_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Collegamento incantesimo ↔ classe: un incantesimo può essere di più classi
export const spellClasses = pgTable("spell_classes", {
  spellId: integer("spell_id").references(() => spells.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
}, (t) => [primaryKey({ columns: [t.spellId, t.classId] })]);

// Tipi di danno (es. Fuoco). I 13 SRD (scripts/srd-damage-types.json) sono di sistema;
// stessa logica delle classi: "nome" in inglese ("Fire"), traduzioni in "translations".
export const damageTypes = pgTable("damage_types", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  translations: jsonb("translations").$type<Record<string, { nome: string }>>().default({}),
  isSystem: boolean("is_system").notNull().default(false),
  creatorId: integer("creator_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Collegamento incantesimo ↔ tipo di danno: un incantesimo può fare più tipi di danno
export const spellDamageTypes = pgTable("spell_damage_types", {
  spellId: integer("spell_id").references(() => spells.id).notNull(),
  damageTypeId: integer("damage_type_id").references(() => damageTypes.id).notNull(),
}, (t) => [primaryKey({ columns: [t.spellId, t.damageTypeId] })]);

export const spellGroups = pgTable("spell_groups", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  kind: text("kind"), // "generale" | "ufficiali" | null (custom)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSpellLibrary = pgTable("user_spell_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  spellId: integer("spell_id").references(() => spells.id).notNull(),
  groupId: integer("group_id").references(() => spellGroups.id),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

export const campaignSpellLibrary = pgTable("campaign_spell_library", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  spellId: integer("spell_id").references(() => spells.id).notNull(),
  sharedById: integer("shared_by_id").references(() => users.id).notNull(),
  sharedAt: timestamp("shared_at", { withTimezone: true }).defaultNow().notNull(),
});
