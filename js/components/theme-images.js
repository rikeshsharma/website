/*
  Per-theme image sources.

  Some artwork can't be themed with tokens — the project card images and the
  timeline's company logos are opaque PNGs with their own baked-in background,
  so each one ships a light and a dark file. An <img> carries both paths as
  data attributes and this swaps `src` when the theme flips:

    <img src="…_dark.png"
         data-src-light="…png"
         data-src-dark="…_dark.png">

  Why not two <img>s toggled with CSS, or a `body.dark-mode` background-image
  rule per card: the two-element version makes the browser fetch both variants
  on every load — six extra megabytes for images that are never painted — and
  the CSS version needs one override per card, which is exactly the pattern
  css/themes/dark.css was rewritten to get rid of. This is one rule for all of
  them, and only the active variant is ever requested.

  `src` in the markup must be the **dark** file, matching the `dark-mode` class
  the body ships with, so the first paint is already correct and nothing swaps
  on load. With JS off the theme can't change either, so the two stay in step.

  This watches the body class rather than being called by theme-toggle.js: the
  images then follow whoever flips the theme, the same way the token-driven
  components do, with no ordering contract between the two files.
*/

(function themeImages() {
  "use strict";

  const images = document.querySelectorAll("img[data-src-light][data-src-dark]");
  if (!images.length) return;

  /*
    Swapping `src` directly blanks the element until the new file decodes — on
    a 1MB PNG that's a visible hole in the card. So the next variant is loaded
    off-screen first and only assigned once it's ready; until then the outgoing
    image stays painted.
  */
  const swapWhenReady = (image, nextSrc) => {
    /* Records what this element is *currently* headed towards, so a fast
       double-toggle can't have the first (slower) load land last and leave the
       card showing the wrong theme. */
    image.dataset.themePending = nextSrc;

    const commit = () => {
      if (image.dataset.themePending !== nextSrc) return;
      image.src = nextSrc;
      delete image.dataset.themePending;
    };

    const loader = new Image();
    loader.onload = commit;
    /* A missing file leaves the other theme's image in place — wrong tone
       beats a broken-image icon. */
    loader.onerror = () => {
      if (image.dataset.themePending === nextSrc) delete image.dataset.themePending;
    };
    loader.src = nextSrc;
    if (loader.complete) commit();
  };

  const syncToTheme = () => {
    const darkMode = document.body.classList.contains("dark-mode");

    images.forEach((image) => {
      const nextSrc = darkMode ? image.dataset.srcDark : image.dataset.srcLight;
      if (!nextSrc) return;

      /* Compare against the attribute, not `image.src` — the property is
         resolved to an absolute URL and would never match the relative path
         in the markup, re-swapping every image on every toggle. */
      if (image.getAttribute("src") === nextSrc) {
        delete image.dataset.themePending;
        return;
      }

      swapWhenReady(image, nextSrc);
    });
  };

  syncToTheme();

  new MutationObserver(syncToTheme).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
})();
