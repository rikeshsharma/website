/*
  The moment lag appears, the feeling of directness falls off a cliff. So the
  highlight goes on at pointer-*down*, never on click — waiting for touch-up
  to acknowledge a press feels dead, and `click` fires after the browser has
  already decided the gesture wasn't a scroll.

  `:active` almost does this on its own, but it doesn't survive iOS Safari's
  quirks and it gives no way to implement the other half of the rule: a press
  must be cancellable by dragging away, and re-armable by dragging back. This
  adds a class instead, with ~10px of hysteresis around the target.
*/

(function pressFeedback() {
  "use strict";

  /*
    Only things that actually do something on release. Feedback on an element
    that does nothing when you let go teaches people to distrust all of it.
  */
  const PRESSABLE = "a[href], button, .project-card";
  /* Slop radius: a press survives small finger jitter, and cancels once the
     movement is clearly a drag or a scroll rather than a tap. */
  const HYSTERESIS = 10;

  let target = null;
  let pointerId = null;
  let originX = 0;
  let originY = 0;

  const release = () => {
    if (target) target.classList.remove("is-pressed");
    target = null;
    pointerId = null;
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      /* Right-click and middle-click aren't presses. */
      if (event.button !== 0) return;

      const candidate = event.target.closest(PRESSABLE);
      if (!candidate || candidate.disabled) return;

      release();
      /*
        A project card's repo link is stretched over the entire tile, so a
        press anywhere on the card lands on the anchor. The thing the user
        perceives themselves as pushing is the tile, so the feedback goes
        there — an anchor with no press styling would otherwise swallow it.
      */
      target = candidate.closest(".project-card") || candidate;
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      target.classList.add("is-pressed");
    },
    /* Passive: this only ever adds a class, so it must never be able to
       block or delay the scroll that may be starting at the same moment. */
    { passive: true }
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!target || event.pointerId !== pointerId) return;

      const distance = Math.hypot(
        event.clientX - originX,
        event.clientY - originY
      );
      /* Past the slop the gesture is no longer a tap — but keep tracking, so
         coming back inside re-arms it, the way a real button behaves. */
      target.classList.toggle("is-pressed", distance <= HYSTERESIS);
    },
    { passive: true }
  );

  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });
  /* A press that loses the window (alt-tab, system gesture) has to let go. */
  window.addEventListener("blur", release);
})();
