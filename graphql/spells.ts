import { gql } from "graphql-tag";
import { eq, and, or, ilike, isNull, inArray } from "drizzle-orm";
import { db } from "@/db";
import { spells, userSpellLibrary, campaignSpellLibrary, campaignMembers, spellGroups, classes, spellClasses, damageTypes, spellDamageTypes, spellMaterials } from "@/db/schema";
import { assertAuthenticated } from "./permissions";
import { getOrCreateGroup } from "./spellGroups";
import type { Context } from "./context";
import { appError } from "./errors";

export const spellTypeDefs = gql`
  type SpellTranslation {
    locale: String!
    nome: String!
    descrizione: String
    highLevel: String
    material: String
  }

  type Spell {
    id: ID!
    nome: String!
    descrizione: String
    scuola: String
    livello: Int!
    tempoLancio: String
    gittata: String
    durata: String
    componenti: String
    higherLevel: String
    concentration: Boolean
    ritual: Boolean
    # locale facoltativo: lingua dei nomi di classi e tipi di danno, se diversa da quella della query
    classi(locale: String): [SpellClass!]!
    sottoclassi: String
    tipiDanno(locale: String): [DamageType!]!
    creatorId: Int
    createdAt: String!
    isOwner: Boolean!
    isSystem: Boolean!
    inLibrary: Boolean!
    groupId: ID
    groupNome: String
    translations: [SpellTranslation!]!
    # componente materiale (solo se ha la "M" e un testo)
    materiale: SpellMaterial
  }

  # Componente materiale: testo nella lingua di creazione, le altre lingue in translations
  type SpellMaterial {
    testo: String!
    perBersaglio: Boolean!
    translations: [SpellMaterialTranslation!]!
  }

  type SpellMaterialTranslation {
    locale: String!
    testo: String!
  }

  # Classe di un personaggio (es. Mago), con il nome già tradotto nella lingua richiesta
  type SpellClass {
    id: ID!
    nome: String!
  }

  # Tipo di danno (es. Fuoco), con il nome già tradotto nella lingua richiesta
  type DamageType {
    id: ID!
    nome: String!
  }

  type Query {
    spellClasses(locale: String): [SpellClass!]!
    damageTypes(locale: String): [DamageType!]!
    mySpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, groupIds: [ID!], locale: String): [Spell!]!
    spell(id: ID!, locale: String): Spell
    srdSpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    allSpells(search: String, scuole: [String!], livelli: [Int!], classi: [ID!], tipiDanno: [ID!], concentration: Boolean, ritual: Boolean, locale: String): [Spell!]!
    campaignSpells(campaignId: ID!): [Spell!]!
  }

  type Mutation {
    upsertSpellTranslation(spellId: ID!, locale: String!, nome: String!, descrizione: String, highLevel: String, material: String): Spell!

    createSpell(
      nome: String!
      descrizione: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
      higherLevel: String
      # testo del componente materiale (vale solo se componenti ha la "M")
      materiale: String
      materialePerBersaglio: Boolean
      groupId: ID
      translationLocale: String
      translationNome: String
      translationDescrizione: String
      translationHigherLevel: String
      translationMateriale: String
      classIds: [ID!]
      damageTypeIds: [ID!]
    ): Spell!

    updateSpell(
      id: ID!
      nome: String
      descrizione: String
      higherLevel: String
      scuola: String
      livello: Int
      tempoLancio: String
      gittata: String
      durata: String
      componenti: String
      materiale: String
      materialePerBersaglio: Boolean
      # se passati, sostituiscono classi e tipi di danno dell'incantesimo
      classIds: [ID!]
      damageTypeIds: [ID!]
    ): Spell!

    deleteSpell(id: ID!): Boolean!

    addSrdSpellToLibrary(spellId: ID!, groupId: ID): Boolean!
    removeSrdSpellFromLibrary(spellId: ID!): Boolean!

    # Operazioni in blocco: restituiscono quanti incantesimi sono stati davvero cambiati
    addSrdSpellsToLibrary(spellIds: [ID!]!, groupId: ID): Int!
    removeSrdSpellsFromLibrary(spellIds: [ID!]!): Int!
    deleteSpells(ids: [ID!]!): Int!
    shareSpellWithUser(spellId: ID!, email: String!): Boolean!
    shareSpellWithCampaign(spellId: ID!, campaignId: ID!): Boolean!
    removeSpellFromCampaign(spellId: ID!, campaignId: ID!): Boolean!
  }
`;

async function getSpellOrThrow(spellId: number) {
  const [spell] = await db.select().from(spells).where(eq(spells.id, spellId)).limit(1);
  if (!spell) throw appError("SPELL_NOT_FOUND");
  return spell;
}

type TranslationsMap = Record<string, { nome: string; descrizione?: string; highLevel?: string; material?: string }>;

function toGql(
  spell: typeof spells.$inferSelect,
  userId: number | null,
  inLibrary: boolean,
  groupId?: number | null,
  groupNome?: string | null,
  locale?: string | null
) {
  const map = (spell.translations ?? {}) as TranslationsMap;
  const t = locale ? map[locale] : undefined;
  const translations = Object.entries(map).map(([l, v]) => ({
    locale: l,
    nome: v.nome,
    descrizione: v.descrizione ?? null,
    highLevel: v.highLevel ?? null,
    material: v.material ?? null,
  }));
  return {
    ...spell,
    // solo le lettere (V, S, M): il testo del materiale arriva da "materiale"
    componenti: componentLetters(spell.componenti),
    _componentiColonna: spell.componenti,
    nome: t?.nome ?? spell.nome,
    descrizione: t?.descrizione ?? spell.descrizione,
    higherLevel: (t?.highLevel ?? spell.higherLevel) || null,
    createdAt: spell.createdAt.toISOString(),
    isOwner: spell.creatorId != null && spell.creatorId === userId,
    isSystem: spell.isSystem,
    inLibrary,
    groupId: groupId ?? null,
    groupNome: groupNome ?? null,
    translations,
    // classi e tipi di danno li aggiunge withTags (liste) o i resolver Spell.* (singolo incantesimo)
    classi: undefined as TagGql[] | undefined,
    tipiDanno: undefined as TagGql[] | undefined,
    _locale: locale ?? null,
  };
}

// Filtri per classe e per tipo di danno: l'incantesimo è collegato ad almeno uno degli id scelti
function classiCondition(classIds: string[]) {
  return inArray(
    spells.id,
    db.select({ id: spellClasses.spellId }).from(spellClasses).where(inArray(spellClasses.classId, classIds.map(Number)))
  );
}

function tipiDannoCondition(damageTypeIds: string[]) {
  return inArray(
    spells.id,
    db.select({ id: spellDamageTypes.spellId }).from(spellDamageTypes).where(inArray(spellDamageTypes.damageTypeId, damageTypeIds.map(Number)))
  );
}

// Collega un incantesimo alle classi e ai tipi di danno scelti, sostituendo quelli di prima.
// Un elenco non passato (o null) resta com'è. Si accettano solo voci di sistema (SRD) o
// create dall'utente; gli id sconosciuti vengono ignorati.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function setSpellTags(tx: Tx, spellId: number, userId: number, classIds?: string[] | null, damageTypeIds?: string[] | null) {
  if (classIds != null) {
    await tx.delete(spellClasses).where(eq(spellClasses.spellId, spellId));
    const ids = classIds.map(Number);
    if (ids.length) {
      const allowed = await tx.select({ id: classes.id }).from(classes)
        .where(and(inArray(classes.id, ids), or(eq(classes.isSystem, true), eq(classes.creatorId, userId))));
      if (allowed.length) await tx.insert(spellClasses).values(allowed.map((c) => ({ spellId, classId: c.id })));
    }
  }
  if (damageTypeIds != null) {
    await tx.delete(spellDamageTypes).where(eq(spellDamageTypes.spellId, spellId));
    const ids = damageTypeIds.map(Number);
    if (ids.length) {
      const allowed = await tx.select({ id: damageTypes.id }).from(damageTypes)
        .where(and(inArray(damageTypes.id, ids), or(eq(damageTypes.isSystem, true), eq(damageTypes.creatorId, userId))));
      if (allowed.length) await tx.insert(spellDamageTypes).values(allowed.map((d) => ({ spellId, damageTypeId: d.id })));
    }
  }
}

// Classe o tipo di danno per GraphQL: id e nome già tradotto
type TagGql = { id: string; nome: string };

// ── Componente materiale ──
// Dalla 0.20.0 il testo del materiale sta in spell_materials. Nella colonna "componenti" si scrive
// ancora anche "(testo)", così la versione 0.19 (che legge solo la colonna) resta utilizzabile se si
// torna indietro; al client si mandano solo le lettere. Il testo nella colonna si toglierà al rilascio dopo.

// "V, S, M (un pizzico di sale)" → "V, S, M"
function componentLetters(componenti: string | null | undefined) {
  if (!componenti) return null;
  return componenti.replace(/\s*\([\s\S]*\)\s*$/, "").trim() || null;
}

const hasM = (letters: string | null) => !!letters && letters.split(",").map((p) => p.trim()).includes("M");

// Valore per la colonna "componenti": lettere + testo del materiale tra parentesi
function componentiColumn(letters: string | null, testo: string | null) {
  return letters && testo && hasM(letters) ? `${letters} (${testo})` : letters;
}

// Salva il materiale di un incantesimo: senza "M" o senza testo lo toglie.
// Le traduzioni passate si aggiungono a quelle che ci sono (null = togli quella lingua).
async function saveMaterial(
  tx: Tx,
  spellId: number,
  letters: string | null,
  testo: string | null,
  perBersaglio?: boolean | null,
  translations?: Record<string, string | null>
) {
  if (!hasM(letters) || !testo) {
    await tx.delete(spellMaterials).where(eq(spellMaterials.spellId, spellId));
    return;
  }
  const [existing] = await tx.select().from(spellMaterials).where(eq(spellMaterials.spellId, spellId)).limit(1);
  const merged = { ...(existing?.translations ?? {}) };
  for (const [l, t] of Object.entries(translations ?? {})) {
    if (t?.trim()) merged[l] = { testo: t.trim() };
    else delete merged[l];
  }
  const values = { testo, translations: merged, perBersaglio: perBersaglio ?? existing?.perBersaglio ?? false };
  if (existing) await tx.update(spellMaterials).set(values).where(eq(spellMaterials.id, existing.id));
  else await tx.insert(spellMaterials).values({ spellId, ...values });
}

// Nome nella lingua richiesta (se c'è la traduzione), altrimenti quello inglese
function localizedName(c: { nome: string; translations: Record<string, { nome: string }> | null }, locale?: string | null) {
  return (locale && c.translations?.[locale]?.nome) || c.nome;
}

// Righe { spellId, id, nome, translations } → id incantesimo → lista (in ordine alfabetico)
function groupBySpell(
  rows: { spellId: number; id: number; nome: string; translations: Record<string, { nome: string }> | null }[],
  locale?: string | null
) {
  const map = new Map<number, TagGql[]>();
  for (const r of rows) {
    const list = map.get(r.spellId) ?? [];
    list.push({ id: String(r.id), nome: localizedName(r, locale) });
    map.set(r.spellId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.nome.localeCompare(b.nome));
  return map;
}

// Classi di tanti incantesimi con una sola query
async function loadClasses(spellIds: number[], locale?: string | null) {
  if (spellIds.length === 0) return new Map<number, TagGql[]>();
  const rows = await db
    .select({ spellId: spellClasses.spellId, id: classes.id, nome: classes.nome, translations: classes.translations })
    .from(spellClasses)
    .innerJoin(classes, eq(spellClasses.classId, classes.id))
    .where(inArray(spellClasses.spellId, spellIds));
  return groupBySpell(rows, locale);
}

// Tipi di danno di tanti incantesimi con una sola query
async function loadDamageTypes(spellIds: number[], locale?: string | null) {
  if (spellIds.length === 0) return new Map<number, TagGql[]>();
  const rows = await db
    .select({ spellId: spellDamageTypes.spellId, id: damageTypes.id, nome: damageTypes.nome, translations: damageTypes.translations })
    .from(spellDamageTypes)
    .innerJoin(damageTypes, eq(spellDamageTypes.damageTypeId, damageTypes.id))
    .where(inArray(spellDamageTypes.spellId, spellIds));
  return groupBySpell(rows, locale);
}

// Aggiunge classi e tipi di danno a una lista di incantesimi già pronti per GraphQL
async function withTags<S extends { id: number }>(list: S[], locale?: string | null) {
  const ids = list.map((s) => s.id);
  const [classMap, damageMap] = await Promise.all([loadClasses(ids, locale), loadDamageTypes(ids, locale)]);
  return list.map((s) => ({ ...s, classi: classMap.get(s.id) ?? [], tipiDanno: damageMap.get(s.id) ?? [] }));
}

export const spellResolvers = {
  Spell: {
    materiale: async (parent: { id: number; _componentiColonna?: string | null; translations?: { locale: string; material: string | null }[] }) => {
      const [m] = await db.select().from(spellMaterials).where(eq(spellMaterials.spellId, parent.id)).limit(1);
      if (!m) {
        // Rete di sicurezza: incantesimo salvato con la 0.19 dopo la migrazione, testo solo nella
        // colonna "componenti". Si mostra da lì; al prossimo salvataggio finisce in spell_materials.
        const testo = parent._componentiColonna?.match(/\(([\s\S]*)\)\s*$/)?.[1].trim();
        if (!testo || !hasM(componentLetters(parent._componentiColonna))) return null;
        return {
          testo,
          perBersaglio: false,
          translations: (parent.translations ?? [])
            .filter((tr) => tr.material?.trim())
            .map((tr) => ({ locale: tr.locale, testo: tr.material!.trim() })),
        };
      }
      return {
        testo: m.testo,
        perBersaglio: m.perBersaglio,
        translations: Object.entries(m.translations ?? {}).map(([locale, v]) => ({ locale, testo: v.testo })),
      };
    },
    // Già caricati dalle liste (withTags); per un singolo incantesimo, o se si chiede
    // un'altra lingua col parametro locale, si leggono qui
    classi: async (parent: { id: number; classi?: TagGql[]; _locale?: string | null }, args: { locale?: string }) =>
      (!args.locale && parent.classi) ||
      (await loadClasses([parent.id], args.locale ?? parent._locale)).get(parent.id) || [],
    tipiDanno: async (parent: { id: number; tipiDanno?: TagGql[]; _locale?: string | null }, args: { locale?: string }) =>
      (!args.locale && parent.tipiDanno) ||
      (await loadDamageTypes([parent.id], args.locale ?? parent._locale)).get(parent.id) || [],
  },

  Query: {
    spellClasses: async (_: unknown, args: { locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const rows = await db.select().from(classes);
      return rows
        .map((c) => ({ id: String(c.id), nome: localizedName(c, args.locale) }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    damageTypes: async (_: unknown, args: { locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const rows = await db.select().from(damageTypes);
      return rows
        .map((d) => ({ id: String(d.id), nome: localizedName(d, args.locale) }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },

    mySpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; groupIds?: string[]; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const conditions = [eq(userSpellLibrary.userId, user.id)];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));
      if (args.groupIds?.length) conditions.push(inArray(userSpellLibrary.groupId, args.groupIds.map(Number)));
      const rows = await db
        .select({ spell: spells, lib: userSpellLibrary, group: spellGroups })
        .from(userSpellLibrary)
        .innerJoin(spells, eq(userSpellLibrary.spellId, spells.id))
        .leftJoin(spellGroups, eq(userSpellLibrary.groupId, spellGroups.id))
        .where(and(...conditions));
      return withTags(rows.map((r) => toGql(r.spell, user.id, true, r.lib.groupId, r.group?.nome, args.locale)), args.locale);
    },

    spell: async (_: unknown, args: { id: string; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.isSystem) return toGql(spell, user.id, false, null, null, args.locale);
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw appError("FORBIDDEN");
      return toGql(spell, user.id, true, null, null, args.locale);
    },

    srdSpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      assertAuthenticated(context);
      const user = context.user!;

      const conditions = [eq(spells.isSystem, true), isNull(spells.creatorId)];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = await db.select().from(spells).where(and(...conditions));

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return withTags(rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale)), args.locale);
    },

    allSpells: async (_: unknown, args: { search?: string; scuole?: string[]; livelli?: number[]; classi?: string[]; tipiDanno?: string[]; concentration?: boolean; ritual?: boolean; locale?: string }, context: Context) => {
      const user = assertAuthenticated(context);

      const conditions = [];
      if (args.scuole?.length) conditions.push(inArray(spells.scuola, args.scuole));
      if (args.livelli?.length) conditions.push(inArray(spells.livello, args.livelli));
      if (args.classi?.length) conditions.push(classiCondition(args.classi));
      if (args.tipiDanno?.length) conditions.push(tipiDannoCondition(args.tipiDanno));
      if (args.search) conditions.push(ilike(spells.nome, `%${args.search}%`));
      if (args.concentration === true) conditions.push(eq(spells.concentration, true));
      if (args.ritual === true) conditions.push(eq(spells.ritual, true));

      const rows = conditions.length
        ? await db.select().from(spells).where(and(...conditions))
        : await db.select().from(spells);

      const libraryRows = await db.select({ spellId: userSpellLibrary.spellId })
        .from(userSpellLibrary).where(eq(userSpellLibrary.userId, user.id));
      const inLibrarySet = new Set(libraryRows.map((r) => r.spellId));

      return withTags(rows.map((s) => toGql(s, user.id, inLibrarySet.has(s.id), null, null, args.locale)), args.locale);
    },

    campaignSpells: async (_: unknown, args: { campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw appError("NOT_CAMPAIGN_MEMBER");
      const rows = await db.select({ spell: spells }).from(campaignSpellLibrary)
        .innerJoin(spells, eq(campaignSpellLibrary.spellId, spells.id))
        .where(eq(campaignSpellLibrary.campaignId, Number(args.campaignId)));
      return withTags(rows.map((r) => toGql(r.spell, user.id, false)));
    },
  },

  Mutation: {
    createSpell: async (
      _: unknown,
      args: { nome: string; descrizione?: string; higherLevel?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string; materiale?: string; materialePerBersaglio?: boolean; groupId?: string; translationLocale?: string; translationNome?: string; translationDescrizione?: string; translationHigherLevel?: string; translationMateriale?: string; classIds?: string[]; damageTypeIds?: string[] },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const groupId = args.groupId
        ? Number(args.groupId)
        : await getOrCreateGroup(user.id, "generale", "Generale");
      return db.transaction(async (tx) => {
        const translationsData: TranslationsMap = {};
        if (args.translationLocale && args.translationNome?.trim()) {
          translationsData[args.translationLocale] = {
            nome: args.translationNome,
            ...(args.translationDescrizione?.trim() ? { descrizione: args.translationDescrizione } : {}),
            ...(args.translationHigherLevel?.trim() ? { highLevel: args.translationHigherLevel } : {}),
            // copia per la 0.19 (vedi componentiColumn)
            ...(args.translationMateriale?.trim() ? { material: args.translationMateriale.trim() } : {}),
          };
        }
        const letters = componentLetters(args.componenti);
        const testo = args.materiale?.trim() || null;
        const [spell] = await tx.insert(spells).values({
          creatorId: user.id,
          nome: args.nome,
          descrizione: args.descrizione ?? null,
          higherLevel: args.higherLevel || null,
          scuola: args.scuola ?? null,
          livello: args.livello ?? 1,
          tempoLancio: args.tempoLancio ?? null,
          gittata: args.gittata ?? null,
          durata: args.durata ?? null,
          componenti: componentiColumn(letters, testo),
          ...(Object.keys(translationsData).length > 0 ? { translations: translationsData } : {}),
        }).returning();
        await tx.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id, groupId });
        await saveMaterial(tx, spell.id, letters, testo, args.materialePerBersaglio,
          args.translationLocale ? { [args.translationLocale]: args.translationMateriale ?? null } : undefined);
        await setSpellTags(tx, spell.id, user.id, args.classIds, args.damageTypeIds);
        return toGql(spell, user.id, true, groupId, null);
      });
    },

    updateSpell: async (
      _: unknown,
      args: { id: string; nome?: string; descrizione?: string; higherLevel?: string; scuola?: string; livello?: number; tempoLancio?: string; gittata?: string; durata?: string; componenti?: string; materiale?: string | null; materialePerBersaglio?: boolean; classIds?: string[]; damageTypeIds?: string[] },
      context: Context
    ) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw appError("ONLY_CREATOR_EDITS");
      const updates: Record<string, unknown> = {};
      if (args.nome !== undefined) updates.nome = args.nome;
      if (args.descrizione !== undefined) updates.descrizione = args.descrizione;
      if (args.higherLevel !== undefined) updates.higherLevel = args.higherLevel || null;
      if (args.scuola !== undefined) updates.scuola = args.scuola;
      if (args.livello !== undefined) updates.livello = args.livello;
      if (args.tempoLancio !== undefined) updates.tempoLancio = args.tempoLancio;
      if (args.gittata !== undefined) updates.gittata = args.gittata;
      if (args.durata !== undefined) updates.durata = args.durata;
      // Componenti e materiale: ciò che non arriva resta com'è
      const touchesMaterial = args.componenti !== undefined || args.materiale !== undefined || args.materialePerBersaglio !== undefined;
      const [currentMaterial] = touchesMaterial
        ? await db.select().from(spellMaterials).where(eq(spellMaterials.spellId, spell.id)).limit(1)
        : [];
      const letters = args.componenti !== undefined ? componentLetters(args.componenti) : componentLetters(spell.componenti);
      const testo = args.materiale !== undefined ? args.materiale?.trim() || null : currentMaterial?.testo ?? null;
      if (touchesMaterial) updates.componenti = componentiColumn(letters, testo);
      return db.transaction(async (tx) => {
        const [updated] = Object.keys(updates).length
          ? await tx.update(spells).set(updates).where(eq(spells.id, spell.id)).returning()
          : [spell];
        if (touchesMaterial) await saveMaterial(tx, spell.id, letters, testo, args.materialePerBersaglio);
        await setSpellTags(tx, spell.id, user.id, args.classIds, args.damageTypeIds);
        return toGql(updated, user.id, true);
      });
    },

    deleteSpell: async (_: unknown, args: { id: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.id));
      if (spell.creatorId !== user.id) throw appError("ONLY_CREATOR_DELETES");
      await db.delete(spellClasses).where(eq(spellClasses.spellId, spell.id));
      await db.delete(spellDamageTypes).where(eq(spellDamageTypes.spellId, spell.id));
      await db.delete(spellMaterials).where(eq(spellMaterials.spellId, spell.id));
      await db.delete(userSpellLibrary).where(eq(userSpellLibrary.spellId, spell.id));
      await db.delete(campaignSpellLibrary).where(eq(campaignSpellLibrary.spellId, spell.id));
      await db.delete(spells).where(eq(spells.id, spell.id));
      return true;
    },

    addSrdSpellToLibrary: async (_: unknown, args: { spellId: string; groupId?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      if (!spell.isSystem) throw appError("NOT_SRD_SPELL");
      const [existing] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!existing) {
        const groupId = args.groupId
          ? Number(args.groupId)
          : await getOrCreateGroup(user.id, "ufficiali", "Ufficiali");
        await db.insert(userSpellLibrary).values({ userId: user.id, spellId: spell.id, groupId });
      }
      return true;
    },

    // Aggiunge alla libreria gli incantesimi SRD della lista (salta quelli già presenti e i non SRD)
    addSrdSpellsToLibrary: async (_: unknown, args: { spellIds: string[]; groupId?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.spellIds.map(Number);
      if (ids.length === 0) return 0;
      const srd = await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.isSystem, true)));
      const already = await db.select({ spellId: userSpellLibrary.spellId }).from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.userId, user.id), inArray(userSpellLibrary.spellId, ids)));
      const alreadySet = new Set(already.map((r) => r.spellId));
      const toAdd = srd.map((r) => r.id).filter((id) => !alreadySet.has(id));
      if (toAdd.length === 0) return 0;
      let groupId: number;
      if (args.groupId) {
        groupId = Number(args.groupId);
        const [group] = await db.select().from(spellGroups)
          .where(and(eq(spellGroups.id, groupId), eq(spellGroups.userId, user.id))).limit(1);
        if (!group) throw appError("GROUP_NOT_FOUND");
      } else {
        groupId = await getOrCreateGroup(user.id, "ufficiali", "Ufficiali");
      }
      await db.insert(userSpellLibrary).values(toAdd.map((spellId) => ({ userId: user.id, spellId, groupId })));
      return toAdd.length;
    },
    // Toglie dalla libreria gli incantesimi SRD della lista (i non SRD vengono ignorati)
    removeSrdSpellsFromLibrary: async (_: unknown, args: { spellIds: string[] }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.spellIds.map(Number);
      if (ids.length === 0) return 0;
      const srd = await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.isSystem, true)));
      if (srd.length === 0) return 0;
      const removed = await db.delete(userSpellLibrary)
        .where(and(eq(userSpellLibrary.userId, user.id), inArray(userSpellLibrary.spellId, srd.map((r) => r.id))))
        .returning({ spellId: userSpellLibrary.spellId });
      return removed.length;
    },
    // Elimina gli incantesimi della lista creati dall'utente (gli altri vengono ignorati), tutto o niente
    deleteSpells: async (_: unknown, args: { ids: string[] }, context: Context) => {
      const user = assertAuthenticated(context);
      const ids = args.ids.map(Number);
      if (ids.length === 0) return 0;
      const own = (await db.select({ id: spells.id }).from(spells)
        .where(and(inArray(spells.id, ids), eq(spells.creatorId, user.id)))).map((r) => r.id);
      if (own.length === 0) return 0;
      await db.transaction(async (tx) => {
        await tx.delete(spellClasses).where(inArray(spellClasses.spellId, own));
        await tx.delete(spellDamageTypes).where(inArray(spellDamageTypes.spellId, own));
        await tx.delete(spellMaterials).where(inArray(spellMaterials.spellId, own));
        await tx.delete(userSpellLibrary).where(inArray(userSpellLibrary.spellId, own));
        await tx.delete(campaignSpellLibrary).where(inArray(campaignSpellLibrary.spellId, own));
        await tx.delete(spells).where(inArray(spells.id, own));
      });
      return own.length;
    },
    removeSrdSpellFromLibrary: async (_: unknown, args: { spellId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      if (!spell.isSystem) throw appError("NOT_SRD_SPELL");
      await db.delete(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id)));
      return true;
    },

    shareSpellWithUser: async (_: unknown, args: { spellId: string; email: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw appError("SPELL_NOT_IN_LIBRARY");
      const { users } = await import("@/db/schema");
      const [target] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
      if (!target) throw appError("USER_NOT_FOUND");
      const [existing] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, target.id))).limit(1);
      if (!existing) await db.insert(userSpellLibrary).values({ userId: target.id, spellId: spell.id });
      return true;
    },

    shareSpellWithCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      const [entry] = await db.select().from(userSpellLibrary)
        .where(and(eq(userSpellLibrary.spellId, spell.id), eq(userSpellLibrary.userId, user.id))).limit(1);
      if (!entry) throw appError("SPELL_NOT_IN_LIBRARY");
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member) throw appError("NOT_CAMPAIGN_MEMBER");
      const [existing] = await db.select().from(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, spell.id), eq(campaignSpellLibrary.campaignId, Number(args.campaignId)))).limit(1);
      if (!existing) await db.insert(campaignSpellLibrary).values({ spellId: spell.id, campaignId: Number(args.campaignId), sharedById: user.id });
      return true;
    },

    removeSpellFromCampaign: async (_: unknown, args: { spellId: string; campaignId: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const [member] = await db.select().from(campaignMembers)
        .where(and(eq(campaignMembers.campaignId, Number(args.campaignId)), eq(campaignMembers.userId, user.id))).limit(1);
      if (!member || (member.ruolo !== "master" && member.ruolo !== "owner")) {
        throw appError("FORBIDDEN");
      }
      await db.delete(campaignSpellLibrary)
        .where(and(eq(campaignSpellLibrary.spellId, Number(args.spellId)), eq(campaignSpellLibrary.campaignId, Number(args.campaignId))));
      return true;
    },

    upsertSpellTranslation: async (_: unknown, args: { spellId: string; locale: string; nome: string; descrizione?: string; highLevel?: string; material?: string }, context: Context) => {
      const user = assertAuthenticated(context);
      const spell = await getSpellOrThrow(Number(args.spellId));
      // Come per la modifica: solo chi l'ha creato (le traduzioni SRD valgono per tutti)
      if (spell.creatorId !== user.id) throw appError("ONLY_CREATOR_EDITS");
      const existing = ((spell.translations ?? {}) as TranslationsMap);
      const updated: TranslationsMap = {
        ...existing,
        [args.locale]: {
          nome: args.nome,
          descrizione: args.descrizione ?? undefined,
          highLevel: args.highLevel ?? undefined,
          material: args.material ?? undefined,
        },
      };
      return db.transaction(async (tx) => {
        const [result] = await tx.update(spells).set({ translations: updated }).where(eq(spells.id, spell.id)).returning();
        // Il materiale tradotto va anche (soprattutto) nel materiale dell'incantesimo, se c'è
        const [m] = await tx.select().from(spellMaterials).where(eq(spellMaterials.spellId, spell.id)).limit(1);
        if (m) await saveMaterial(tx, spell.id, componentLetters(spell.componenti), m.testo, undefined, { [args.locale]: args.material ?? null });
        return toGql(result, null, false);
      });
    },
  },
};
