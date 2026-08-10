/*
  Draggable skills marquee (see SKILL.md §2, §3, §5, §6, §10).

  The rows used to be a CSS `@keyframes` loop that paused on hover. That looks
  right and feels wrong the moment you reach for it: a keyframe animation
  can't be grabbed, can't inherit the velocity of a flick, and starts and
  stops with a hard cut. Anything a finger can touch belongs on a rAF loop
  where position and velocity are real values you can hand back and forth.

  So the row is now one continuous velocity:

    - ambient drift when untouched
    - 1:1 with the pointer while dragged (§2 — content sticks to the finger)
    - the finger's release velocity, decayed by Apple's scroll deceleration
      curve, easing back into the ambient drift (§5, §6)

  There is no seam between those states, because none of them ever assigns a
  position — they only ever change the velocity the same loop is integrating.
  Hover doesn't pause the animation either; it drives ambient to zero and lets
  the same decay carry it there (§3 — never hard-cut velocity).
*/

(function skillsMarquee() {
  "use strict";

  /* Per-millisecond retention. 0.998 is Apple's "normal scroll feel". */
  const DECELERATION = 0.998;
  /* Movement before a gesture commits to being a horizontal drag (§10). */
  const HYSTERESIS = 10;

  /*
    Reduced motion means no ambient travel at all — a strip of text sliding
    forever is exactly the kind of large, looping motion the setting exists to
    stop. The stylesheet already parks the row and hides the duplicate group,
    so the honest thing is to leave it alone rather than animate it in JS.
  */
  if (PortfolioMotion.prefersReducedMotion()) return;

  document.querySelectorAll(".marquee-row").forEach((row) => {
    const track = row.querySelector(".marquee-track");
    const group = track && track.querySelector(".marquee-group");
    if (!track || !group) return;

    /* Take the row off the CSS keyframes; JS owns the transform now. */
    track.classList.add("is-interactive");
    row.classList.add("is-draggable");

    const direction = track.classList.contains("marquee-track--right") ? 1 : -1;
    const durationSeconds =
      parseFloat(getComputedStyle(track).getPropertyValue("--marquee-duration")) || 45;

    /* One group's width is exactly one loop: the second group is an identical
       copy, so shifting by this much is visually indistinguishable. */
    let loopWidth = group.getBoundingClientRect().width;
    let baseSpeed = (loopWidth / durationSeconds) * direction;

    let offset = direction === 1 ? -loopWidth : 0;
    let velocity = baseSpeed;
    let hovered = false;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startOffset = 0;
    let decided = false;
    let lastFrame = performance.now();
    let running = false;
    let visible = false;
    let suppressClick = false;

    const tracker = PortfolioMotion.createVelocityTracker();

    const render = () => {
      /* Wrap into a single loop's worth so the number never grows unbounded
         over a long session. */
      offset %= loopWidth;
      if (offset > 0) offset -= loopWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const frame = (now) => {
      const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
      lastFrame = now;

      if (!dragging) {
        const ambient = hovered ? 0 : baseSpeed;
        /* Exponential decay toward the ambient drift. Same curve whether
           we're bleeding off a flick or coasting to a stop under the cursor,
           so every transition between the two is continuous. */
        const retained = Math.pow(DECELERATION, dt * 1000);
        velocity = ambient + (velocity - ambient) * retained;
        offset += velocity * dt;
        render();
      }

      /* Scrolled out of sight, and nobody holding on to it — stop burning
         frames on motion nobody can see. */
      if (!visible && !dragging) {
        running = false;
        return;
      }

      requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(frame);
    };

    row.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      /* A fresh press is always allowed to become a click, whatever the
         previous gesture did. */
      suppressClick = false;
      dragging = false;
      decided = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startOffset = offset;
      tracker.reset();
      tracker.add(event.clientX, event.timeStamp);
      start();
    });

    row.addEventListener("pointermove", (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!decided) {
        /* Detect both plausible gestures in parallel, then cancel the loser
           once intent is clear: past the slop, whichever axis is dominant
           wins. A vertical drag is the page scrolling, and must stay the
           browser's — so we give up the pointer entirely. */
        if (Math.abs(dx) < HYSTERESIS && Math.abs(dy) < HYSTERESIS) return;
        decided = true;
        if (Math.abs(dy) > Math.abs(dx)) {
          pointerId = null;
          return;
        }
        dragging = true;
        /* Capture so the row keeps tracking once the finger leaves it. */
        row.setPointerCapture(event.pointerId);
        row.classList.add("is-dragging");
      }

      /* 1:1 with the pointer, measured from where the grab started — so the
         content stays under the exact spot the finger landed on. */
      offset = startOffset + dx;
      tracker.add(event.clientX, event.timeStamp);
      render();
    });

    const endDrag = (event) => {
      if (pointerId === null || (event && event.pointerId !== pointerId)) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;
      row.classList.remove("is-dragging");
      /* The `click` that follows this pointerup belongs to the drag, not to
         whatever chip the finger happened to be over — flag it here, because
         by the time it fires the dragging state is already gone. */
      suppressClick = true;
      /* Hand the finger's release velocity straight to the coast, so there's
         no visible seam between dragging and animating. */
      velocity = tracker.velocity();
      lastFrame = performance.now();
    };

    row.addEventListener("pointerup", endDrag);
    row.addEventListener("pointercancel", endDrag);

    row.addEventListener("pointerenter", (event) => {
      /* Touch "enters" on contact and would freeze the row under the finger
         after release; hover-to-pause is a mouse affordance. */
      if (event.pointerType === "touch") return;
      hovered = true;
    });
    row.addEventListener("pointerleave", () => {
      hovered = false;
    });

    /* A drag that crosses a chip must not also read as a click on it. */
    row.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        const width = group.getBoundingClientRect().width;
        if (width <= 0 || width === loopWidth) return;
        /* Keep the same fraction through the loop so a resize doesn't jump. */
        const progress = offset / loopWidth;
        loopWidth = width;
        baseSpeed = (loopWidth / durationSeconds) * direction;
        offset = progress * loopWidth;
        render();
      }).observe(group);
    }

    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(row);
    } else {
      visible = true;
    }

    render();
    start();
  });
})();
