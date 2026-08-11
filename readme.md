# Rikesh Sharma — Portfolio Website

A single-page portfolio built with plain HTML, CSS, and vanilla JavaScript.
No build step, no package manager, no framework — open `index.html` in a
browser, or serve the folder with any static file server, and it runs.

```sh
python3 -m http.server 8080
```

The site ships **dark by default** (`<body class="dark-mode">`), with a
toggle in the header for light.

## Stack

- HTML5
- CSS3 (custom properties, Grid, Flexbox — no preprocessor)
- Vanilla JavaScript (ES6+, classic scripts — no bundler, no modules)
- Inline SVG

## Design system

| File | Owns |
| --- | --- |
| `css/variables.css` | colour, radius, and the hero-glow / toggle palettes |
| `css/base/motion.css` | easing curves, response times, movement amounts, translucent materials |
| `css/base/typography.css` | system font stack, tracking and leading scales |

Three ideas run through the whole codebase:

- **Springs, not durations.** `--ease-enter` / `--ease-exit` are an exact
  cubic-bezier *mirrored pair*, so a reversible transition returns along the
  path it arrived on. `--response-*` are response times (how fast a value
  reaches its target), not arbitrary durations.
- **Accessibility lives in the tokens.** `motion.css` re-points
  `--motion-shift`, `--press-scale`, `--material-*` and friends under
  `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast`. That's why almost no component carries its own
  accessibility overrides — collapsing `--motion-shift` to `0px` turns every
  reveal into a cross-fade in place, everywhere, at once.
- **Tracking is size-specific.** A single `letter-spacing` is wrong
  somewhere: large text needs negative tracking, small text slightly
  positive. Tokens are applied next to the `font-size` they belong with, in
  the file that owns that element.

## Project structure

```
/
├── index.html
├── assets/
│   ├── brand/            logo, favicon, brand-kit source files
│   └── image/            profile photo, company logos, project thumbnails
├── css/
│   ├── variables.css     design tokens: color, radius, glow, toggle
│   ├── base/
│   │   ├── reset.css     body defaults, smooth-scroll opt-in
│   │   ├── motion.css    easing, response, materials + a11y media queries
│   │   └── typography.css font stack, tracking/leading scales
│   ├── layout/
│   │   └── header.css    sticky translucent header, nav, hamburger menu
│   ├── components/       small reusable pieces, used by more than one section
│   │   ├── theme-toggle.css
│   │   ├── section-divider.css
│   │   ├── reveal.css
│   │   ├── project-card.css
│   │   └── hero-glow.css   pointer-following ambient light behind the hero
│   ├── sections/         one file per <section>, page-specific layout
│   │   ├── hero.css
│   │   ├── carrier.css
│   │   ├── skills.css
│   │   ├── projects.css
│   │   ├── about.css
│   │   ├── contact.css
│   │   └── footer.css
│   └── themes/
│       └── dark.css      dark-mode token overrides (see "Theming")
└── js/
    ├── config/
    │   └── constants.js       shared config (see "Why no ES modules" below)
    ├── utils/
    │   ├── scroll-observer.js reveal-on-scroll IntersectionObserver factory
    │   └── motion.js          springs, momentum projection, rubber-banding
    ├── components/            interactive widgets
    │   ├── press.js           instant press feedback, delegated document-wide
    │   ├── nav-scroll.js      header scroll-edge effect + nav scroll spy
    │   ├── mobile-menu.js     hamburger menu + swipe-to-dismiss
    │   ├── hero-glow.js       pointer tracking for the hero lights
    │   ├── skills-marquee.js  draggable, flickable skills rows
    │   ├── theme-toggle.js
    │   ├── project-cards.js
    │   └── contact-form.js
    └── sections/              sections with no interaction beyond reveal-on-scroll
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
- **CSS custom properties**: grouped by role — `--color-*`, `--radius-*`
  (`variables.css`); `--ease-*`, `--response-*`, `--motion-*`, `--press-*`,
  `--material-*` (`motion.css`); `--tracking-*`, `--leading-*`
  (`typography.css`). Alpha/tinted colors are built from an accompanying
  `--color-x-rgb` triple via `rgba(var(--color-x-rgb), <alpha>)`, so the
  exact opacity used at each call site stays visible instead of hiding
  behind a wall of near-duplicate fixed-alpha tokens.

## How the pieces load

`<link>` tags in `index.html`'s `<head>` are ordered deliberately:

```
variables → base → layout → components → sections → themes/dark
```

`themes/dark.css` loads **last** so its overrides reliably win on
selector-specificity ties, no `!important` needed.

`<script defer>` tags at the end of `<head>` are ordered by dependency:
`constants.js`, `scroll-observer.js` and `motion.js` first (other scripts
call into them), then components/sections. `defer` guarantees they execute
in that order, after the DOM is parsed.

### Why no ES modules

Classic `<script>` tags were used instead of `<script type="module">`. The
project's one hard constraint is that `index.html` keeps working when
opened directly from disk (`file://`) — no server required. Native ES
modules are blocked by Chrome/Firefox/Safari under `file://` due to
CORS-on-file restrictions, so `import`/`export` would silently break that
workflow.

Instead, each JS file is an IIFE (`(function () { ... })();`) so it doesn't
leak its internals, and the three things that genuinely need sharing live in
plain top-level objects:

| Global | Provides |
| --- | --- |
| `PortfolioConfig` | shared constants (observer threshold, storage keys) |
| `PortfolioUtils` | `observeReveal()` |
| `PortfolioMotion` | `spring()`, `project()`, `rubberband()`, `createVelocityTracker()`, `prefersReducedMotion()` |

Those are the only three, and all three must load before the components that
use them.

## Theming

**Dark mode is a token override, not a set of component overrides.**
Components only ever name semantic tokens; `css/themes/dark.css` re-points
those tokens under `body.dark-mode` and the components follow on their own.

The rule when adding anything colored: **never hard-code a color, and never
add a `body.dark-mode` rule to fix one.** If a component looks wrong in dark
mode it is almost always naming the wrong token, not missing an override.

| Token | Means |
| --- | --- |
| `--color-page` | the page background |
| `--color-surface` / `--color-surface-rgb` | raised surfaces: cards, chips, inputs, popovers, nav |
| `--color-brand` / `--color-brand-rgb` | the accent, and any fill made of it |
| `--color-on-brand` | text/icons sitting **on** a brand fill |
| `--color-heading` → `--color-text-faint-2` | the text ramp, strongest to faintest |
| `--color-border`, `--color-hairline-rgb` | ink: borders and 1px rules |

Three distinctions are load-bearing and easy to get wrong:

- **`--color-on-brand` is not white.** In dark mode the brand lightens to
  clear contrast on a near-black ground, so white-on-brand would collapse to
  ~2.9:1. `--color-on-brand` darkens to compensate.
- **`--color-black-rgb` is shadows only and stays black in both themes** — a
  shadow is absent light, so it doesn't invert. A 1px rule *is* ink and does,
  so it uses `--color-hairline-rgb`.
- **`--color-white` still means white** and is deliberately unthemed. Only
  two things use it: the bright edge on translucent chrome, and the disc
  behind the company logos in the timeline (dark PNGs on transparency —
  inverting that disc makes them vanish).

The palette is warm rather than neutral grey, to sit with the terracotta
brand. Every text token clears WCAG AA (≥4.5:1) against **both**
`--color-page` and `--color-surface` — check the tighter of the two when
adding a color.

Everything remaining in `dark.css` beyond the token block is a documented
exception. Read them before adding another; the file was 78 component
overrides once, and that is how it got there.

## CSS transitions vs. JS springs

The dividing line is whether the user can **grab** the thing.

- **Can't grab it** (hover, focus, reveal-on-scroll, theme switch) → CSS
  transition with the shared easing/response tokens.
- **Can grab it** (the skills marquee, the mobile menu's swipe-to-dismiss) →
  `PortfolioMotion`, driven by `requestAnimationFrame`.

A CSS transition can't be interrupted, redirected, or handed a gesture's
release velocity — grab a closing panel mid-flight and it insists on
finishing before it reopens. `PortfolioMotion.spring()` animates from the
*current* value and its `retarget()` carries position **and velocity**
through a reversal, which is what stops a direction change from feeling like
hitting a wall.

Only ever animate `transform` and `opacity` — they're the compositor-friendly
pair. Anything else repaints.

## How to add a new section

1. Add a `<section class="my-section" id="my-section">` inside `<main>` in
   `index.html`, and a nav link pointing at `#my-section` if it should be
   reachable from the header/footer nav. A nav link also opts the section
   into the scroll spy automatically.
2. Create `css/sections/my-section.css` with the section's layout/styles.
   If it needs the divider rule at its top or a scroll-reveal fade-in, add
   its selector to `css/components/section-divider.css` /
   `css/components/reveal.css` rather than re-declaring the shared
   properties.
3. Register the stylesheet in `index.html`'s `<head>`, in the `sections/`
   group, before `css/themes/dark.css`.
4. Use the semantic color tokens (see "Theming") and it will work in both
   themes with no dark-mode rules at all. Needing one is a signal you named
   the wrong token.
5. If the section needs JS (beyond reveal-on-scroll), add
   `js/sections/my-section.js` (or `js/components/` if it's an interactive
   widget) as an IIFE, and add its `<script defer>` tag after
   `constants.js` / `scroll-observer.js` / `motion.js`.

## How to add a new project card

Project cards live in `.projects-grid` inside the `#project` section of
`index.html`. Copy an existing `<article class="project-card project-card--N" style="--i: N;" tabindex="0">` block, give it the next `--N` index and
grid-area name, and add that grid-area to `.projects-grid`'s
`grid-template-areas` in `css/sections/projects.css` (desktop, tablet, and
mobile breakpoints). Card visuals (`.project-card*`) live in
`css/components/project-card.css` — you shouldn't need to touch it for a
new card, only for a new *kind* of card.

Note the card deliberately splits its two animations across two properties:
the scroll reveal uses `translate`, the hover/press reaction uses
`transform`. They compose, so neither has to win a specificity fight — which
they previously did, silently killing the hover scale.

## How to add a new scroll-reveal animation

Don't hand-roll another `IntersectionObserver`. In JS, call
`PortfolioUtils.observeReveal(element)` (from `js/utils/scroll-observer.js`)
— it adds `.in-view` to the element once it scrolls into view and then
stops watching. In CSS, give the element(s)
`opacity: 0; transform: translateY(var(--motion-shift));` and a `transition`,
then define
`.your-section.in-view .your-element { opacity: 1; transform: translateY(0); }`.

Use `var(--motion-shift)` rather than a literal `16px`: it collapses to `0px`
under `prefers-reduced-motion`, turning the reveal into a cross-fade in place
with no extra rules. If the element is one of About/Contact/Footer's existing
reveal targets, its hidden state is already covered by
`css/components/reveal.css` — just add the section-specific `transition` and
`.in-view` rule next to the others.

## Best practices in this codebase

- Every interactive JS component null-checks its DOM elements before
  wiring up listeners, so a missing element degrades silently instead of
  throwing.
- Feedback lands on **pointer-down**, not on click — see
  `js/components/press.js`, which also implements the other half of the rule:
  a press cancels if you drag ~10px away, and re-arms if you drag back.
- Gesture handlers commit to a direction only after a ~10px threshold, and
  give the pointer back to the browser if the drag turns out to be a page
  scroll. A drag that ends over a link must not also navigate — both gesture
  surfaces suppress the synthetic `click` that follows.
- Distinct color values are kept as distinct tokens in `variables.css`
  (e.g. `#555` and `#666` are separate muted-text tokens) rather than
  merged, so refactors don't quietly shift the palette.
- The hero/contact/footer "social link" buttons are visually distinct
  enough (different sizes, dark vs. light context, icon-only vs.
  icon+label+arrow) that they were left as separate CSS rather than forced
  into one shared component — a candidate for later if a fourth variant
  shows up and the pattern solidifies.
- The hero `<h3>` tagline and the duplicated project-image SVG glyphs are
  pre-existing minor semantic quirks, flagged here rather than silently
  "fixed" mid-refactor.

## Known gaps

- No persistence on the theme toggle: switching to light resets to dark on
  reload. Storing the choice needs a small blocking script in `<head>` to
  read it before first paint, or the page flashes.
- `--tracking-heading`, `--leading-title` and a few siblings are defined but
  not yet applied — several sections still use literal values that happen to
  match. Swapping them is value-identical, just not done.
