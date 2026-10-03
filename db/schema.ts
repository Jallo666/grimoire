import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

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
  classi: text("classi"),
  sottoclassi: text("sottoclassi"),
  // Tipi di danno in inglese, come nei dati SRD (es. ["fire", "radiant"]); null = nessun danno
  tipiDanno: text("tipi_danno").array(),
  translations: jsonb("translations").$type<Record<string, { nome: string; descrizione?: string; highLevel?: string; material?: string }>>().default({}),
});

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
