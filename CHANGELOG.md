# Changelog

Tutte le modifiche rilevanti del progetto, dalla più recente.
Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/): MAJOR.MINOR.PATCH.

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
