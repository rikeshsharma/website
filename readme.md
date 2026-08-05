# Rikesh Sharma — Portfolio Website

A single-page portfolio built with plain HTML, CSS, and vanilla JavaScript.
No build step, no package manager, no framework — open `index.html` in a
browser, or serve the folder with any static file server, and it runs.

```sh
python3 -m http.server 8080
```

## Stack

- HTML5
- CSS3 (custom properties, Grid, Flexbox — no preprocessor)
- Vanilla JavaScript (ES6+, classic scripts — no bundler, no modules)
- Inline SVG

## Project structure

```
/
├── index.html
├── assets/
│   ├── brand/            logo, favicon, brand-kit source files
│   └── image/            profile photo, placeholder logos
├── css/
│   ├── variables.css     design tokens: color, radius
│   ├── base/
│   │   └── reset.css     body defaults, smooth-scroll opt-in
│   ├── layout/
│   │   └── header.css    sticky header, nav, mobile hamburger menu
│   ├── components/       small reusable pieces, used by more than one section
│   │   ├── theme-toggle.css
│   │   ├── section-divider.css
│   │   ├── reveal.css
│   │   └── project-card.css
│   ├── sections/         one file per <section>, page-specific layout
│   │   ├── hero.css
│   │   ├── carrier.css
│   │   ├── skills.css
│   │   ├── projects.css
│   │   ├── about.css
│   │   ├── contact.css
│   │   └── footer.css
│   └── themes/
│       └── dark.css      every `body.dark-mode` override, centralized
└── js/
    ├── config/
    │   └── constants.js       shared config (see "Why no ES modules" below)
    ├── utils/
    │   └── scroll-observer.js reveal-on-scroll IntersectionObserver factory
    ├── components/             interactive widgets
    │   ├── mobile-menu.js
    │   ├── theme-toggle.js
    │   ├── project-cards.js
    │   └── contact-form.js
    └── sections/                sections with no interaction beyond reveal-on-scroll
        ├── about.js
        └── footer.js
```

## Naming conventions

- **Files**: kebab-case, named after what they contain (`mobile-menu.js`,
  `project-card.css`), not after where they're used.
- **CSS classes**: `section-name`, `section-name-part` (e.g. `.contact-panel`,
  `.contact-panel-title`) — a light BEM-ish flat convention, no `__`/`--`
  punctuation. Modifier classes use a `--modifier` suffix
  (`.project-card--1`, `.marquee-track--right`).
- **JS functions**: verbs in camelCase (`observeReveal`, `closeNav`,
  `validateField`), matching what they do, not the DOM ID they happen to
  touch.
- **CSS custom properties**: `--color-*`, `--radius-*`, grouped by role in
  `css/variables.css`. Alpha/tinted colors are built from an accompanying
  `--color-x-rgb` triple via `rgba(var(--color-x-rgb), <alpha>)`, so the
  exact opacity used at each call site stays visible instead of hiding
  behind a wall of near-duplicate fixed-alpha tokens.

## How the pieces load

`<link>` tags in `index.html`'s `<head>` are ordered deliberately:

```
variables → base → layout → components → sections → themes/dark
```

`themes/dark.css` loads **last** so its `body.dark-mode` overrides reliably
win on selector-specificity ties, no `!important` needed.

`<script defer>` tags at the end of `<head>` are ordered by dependency:
`constants.js` and `scroll-observer.js` first (other scripts call into
them), then components/sections in the order they appear on the page.
`defer` guarantees they execute in that order, after the DOM is parsed.

### Why no ES modules

Classic `<script>` tags were used instead of `<script type="module">`. The
project's one hard constraint is that `index.html` keeps working when
opened directly from disk (`file://`) — no server required. Native ES
modules are blocked by Chrome/Firefox/Safari under `file://` due to
CORS-on-file restrictions, so `import`/`export` would silently break that
workflow. Instead, each JS file is an IIFE (`(function () { ... })();`) so
it doesn't leak its internals as globals, and the one thing that needs to
be shared across files — a couple of constants and the reveal-observer
helper — lives in two small frozen/plain objects, `PortfolioConfig` and
`PortfolioUtils`. That's the only two globals in the whole codebase.

## How components interact

There's no central "app" object wiring things together — each component
file finds its own DOM elements via `document.getElementById`/`querySelector`
and does nothing if they're not present (see the `if (!el) return;` guards).
This means:

- Deleting a `<script>` tag for a component you don't need is safe; nothing
  else depends on it.
- Sections that just need a fade-in-on-scroll (About, Footer, and part of
  Projects/Contact) call `PortfolioUtils.observeReveal(element)` instead of
  each hand-rolling an `IntersectionObserver`.

## How to add a new section

1. Add a `<section class="my-section" id="my-section">` inside `<main>` in
   `index.html`, and a nav link pointing at `#my-section` if it should be
   reachable from the header/footer nav.
2. Create `css/sections/my-section.css` with the section's layout/styles.
   If it needs the divider rule at its top or a scroll-reveal fade-in, add
   its selector to `css/components/section-divider.css` /
   `css/components/reveal.css` rather than re-declaring the shared
   properties.
3. Register the stylesheet in `index.html`'s `<head>`, in the `sections/`
   group, before `css/themes/dark.css`.
4. If the section needs `body.dark-mode` overrides, add them to
   `css/themes/dark.css` under a comment header for the section — don't put
   `body.dark-mode` rules back into the section file.
5. If the section needs JS (beyond reveal-on-scroll), add
   `js/sections/my-section.js` (or `js/components/` if it's an interactive
   widget) as an IIFE, and add its `<script defer>` tag after
   `constants.js`/`scroll-observer.js`.

## How to add a new project card

Project cards live in `.projects-grid` inside the `#project` section of
`index.html`. Copy an existing `<article class="project-card project-card--N" style="--i: N;" tabindex="0">` block, give it the next `--N` index and
grid-area name, and add that grid-area to `.projects-grid`'s
`grid-template-areas` in `css/sections/projects.css` (desktop, tablet, and
mobile breakpoints). Card visuals (`.project-card*`) live in
`css/components/project-card.css` — you shouldn't need to touch it for a
new card, only for a new *kind* of card.

## How to add a new scroll-reveal animation

Don't hand-roll another `IntersectionObserver`. In JS, call
`PortfolioUtils.observeReveal(element)` (from `js/utils/scroll-observer.js`)
— it adds `.in-view` to the element once it scrolls into view and then
stops watching. In CSS, give the element(s) `opacity: 0; transform:
translateY(16px);` and a `transition`, then define
`.your-section.in-view .your-element { opacity: 1; transform: translateY(0); }`.
If the element is one of About/Contact/Footer's existing reveal targets,
its hidden-state and `prefers-reduced-motion` reset are already covered by
`css/components/reveal.css` — just add the section-specific `transition`
and `.in-view` rule next to the others.

## Best practices in this codebase

- Every interactive JS component null-checks its DOM elements before
  wiring up listeners, so a missing element degrades silently instead of
  throwing.
- Distinct color values are kept as distinct tokens in `variables.css`
  (e.g. `#555` and `#666` are separate muted-text tokens) rather than
  merged, so refactors don't quietly shift the palette.
- Animation durations/delays are **not** all pulled into one shared
  constant — About (350ms) and Contact/Footer (400ms) use deliberately
  different reveal timing, and forcing them to match would be a real
  behavior change, not a cleanup.
- The hero/contact/footer "social link" buttons are visually distinct
  enough (different sizes, dark vs. light context, icon-only vs.
  icon+label+arrow) that they were left as separate CSS rather than forced
  into one shared component — a candidate for later if a fourth variant
  shows up and the pattern solidifies.
- The hero `<h3>` tagline and the duplicated project-image SVG glyphs are
  pre-existing minor semantic quirks, not something this refactor changed;
  flagged here rather than silently "fixed" mid-refactor.
