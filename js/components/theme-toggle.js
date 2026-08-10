/*
  Theme toggle.

  The site ships dark: `<body class="dark-mode">` is set in the markup, so the
  first paint is already dark and there's no white frame to flash. That means
  the button's label has to start out saying "Switch to light mode" — so it is
  derived from the class here rather than assumed, and re-derived on every
  toggle. Hard-coding the starting label in two places is how it ends up
  announcing the wrong action the next time the default changes.
*/

(function themeToggle() {
  "use strict";

  const themeToggleButton = document.getElementById("themeToggle");
  if (!themeToggleButton) return;

  /* Colors the browser's own UI on mobile, so the chrome above the page
     matches the page instead of framing a dark site in a white bar. */
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const syncToTheme = () => {
    const darkMode = document.body.classList.contains("dark-mode");

    themeToggleButton.setAttribute(
      "aria-label",
      darkMode ? "Switch to light mode" : "Switch to dark mode"
    );

    if (themeColorMeta) {
      /*
        Read the *token*, not the computed `background-color`. Body transitions
        its background, so immediately after the class flips the computed value
        is still the outgoing colour at 0% progress — sampling it here left the
        browser chrome one theme behind, permanently. A custom property has no
        transition, so it reports the destination straight away.
      */
      const pageColor = getComputedStyle(document.body)
        .getPropertyValue("--color-page")
        .trim();
      if (pageColor) themeColorMeta.setAttribute("content", pageColor);
    }
  };

  syncToTheme();

  themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    syncToTheme();
  });
})();
