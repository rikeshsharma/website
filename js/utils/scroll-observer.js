/*
  Shared reveal-on-scroll observer. Replaces four near-identical
  IntersectionObserver blocks (projects grid, about, contact, footer) that
  all did the same thing: add "in-view" once the element enters the
  viewport, then stop watching it.
*/

const PortfolioUtils = {
  observeReveal(element, { threshold = PortfolioConfig.OBSERVER_THRESHOLD } = {}) {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
  },
};
