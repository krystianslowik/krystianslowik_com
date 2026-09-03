// ============================================================================
// SLOWIK COMPANION — the page's single pet.
// One bird for the whole journey: it perches on section rules, the hero panel,
// the chat wire and the footer border; when you scroll away it takes off and
// flies (real physics, same engine as the chat wire) to the next perch. At the
// footer it keeps its owner's hours (Europe/Berlin) and sleeps at night.
//
// Coordinates are VIEWPORT space (position: fixed). While perched the bird
// rides its anchor's live rect, so it scrolls with the page like a bird on a
// branch; when the branch leaves the viewport (or a better one appears), it
// launches. Flight vertical = the engine's emergent arc riding a PHYSICAL
// baseline velocity (VT block: gravity-assisted tucked dives, flap-gated
// stair-step climbs, stopping-distance flare); horizontal = the tuned
// forward-speed controller, with dives converting to forward speed.
//
// Singleton: use getSlowik(). Guarded on window so duplicate chunks can't
// hatch a second bird.
// ============================================================================

import { buildBase, FULL, FLY, type Opts, type Wing } from "./slowik";
import { newFly, stepFly, type FlyState, TUNING as T, SONGS, FEET } from "./slowikFlight";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export type PerchKind = "rule" | "panel" | "strip" | "footer" | "wire" | "name";

interface Perch {
  id: string;
  el: HTMLElement;
  kind: PerchKind;
  /** wire perch supplies its own live anchor (chat cards) */
  getAnchor?: () => { x: number; y: number } | null;
  /** stable per-visit fraction along the span, re-rolled on each landing */
  frac: number;
}

interface Anchor { x: number; y: number; }

const SCALE = 2;
const READ_LINE = 0.38;       // preferred perch height, fraction of viewport
const MARGIN = 80;            // rect visibility margin
const SWITCH_GAIN = 130;      // hysteresis: new perch must be this much better
const TAKEOFF_PX = 150;       // scroll distance before follow-flight (> one wheel notch, so casual reading rides the branch)
const SCROLL_SETTLE_MS = 380; // quiet time before a scroll is "stopped" (coalesces notch trains)
const SCROLL_LEAD = 60;       // px the follow point leads in the scroll direction
// one shared Berlin-hour formatter (constructing per call churned the scroll hot path)
const BERLIN_HOUR_FMT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Berlin" });

// Vertical flight model — a physical baseline velocity (bvy, px per 20Hz tick,
// +down), NOT a position lerp. The redesign (validated in the "COMPANION
// VERTICAL V2" battery of design/parrot-flight-sim.js — tune THERE first):
//   FLARE  — landings decelerate to a near-stall: the bob's descent is bled to
//            ~0 as the wire nears (stopping-distance / tau control), replacing
//            an accelerate-into-then-clamp thud. Touchdown gates on soft speed.
//   BOUND  — real flap-bounding on climbs: a flap burst gains height, then the
//            wings FOLD and the body falls a visible scallop, then re-flaps.
//   ASYM   — climb peak < dive peak (effort reads as bounding + duration, not an
//            elevator); climbing costs forward speed (dives trade it back).
//   STEER  — speed-scaled turn deadband + a hold-x band kill the old ping-pong.
//   PITCH  — tracks vertical SPEED (unsaturated), not a pegged clamp.
const VT = {
  V_K: 0.075,         // height error -> desired vertical speed
  DIVE_MAX: 22,       // px/tick down cap (~440 px/s)
  CLIMB_MAX: 12.5,    // px/tick up cap under power (~250 px/s; < dive = asymmetric)
  DZ: 40,             // vertical deadzone: |dyErr| below this is "level"
  LEVEL_SINK: 2.5,    // gentle coast-sink between flaps on a level hop
  BOUND_SINK: 4,      // folded bound of a real climb: body falls ~80 px/s
  A_BOUND: 0.34,      // gravity-like convergence into the bound sink
  BOUND_REFLAP: 2,    // re-power the climb once the bound has sagged to +40 px/s
  A_DOWN: 0.25,       // convergence when accelerating downward (gravity helps)
  A_UP_FLAP: 0.20,    // convergence when gaining height under power
  A_PARK: 0.28,       // final approach: brake + feet down = full vertical authority
  DIVE_BVY: 9, DIVE_DY: 90, // committed-dive gates (baseline speed + height to lose)
  DIVE_YCAP: 7,       // engine-y cap in a dive (stops the bob sinking under the arc clamp)
  TUCK_V: 8,          // total vy (px/tick) above which a non-flapping bird tucks
  FLARE_GATE: 9,      // committed descent above this brakes near the target
  FLARE_T: 5,         // dive brake: flare when height-to-lose < bvy * this
  FLARE_K: 0.55, FLARE_VMAX: 2.2, FLARE_A: 0.5, // landing bob-decel (tau control)
  XV_DIVE: 0.35, XV_CLIMB: 0.7, CLIMB_SPD_CAP: 4.6, // forward-speed coupling (climbs cost speed)
  HOLD_X: 36,         // within this x-error the bird coasts to a stop (no shuttle)
  VERT_DOM_V: 90, VERT_DOM_X: 90, VERT_DOM_SCALE: 0.4, // damp x-authority on vertical legs
  TURN_DB_V: 0.5,     // extra turn deadband per px/tick of |hvx| (commit longer when fast)
  PITCH_K: 0.0088, PITCH_UP: 0.28, PITCH_DN: 0.38, PITCH_S: 0.32, PITCH_FLARE: 0.20,
  CATCH_TICKS: 3, CATCH_D: 0.95, // soft dive-catch: spread the damp over ticks
  TD_BVY: 3.0, TD_VY: 2.4,  // touchdown: baseline soft AND rendered speed soft
} as const;

export class SlowikCompanion {
  private reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private root: HTMLDivElement;
  private perchedCv: HTMLCanvasElement;
  private flightCv: HTMLCanvasElement;
  private hit: HTMLDivElement;
  private bub: HTMLDivElement;
  private pcx: CanvasRenderingContext2D;
  private fcx: CanvasRenderingContext2D;

  private perches = new Map<string, Perch>();
  private current: Perch | null = null;
  private flightTarget: Perch | null = null;

  // presentation
  private x = 0; private y = 0;              // viewport coords of the FEET
  private facing: -1 | 1 = -1;
  private look = 0; private targetLook = 0; private lookHoldT = 0;
  private crest = 0; private tail = 0; private talk = false; private blinkT = 0;
  private hop = 0; private sx = 1; private sy = 1;
  private popT = 0; private popDur = 1; private popH = 0; private recoilX = 0;

  // flight
  private flying = false;
  private fly: FlyState | null = null;
  private flyArc = 0; private pitch = 0;
  private wing: Wing = "mid"; private flightEye: "open" | "closed" = "open";
  private hvx = 0; private heading: -1 | 1 = -1;
  private baseY = 0; private bvy = 0; private vPitch = 0; private catchT = 0;
  private legClimbMax: number = VT.CLIMB_MAX; private legBoundSink: number = VT.BOUND_SINK; // per-leg jitter
  private legT = 0; private parking = false; private forceLand = false; private prevSide = 0;
  private landT = 0;
  // smoothness: landing snap is blended out over ~120ms instead of popping,
  // and takeoff gets a 100ms crouch anticipation before the leap.
  private setX = 0; private setY = 0;            // decaying render offset after touchdown
  private crouchT = 0; private pendingLaunch: { p: Perch; wander: boolean } | null = null;
  // scroll-follow: while the reader scrolls, the bird flies to the READING LINE
  // in viewport space (a near-stationary point) and hovers there — visible,
  // keeping pace — instead of chasing perch anchors that scroll away faster than
  // it flies (which made it vanish off-screen). It perches when scrolling stops.
  private scrollY0 = 0; private scrolling = false; private scrollSettleT = 0; private scrollDir = 0;
  private scrollAccum = 0; // px scrolled this gesture — take off only past a threshold (no twitch on nudges)
  private followTarget: Anchor | null = null; private followX = 0; private followLead = 0; private followSongT = 0;
  private berlinHourAt = -1; private berlinHour = 12; // memoised Berlin hour (recomputed ~1/min)

  // schedule
  private idleT = 2000; private rest = 0; private ready = false;
  private mood: "calm" | "active" = "calm"; private bout = 0;
  private chooseT = 0;

  // loop
  private acc = 0; private pX = 0; private pY = 0; private pArc = 0; private pPitch = 0;
  private rX = 0; private rY = 0; private rArc = 0; private rPitch = 0;
  private spriteCache = new Map<string, HTMLCanvasElement>(); // rasterized poses (quantized pitch)
  private raf = 0; private last = 0;
  private mouse: { x: number; y: number } | null = null;
  private tiles: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>("[data-frame-tile]")); // SheetFrame's frosted tiles — the only things that occlude the bird
  private bubTimer = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private talkTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private ac = new AbortController();

  constructor() {
    this.root = document.createElement("div");
    this.root.setAttribute("aria-hidden", "true");
    // z 35: BELOW the fixed SheetFrame marginalia (z-40) — owner's call: the bird
    // passes UNDER the frosted tiles (behind the glass), never over the menu. The
    // hero-name perch bias keeps it from roosting half-hidden up there.
    this.root.style.cssText = "position:fixed;inset:0;z-index:35;pointer-events:none;";
    this.perchedCv = document.createElement("canvas");
    this.flightCv = document.createElement("canvas");
    for (const cv of [this.perchedCv, this.flightCv]) {
      cv.style.cssText = "position:fixed;image-rendering:pixelated;left:0;top:0;will-change:transform;";
    }
    this.perchedCv.width = FULL.w * SCALE; this.perchedCv.height = FULL.h * SCALE;
    this.flightCv.width = FLY.w * SCALE; this.flightCv.height = FLY.h * SCALE;
    this.flightCv.style.display = "none";
    this.pcx = this.perchedCv.getContext("2d")!; this.pcx.imageSmoothingEnabled = false;
    this.fcx = this.flightCv.getContext("2d")!; this.fcx.imageSmoothingEnabled = false;

    this.hit = document.createElement("div");
    this.hit.style.cssText = `position:fixed;left:0;top:0;width:${FULL.w * SCALE}px;height:${FULL.h * SCALE}px;pointer-events:auto;cursor:default;`;
    this.bub = document.createElement("div");
    this.bub.style.cssText =
      "position:fixed;left:0;top:0;opacity:0;transform:translateY(4px);transition:opacity .2s var(--ease-out),transform .2s var(--ease-out);" +
      "font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;line-height:1.2;letter-spacing:.08em;color:var(--color-accent);white-space:nowrap;pointer-events:none;" +
      // a paper pill: the chirp stays legible over the ink panels and wherever scroll-follow takes it
      "padding:2px 6px;border:1px solid var(--color-border);border-radius:2px;background:color-mix(in oklab,var(--color-bg) 92%,transparent);";
    this.root.append(this.perchedCv, this.flightCv, this.hit, this.bub);
    document.body.appendChild(this.root);

    const sig = { signal: this.ac.signal };
    this.hit.addEventListener("click", () => this.startle(), sig);
    window.addEventListener("mousemove", (e) => { this.mouse = { x: e.clientX, y: e.clientY }; }, sig);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) this.last = performance.now(); }, sig);
    this.scrollY0 = window.scrollY;
    window.addEventListener("scroll", () => this.onScroll(), { passive: true, signal: this.ac.signal });
    // honour a mid-session reduced-motion toggle (scrolling is a reduced-motion user's main activity)
    const rmq = matchMedia("(prefers-reduced-motion: reduce)");
    rmq.addEventListener("change", () => {
      this.reduce = rmq.matches;
      if (this.reduce && this.flying) { const pp = this.flightTarget ?? this.bestPerch(); if (pp) this.settleAt(pp); }
    }, { signal: this.ac.signal });

    this.ambient();
    this.later(() => { this.ready = true; }, 1400);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---- public API -----------------------------------------------------------

  register(el: HTMLElement, kind: PerchKind, id?: string) {
    const key = id ?? `${kind}-${this.perches.size}-${Math.floor(Math.random() * 1e6)}`;
    this.perches.set(key, { id: key, el, kind, frac: rnd(0.55, 0.85) });
    return key;
  }

  registerWire(el: HTMLElement, getAnchor: () => Anchor | null) {
    this.perches.set("wire", { id: "wire", el, kind: "wire", getAnchor, frac: 0.5 });
  }

  unregister(id: string) {
    if (this.current?.id === id) this.current = null;
    if (this.flightTarget?.id === id) this.flightTarget = null;
    this.perches.delete(id);
  }

  /** the chat pulls its companion to the newest card */
  pullToWire() {
    if (this.asleep()) return; // don't wake the night-sleeping footer bird to serve the chat
    const wire = this.perches.get("wire");
    if (!wire) return;
    const a = this.anchorOf(wire);
    if (!this.visible(a)) return; // chat is off-screen: the selection loop will bring the bird when the reader arrives
    this.scrolling = false; this.scrollSettleT = 0; this.followTarget = null; // the chat call overrides scroll-follow
    if (this.reduce) { this.settleAt(wire); return; }
    if (this.flying) this.retarget(wire);
    else this.launch(wire);
  }

  sing(text?: string) {
    this.talk = true; this.crest = 3;
    if (this.talkTimer) clearTimeout(this.talkTimer);
    this.talkTimer = setTimeout(() => { this.talk = false; this.crest = 0; }, 600 + Math.random() * 300);
    this.bub.textContent = text ?? SONGS[Math.floor(Math.random() * SONGS.length)];
    this.bubTimer = 900;
    this.placeBubble();
    // reduced motion: the pill FADES, it does not rise (the global rule no longer
    // zeroes transitions, so the movement has to be dropped here)
    if (this.reduce) {
      this.bub.style.transition = "opacity .2s var(--ease-out)";
      this.bub.style.transform = "none";
    } else {
      this.bub.style.transition = "opacity .2s var(--ease-out),transform .2s var(--ease-out)";
      this.bub.style.transform = "translateY(0)";
    }
    this.bub.style.opacity = "1";
    this.later(() => {
      this.bub.style.opacity = "0";
      if (!this.reduce) this.bub.style.transform = "translateY(4px)"; // rest low again so the next rise plays
    }, 900);
  }

  startle() {
    if (this.asleep()) { this.sing("zzz…"); return; }
    this.sing();
    if (this.flying && this.fly) { this.fly.vy = Math.max(this.fly.vy - 1.5, -3); this.fly.blink = 2; return; }
    this.rest = Math.max(this.rest, 500); this.idleT = Math.max(this.idleT, 900); this.crest = 3;
    if (this.reduce) return;
    this.popT = this.popDur = 300; this.popH = rnd(22, 34);
    this.recoilX = (Math.random() < 0.5 ? -1 : 1) * rnd(14, 26);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ac.abort();
    this.timers.forEach(clearTimeout);
    if (this.talkTimer) clearTimeout(this.talkTimer);
    this.root.remove();
    if ((window as unknown as { __ksSlowik?: unknown }).__ksSlowik === this) {
      delete (window as unknown as { __ksSlowik?: unknown }).__ksSlowik;
    }
  }

  // ---- perch geometry ---------------------------------------------------------

  private anchorOf(p: Perch): Anchor | null {
    if (p.kind === "wire" && p.getAnchor) return p.getAnchor();
    if (!p.el.isConnected || p.el.offsetParent === null) return null;
    const r = p.el.getBoundingClientRect();
    if (r.width < 60) return null;
    switch (p.kind) {
      case "strip": return { x: r.left + r.width * p.frac, y: r.bottom };
      case "panel": return { x: r.right - 56, y: r.top + 1 };
      case "footer": return { x: r.right - clamp(r.width * 0.12, 90, 180), y: r.top + 1 };
      default: return { x: r.left + r.width * p.frac, y: r.top + 1 };
    }
  }

  private visible(a: Anchor | null): a is Anchor {
    return !!a && a.y > -MARGIN && a.y < innerHeight + MARGIN && a.x > 20 && a.x < innerWidth - 20;
  }

  /** kind preference: the chat wire owns the bird, the footer is home at night,
   *  the hero surname is the OG spot — it wins whenever the hero is on screen */
  private bias(kind: PerchKind): number {
    return kind === "wire" ? 420 : kind === "footer" ? 160 : kind === "name" ? 120 : 0;
  }

  private bestPerch(): Perch | null {
    let best: Perch | null = null; let bestScore = Infinity;
    for (const p of this.perches.values()) {
      const a = this.anchorOf(p);
      if (!this.visible(a)) continue;
      let score = Math.abs(a.y - innerHeight * READ_LINE) - this.bias(p.kind);
      if (p.id === this.current?.id) score -= 90; // mild loyalty
      if (score < bestScore) { bestScore = score; best = p; }
    }
    return best;
  }

  /** nearest perch in the scroll direction even if off-screen (bird flies ahead) */
  private perchAhead(): Perch | null {
    let best: Perch | null = null; let bestDist = Infinity;
    for (const p of this.perches.values()) {
      const a = p.kind === "wire" && p.getAnchor ? p.getAnchor() : this.anchorOf(p);
      if (!a) continue;
      const d = Math.abs(a.y - innerHeight * READ_LINE);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }

  private asleep(): boolean {
    if (this.flying || this.current?.kind !== "footer") return false;
    const now = performance.now();
    if (this.berlinHourAt < 0 || now - this.berlinHourAt > 60000) {
      this.berlinHour = Number(BERLIN_HOUR_FMT.format(new Date()));
      this.berlinHourAt = now;
    }
    return this.berlinHour >= 23 || this.berlinHour < 7;
  }

  // ---- flight -----------------------------------------------------------------

  private settleAt(p: Perch) {
    const a = this.anchorOf(p);
    if (!a) return;
    this.current = p; this.flightTarget = null;
    this.flying = false; this.fly = null;
    this.parking = false; this.forceLand = false; this.legT = 0; // invariant: every state change clears these
    this.flyArc = 0; this.rArc = 0; this.bvy = 0; this.vPitch = 0;
    this.crouchT = 0; this.pendingLaunch = null; this.setX = 0; this.setY = 0;
    this.followTarget = null; this.scrolling = false; this.scrollSettleT = 0;
    this.sx = 1; this.sy = 1;
    this.x = a.x; this.y = a.y;
    this.faceContent();
  }

  /** takeoff anticipation: coil for 100ms, then leap (real birds are leg-launched) */
  private launch(p: Perch, wander = false) {
    if (this.flying || this.reduce) { this.doLaunch(p, wander); return; }
    this.pendingLaunch = { p, wander }; // re-aims the pending leap if already coiling
    if (this.crouchT <= 0) { this.crouchT = 100; this.sy = 0.86; this.sx = 1.07; }
  }

  private doLaunch(p: Perch, wander = false) {
    this.sx = 1; this.sy = 1;
    const a = this.anchorOf(p);
    if (!a) return;
    this.setX = 0; this.setY = 0;
    this.flightTarget = p; this.current = null;
    this.parking = false; this.forceLand = false; this.legT = 0; this.catchT = 0;
    this.rollLegVariation();
    const dist = Math.abs(a.x - this.x) + Math.max(0, this.y - a.y) * 1.5; // climbs need more flaps
    this.fly = newFly(wander ? 2 + Math.floor(Math.random() * 3) : clamp(3 + Math.floor(dist / 130), 3, 7));
    this.fly.vy = -2.4 + (Math.random() - 0.5); // the leap, jittered per leg
    this.bvy = -2; this.vPitch = 0;
    this.pitch = 0; this.wing = "down"; this.flightEye = "open";
    this.heading = (Math.sign(a.x - this.x) as -1 | 1) || -1;
    this.hvx = this.heading * T.KICK;
    this.prevSide = Math.sign(a.x - this.x);
    this.baseY = this.y;
    this.flying = true; this.flyArc = 0;
    this.acc = 0; this.pX = this.x; this.pY = this.y; this.pArc = 0; this.pPitch = 0;
  }

  /** per-leg jitter so repeated same-geometry hops are not pixel-identical */
  private rollLegVariation() {
    this.legClimbMax = VT.CLIMB_MAX + (Math.random() - 0.5) * 3;
    this.legBoundSink = VT.BOUND_SINK + (Math.random() - 0.5) * 2.5;
  }

  private retarget(p: Perch) {
    if (!this.flying || !this.fly) return;
    const a = this.anchorOf(p);
    if (!a) return;
    this.flightTarget = p;
    this.parking = false; this.forceLand = false; this.legT = 0; this.catchT = 0;
    this.rollLegVariation();
    this.heading = (Math.sign(a.x - this.x) as -1 | 1) || this.heading;
    this.prevSide = Math.sign(a.x - this.x);
    this.fly.flapping = true; this.fly.wp = 0;
    this.fly.flapsLeft = clamp(3 + Math.floor(Math.abs(a.x - this.x) / 150), 3, 6);
  }

  private land() {
    const visX = this.rX, visY = this.rY - this.rArc; // where the bird visually is, pre-snap
    this.flying = false; this.flyArc = 0; this.rArc = 0; this.fly = null;
    this.parking = false; this.forceLand = false; this.bvy = 0; this.vPitch = 0;
    this.followTarget = null;
    this.current = this.flightTarget; this.flightTarget = null;
    if (this.current) this.current.frac = rnd(0.5, 0.88);
    const a = this.current ? this.anchorOf(this.current) : null;
    if (a) {
      this.x = this.current!.kind === "wire" ? a.x : clamp(this.x, 30, innerWidth - 30);
      this.y = a.y;
      // blend the touchdown snap out over ~120ms instead of popping to the anchor
      this.setX = clamp(visX - this.x, -60, 60);
      this.setY = clamp(visY - this.y, -60, 60);
    }
    this.landT = 170;
    this.rest = rnd(500, 1100);
    this.mood = "calm"; this.bout = 0;
    this.idleT = Math.min(this.logn(2600, 0.45), 9000);
    if (Math.random() < 0.4) this.later(() => this.preen(), rnd(400, 900));
    this.faceContent();
  }

  private updateFlight() {
    const fly = this.fly!;
    const following = this.followTarget !== null;
    let target: Anchor | null;
    if (following) {
      target = this.followTarget; // hover to the reading line; skip all perch-chase logic
    } else {
      target = this.flightTarget ? this.anchorOf(this.flightTarget) : null;
      const off = (a: Anchor | null) => !!a && (a.y < -MARGIN * 2 || a.y > innerHeight + MARGIN * 2);
      if (!target || off(target)) {
        // branch vanished or scrolled away mid-flight: chase whatever is best now
        const next = this.bestPerch() ?? this.perchAhead();
        if (next && next.id !== this.flightTarget?.id) {
          this.retarget(next);
          target = this.anchorOf(next);
        } else if (!target) { this.forceLand = true; this.parking = true; }
      }
      // perch desert: the only branch is beyond the viewport — fly out of sight
      // toward it, then settle there silently (never hover-land at the edge)
      if (off(target) && this.flightTarget &&
          (this.baseY < -MARGIN * 2 || this.baseY > innerHeight + MARGIN * 2)) {
        this.settleAt(this.flightTarget);
        return;
      }
    }
    const tx = target?.x ?? this.x;
    const ty = target ? clamp(target.y, -MARGIN * 3, innerHeight + MARGIN * 3) : this.y;
    const dyErr = ty - this.baseY;
    const climbing = dyErr < -VT.DZ, descending = dyErr > VT.DZ;

    // re-power triggers (before stepFly so `flapping` is current this tick):
    // a climb whose fold-bound has sagged re-flaps to climb again; a committed
    // dive re-flaps to BRAKE (flare) once inside stopping distance.
    const climbReflap = climbing && !fly.flapping && this.bvy >= VT.BOUND_REFLAP;
    const diveFlare = descending && this.bvy > VT.FLARE_GATE && dyErr < this.bvy * VT.FLARE_T;
    if ((climbReflap || diveFlare) && !fly.flapping && !this.parking) {
      fly.flapping = true; fly.wp = 0;
      fly.flapsLeft = climbReflap ? 5 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 2);
      this.catchT = VT.CATCH_TICKS; // soft catch: spread the damp over ticks (no jerk)
    }

    // vertical intent: a physical baseline velocity (bvy), asymmetric by phase
    let want: number, accel: number;
    if (this.parking) {
      want = clamp(dyErr * VT.V_K, -VT.CLIMB_MAX, VT.DIVE_MAX); accel = VT.A_PARK;
    } else if (fly.flapping) {
      want = clamp(dyErr * VT.V_K, -this.legClimbMax, VT.DIVE_MAX);
      accel = want > this.bvy ? VT.A_DOWN : VT.A_UP_FLAP;
    } else if (descending) {
      want = clamp(dyErr * VT.V_K, 0, VT.DIVE_MAX); accel = VT.A_DOWN; // committed descent/dive
    } else if (climbing) {
      want = this.legBoundSink; accel = VT.A_BOUND;                    // folded bound of a climb: FALL a scallop
    } else {
      want = VT.LEVEL_SINK; accel = VT.A_DOWN;                         // level coast between flaps: gentle sink
    }
    this.bvy += (want - this.bvy) * accel;
    const dive = !this.parking && this.bvy > VT.DIVE_BVY && dyErr > VT.DIVE_DY;

    const sideNow = Math.sign(tx - this.x);
    const crossed = sideNow !== 0 && this.prevSide !== 0 && sideNow !== this.prevSide;
    const nearBase = Math.abs(this.baseY - ty) < 16;
    // never latch parking while FOLLOWING — the bird hovers at the reading line
    // and only commits to a landing once scrolling stops (followTarget cleared).
    if (!following && !this.parking && (Math.abs(this.x - tx) < T.LAND_X * 1.6 || crossed) && nearBase &&
        Math.abs(this.bvy) < 8 && (fly.vy >= 0 || fly.y > -6)) this.parking = true;
    this.prevSide = sideNow || this.prevSide;

    const out = stepFly(fly, this.parking || dive);
    if (this.catchT > 0) { fly.vy *= VT.CATCH_D; this.catchT--; } // soft-catch spread
    if (dive && fly.y > VT.DIVE_YCAP) { fly.y = VT.DIVE_YCAP; if (fly.vy > 1) fly.vy = 1; }
    if (this.parking) {
      if (fly.flapping && fly.flapsLeft > 2) fly.flapsLeft = 2; // no fresh climb bursts on final
      // FLARE: bleed the bob's descent as the wire nears -> rendered speed -> ~0
      const above = Math.max(0, -fly.y);
      const sink = Math.min(above * VT.FLARE_K, VT.FLARE_VMAX);
      fly.vy += (sink - fly.vy) * VT.FLARE_A;
      if (fly.y > 0) { fly.y = 0; if (fly.vy > 0) fly.vy = 0; }
    }
    this.flyArc = Math.max(-30, -fly.y * T.VS);

    // pitch tracks the TOTAL vertical SPEED (baseline + bob), unsaturated; a fast
    // unpowered descent tucks the wings into a dart.
    const totalVy = this.bvy + fly.vy * T.VS;
    const pt = this.parking ? VT.PITCH_FLARE : clamp(-totalVy * VT.PITCH_K, -VT.PITCH_DN, VT.PITCH_UP);
    this.vPitch += (pt - this.vPitch) * VT.PITCH_S;
    this.pitch = this.vPitch;
    // wing pose from the flight phase: flare on final approach, tuck in a fast
    // fold-dive, glide when coasting wings-out, else the flap cycle.
    if (this.parking) this.wing = "flare";
    else if (!fly.flapping && totalVy > VT.TUCK_V) this.wing = "tuck";
    else if (!fly.flapping) this.wing = "glide";
    else this.wing = out.wing;
    this.flightEye = out.eye;

    this.baseY += this.bvy;

    const err = tx - this.x;
    const turnDb = T.TURN_DB + Math.abs(this.hvx) * VT.TURN_DB_V; // commit to a heading longer when fast
    if (Math.sign(err) && Math.sign(err) !== this.heading && Math.abs(err) > turnDb) this.heading = Math.sign(err) as -1 | 1;
    if (this.parking || following) {
      // approach servo — eases to the target x and holds station (parking on final,
      // hovering at the reading line while following). Keeps flapping either way.
      this.hvx += (clamp((tx - this.x) * T.APPROACH_K, -T.APPROACH_MAX, T.APPROACH_MAX) - this.hvx) * T.APPROACH_ACCEL;
    } else {
      // dives convert to forward speed; climbs COST it (the pump no longer wins)
      let spdEff = fly.spd + Math.max(0, fly.vy) * T.DIVE_XV + Math.max(0, this.bvy / T.VS) * VT.XV_DIVE;
      const climbRate = Math.max(0, -this.bvy) / T.VS;
      spdEff -= climbRate * VT.XV_CLIMB;
      if (this.bvy < -6) spdEff = Math.min(spdEff, VT.CLIMB_SPD_CAP);
      if (Math.abs(dyErr) > VT.VERT_DOM_V && Math.abs(err) < VT.VERT_DOM_X) spdEff *= VT.VERT_DOM_SCALE; // damp x on vertical legs
      let desiredHvx = this.heading * Math.max(0.6, spdEff) * T.SPD_PX;
      if (Math.abs(err) < VT.HOLD_X) desiredHvx = 0; // arrived at target x: coast to a stop, no shuttle
      this.hvx += (desiredHvx - this.hvx) * T.ACCEL;
    }
    this.hvx = clamp(this.hvx, -T.VMAX, T.VMAX);
    this.x += this.hvx;
    this.y = this.baseY;
    // in follow: face travel direction while moving laterally, else face the content (station-holding hover)
    this.facing = following
      ? (Math.abs(this.hvx) > 2 ? (Math.sign(this.hvx) as -1 | 1) : (this.x > innerWidth * 0.5 ? -1 : 1))
      : this.heading;
    this.legT += T.STEP_MS;

    if (!following && this.legT > T.LEG_MS && !this.forceLand) { this.forceLand = true; this.parking = true; }
    const touchdown = !following && this.parking && (this.forceLand || Math.abs(this.x - tx) < T.LAND_X * 1.6) &&
      Math.abs(this.baseY - ty) < 10 && fly.y >= 0 && fly.vy >= -0.2 &&
      Math.abs(this.bvy) < VT.TD_BVY && Math.abs(totalVy) < VT.TD_VY;
    if (touchdown) this.land();
  }

  // ---- perched behaviour --------------------------------------------------------

  private logn(median: number, sigma: number) {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return median * Math.exp(sigma * (Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
  }

  private glance() { this.targetLook = Math.random() < 0.5 ? -1.2 : 1.2; this.lookHoldT = rnd(400, 900); }

  private preen() {
    if (this.flying) return;
    this.sy = 0.94; this.tail = 2;
    this.later(() => { this.tail = 0; }, 300);
    this.later(() => { this.tail = 2; }, 480);
    this.later(() => { this.tail = 0; this.sy = 1; }, rnd(650, 950));
  }

  private wanderOnPerch() {
    if (!this.current) return;
    const p = this.current;
    p.frac = clamp(p.frac + (Math.random() < 0.5 ? -1 : 1) * rnd(0.12, 0.3), 0.15, 0.9);
    this.launch(p, true);
  }

  private nextIdle() {
    if (this.asleep()) { this.idleT = 4000; return; }
    if (this.mood === "active") {
      if (--this.bout <= 0) this.mood = "calm";
      const r = Math.random();
      if (r < 0.38 && this.current?.kind !== "wire") { this.wanderOnPerch(); this.idleT = Math.min(this.logn(650, 0.5), 4000); return; }
      else if (r < 0.8) this.glance(); else this.preen();
      this.idleT = Math.min(this.logn(650, 0.5), 4000);
      if (this.mood === "calm") this.idleT += Math.min(this.logn(2600, 0.4), 8000);
    } else {
      const r = Math.random();
      if (r < 0.55) { this.preen(); this.idleT = Math.min(this.logn(4200, 0.5), 12000); }
      else if (r < 0.8) { this.glance(); this.idleT = Math.min(this.logn(3400, 0.5), 10000); }
      else { this.mood = "active"; this.bout = 2 + Math.floor(rnd(0, 4)); this.idleT = Math.min(this.logn(500, 0.4), 2500); }
      if (Math.random() < 0.18) this.idleT += rnd(6000, 12000);
    }
  }

  private updatePerch(dt: number) {
    if (this.crouchT > 0) { // coiled for takeoff: hold the squash, then leap
      this.crouchT -= dt;
      if (this.crouchT <= 0) {
        const pl = this.pendingLaunch; this.pendingLaunch = null;
        if (pl) { this.doLaunch(pl.p, pl.wander); return; }
        this.sx = 1; this.sy = 1;
      }
    }
    if (this.landT > 0 && this.crouchT <= 0) {
      this.landT -= dt;
      const u = clamp(this.landT / 170, 0, 1), s = Math.sin(u * Math.PI) * (1 - u * 0.4);
      this.sy = 1 - 0.18 * s; this.sx = 1 + 0.13 * s;
      if (this.landT <= 0) { this.sx = 1; this.sy = 1; }
    }
    // ride the branch — but NOT while coiling for a launch. The wire perch snaps
    // x to its live anchor every frame (so the bird rides cards as you scroll);
    // if we kept doing that during the pre-launch crouch, a card-click — which
    // jumps the anchor — would teleport the perched bird onto the new card before
    // it ever takes off, so the leap flies zero distance and it looks like it
    // "spawns" there. Freezing x/y while pendingLaunch is set gives the flight
    // real distance from where the bird actually is.
    if (this.current && !this.pendingLaunch) {
      const a = this.anchorOf(this.current);
      if (a) {
        const span = this.current.el.getBoundingClientRect();
        this.x = this.current.kind === "wire" ? a.x : clamp(this.x, span.left + 24, span.right - 24);
        this.y = a.y;
      }
    }
    if (this.rest > 0) { this.rest -= dt; this.faceContent(); return; }
    if (this.reduce || !this.ready) return;
    if (this.lookHoldT > 0) { this.lookHoldT -= dt; if (this.lookHoldT <= 0) this.targetLook = 0; }
    this.idleT -= dt;
    if (this.idleT <= 0) this.nextIdle();
  }

  private faceContent() {
    // face toward the page middle (where the words are)
    this.facing = this.x > innerWidth * 0.5 ? -1 : 1;
  }

  // ---- scroll-follow --------------------------------------------------------------

  private onScroll() {
    const y = window.scrollY;
    const dv = y - this.scrollY0;
    this.scrollY0 = y; // keep the baseline current even while gated, so the next live delta is right
    if (this.reduce || this.asleep()) return; // reduced motion never flies; a sleeping bird stays put
    if (Math.abs(dv) < 1) return;
    this.scrollDir = Math.sign(dv);
    if (!this.scrolling) { this.followX = this.x; this.scrollAccum = 0; } // seed the ease + gesture accumulator
    this.scrollAccum += Math.abs(dv);
    this.scrolling = true;
    this.scrollSettleT = SCROLL_SETTLE_MS;
  }

  /** the current perch is riding TOWARD a viewport edge — take off now or it rides off-screen */
  private perchLeaving(): boolean {
    const a = this.current ? this.anchorOf(this.current) : null;
    if (!a) return false; // no anchor -> choose()/desert handles it, not a "leaving" launch
    const m = Math.min(MARGIN * 1.5, innerHeight * 0.2);
    return (this.scrollDir > 0 && a.y < m) || (this.scrollDir < 0 && a.y > innerHeight - m);
  }

  private updateScroll(dt: number) {
    if (this.scrollSettleT > 0) {
      this.scrollSettleT -= dt;
      if (this.scrollSettleT <= 0) this.scrolling = false;
    }
    if (!this.scrolling) { this.scrollAccum = 0; this.followLead = 0; }
    if (this.followSongT > 0) this.followSongT -= dt;

    if (this.scrolling && this.ready && !this.reduce) {
      // the reading line in VIEWPORT space (near-stationary as content scrolls), led
      // slightly toward where you're heading — the lead is SLEWED so a direction
      // reversal glides the target instead of stepping it 120px (no yo-yo).
      this.followLead += (this.scrollDir * SCROLL_LEAD - this.followLead) * (1 - Math.pow(0.86, dt / 16.7));
      const m = Math.min(MARGIN * 2, innerHeight * 0.25);
      const fy = clamp(innerHeight * READ_LINE + this.followLead, m, innerHeight - m);
      const bp = this.bestPerch();
      const na = bp ? this.anchorOf(bp) : null;
      this.followX += ((na ? na.x : this.followX) - this.followX) * (1 - Math.pow(0.94, dt / 16.7)); // drift to the content column
      const ft = { x: clamp(this.followX, 40, innerWidth - 40), y: fy };
      if (this.followTarget) {
        this.followTarget = ft; // already following — keep steering the hover
      } else if (this.crouchT <= 0 && (this.scrollAccum > TAKEOFF_PX || this.perchLeaving())) {
        // meaningful gesture: take off from a perch, OR hijack an in-progress
        // perch flight into follow. Sub-threshold nudges leave both alone.
        this.enterFollow(ft);
      }
      // occasional guide chirp (rate per unit time, so it's refresh-independent)
      if (this.followTarget && this.followSongT <= 0 && Math.random() < 0.0016 * dt) { this.sing(); this.followSongT = 2600; }
    } else if (this.followTarget) {
      // scroll stopped: commit to the nearest perch and land — a short hop, since
      // the bird is already hovering at the reading line
      this.followTarget = null;
      if (this.flying) {
        const best = this.bestPerch() ?? this.perchAhead();
        if (best) this.retarget(best);
      }
    }
  }

  /** commit to scroll-follow: clears the leg state (strand invariant) then hovers
   *  to the reading line — taking off if perched, or diverting a perch flight. */
  private enterFollow(ft: Anchor) {
    this.followTarget = ft;
    if (this.flying) {
      this.parking = false; this.forceLand = false; this.legT = 0; this.catchT = 0; // hijack: don't strand in flare pose
    } else {
      this.launchFollow(); // reads this.followTarget
    }
    if (this.followSongT <= 0) { this.sing(); this.followSongT = 2600; } // a chirp as it lifts off to guide you
  }

  /** take off to hover at the reading line while the reader scrolls (no crouch — reactive) */
  private launchFollow() {
    const a = this.followTarget;
    if (!a || this.flying) return;
    this.flightTarget = null; this.current = null;
    this.parking = false; this.forceLand = false; this.legT = 0; this.catchT = 0;
    this.rollLegVariation();
    this.fly = newFly(3);
    this.fly.vy = -2.4 + (Math.random() - 0.5);
    this.bvy = -2; this.vPitch = 0;
    this.pitch = 0; this.wing = "down"; this.flightEye = "open";
    this.heading = (Math.sign(a.x - this.x) as -1 | 1) || -1;
    this.hvx = this.heading * T.KICK;
    this.prevSide = Math.sign(a.x - this.x);
    this.baseY = this.y;
    this.flying = true; this.flyArc = 0;
    this.acc = 0; this.pX = this.x; this.pY = this.y; this.pArc = 0; this.pPitch = 0;
  }

  // ---- perch selection loop -------------------------------------------------------

  private choose(dt: number) {
    if (this.asleep()) return; // never relocate a sleeping night bird
    // scroll-follow owns the bird once it can actually take over (ready); BEFORE
    // ready, choose still settles a pre-ready bird onto visible perches mid-scroll.
    if ((this.scrolling && this.ready) || this.followTarget) return;
    this.chooseT -= dt;
    if (this.chooseT > 0) return;
    this.chooseT = 280;
    if (this.reduce) {
      const best = this.bestPerch();
      if (best && best.id !== this.current?.id) this.settleAt(best);
      return;
    }
    if (this.flying) return;
    const cur = this.current;
    const curAnchor = cur ? this.anchorOf(cur) : null;
    const best = this.bestPerch();
    if (!cur || !this.visible(curAnchor)) {
      const next = best ?? this.perchAhead();
      if (!next || next.id === cur?.id) return; // the only branch around is the one it's on: wait there
      if (this.ready) this.launch(next);
      else this.settleAt(next);
      return;
    }
    if (best && cur && best.id !== cur.id) {
      const curScore = Math.abs(curAnchor.y - innerHeight * READ_LINE) - this.bias(cur.kind);
      const bestAnchor = this.anchorOf(best)!;
      const bestScore = Math.abs(bestAnchor.y - innerHeight * READ_LINE) - this.bias(best.kind);
      if (bestScore + SWITCH_GAIN < curScore && this.ready) this.launch(best);
    }
  }

  // ---- render -----------------------------------------------------------------------

  private placeBubble() {
    const x = (this.facing > 0 ? this.rX + 22 : this.rX - 58) + (this.recoilX || 0);
    const y = this.rY - FEET * SCALE - 10 - (this.flying ? this.rArc : 0) - this.hop;
    this.bub.style.left = `${x}px`;
    this.bub.style.top = `${y - 22}px`;
  }

  /** memoised rasterization: poses are a small discrete space (pitch quantized to
   *  ~0.04rad ≈ 1px of tail travel), so almost every frame is a cache hit — no
   *  per-frame canvas allocation/getImageData churn, and quantized rotation stops
   *  the sub-pixel edge boil. Skips the draw entirely when the pose is unchanged. */
  private lastKey = "";
  private sprite(which: "full" | "fly", o: Opts, key: string): HTMLCanvasElement {
    let c = this.spriteCache.get(key);
    if (!c) {
      if (this.spriteCache.size > 256) this.spriteCache.clear();
      c = buildBase(which, o);
      this.spriteCache.set(key, c);
    }
    return c;
  }

  private renderSprites() {
    if (this.flying) {
      const qp = Math.round(this.rPitch / 0.04) * 0.04;
      const key = `f|${this.wing}|${this.flightEye}|${qp.toFixed(2)}`;
      if (key === this.lastKey) return;
      this.lastKey = key;
      const base = this.sprite("fly", { fly: true, wing: this.wing, pitch: qp, eye: this.flightEye, dy: 0 }, key);
      this.fcx.clearRect(0, 0, this.flightCv.width, this.flightCv.height);
      this.fcx.drawImage(base, 0, 0, this.flightCv.width, this.flightCv.height);
      return;
    }
    const eye = this.asleep() ? "closed" : this.blinkT % 3000 < 130 ? "closed" : "open";
    const mouth = this.talk ? (Math.floor(this.blinkT / 150) % 2 ? ("open" as const) : ("closed" as const)) : ("closed" as const);
    const look = Math.round(this.look);
    const key = `p|${eye}|${mouth}|${this.crest}|${this.tail}|${look}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const base = this.sprite("full", { eyeShift: look, crestUp: this.crest, tailFlick: this.tail, noPerch: true, eye, mouth }, key);
    this.pcx.clearRect(0, 0, this.perchedCv.width, this.perchedCv.height);
    this.pcx.drawImage(base, 0, 0, this.perchedCv.width, this.perchedCv.height);
  }

  private loop = (now: number) => {
    if (this.destroyed) return;
    const dt = Math.min(100, now - this.last); this.last = now;
    this.blinkT += dt;
    this.hop = 0;

    this.updateScroll(dt); // may launch/land the bird — must run before the flight/perch branch
    this.choose(dt);

    let rX = this.x, rY = this.y, rArc = 0; this.rPitch = this.pitch;
    if (this.flying) {
      this.acc += dt; let guard = 0;
      while (this.flying && this.acc >= T.STEP_MS && guard++ < 8) {
        this.pX = this.x; this.pY = this.y; this.pArc = this.flyArc; this.pPitch = this.pitch;
        this.updateFlight();
        this.acc -= T.STEP_MS;
      }
      if (this.flying) {
        const a = this.acc / T.STEP_MS;
        rX = this.pX + (this.x - this.pX) * a;
        rY = this.pY + (this.y - this.pY) * a;
        rArc = this.pArc + (this.flyArc - this.pArc) * a;
        this.rPitch = this.pPitch + (this.pitch - this.pPitch) * a;
      } else { this.acc = 0; rX = this.x; rY = this.y; rArc = 0; }
    } else {
      this.updatePerch(dt); this.acc = 0; rX = this.x; rY = this.y;
      // bleed the touchdown snap out smoothly
      if (this.setX || this.setY) {
        const k = Math.pow(0.72, dt / 16.7);
        this.setX *= k; this.setY *= k;
        if (Math.abs(this.setX) < 0.3 && Math.abs(this.setY) < 0.3) { this.setX = 0; this.setY = 0; }
        rX += this.setX; rY += this.setY;
      }
    }
    this.rX = rX; this.rY = rY; this.rArc = rArc;

    if (this.popT > 0) { this.popT -= dt; const u = 1 - Math.max(0, this.popT) / this.popDur; this.hop += Math.sin(u * Math.PI) * this.popH; }
    if (this.recoilX) { this.recoilX *= Math.pow(0.86, dt / 16); if (Math.abs(this.recoilX) < 0.3) this.recoilX = 0; }
    if (this.mouse && !this.asleep()) {
      const want = clamp((this.mouse.x - rX) / 180, -1.6, 1.6);
      this.look += (want - this.look) * (1 - Math.pow(0.8, dt / 16.7));
    } else {
      this.look += (this.targetLook - this.look) * (1 - Math.pow(0.88, dt / 16.7));
    }
    if (this.bubTimer > 0) { this.bubTimer -= dt; this.placeBubble(); }

    this.renderSprites();

    const feetPx = FEET * SCALE;
    this.perchedCv.style.display = this.flying ? "none" : "block";
    if (!this.flying) {
      this.perchedCv.style.transform =
        `translate(${rX - this.perchedCv.width / 2 + (this.recoilX || 0)}px, ${rY - feetPx - this.hop}px) scaleX(${-this.facing * this.sx}) scaleY(${this.sy})`;
    }
    this.flightCv.style.display = this.flying ? "block" : "none";
    if (this.flying) {
      this.flightCv.style.transform =
        `translate(${rX - this.flightCv.width / 2}px, ${rY - rArc - this.flightCv.height * 0.72}px) scaleX(${-this.facing})`;
    }
    // hit box tracks the visible sprite (flight sprite is wider/taller than the
    // perched one), clipped against SheetFrame's frosted tiles — the sprite
    // passes behind them (z 35 vs 40), so the occluded part must never be
    // tappable: the header tiles are pointer-events-auto, so a tap there has to
    // reach the tile, and the bottom tiles simply occlude. The rest of the frame
    // is transparent and pointer-events-none, so a bird there stays tappable.
    const hitW = this.flying ? this.flightCv.width : FULL.w * SCALE;
    let hitTop = this.flying ? rY - rArc - this.flightCv.height * 0.72 : rY - feetPx - this.hop;
    let hitH = this.flying ? this.flightCv.height : FULL.h * SCALE;
    const hitL = rX - hitW / 2, hitR = hitL + hitW;
    for (const tile of this.tiles) {
      const r = tile.getBoundingClientRect();
      if (r.width === 0 || r.right <= hitL || r.left >= hitR || r.bottom <= hitTop || r.top >= hitTop + hitH) continue;
      if (r.top <= hitTop) {
        // tile covers the top: keep only what shows below it
        const cut = Math.min(hitTop + hitH, r.bottom) - hitTop;
        hitH = Math.max(0, hitH - cut); hitTop += cut;
      } else {
        // tile enters from below: keep what shows above it
        hitH = Math.max(0, Math.min(hitH, r.top - hitTop));
      }
    }
    this.hit.style.width = `${hitW}px`;
    this.hit.style.height = `${hitH}px`;
    this.hit.style.pointerEvents = hitH > 0 ? "auto" : "none";
    this.hit.style.transform = `translate(${rX - hitW / 2}px, ${hitTop}px)`;

    this.raf = requestAnimationFrame(this.loop);
  };

  // ---- misc -----------------------------------------------------------------------

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => { this.timers.delete(t); if (!this.destroyed) fn(); }, ms);
    this.timers.add(t);
  }

  private ambient() {
    this.later(() => {
      if (!this.talk && !this.flying && !this.reduce && !this.asleep() && Math.random() < 0.4) this.sing();
      this.ambient();
    }, rnd(11000, 26000));
  }
}

declare global {
  interface Window { __ksSlowik?: SlowikCompanion; }
}

export function getSlowik(): SlowikCompanion {
  if (!window.__ksSlowik) window.__ksSlowik = new SlowikCompanion();
  return window.__ksSlowik;
}
