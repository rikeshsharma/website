/*
  Pointer tracking for the hero glow (see SKILL.md §3, §4, §11).

  The naive version writes the pointer's coordinates straight onto the orbs.
  That produces motion that is technically correct and feels wrong: the light
  stops dead the instant the mouse does, which reads as a cursor decoration
  rather than as illumination. Running the position through a spring gives it
  weight — it accelerates after the pointer, overshoots nothing, and coasts to
  a stop on its own.

  Two separate springs, one per axis, deliberately. A single spring on the 2D
  distance desyncs the moment X and Y are moving at different speeds, which
  bends what should be a straight diagonal into a curve.

  Note this is the one place in the project where lag is *wanted*. Everywhere
  else latency is the enemy, because the user is manipulating an object and it
  has to stay under the finger. Nobody is dragging the glow — it's ambient
  light, and light that trails slightly is what makes it read as soft.
*/

(function heroGlow() {
  "use strict";

  const hero = document.querySelector(".hero");
  const glow = hero && hero.querySelector(".hero-glow");
  if (!glow) return;

  const orbs = Array.from(glow.querySelectorAll(".hero-orb"));
  if (!orbs.length) return;

  /*
    Reduced motion: the CSS already stops the drift, and bailing out here
    leaves the orbs in their resting composition. The section still looks
    considered — it just doesn't chase anything.
  */
  if (PortfolioMotion.prefersReducedMotion()) return;

  /* How far each orb travels relative to the pointer. Read from CSS so the
     parallax stays tunable next to the sizes it has to look right against. */
  const depths = orbs.map(
    (orb) => parseFloat(getComputedStyle(orb).getPropertyValue("--orb-depth")) || 0
  );

  let springX = null;
  let springY = null;

  const render = () => {
    /* The springs settle synchronously in some paths, which can call this
       before both handles exist. */
    if (!springX || !springY) return;
    const x = springX.value;
    const y = springY.value;
    orbs.forEach((orb, i) => {
      const d = depths[i];
      orb.style.transform = `translate3d(${x * d}px, ${y * d}px, 0)`;
    });
  };

  const spring = () =>
    PortfolioMotion.spring({
      from: 0,
      to: 0,
      /* Critically damped: light doesn't bounce. */
      damping: 1,
      /* Slower than the 0.3–0.4s used for controls — this is the trailing
         weight described above, not a response to a command. */
      response: 0.65,
      onUpdate: render,
    });

  springX = spring();
  springY = spring();

  /*
    The hero's position changes as the page scrolls, so the rect can't be
    measured once. It's also a layout read, so it can't happen on every
    pointermove without risking thrash — measure lazily instead, at most once
    after each scroll or resize.
  */
  let bounds = null;
  let stale = true;

  const markStale = () => {
    stale = true;
  };

  window.addEventListener("scroll", markStale, { passive: true });
  window.addEventListener("resize", markStale, { passive: true });

  hero.addEventListener(
    "pointermove",
    (event) => {
      /* Touch has no hover: a finger would drag the light around and then
         abandon it wherever it lifted. Mouse and pen only. */
      if (event.pointerType === "touch") return;

      if (stale || !bounds) {
        bounds = hero.getBoundingClientRect();
        stale = false;
      }

      /* Offset from the centre of the hero, so the resting state is 0,0. */
      springX.retarget(event.clientX - (bounds.left + bounds.width / 2));
      springY.retarget(event.clientY - (bounds.top + bounds.height / 2));
    },
    { passive: true }
  );

  /* Drift back to the resting composition when the pointer leaves — the same
     spring carries it home, so there's no snap. */
  hero.addEventListener("pointerleave", () => {
    springX.retarget(0);
    springY.retarget(0);
  });
})();
