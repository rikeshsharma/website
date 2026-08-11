(function projectCards() {
  "use strict";

  const projectsGrid = document.querySelector(".projects-grid");
  if (!projectsGrid) return;

  PortfolioUtils.observeReveal(projectsGrid);

  projectsGrid.querySelectorAll(".project-card").forEach((card, index) => {
    /*
      The reveal stagger. This was a hand-written `style="--i: N"` on every
      article, which is one more thing that had to be renumbered by hand when
      the project list changed — and getting it wrong is invisible until the
      section scrolls into view. Derived from DOM order instead; the CSS still
      falls back to `var(--i, 0)` if this never runs.
    */
    card.style.setProperty("--i", index);

    card.addEventListener("click", (event) => {
      /*
        On pointer devices the title's repo link is stretched across the whole
        card, so nearly every click reaches this handler from the anchor.
        Following the link and toggling the panel are different intents — the
        link wins, and the card is left exactly as the user found it.
      */
      if (event.target.closest("a[href]")) return;

      const wasOpen = card.classList.contains("is-open");
      projectsGrid
        .querySelectorAll(".project-card.is-open")
        .forEach((open) => open.classList.remove("is-open"));
      if (!wasOpen) {
        card.classList.add("is-open");
      }
    });
  });
})();
