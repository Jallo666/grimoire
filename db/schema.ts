import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  nome: text("nome"),
  passwordHash: text("password_hash").notNull(),
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

