// ============================================================================
// SŁOWIK FLIGHT — the physics engine for the bird that rides the chat wire.
// Production port of design/chat-wire-natural.html; the deterministic tuning
// harness for these constants is design/parrot-flight-sim.js (validate there
// before changing numbers here — the design/ studies keep their pre-rebrand
// parrot naming, see design/slowik-rebrand.md).
//
// Architecture (must not regress — see the naturalness review):
// - stepFly() is a frame-based integrator: it advances at a FIXED tick
//   (STEP_MS, 20Hz) inside the rAF loop, with render interpolation between
//   ticks, so the motion is identical on 60/120/144Hz displays.
// - Horizontal motion RIDES the engine's own forward speed (flap bursts
//   surge, dives convert to forward speed); heading is deadbanded steering
//   intent. No position springs, no tweens — everything is emergent.
// - Landing: a "parking" latch (only when descending or near wire height,
//   with crossing detection so a fast pass cannot jump the window), the wire
//   as floor, a wing-brake and a nose-up flare. Touchdown vy is 0.
// - Every path that changes flight state clears parking/forceLand/legT —
//   otherwise the bird strands mid-air (this bug shipped twice in design).
// - Idle is a bout scheduler: flurries of activity, then real calm.
// ============================================================================

import type { Wing } from "./slowik";

// ---- engine (per-flap feel — tuned in design/parrot-1bit.html, keep) -------
const PH = {
  gravity: 0.2, lift: 0.3, vDrag: 0.92, diveDrag: 0.99, diveBoost: 0.13, catch: 0.9,
  thrust: 2, drag: 0.96, beat: 0.42, pitch: 0.13, pitchSmooth: 0.4, startFlapY: 7,
  ceiling: -48, flapMin: 2, flapMax: 12,
};

// ---- screen mapping + controller (tuned in design/parrot-flight-sim.js) ----
const STEP_MS = 1000 / 20;   // fixed physics cadence (beat=0.42/tick -> ~8.4 wingbeats/s)
const VS = 4.2;              // engine y -> screen px above the wire
const ARC_MIN = -30;         // cruise troughs may dip under the wire line
const SPD_PX = 4.5;          // engine forward speed -> px/step
const ACCEL = 0.36;
const DIVE_XV = 0.6;
const TURN_DB = 28;
const APPROACH_K = 0.28, APPROACH_MAX = 12, APPROACH_ACCEL = 0.5;
const VMAX = 50;
const KICK = 8;
const ARRIVE = 42, OUT_MS = 900;
const LAND_X = 30, LAND_Y = 0, LEG_MS = 11000; // exhaustion backstop; a full-viewport climb needs > 8s

export const TUNING = {
  STEP_MS, VS, ARC_MIN, SPD_PX, ACCEL, DIVE_XV, TURN_DB,
  APPROACH_K, APPROACH_MAX, APPROACH_ACCEL, VMAX, KICK, ARRIVE, OUT_MS, LAND_X, LAND_Y, LEG_MS,
} as const;

// the słowik sings — short learned phrases, not squawks
export const SONGS = ["fiu-fiu!", "tju-tju-tju", "chook-chook", "jug-jug!", "hweet—", "trrr…", "tik!"];
export const FEET = 40; // native sprite row of the feet — anchors the bird ON the wire

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export interface FlyState {
  y: number; vy: number; wp: number; flapping: boolean; flapsLeft: number;
  glideT: number; blink: number; pitch: number; spd: number;
}
export function newFly(flaps: number): FlyState {
  return { y: 0, vy: 0, wp: 0, flapping: true, flapsLeft: flaps, glideT: 0, blink: 0, pitch: 0, spd: 3 };
}

export interface StepOut { wing: Wing; pitch: number; eye: "open" | "closed"; }
export function stepFly(s: FlyState, glideDown: boolean): StepOut {
  s.vy += PH.gravity;
  if (s.flapping) s.vy -= PH.lift;
  else if (s.vy > 0) s.vy += PH.diveBoost;
  s.vy *= s.vy > 0 ? PH.diveDrag : PH.vDrag;
  s.vy = clamp(s.vy, -3, 4.5);
  s.y += s.vy;
  if (s.flapping) {
    s.spd += PH.thrust; s.wp += PH.beat;
    if (s.wp >= 1) { s.wp -= 1; s.flapsLeft--; if (s.flapsLeft <= 0) { s.flapping = false; s.glideT = 0; } }
  } else if (!glideDown) {
    s.glideT++;
    if (s.y > PH.startFlapY || s.glideT > 80) {
      s.vy *= PH.catch;
      s.flapping = true; s.flapsLeft = PH.flapMin + Math.floor(Math.random() * (PH.flapMax - PH.flapMin + 1)); s.wp = 0;
    } else if (Math.random() < 0.012) { s.flapping = true; s.flapsLeft = 1; s.wp = 0; }
  }
  s.spd *= PH.drag; s.spd = clamp(s.spd, 0.6, 8);
  if (s.y < PH.ceiling) { s.y = PH.ceiling; if (s.vy < 0) s.vy *= -0.15; }
  const target = clamp(-s.vy * PH.pitch, -0.24, 0.24);
  s.pitch += (target - s.pitch) * PH.pitchSmooth;
  if (s.blink > 0) s.blink--; else if (Math.random() < 0.012) s.blink = 2;
  const f = s.wp % 1;
  return {
    wing: s.flapping ? (f < 0.4 ? "down" : f < 0.65 ? "mid" : f < 0.9 ? "up" : "mid") : "mid",
    pitch: s.pitch,
    eye: s.blink > 0 ? "closed" : "open",
  };
}
