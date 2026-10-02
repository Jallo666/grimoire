CREATE TABLE "campaign_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"user_id" integer,
	"ruolo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_spell_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"spell_id" integer NOT NULL,
	"shared_by_id" integer NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descrizione" text,
	"stato" text DEFAULT 'attiva' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unita_misura_default" text DEFAULT 'metri' NOT NULL,
	"master_puo_modificare_personaggi" boolean DEFAULT true NOT NULL,
	"owner_id" integer
);
--> statement-breakpoint
CREATE TABLE "spells" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"nome" text NOT NULL,
	"descrizione" text,
	"scuola" text,
	"livello" integer DEFAULT 1 NOT NULL,
	"tempo_lancio" text,
	"gittata" text,
	"durata" text,
	"componenti" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_spell_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spell_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text,
	"password_hash" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spell_library" ADD CONSTRAINT "campaign_spell_library_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spell_library" ADD CONSTRAINT "campaign_spell_library_spell_id_spells_id_fk" FOREIGN KEY ("spell_id") REFERENCES "public"."spells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spell_library" ADD CONSTRAINT "campaign_spell_library_shared_by_id_users_id_fk" FOREIGN KEY ("shared_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spells" ADD CONSTRAINT "spells_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spell_library" ADD CONSTRAINT "user_spell_library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_spell_library" ADD CONSTRAINT "user_spell_library_spell_id_spells_id_fk" FOREIGN KEY ("spell_id") REFERENCES "public"."spells"("id") ON DELETE no action ON UPDATE no action;