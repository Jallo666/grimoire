# Changelog

Tutte le modifiche rilevanti del progetto, dalla più recente.
Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.

## [0.20.1] - 2026-10-03

### Modificato
- Italiano degli incantesimi SRD allineato al PDF ufficiale SRD 5.1 in italiano: nomi, descrizioni e "ai livelli superiori" (prima mancava). Cambiano alcuni nomi (es. "Pelle di Corteccia" → "Pelle coriacea", "Lingue" → "Linguaggi", "Tocco Vampirico" → "Tocco del vampiro") e le maiuscole seguono il PDF ("Palla di fuoco").
- Migrazione temporanea `scripts/migrate-0.20.1.ts` al posto della 0.20: aggiorna l'italiano degli incantesimi SRD nel database.
- Componente materiale vicino a "Componenti" (V, S, M): nel dettaglio subito sotto, nel form sotto le caselle con i campi delle due lingue.

### Corretto
- Descrizioni italiane tagliate (soprattutto quelle con elenchi o tabelle, es. Artificio druidico, Prestidigitazione, Desiderio): ora complete.
- Il materiale nella seconda lingua si salva anche se non c'è il nome tradotto.

## [0.20.0] - 2026-10-03

### Aggiunto
- Componente materiale degli incantesimi in una tabella sua (`spell_materials`), in inglese e italiano: per gli incantesimi SRD i testi vengono da `scripts/srd-materials.json` (italiano dal PDF ufficiale SRD 5.1).
- Nel dettaglio il materiale si vede nella lingua scelta, con l'indicazione "per bersaglio" quando la quantità si moltiplica.
- Nel form il testo del materiale sta nelle tab della lingua (compare con la M spuntata), più la casella "per bersaglio".

### Modificato
- Il campo componenti mostra solo V, S, M: il testo del materiale ha il suo campo.
- Migrazione temporanea `scripts/migrate-0.20.ts` nel build: crea la tabella e ci sposta i materiali SRD e quelli degli incantesimi degli utenti. Non cancella niente: per questa versione il testo resta anche nella vecchia colonna.
- Nei controlli su GitHub le migrazioni si saltano (`SKIP_DB_MIGRATIONS=1`).

### Corretto
- Bocca Magica: il materiale inglese diceva "10 inches" (refuso della fonte), ora "10 gp".

## [0.19.1] - 2026-10-03

### Corretto
- Dettaglio incantesimo: la posizione ("5 / 319") e lo swipe seguono di nuovo l'ordine mostrato nella lista. Aprendo il dettaglio, il nome originale sovrascriveva quello tradotto e la lista si riordinava.
- Modifica incantesimo: ora è la stessa modale della creazione (tab delle lingue, stessi campi), aperta da "Modifica" nel dettaglio. La vecchia pagina `/spells/<id>` riporta alla lista; "Condividi" è nel dettaglio.
- "Ai livelli superiori" si può scrivere anche creando un incantesimo, in entrambe le lingue.
- Le traduzioni di un incantesimo le può modificare solo chi l'ha creato (prima chiunque poteva cambiare anche quelle SRD).

## [0.19.0] - 2026-10-03

### Modificato
- Pagina incantesimi divisa in pezzi in `components/features/spells/` (filtri, lista, selezione multipla, modali di creazione, spostamento e gruppi); la pagina li collega soltanto.
- Parametri dell'URL dei filtri in inglese: `school`, `level`, `class`, `damage`. I link salvati con i vecchi nomi (`scuola`, `livello`, `classe`, `danno`) aprono la pagina senza filtri.
- `AGENTS.md`: Bootstrap ammesso nei componenti di `features/`, pagine corte, parametri dell'URL in inglese.

### Corretto
- Filtri su mobile: scegliendo insieme concentrazione e rituale uno dei due non si perde più.

## [0.18.0] - 2026-10-03

### Aggiunto
- Controlli automatici su GitHub (`.github/workflows/controlli.yml`): lint e build (con controllo dei tipi) a ogni push e pull request.
- Errori tradotti: il server manda un codice (`graphql/errors.ts`, es. `SPELL_NOT_FOUND`) e la pagina mostra il testo in italiano o inglese (gruppo `errors`), o un messaggio generico.
- Nuovi componenti: `GrimoireModalFooter`, `GrimoireField`, `GrimoireDivider`, `GrimoirePager`, `GrimoireText`, `GrimoireExternalLink`, `GrimoireSwipeArea`.

### Modificato
- Pagine senza classi Bootstrap, tag HTML stilizzati o `style` scritti a mano: tutto passa dai componenti.
- Tutte le modali hanno i bottoni nel footer (`GrimoireModalFooter`); tolto `GrimoireModalActions`.
- `GrimoireInlineGroup`, `GrimoireSelect`, `GrimoireMultiSelect`: prop chiare (`wrap`, `spaced`, `fillFirst`, `minWidth`) al posto di `style`/`className`.
- Modifica incantesimo: la card delle traduzioni è un `GrimoireForm`.

### Corretto
- Pagina d'errore della dashboard: con la sessione scaduta torna di nuovo al login (leggeva il codice nel formato della vecchia versione di Apollo).
- 6 errori trovati dal lint: stato aggiornato dentro un effetto (input speciali, dettaglio, profilo) e cookie della lingua scritto in un modo vietato da React.

## [0.17.1] - 2026-10-03

### Modificato
- `AGENTS.md`: regole del progetto scritte per ogni sessione (architettura, tema, responsive, traduzioni, dati SRD, migrazioni, versioning, pubblicazione).
- Tolta la migrazione temporanea 0.17 dal build: il build torna a essere solo `next build`.

## [0.17.0] - 2026-10-03

### Aggiunto
- Classi e tipo di danno negli incantesimi creati dall'utente: pillole "Classi" e "Tipo di danno" nella creazione e nella modifica (`createSpell` / `updateSpell` accettano `classIds` e `damageTypeIds`). Nuovo tipo di campo "chips" in `GrimoireForm`, prop `disabled` di `GrimoireChips`, nuovo componente `GrimoireStack`.

### Database
- Cancellata la vecchia colonna `spells.classi` (migrazione temporanea `scripts/migrate-0.17.ts` nel build; tolta la 0.16). Pulizia del database completata.

## [0.16.0] - 2026-10-03

### Corretto
- Dettaglio incantesimo: classi e tipi di danno tradotti (prima in inglese). I campi `classi` e `tipiDanno` accettano un parametro `locale` facoltativo.

### Database
- Cancellata la colonna `spells.tipi_danno` (migrazione temporanea `scripts/migrate-0.16.ts` nel build; tolta la 0.15).
- `spells.classi` non è più usata dal codice; verrà cancellata dal database nella prossima versione.

## [0.15.0] - 2026-10-03

### Modificato
- Classi e tipi di danno SRD in file di dati (`scripts/srd-classes.json`, `scripts/srd-damage-types.json`) con le traduzioni, come gli incantesimi: niente più elenchi scritti nel codice.
- Tipi di danno come tabella (`damage_types`, collegata con `spell_damage_types`), con la stessa logica delle classi; i nomi tradotti arrivano dal database.

### Aggiunto
- Un solo comando per inizializzare il database da zero: `npm run db:setup` (oppure `db:push` e `db:seed`). README in italiano con le istruzioni.

### Database
- Migrazione automatica nel build (`scripts/migrate-0.15.ts`, temporanea; tolta la 0.14): tabelle dei tipi di danno, classi e tipi di danno dai JSON, collegamenti. La colonna `spells.tipi_danno` non è più usata dal codice ma resta nel database per ora, come `spells.classi`.

## [0.14.0] - 2026-10-03

### Aggiunto
- Tipo di danno degli incantesimi (Fuoco, Freddo, Radioso, …): colonna Danno in tabella, nelle card e nel dettaglio, filtro a scelta multipla; 13 tipi tradotti IT/EN. Nuova colonna `spells.tipi_danno`.
- Classi nel database: tabella `classes` (le 8 classi SRD, con traduzioni; pronta per le classi create dagli utenti) e collegamento `spell_classes`. Filtro, tabella e dettaglio usano le classi dal database, col nome tradotto dal server.

### Corretto
- Dettaglio incantesimo: tempo di lancio e durata tradotti (prima in inglese, es. "Instantaneous").

### Database
- Migrazione automatica nel build (`scripts/migrate-0.14.ts`, temporanea): colonna e tabelle nuove, tipi di danno SRD, classi SRD e collegamenti. La vecchia colonna di testo `spells.classi` resta per ora.

## [0.13.0] - 2026-10-03

### Aggiunto
- Incantesimi: modalità selezione (bottone "Seleziona" nel titolo) in tabella e card, con "Seleziona tutti" che rispetta i filtri. Barra in basso con le azioni in blocco: Aggiungi alla libreria (con scelta del gruppo), Sposta nel gruppo, Togli dalla libreria, Elimina; alla fine un messaggio dice quanti incantesimi sono stati cambiati e quanti ignorati. Nuovi componenti `GrimoireSelectionBar` e `GrimoireToast`.
- Server: operazioni in blocco `addSrdSpellsToLibrary`, `removeSrdSpellsFromLibrary`, `deleteSpells`, `moveSpellsToGroup` (una richiesta per tante voci; l'eliminazione tocca solo gli incantesimi dell'utente).
- Conferma prima di eliminare un incantesimo, un gruppo o una campagna e prima delle azioni in blocco distruttive (nuovo componente `GrimoireConfirm`).
- Filtro per classe (tendina su desktop, pillole su mobile); classi tradotte in tabella e nel dettaglio.

## [0.12.1] - 2026-10-03

### Corretto
- Dettaglio incantesimo: skeleton anche sul titolo mentre carica (prop `titleSkeleton` di `GrimoireModal`).
- Creazione incantesimo allineata al dettaglio: a schermo intero su tablet e telefono, tab della lingua con `GrimoireTabs`, campi su due colonne da 768px (nuovo componente `GrimoireFieldGrid`).
- `GrimoireTabs`: i bottoni non inviano più un form quando le tab sono dentro un form.

## [0.12.0] - 2026-10-02

### Aggiunto
- Dettaglio incantesimo: frecce ‹ › per passare al precedente/successivo nell'ordine mostrato (filtri, riordino, tabella o card), con la posizione "3 / 42"; frecce ← → della tastiera; su mobile swipe a sinistra/destra. Il nuovo incantesimo entra scivolando dal lato giusto. Prop `onOrderChange` di `GrimoireTable` e `GrimoireCardView`.

### Modificato
- Dettaglio incantesimo: "Chiudi" al posto di "Annulla"; su mobile "Modifica" è solo un'icona.

## [0.11.0] - 2026-10-02

### Modificato
- Barra in alto su tablet e telefono (sotto i 992px) in stile app: ☰ senza bordo, titolo della pagina e i suoi bottoni nella barra stessa; la riga del titolo sotto la barra sparisce (più spazio per il contenuto). La barra ha il colore della pagina con una linea sotto invece del blu pieno. Desktop invariato.
- Menu laterale: logo e "Grimoire" in cima, saluto come riga piccola sotto.

## [0.10.3] - 2026-10-02

### Corretto
- Modale dei gruppi uguale alle altre: "Nuovo gruppo" in alto, gruppi in una tabella (su mobile: tocco sulla riga e menu dal basso), footer con Chiudi, Rinomina con Annulla / Salva nella stessa modale, messaggio di lista vuota che segue il tema.
- Il menu che sale dal basso ora compare sopra le modali.

## [0.10.2] - 2026-10-02

### Modificato
- Testo a 18px su tablet e telefono (prima 17px); navbar di conseguenza a 63px. Desktop invariato.

## [0.10.1] - 2026-10-02

### Modificato
- Testo a 17px su tablet e telefono (sotto i 992px): testo, bottoni, input e spazi crescono nella stessa proporzione; rispetta l'ingrandimento del testo impostato sul telefono. Desktop invariato. Altezza della navbar in rem (`--g-navbar-height: 3.5rem`).

### Corretto
- Interruttore del tema visibile sul blu di navbar e menu laterale anche quando è acceso (prima restava visibile solo il pallino).

## [0.10.0] - 2026-10-02

### Aggiunto
- Incantesimi: vista a card oltre alla tabella, scelta con le icone ☰ / ▦ accanto alle tab e salvata nell'URL (`?view=cards`). Le card mostrano nome, livello, scuola tradotta, gittata, concentrazione/rituale e gruppo; toccando una card sale il menu delle azioni. 1 colonna su telefono, 2 su tablet, 3 su desktop. Nuovi componenti `GrimoireCardView`, `GrimoireViewToggle`, `GrimoireSpellCard`.

### Corretto
- Attribuzione SRD: "CC BY 4.0" non è più ripetuto due volte.

## [0.9.0] - 2026-10-02

### Aggiunto
- Liste di incantesimi ordinate per livello all'apertura (a parità di livello per nome), con la freccetta già sulla colonna Livello (prop `defaultSort` di `GrimoireTable`).
- Dettaglio incantesimo: skeleton con la forma del contenuto mentre carica (nuovo componente `GrimoireSkeletonText`) e, su tablet e telefono, modale a schermo intero (prop `fullscreenOnMobile` di `GrimoireModal`).

### Corretto
- Scuole tradotte nei badge della tabella e nel dettaglio (prima restavano in italiano); il riordino per scuola segue il nome tradotto (prop `badgeLabels` di `GrimoireTable`).

## [0.8.1] - 2026-10-02

### Corretto
- Tabelle a tutta altezza su tablet e telefono: lo sfondo della tabella arriva fino in fondo allo schermo anche con lo skeleton o senza righe.
- Tabella vuota: il messaggio "nessun elemento" sta al centro dello spazio invece che subito sotto i titoli.

## [0.8.0] - 2026-10-02

### Aggiunto
- Tabelle su tablet e telefono (sotto i 992px): toccando una riga sale dal basso un menu con le azioni di quella riga (dettaglio, elimina, …), con animazione: lo sfondo si scurisce, il pannello sale con una curva morbida e le voci entrano a cascata; alla chiusura tutto riscende. La colonna Azioni su mobile è nascosta. Nuovo componente `GrimoireActionSheet`. Su desktop non cambia nulla.

## [0.7.0] - 2026-10-02

### Aggiunto
- Filtri degli incantesimi su tablet e telefono (sotto i 992px) in una modale: si apre con l'icona a imbuto accanto alle tab, che mostra quanti filtri sono attivi. Dentro, le scelte sono pillole da toccare (gruppo, livello, scuola, concentrazione/rituale) e i filtri si applicano subito; "Azzera" li toglie tutti. Su desktop resta la riga di filtri.
- Nuovi componenti `GrimoireChips`, `GrimoireFilterButton`, `GrimoireFilterModal`; prop `action` di `GrimoireTabs`.

### Modificato
- Su tablet e telefono non c'è più il pulsante "Filtri" a tutta larghezza introdotto in 0.5.0: più spazio per la tabella.

## [0.6.0] - 2026-10-02

Tutte le modifiche valgono sotto i 992px (tablet e telefono); il desktop non cambia.

### Aggiunto
- Tabelle: la colonna leader (il nome) resta ferma a sinistra e le altre scorrono di lato; ogni cella su una riga sola, così le righe sono basse (prop di colonna `leader`).
- Tabelle a tutta altezza in incantesimi e campagne: la tabella prende lo spazio rimasto sotto titolo, tab e filtri, scorre al suo interno e i titoli delle colonne restano fermi (prop `fillHeight` di `GrimoirePage` e `GrimoireTable`).
- Bottoni accanto al titolo solo con icona (＋ nuovo, gruppi), così stanno sulla stessa riga del titolo (prop `mobileIcon` di `GrimoireButton`).

### Modificato
- I bottoni del titolo non vanno più sotto il titolo (introdotto in 0.4.0): restano sulla stessa riga.
- Navbar ad altezza fissa (`--g-navbar-height`, 56px).

## [0.5.1] - 2026-10-02

### Corretto
- Incantesimi: righe skeleton nella tabella mentre i dati si caricano, invece del messaggio "nessun incantesimo".
- Ricerca incantesimi: parte 300ms dopo l'ultima lettera invece che a ogni lettera (nuovo componente `GrimoireSearchInput`).
- Tab su tablet e telefono: etichette corte (Miei / SRD / Tutti) e tab a larghezza uguale, così non vanno più a capo.

## [0.5.0] - 2026-10-02

### Aggiunto
- Filtri a scomparsa su tablet e telefono (sotto i 992px): i filtri degli incantesimi sono nascosti e si aprono col pulsante "Filtri (n)", dove n è il numero di filtri attivi. Su desktop restano sempre visibili. Nuovo componente `GrimoireFilterPanel`.

## [0.4.1] - 2026-10-02

### Modificato
- Tema unico: l'unico interruttore è `data-bs-theme` sul `<body>`, che cambia insieme i nostri colori (`--g-…` in `styles/palette.css`) e quelli di Bootstrap. I componenti non leggono più il tema: usano solo le variabili `--g-…`.

### Corretto
- Nel tema scuro anche gli elementi Bootstrap senza colori nostri (es. la ✕ delle modali, testi e link) usano i colori scuri.

## [0.4.0] - 2026-10-02

### Aggiunto
- Filtri degli incantesimi a scelta multipla per gruppo, scuola e livello (nuovo componente `GrimoireMultiSelect`). Nell'URL i valori sono separati da virgola, es. `?livello=0,3`.

### Corretto
- Titoli di pagina su tablet e telefono: i bottoni vanno sotto il titolo invece di schiacciarsi accanto.
- Meno spazio sopra e sotto le pagine su tablet e telefono (16px invece di 48px).
- Tema scuro negli input: placeholder, freccette delle select, checkbox e menu a tendina ora sono leggibili.

## [0.3.0] - 2026-10-02

### Aggiunto
- Menu mobile (sotto i 992px): nella barra in alto solo ☰ e "Grimoire"; il ☰ apre un menu laterale da sinistra sopra la pagina, con link, profilo, tema, lingua e logout.
- Nuovi componenti `GrimoireHamburger`, `GrimoireSidenav` e `GrimoireSidenavLink`.

### Corretto
- `ThemeToggle`: id generato con `useId`, così può comparire più volte nella stessa pagina.

## [0.2.0] - 2026-10-02

### Aggiunto
- Versione dell'app visibile in fondo alla pagina di login e alla home (componente `GrimoireVersion`).

### Corretto
- Logo ritagliato attorno al libro (tolti lo spazio vuoto e la scritta "Made with AI").
- Login e registrazione: logo al massimo 160px su desktop e 120px su tablet e telefono (sotto i 992px).
- La card di login/registrazione non si allunga più oltre il form lasciando uno spazio vuoto.
- Login e registrazione rispettano il tema scuro (prima lo sfondo restava sempre chiaro).

## [0.1.0]

- Versione iniziale.
