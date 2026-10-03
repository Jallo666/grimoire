# Changelog

Tutte le modifiche rilevanti del progetto, dalla più recente.
Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.

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
