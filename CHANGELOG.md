# Changelog

Tutte le modifiche rilevanti del progetto, dalla più recente.
Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.

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
