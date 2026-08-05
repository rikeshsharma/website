(function projectCards() {
  "use strict";

  const projectsGrid = document.querySelector(".projects-grid");
  if (!projectsGrid) return;

  PortfolioUtils.observeReveal(projectsGrid);

  projectsGrid.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
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
