# Grimoire

Gestione di campagne e incantesimi per giochi di ruolo (D&D 5e). Next.js, GraphQL, Drizzle + PostgreSQL.

## Avviare il progetto in locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Crea il file `.env.local` con almeno:
   ```
   DATABASE_URL=postgres://utente:password@host:5432/database
   JWT_SECRET=una-stringa-lunga-e-segreta
   ```
3. Inizializza il database (una volta sola, su un database vuoto):
   ```bash
   npm run db:setup
   ```
4. Avvia l'app:
   ```bash
   npm run dev
   ```
   e apri [http://localhost:3000](http://localhost:3000).

## Database

| Comando | Cosa fa |
|---|---|
| `npm run db:setup` | Da zero: crea tabelle e colonne (`db:push`) e carica tutti i dati SRD (`db:seed`). |
| `npm run db:push` | Allinea il database allo schema in `db/schema.ts` (drizzle-kit). Mostra le modifiche e chiede conferma. |
| `npm run db:seed` | Carica i dati SRD, nell'ordine: incantesimi, traduzioni italiane, classi, tipi di danno (con i collegamenti agli incantesimi), componenti materiali. Si può rilanciare: non crea doppioni. |

I dati SRD stanno in `scripts/`:

| File | Contenuto |
|---|---|
| `srd-spells.json` | Incantesimi (in inglese) |
| `srd-translations-it.json` | Traduzioni italiane degli incantesimi |
| `srd-classes.json` | Classi, con traduzioni |
| `srd-damage-types.json` | Tipi di danno, con traduzioni |
| `srd-materials.json` | Componenti materiali degli incantesimi (inglese e italiano, dal PDF ufficiale SRD 5.1) |

## Versioni

Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/); le modifiche di ogni versione sono in [`CHANGELOG.md`](CHANGELOG.md).

## Attribuzione

I dati degli incantesimi vengono dal D&D 5e System Reference Document: vedi [`ATTRIBUTION.md`](ATTRIBUTION.md).
