/*
  Two small jobs, both about answering questions the user hasn't had to ask:

  1. The floating nav only deepens its shadow once content is actually passing
     underneath it. A permanent divider separates things that aren't
     overlapping yet; a scroll edge effect appears exactly when it's needed.

  2. Every screen should answer "where am I". The nav marks the section
     currently occupying the middle of the viewport, so position in the page
     is always visible rather than inferred.
*/

(function navScroll() {
  "use strict";

  const header = document.querySelector("header");
  if (!header) return;

  /* --- Scroll edge effect ---------------------------------------------- */

  let scrolled = null;
  let pending = false;

  const syncEdge = () => {
    pending = false;
    const next = window.scrollY > 8;
    /* Only touch the DOM on an actual change — a class write per scroll event
       is exactly the kind of avoidable work that costs frames. */
    if (next === scrolled) return;
    scrolled = next;
    header.classList.toggle("is-scrolled", next);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(syncEdge);
    },
    { passive: true }
  );

  syncEdge();

  /* --- Scroll spy ------------------------------------------------------ */

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  if (!sections.length) return;

  /* Only nav links that actually point at a section on this page — the blog
     link goes elsewhere and is never "current". */
  const links = new Map();
  sections.forEach((section) => {
    const link = header.querySelector(`nav ul a[href="#${section.id}"]`);
    if (link) links.set(section, link);
  });
  if (!links.size) return;

  let current = null;

  const setCurrent = (section) => {
    if (section === current) return;
    if (current && links.has(current)) {
      links.get(current).removeAttribute("aria-current");
    }
    current = section;
    if (current && links.has(current)) {
      links.get(current).setAttribute("aria-current", "true");
    }
  };

  /*
    The band is a thin horizontal slice across the middle of the viewport: a
    section is "current" while it occupies that slice. Anchoring to the middle
    rather than the top means the highlight changes when the section you're
    reading changes, not when its edge happens to clear the header.
  */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target);
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
})();
