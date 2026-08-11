/*
  Mobile navigation.

    - the panel tracks the finger 1:1 from wherever it was grabbed
    - dragging the wrong way rubber-bands instead of hitting a wall
    - release hands the finger's velocity straight to a spring
    - the spring can be grabbed again mid-flight and starts from wherever the
      panel actually is on screen, not from where it was headed

  The panel also dismisses along the path it arrived on — up and out, toward
  the button that opened it — so the spatial relationship stays obvious.
*/

(function mobileMenu() {
  "use strict";

  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  if (!navToggle || !primaryNav) return;

  const navItems = Array.from(primaryNav.children);
  navItems.forEach((item, index) => {
    item.style.setProperty("--i", index);
    item.style.setProperty("--ri", navItems.length - 1 - index);
  });

  /* Below this, a release is judged on where the flick was *going*; above it,
     the direction of the flick decides on its own. Velocity beats position:
     a fast upward flick from near the top should still dismiss. */
  const FLICK_VELOCITY = 300;
  const HYSTERESIS = 10;

  let animation = null;
  let dragging = false;
  let decided = false;
  let suppressClick = false;
  let pointerId = null;
  let startY = 0;
  let startX = 0;
  let panelHeight = 0;
  const tracker = PortfolioMotion.createVelocityTracker();

  const isOpen = () => primaryNav.classList.contains("is-open");

  /* Everything that moves the panel goes through here, so the drag and the
     spring are writing the same two composited properties. */
  const applyOffset = (y) => {
    primaryNav.style.transform = `translateY(${y}px)`;
    /* Large moving surfaces read better semi-transparent while they travel. */
    const travelled = Math.min(1, Math.abs(Math.min(y, 0)) / (panelHeight || 1));
    primaryNav.style.opacity = String(1 - travelled * 0.85);
  };

  const clearOffset = () => {
    primaryNav.style.transform = "";
    primaryNav.style.opacity = "";
  };

  const stopAnimation = () => {
    if (animation) animation.stop();
    animation = null;
    primaryNav.classList.remove("is-animating");
  };

  const closeNav = () => {
    stopAnimation();
    dragging = false;
    primaryNav.classList.remove("is-open", "is-dragging");
    clearOffset();
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  const openNav = () => {
    stopAnimation();
    clearOffset();
    primaryNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
  };

  navToggle.addEventListener("click", () => {
    if (isOpen()) {
      closeNav();
    } else {
      openNav();
    }
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#primaryNav") && !event.target.closest("#navToggle")) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  /* --- Swipe to dismiss ------------------------------------------------ */

  /* The panel is only a sheet at mobile widths; on desktop it's the nav bar
     itself and must never move. */
  const isSheet = () => window.matchMedia("(max-width: 960px)").matches;

  /* Read the transform actually on screen right now. On an interrupt this is
     the only correct starting point — starting from the target value is what
     makes an interrupted animation visibly jump. */
  const presentationOffset = () => {
    const transform = getComputedStyle(primaryNav).transform;
    /* An untransformed element computes to the literal "none", which the
       matrix parser rejects. */
    if (!transform || transform === "none") return 0;
    return new DOMMatrixReadOnly(transform).m42;
  };

  primaryNav.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !isOpen() || !isSheet()) return;

    /* Grabbing a moving panel takes it over from wherever it is — the thought
       and the gesture happen in parallel, so there is nothing to wait for. */
    const liveOffset = animation ? presentationOffset() : 0;
    stopAnimation();

    pointerId = event.pointerId;
    /* A fresh press is always allowed to become a click. */
    suppressClick = false;
    dragging = false;
    decided = false;
    startX = event.clientX;
    startY = event.clientY - liveOffset;
    panelHeight = primaryNav.offsetHeight;
    tracker.reset();
    tracker.add(event.clientY, event.timeStamp);
  });

  primaryNav.addEventListener("pointermove", (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;

    const dy = event.clientY - startY;
    const dx = event.clientX - startX;

    if (!decided) {
      if (Math.abs(dy) < HYSTERESIS && Math.abs(dx) < HYSTERESIS) return;
      decided = true;
      /* A mostly-horizontal drag isn't a dismiss; let it go. */
      if (Math.abs(dx) > Math.abs(dy)) {
        pointerId = null;
        return;
      }
      dragging = true;
      primaryNav.setPointerCapture(event.pointerId);
      primaryNav.classList.add("is-dragging");
    }

    tracker.add(event.clientY, event.timeStamp);
    /* Up is the dismiss direction and tracks 1:1. Down is a boundary: resist
       progressively rather than stopping dead, so it stays responsive while
       making clear there's nothing further that way. */
    applyOffset(dy <= 0 ? dy : PortfolioMotion.rubberband(dy, panelHeight));
  });

  const endDrag = (event) => {
    if (pointerId === null || (event && event.pointerId !== pointerId)) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    primaryNav.classList.remove("is-dragging");
    /* The click that follows a dismiss swipe would otherwise navigate to
       whichever link the finger lifted over. */
    suppressClick = true;

    const from = presentationOffset();
    const velocity = tracker.velocity();
    /* Where the flick is heading, not where the finger happened to stop. */
    const projected = from + PortfolioMotion.project(velocity);

    const dismiss =
      Math.abs(velocity) > FLICK_VELOCITY
        ? velocity < 0
        : projected < -panelHeight / 2;

    primaryNav.classList.add("is-animating");

    if (dismiss) {
      animation = PortfolioMotion.spring({
        from,
        to: -(panelHeight + 24),
        velocity,
        damping: 1,
        response: 0.3,
        onUpdate: applyOffset,
        onComplete: () => {
          closeNav();
          /*
            The panel is already off-screen where the spring left it. Clearing
            the inline transform hands it back to the closed CSS rule, which
            sits much lower — and the close transition would happily animate
            that gap, sliding a ghost of the panel back down. Suppress
            transitions for the one frame it takes to land.
          */
          primaryNav.classList.add("is-animating");
          requestAnimationFrame(() => {
            primaryNav.classList.remove("is-animating");
          });
        },
      });
      return;
    }

    /* Settling back is momentum-driven — a flick preceded it — so a little
       overshoot here is honest rather than decorative. */
    animation = PortfolioMotion.spring({
      from,
      to: 0,
      velocity,
      damping: 0.8,
      response: 0.3,
      onUpdate: applyOffset,
      onComplete: () => {
        stopAnimation();
        clearOffset();
      },
    });
  };

  primaryNav.addEventListener("pointerup", endDrag);
  primaryNav.addEventListener("pointercancel", endDrag);

  /* A drag that ends on a link must not also navigate. */
  primaryNav.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
})();
