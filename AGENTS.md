<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regole del progetto Grimoire

Queste regole le ha decise il proprietario del progetto e valgono per ogni modifica.
Si scrive in italiano: commenti nel codice, messaggi di commit, CHANGELOG e risposte.

## Architettura dei componenti

- **Componenti atomici.** `components/ui/` contiene i mattoncini (`Grimoire*`): bottoni, input,
  tabelle, modali, card… Le pagine (`app/`) usano solo questi componenti.
- **Niente Bootstrap nelle pagine.** Nelle pagine non si usano classi Bootstrap
  (`d-flex`, `mb-3`, `row`, `card`, `nav-tabs`…) né tag HTML stilizzati a mano: se serve
  qualcosa che non c'è, si crea un nuovo componente in `components/ui/`. Bootstrap si usa
  solo dentro i componenti.
- `components/features/` contiene pezzi con logica dell'app (navbar, card di una campagna,
  card di un incantesimo, toggle di tema e lingua) costruiti con i componenti di `ui/`.
  Qui Bootstrap è ammesso (il divieto vale solo per le pagine), ma si preferiscono i `Grimoire*`.
- **Pagine corte.** Quando una pagina cresce troppo, i suoi pezzi (filtri, lista, modali,
  hook con lo stato) vanno in `components/features/<sezione>/`; la pagina li collega
  (esempio: `components/features/spells/`).
- **Parametri dell'URL in inglese** (`search`, `school`, `level`, `class`, `damage`, `tab`…).
- **Ogni componente gestisce tema e traduzioni** da sé: i testi con `useTranslations`,
  i colori con le variabili `--g-…`.
- **Niente CSS incomprensibile.** Se serve CSS, un file `*.module.css` accanto al componente,
  con un commento in italiano che spiega ogni regola.
- **Tutto deve essere comprensibile a un umano.** Niente soluzioni strane; commenti brevi
  in italiano dove il perché non è ovvio.

## Tema

- L'unico interruttore è `data-bs-theme` sul `<body>`, messo da `ThemeSync`.
- I colori sono in `styles/palette.css` (variabili `--g-…`, versione chiara e scura).
  I componenti usano solo queste variabili e non devono sapere quale tema è attivo
  (eccezione: chi mostra il tema, come `ThemeToggle`).

## Responsive

- Il mobile è importante ma **non deve mai cambiare il desktop**.
- Il confine è **992px** (breakpoint `lg` di Bootstrap): le regole per tablet e telefono
  stanno in `@media (max-width: 991.98px)` oppure usano le classi `*-lg-*`.
- Su mobile il testo base è 18px (`styles/palette.css`); l'altezza della navbar è
  `--g-navbar-height`.

## Traduzioni

- Italiano e inglese: ogni testo dell'interfaccia va in `messages/it.json` e `messages/en.json`.
- I **dati** non sono testi dell'interfaccia: classi, tipi di danno e incantesimi SRD
  stanno nel database con le loro traduzioni (campo `translations`), e il server
  restituisce il nome già tradotto.

## Dati SRD e database

- Dati SRD in file JSON in `scripts/` (`srd-spells.json`, `srd-translations-it.json`,
  `srd-classes.json`, `srd-damage-types.json`): niente elenchi di dati scritti nel codice.
- Da zero: `npm run db:setup` (crea tabelle e carica tutti i dati). Vedi README.
- Classi e tipi di danno: tabelle `classes` / `damage_types` collegate agli incantesimi con
  `spell_classes` / `spell_damage_types`. Le voci SRD hanno `isSystem = true`;
  `creatorId` è pronto per quelle create dagli utenti.
- **Modifiche al database in produzione:** il proprietario non lancia comandi a mano.
  Si usa uno script di migrazione **temporaneo** (`scripts/migrate-X.Y.ts`) lanciato dal
  `build` in `package.json`, prima di `next build`:
  - idempotente (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`…) e in una transazione;
  - se fallisce, esce con errore: il build si ferma e la versione online non cambia;
  - mai cancellare una colonna che la versione ancora online legge (Drizzle legge tutte
    le colonne dello schema): prima la si toglie dal codice, la si cancella al rilascio dopo;
  - lo script e la sua riga nel `build` si tolgono al push successivo.

## Git, versioni e pubblicazione

- Si lavora sul branch indicato dalla sessione. **Su `main` si pusha direttamente, ma solo
  alla fine di una task e solo dopo aver chiesto il permesso, ogni volta.** `main` ha
  l'autodeploy su Vercel.
- **Versioning semver** a ogni push su `main`: patch per correzioni, minor per novità.
  Si aggiornano `version` in `package.json` e `package-lock.json` e si aggiunge la voce in
  `CHANGELOG.md` (in italiano), in un commit "Versione X.Y.Z" separato.
- Commit piccoli e separati per argomento, con messaggi in italiano.
- **Nei commit e nelle PR non si mette il link alla sessione** (`Claude-Session: …`).
- Prima di pushare si rilegge il diff: qui non sempre si possono lanciare build e lint,
  quindi va detto chiaramente cosa è stato verificato e cosa no.
