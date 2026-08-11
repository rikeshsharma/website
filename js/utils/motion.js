/*
  CSS transitions are fine for anything the user can only *look* at. They are
  wrong for anything the user can *grab*, because a transition can't be
  interrupted and redirected mid-flight — grab a closing panel and it insists
  on finishing before it reopens. Springs don't have that problem: they always
  animate from the current value, so re-targeting one mid-flight is just a
  change of target, and the motion stays continuous.

  Everything here is plain rAF math — no library, matching the rest of this
  project (no bundler, no dependencies).
*/

const PortfolioMotion = {
  /* Live query, not a snapshot — the user can flip this setting mid-session. */
  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  /*
    Where a flick would come to rest, given its release velocity. This is the
    exponential-decay form Apple's own sample code uses — deliberately *not*
    the physics-textbook v^2/(2a), which decelerates too abruptly to read as
    natural scrolling.

    velocity is px/s; decelerationRate 0.998 is normal scroll feel, 0.99 is
    snappier.
  */
  project(velocity, decelerationRate = 0.998) {
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
  },

  /*
    Progressive resistance past a boundary. A hard stop reads as "frozen";
    resistance that grows the further you drag reads as "responsive, but
    there's nothing more here".
  */
  rubberband(overshoot, dimension, constant = 0.55) {
    return (
      (overshoot * dimension * constant) /
      (dimension + constant * Math.abs(overshoot))
    );
  },

  /*
    Rolling velocity estimate over the last few pointer samples.

    A single frame's delta is far too noisy to hand to a spring — and the very
    last sample before release is often a near-zero one, because fingers pause
    for a few milliseconds before lifting. Averaging over a short window is
    what makes a flick feel like a flick.
  */
  createVelocityTracker(windowMs = 100) {
    const samples = [];

    return {
      add(value, time = performance.now()) {
        samples.push({ value, time });
        while (samples.length > 2 && time - samples[0].time > windowMs) {
          samples.shift();
        }
      },
      /* px/s over the window; 0 if the pointer has been still. */
      velocity() {
        if (samples.length < 2) return 0;
        const first = samples[0];
        const last = samples[samples.length - 1];
        const elapsed = last.time - first.time;
        if (elapsed <= 0) return 0;
        return ((last.value - first.value) / elapsed) * 1000;
      },
      reset() {
        samples.length = 0;
      },
    };
  },

  /*
    A spring, described the way Apple describes one to designers:

      damping  — overshoot. 1.0 is critically damped (no bounce, graceful
                 settle) and is the right default for almost everything.
                 ~0.8 bounces, and is only honest when the gesture itself
                 carried momentum into the animation.
      response — how quickly the value reaches the target, in seconds. NOT a
                 duration: the settle time emerges from the parameters.

    Returns a handle whose `.retarget()` changes the destination while keeping
    the current position *and velocity*. That carry-through is the whole point
    — swapping in a fresh animation at a reversal creates a velocity
    discontinuity that feels like hitting a brick wall.
  */
  spring(options) {
    const {
      from = 0,
      to = 0,
      velocity = 0,
      response = 0.4,
      onUpdate,
      onComplete,
    } = options;

    let damping = typeof options.damping === "number" ? options.damping : 1;
    const omega = (2 * Math.PI) / response;
    /* Settle thresholds scaled to the distance travelled, so a 4px move and a
       400px move both stop looking like they're still moving at the same time. */
    const epsilon = Math.max(0.01, Math.abs(to - from) * 0.001);

    let target = to;
    let value = from;
    let speed = velocity;
    let frame = null;
    let last = null;

    const settle = () => {
      value = target;
      speed = 0;
      frame = null;
      if (onUpdate) onUpdate(value, 0);
      if (onComplete) onComplete();
    };

    const tick = (now) => {
      /* Clamp dt: a backgrounded tab hands back a huge delta that would
         explode the integration. */
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      /* Sub-stepped semi-implicit Euler — stable at stiff response values
         where a single step per frame would oscillate apart. */
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let i = 0; i < steps; i += 1) {
        const acceleration =
          -(omega * omega) * (value - target) - 2 * damping * omega * speed;
        speed += acceleration * h;
        value += speed * h;
      }

      if (Math.abs(value - target) < epsilon && Math.abs(speed) < epsilon * 10) {
        settle();
        return;
      }

      if (onUpdate) onUpdate(value, speed);
      frame = requestAnimationFrame(tick);
    };

    /* Reduced motion: jump to the settled state rather than travel to it. */
    if (PortfolioMotion.prefersReducedMotion()) {
      settle();
      return { stop() {}, retarget() {}, get value() { return value; } };
    }

    last = performance.now();
    frame = requestAnimationFrame(tick);

    return {
      /* Change destination, keep position and velocity — no jump, no seam. */
      retarget(next, nextDamping) {
        target = next;
        if (typeof nextDamping === "number") {
          damping = nextDamping;
        }
        if (frame === null) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        }
      },
      stop() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
      },
      get value() {
        return value;
      },
      get velocity() {
        return speed;
      },
    };
  },
};
