// ============================================================================
// PARROT FLIGHT — exact, deterministic reference simulation
// ----------------------------------------------------------------------------
// A 1:1 port of the flight physics in design/chat-wire-natural.html:
// the stepFly() engine plus the horizontal controller and landing logic of
// updateFlight()/launch()/focusChanged(). Same equations, same update ORDER,
// same parameters. Math.random() is replaced by a seedable PRNG so runs are
// reproducible. Keep this file in lockstep with the demo — it is the place to
// validate tuning changes before touching the HTML.
//
// The demo advances the engine at a FIXED 20Hz tick (STEP_MS=50) inside a
// rAF loop with render interpolation, so 1 sim step == 50ms wall clock.
//
// Model summary (post naturalness-review):
//   VERTICAL   — the tuned engine: gravity/lift/asym drag/diveBoost/bounding
//                bursts/dive-catch. On landing approach ("parking") the wire
//                becomes a floor (feet catch, vy zeroed), a wing-brake bleeds
//                the dive (vy*=0.86 above 1.4), and pitch flares nose-up.
//   HORIZONTAL — rides the engine's own forward speed: hvx converges on
//                heading * (fly.spd + max(0,vy)*DIVE_XV) * SPD_PX, so flap
//                bursts surge and dives convert to forward speed. Heading is
//                steering INTENT with a deadband (TURN_DB). While parking, an
//                approach servo eases onto the perch point. No spring.
//   FAILSAFE   — a retarget (new message) resets legT (fresh leg); if a leg
//                still exceeds LEG_MS the bird force-lands where it is by
//                normal descent — never a teleport.
//
// Run:  node design/parrot-flight-sim.js
// ============================================================================

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---- seedable PRNG (mulberry32) -> deterministic, reproducible runs ---------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- parameters (verbatim from chat-wire-natural.html) ----------------------
const PH = {
  gravity: 0.2, lift: 0.3, vDrag: 0.92, diveDrag: 0.99, diveBoost: 0.13, catch: 0.9,
  thrust: 2, drag: 0.96, beat: 0.42, pitch: 0.13, pitchSmooth: 0.4, startFlapY: 7,
  ceiling: -48, floor: 12, flapMin: 2, flapMax: 12,
};
const MAP = {
  STEP_MS: 1000 / 20, VS: 4.2, ARC_MIN: -30,   // 20Hz clock: ~6.7 flaps/s — a darting chat bird, not the loader's lazy cruise
  SPD_PX: 4.5, ACCEL: 0.36, DIVE_XV: 0.6, TURN_DB: 28,
  APPROACH_K: 0.28, APPROACH_MAX: 12, APPROACH_ACCEL: 0.5,
  VMAX: 50, KICK: 8, ARRIVE: 42, OUT_MS: 900, LAND_X: 30, LAND_Y: 0, LEG_MS: 11000,
};

// ---- engine state ----------------------------------------------------------
// y: vertical position, engine units. 0 == on the wire. y<0 is ABOVE, y>0 BELOW.
// vy: vertical velocity. vy>0 == moving DOWN. spd: engine forward speed.
function newFly(flaps) {
  return { y: 0, vy: 0, wp: 0, flapping: true, flapsLeft: flaps, glideT: 0, blink: 0, pitch: 0, spd: 3 };
}

// ---- ONE physics step (exact port of stepFly) -------------------------------
function stepFly(s, glideDown, rng) {
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
      const lo = Math.min(PH.flapMin, PH.flapMax), hi = Math.max(PH.flapMin, PH.flapMax);
      s.vy *= PH.catch; s.flapping = true; s.flapsLeft = lo + Math.floor(rng() * (hi - lo + 1)); s.wp = 0;
    } else if (rng() < 0.012) { s.flapping = true; s.flapsLeft = 1; s.wp = 0; }
  }
  s.spd *= PH.drag; s.spd = clamp(s.spd, 0.6, 8);
  if (s.y < PH.ceiling) { s.y = PH.ceiling; if (s.vy < 0) s.vy *= -0.15; }
  const target = clamp(-s.vy * PH.pitch, -0.24, 0.24);
  s.pitch += (target - s.pitch) * PH.pitchSmooth;
  if (s.blink > 0) s.blink--; else if (rng() < 0.012) s.blink = 2;
}

// ---- one full flight leg (exact port of launch + updateFlight) --------------
// retargets: [{ms, target}] — mirrors focusChanged() firing mid-flight.
function runLeg({ wander, startPos, targetPos, stageW = 1080, rng, retargets = [], trace = false }) {
  const dtMs = MAP.STEP_MS;
  let target = targetPos;
  let hx = startPos, hvx, heading, aimX, phase, fly, legT = 0, parking = false, forceLand = false, ri = 0;

  // launch()
  if (wander) {
    const side = rng() < 0.5 ? -1 : 1;
    aimX = clamp(target + side * (80 + rng() * 120), 70, stageW - 70);
    phase = "out"; fly = newFly(2 + Math.floor(rng() * 3));
  } else {
    aimX = target; phase = "home";
    const dist = Math.abs(aimX - startPos);
    fly = newFly(clamp(3 + Math.floor(dist / 130), 3, 7));
  }
  fly.vy = -2.4;                                          // the leap
  heading = Math.sign(aimX - hx) || -1; hvx = heading * MAP.KICK;
  let prevSide = Math.sign(target - hx);                  // for crossing detection (fast birds can jump the latch window)

  const tr = [];
  let peakArc = -1e9, belowWireParkTicks = 0, touchdownVy = null, elapsed = 0, usedForceLand = false;

  for (let i = 0; i < 100000; i++) {
    // focusChanged() mid-flight (message / card click)
    if (ri < retargets.length && elapsed >= retargets[ri].ms) {
      target = retargets[ri].target;
      phase = "home"; aimX = target; parking = false; forceLand = false; legT = 0;
      heading = Math.sign(aimX - hx) || heading;
      fly.flapping = true; fly.wp = 0; fly.flapsLeft = clamp(3 + Math.floor(Math.abs(aimX - hx) / 150), 3, 6);
      prevSide = Math.sign(target - hx);
      ri++;
    }

    // updateFlight(), verbatim order
    // latch the perch only when descending or already near wire height — a fast high
    // pass overshoots and circles back (heading deadband) instead of freezing mid-climb.
    // "crossed" catches a fast pass that jumps the 48px window between ticks.
    const side = Math.sign(target - hx), crossed = phase === "home" && side !== 0 && prevSide !== 0 && side !== prevSide;
    if (!parking && phase === "home" && (Math.abs(hx - target) < MAP.LAND_X * 1.6 || crossed) && (fly.vy >= 0 || fly.y > -6)) parking = true;
    prevSide = side || prevSide;
    stepFly(fly, parking, rng);
    if (parking) {
      if (fly.vy > 1.4) fly.vy *= 0.86;                   // wing-brake on final
      if (fly.y > 0) { fly.y = 0; if (fly.vy > 0) fly.vy = 0; }  // the wire is the floor on approach
      fly.pitch += (0.16 - fly.pitch) * 0.35;             // flare
    }
    const arc = Math.max(MAP.ARC_MIN, -fly.y * MAP.VS);
    peakArc = Math.max(peakArc, arc);
    if (parking && arc < 0) belowWireParkTicks++;

    const err = aimX - hx;
    if (Math.sign(err) && Math.sign(err) !== heading && Math.abs(err) > MAP.TURN_DB) heading = Math.sign(err);
    if (parking) {
      hvx += (clamp((aimX - hx) * MAP.APPROACH_K, -MAP.APPROACH_MAX, MAP.APPROACH_MAX) - hvx) * MAP.APPROACH_ACCEL;
    } else {
      const spdEff = fly.spd + Math.max(0, fly.vy) * MAP.DIVE_XV;
      hvx += (heading * spdEff * MAP.SPD_PX - hvx) * MAP.ACCEL;
    }
    hvx = clamp(hvx, -MAP.VMAX, MAP.VMAX);
    hx += hvx;
    legT += dtMs; elapsed += dtMs;

    if (phase === "out" && (Math.abs(hx - aimX) < MAP.ARRIVE || legT > MAP.OUT_MS)) { phase = "home"; aimX = target; }
    if (legT > MAP.LEG_MS && !forceLand) { forceLand = true; usedForceLand = true; parking = true; aimX = hx; }

    if (trace) tr.push({ ms: +elapsed.toFixed(0), arc: +arc.toFixed(1), vy: +fly.vy.toFixed(2), spd: +fly.spd.toFixed(1), hvx: +hvx.toFixed(1), flap: fly.flapping ? 1 : 0, park: parking ? 1 : 0 });

    const touchdown = parking && (forceLand || Math.abs(hx - target) < MAP.LAND_X * 1.6) && fly.y >= MAP.LAND_Y && fly.vy >= 0;
    if (touchdown) {
      touchdownVy = fly.vy;
      return { ended: "land", ms: elapsed, peakArc, belowWireParkTicks, touchdownVy, landDist: Math.abs(hx - target), usedForceLand, trace: tr };
    }
  }
  return { ended: "overflow", ms: elapsed, peakArc, belowWireParkTicks, touchdownVy, landDist: Math.abs(hx - target), usedForceLand, trace: tr };
}

// ============================================================================
// VALIDATION BATTERY
// ============================================================================
function stats(label, runs) {
  const n = runs.length;
  const landed = runs.filter(r => r.ended === "land");
  const ms = landed.map(r => r.ms).sort((a, b) => a - b);
  const p = q => ms[Math.min(n - 1, Math.floor(q * ms.length))] || 0;
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  console.log(`  ${label.padEnd(30)} land ${landed.length}/${n}` +
    ` | air p50=${(p(0.5) / 1000).toFixed(1)}s p95=${(p(0.95) / 1000).toFixed(1)}s max=${(ms[ms.length - 1] / 1000 || 0).toFixed(1)}s` +
    ` | peakArc avg=${avg(landed.map(r => r.peakArc)).toFixed(0)}px` +
    ` | tdVy avg=${avg(landed.map(r => r.touchdownVy)).toFixed(2)} max=${Math.max(...landed.map(r => r.touchdownVy)).toFixed(2)}` +
    ` | landErr avg=${avg(landed.map(r => r.landDist)).toFixed(0)}px` +
    ` | belowWirePark ${Math.max(...runs.map(r => r.belowWireParkTicks))} ticks` +
    ` | forced ${runs.filter(r => r.usedForceLand).length}`);
}
function battery(label, fn, n = 500) {
  const runs = []; for (let i = 0; i < n; i++) runs.push(fn(mulberry32(i * 7 + 1)));
  stats(label, runs);
}

console.log("=".repeat(110));
console.log("VALIDATION — exact mirror of chat-wire-natural.html (fixed 20Hz tick)");
console.log("=".repeat(110));
battery("idle wander (540)", rng => runLeg({ wander: true, startPos: 540, targetPos: 540, rng }));
battery("travel +180", rng => runLeg({ wander: false, startPos: 540, targetPos: 720, rng }));
battery("travel -380", rng => runLeg({ wander: false, startPos: 700, targetPos: 320, rng }));
battery("travel +520", rng => runLeg({ wander: false, startPos: 300, targetPos: 820, rng }));
battery("narrow stage W=640, edge tgt", rng => runLeg({ wander: false, startPos: 320, targetPos: 580, stageW: 640, rng }));
battery("idle + msg @1.5s -> 760", rng => runLeg({ wander: true, startPos: 540, targetPos: 540, rng, retargets: [{ ms: 1500, target: 760 }] }));
battery("travel + msg @0.7s -> 300", rng => runLeg({ wander: false, startPos: 540, targetPos: 760, rng, retargets: [{ ms: 700, target: 300 }] }));
battery("storm: 3 msgs @0.4/0.9/1.4s", rng => runLeg({ wander: false, startPos: 540, targetPos: 720, rng, retargets: [{ ms: 400, target: 980 }, { ms: 900, target: 300 }, { ms: 1400, target: 760 }] }));

// one trace, for eyeballing the shape of a leg
const t = runLeg({ wander: true, startPos: 540, targetPos: 540, rng: mulberry32(7), trace: true });
console.log("\nsample idle-flit trace (arc px above wire / vy / flap / park):");
console.log("  " + t.trace.filter((_, i) => i % 2 === 0).map(s => `${s.park ? "P" : s.flap ? "f" : "g"}${s.arc}`).join(" "));
console.log(`  -> ${t.ended} after ${(t.ms / 1000).toFixed(2)}s, touchdown vy=${t.touchdownVy?.toFixed(2)}, landErr=${t.landDist.toFixed(1)}px`);

// ============================================================================
// COMPANION VERTICAL MODEL — PRE-REDESIGN BASELINE (kept for A/B comparison).
// The live production mirror is now "COMPANION VERTICAL V2" below; this V1 block
// is the model the study measured, retained so the battery shows before/after.
// ----------------------------------------------------------------------------
// The companion travels between perches at very different viewport heights.
// Vertical = a physical baseline velocity bvy (px per 20Hz tick, +down) chasing
// a proportional intent, with asymmetric authority:
//   - descending is gravity-assisted (fast convergence, high cap, committed
//     dives tuck the wings and silence the flap scheduler),
//   - climbing needs wingbeats (lower cap, and a glide can only hold ~level,
//     so long climbs read as flap-burst stair-steps),
//   - pitch follows the TOTAL vertical velocity (baseline + engine bob),
//   - touchdown additionally requires |bvy| small -> soft landings.
// The engine bob (stepFly) rides on top exactly as on the chat wire.
// ============================================================================

const VT = {
  V_K: 0.07,          // height error -> desired vertical speed
  DIVE_MAX: 22,       // px/tick down cap (~440 px/s)
  CLIMB_MAX: 13,      // px/tick up cap while flapping (~260 px/s)
  FLARE_T: 5,         // flare when height-to-lose < bvy * this (stopping distance, ticks)
  A_DOWN: 0.25,       // convergence when accelerating downward (gravity helps)
  A_UP_FLAP: 0.18,    // convergence when gaining height under power
  A_UP_GLIDE: 0.05,   // gliding wings can barely pull up
  A_PARK: 0.25,       // final approach: brake + feet down = full vertical authority
  GLIDE_CLIMB: 2,     // max upward intent while not flapping
  CLIMB_COMMIT: 1.5,  // intent beyond this forces a flap burst (can't glide uphill)
  TUCK_V: 8,          // total vy (px/tick) above which a non-flapping bird tucks
  DIVE_BVY: 9, DIVE_DY: 90, // committed-dive gates (baseline speed + height to lose)
  DIVE_YCAP: 7,       // engine-y cap in a dive (stops the bob sinking under the arc clamp)
  XV_DIVE: 0.35, XV_CLIMB: 0.25, // baseline vertical <-> forward speed coupling
  PITCH_K: 0.13, PITCH_UP: 0.30, PITCH_DN: 0.34, PITCH_S: 0.35,
  TD_BVY: 3.5,        // touchdown: baseline must be this soft
};

function runCompanionLeg({ startX = 240, startY = 600, dx = 0, dy = 0, vh = 800,
                           rng, tyFn = null, retargets = [], trace = false }) {
  const dtMs = MAP.STEP_MS;
  let x = startX, baseY = startY, bvy = -2, vPitch = 0;
  let tx = startX + dx, tyBase = startY + dy;
  let legT = 0, parking = false, forceLand = false, ri = 0, elapsed = 0;

  // launch() — climbs need more flaps than level hops
  const dist = Math.abs(tx - x) + Math.max(0, -dy) * 1.5;
  const fly = newFly(clamp(3 + Math.floor(dist / 130), 3, 7));
  fly.vy = -2.4;
  let heading = Math.sign(tx - x) || -1, hvx = heading * MAP.KICK;
  let prevSide = Math.sign(tx - x);

  const tr = [];
  let maxDive = 0, maxClimb = 0, glideClimbMax = 0, tuckTicks = 0, diveTicks = 0;
  let flips = 0, yOver = 0, pitchOk = 0, pitchN = 0;

  for (let i = 0; i < 100000; i++) {
    if (ri < retargets.length && elapsed >= retargets[ri].ms) {
      tx = retargets[ri].tx; tyBase = retargets[ri].ty;
      parking = false; forceLand = false; legT = 0;
      heading = Math.sign(tx - x) || heading; prevSide = Math.sign(tx - x);
      fly.flapping = true; fly.wp = 0;
      fly.flapsLeft = clamp(3 + Math.floor(Math.abs(tx - x) / 150), 3, 6);
      ri++;
    }
    const ty = clamp(tyFn ? tyFn(elapsed, tyBase) : tyBase, -80, vh + 80);
    const dyErr = ty - baseY;

    // ---- vertical intent (mirror of parrotCompanion.updateFlight) ----------
    let want = clamp(dyErr * VT.V_K, -VT.CLIMB_MAX, VT.DIVE_MAX);
    if (!fly.flapping && want < -VT.GLIDE_CLIMB) want = -VT.GLIDE_CLIMB;
    const needPower =
      (want < -VT.CLIMB_COMMIT && bvy > -(VT.GLIDE_CLIMB + 1)) || // climb stalled in a glide
      (bvy > 8 && dyErr < bvy * VT.FLARE_T);                      // dive reaching stopping distance: flare
    if (needPower && !fly.flapping && !parking) {
      fly.vy *= PH.catch; fly.flapping = true; fly.wp = 0;
      fly.flapsLeft = 4 + Math.floor(rng() * 3);
    }
    const accel = parking ? VT.A_PARK : want > bvy ? VT.A_DOWN : fly.flapping ? VT.A_UP_FLAP : VT.A_UP_GLIDE;
    bvy += (want - bvy) * accel;
    const dive = !parking && bvy > VT.DIVE_BVY && dyErr > VT.DIVE_DY;

    // ---- parking latch (needs the baseline near height too) ----------------
    const sideNow = Math.sign(tx - x);
    const crossed = sideNow !== 0 && prevSide !== 0 && sideNow !== prevSide;
    const nearBase = Math.abs(baseY - ty) < 14;
    if (!parking && (Math.abs(x - tx) < MAP.LAND_X * 1.6 || crossed) && nearBase && (fly.vy >= 0 || fly.y > -6)) parking = true;
    prevSide = sideNow || prevSide;

    stepFly(fly, parking || dive, rng);
    if (dive && fly.y > VT.DIVE_YCAP) { fly.y = VT.DIVE_YCAP; if (fly.vy > 1) fly.vy = 1; }
    if (parking) {
      if (fly.flapping && fly.flapsLeft > 2) fly.flapsLeft = 2; // no fresh climb bursts on final
      if (fly.vy > 1.4) fly.vy *= 0.86;
      if (fly.y > 0) { fly.y = 0; if (fly.vy > 0) fly.vy = 0; }
    }

    const totalVy = bvy + fly.vy * MAP.VS; // px/tick, +down
    const pt = parking ? 0.16 : clamp(-(totalVy / MAP.VS) * VT.PITCH_K, -VT.PITCH_DN, VT.PITCH_UP);
    vPitch += (pt - vPitch) * VT.PITCH_S;
    const tuck = !fly.flapping && !parking && totalVy > VT.TUCK_V;

    baseY += bvy;

    // ---- horizontal (verbatim + vertical coupling) --------------------------
    const err = tx - x;
    if (Math.sign(err) && Math.sign(err) !== heading && Math.abs(err) > MAP.TURN_DB) { heading = Math.sign(err); flips++; }
    if (parking) {
      hvx += (clamp((tx - x) * MAP.APPROACH_K, -MAP.APPROACH_MAX, MAP.APPROACH_MAX) - hvx) * MAP.APPROACH_ACCEL;
    } else {
      let spdEff = fly.spd + Math.max(0, fly.vy) * MAP.DIVE_XV
        + Math.max(0, bvy / MAP.VS) * VT.XV_DIVE + Math.min(0, bvy / MAP.VS) * VT.XV_CLIMB;
      spdEff = Math.max(0.8, spdEff);
      hvx += (heading * spdEff * MAP.SPD_PX - hvx) * MAP.ACCEL;
    }
    hvx = clamp(hvx, -MAP.VMAX, MAP.VMAX);
    x += hvx;
    legT += dtMs; elapsed += dtMs;
    if (legT > MAP.LEG_MS && !forceLand) { forceLand = true; parking = true; }

    // ---- metrics -------------------------------------------------------------
    maxDive = Math.max(maxDive, bvy); maxClimb = Math.min(maxClimb, bvy);
    if (!fly.flapping) glideClimbMax = Math.min(glideClimbMax, bvy);
    if (bvy > VT.DIVE_BVY) { diveTicks++; if (tuck) tuckTicks++; }
    if (dy > 0) yOver = Math.max(yOver, baseY - (startY + dy));
    if (dy < 0) yOver = Math.max(yOver, (startY + dy) - baseY);
    if (Math.abs(totalVy) > 4 && !parking) { pitchN++; if (Math.sign(vPitch) === -Math.sign(totalVy)) pitchOk++; }
    if (trace) tr.push({ ms: elapsed | 0, y: baseY | 0, bvy: +bvy.toFixed(1), tvy: +totalVy.toFixed(1), pitch: +vPitch.toFixed(2), mode: parking ? "P" : dive ? "D" : tuck ? "t" : fly.flapping ? "f" : "g" });

    const touchdown = parking && (forceLand || Math.abs(x - tx) < MAP.LAND_X * 1.6) &&
      Math.abs(baseY - ty) < 10 && fly.y >= 0 && fly.vy >= 0 && bvy < VT.TD_BVY;
    if (touchdown) {
      return { ended: "land", ms: elapsed, tdVy: totalVy, maxDive, maxClimb, glideClimbMax,
               tuckFrac: diveTicks ? tuckTicks / diveTicks : 1, flips, yOver,
               pitchAgree: pitchN ? pitchOk / pitchN : 1, usedForceLand: forceLand, landErr: Math.abs(x - tx), trace: tr };
    }
  }
  return { ended: "overflow", ms: elapsed, tdVy: 99, maxDive, maxClimb, glideClimbMax, tuckFrac: 0, flips, yOver, pitchAgree: 0, usedForceLand: forceLand, landErr: Math.abs(x - tx), trace: tr };
}

function vstats(label, runs) {
  const n = runs.length, landed = runs.filter(r => r.ended === "land");
  const ms = landed.map(r => r.ms).sort((a, b) => a - b);
  const p = q => ms[Math.min(ms.length - 1, Math.floor(q * ms.length))] || 0;
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  console.log(`  ${label.padEnd(30)} land ${landed.length}/${n}` +
    ` | air p50=${(p(0.5) / 1000).toFixed(1)}s p95=${(p(0.95) / 1000).toFixed(1)}s` +
    ` | tdVy avg=${avg(landed.map(r => Math.abs(r.tdVy))).toFixed(1)} max=${Math.max(...landed.map(r => Math.abs(r.tdVy))).toFixed(1)}px/t` +
    ` | dive max=${Math.max(...runs.map(r => r.maxDive)).toFixed(0)} climb max=${(-Math.min(...runs.map(r => r.maxClimb))).toFixed(0)}` +
    ` | glideClimb ${(-Math.min(...runs.map(r => r.glideClimbMax))).toFixed(1)}` +
    ` | tuck ${(avg(landed.map(r => r.tuckFrac)) * 100).toFixed(0)}%` +
    ` | yOver ${Math.max(...runs.map(r => r.yOver)).toFixed(0)}px` +
    ` | pitchOK ${(avg(landed.map(r => r.pitchAgree)) * 100).toFixed(0)}%` +
    ` | forced ${runs.filter(r => r.usedForceLand).length}`);
}
function vbattery(label, fn, n = 500) {
  const runs = []; for (let i = 0; i < n; i++) runs.push(fn(mulberry32(i * 13 + 5)));
  vstats(label, runs);
}

console.log("\n" + "=".repeat(110));
console.log("COMPANION VERTICAL — physical baseline (bvy), dive-tuck, flap-gated climbs");
console.log("=".repeat(110));
vbattery("hop, level 500px", rng => runCompanionLeg({ dx: 500, dy: 0, rng }));
vbattery("hop next rule: +120x +40y", rng => runCompanionLeg({ dx: 120, dy: 40, rng }));
vbattery("descend 300 (dx 300)", rng => runCompanionLeg({ dx: 300, dy: 300, startY: 250, rng }));
vbattery("steep dive 700 (dx 150)", rng => runCompanionLeg({ dx: 150, dy: 700, startY: 60, rng }));
vbattery("climb 300 (dx 300)", rng => runCompanionLeg({ dx: 300, dy: -300, rng }));
vbattery("steep climb 700 (dx 150)", rng => runCompanionLeg({ dx: 150, dy: -700, startY: 760, rng }));
vbattery("scroll-follow (ty +6px/t 1s)", rng => runCompanionLeg({ dx: 250, dy: 350, startY: 200, rng, tyFn: (ms, base) => base + Math.min(ms, 1000) / MAP.STEP_MS * 6 }));
vbattery("retarget @0.8s: 500px below", rng => runCompanionLeg({ dx: 300, dy: -200, startY: 500, rng, retargets: [{ ms: 800, tx: 640, ty: 700 }] }));

const dv = runCompanionLeg({ dx: 150, dy: 700, startY: 60, rng: mulberry32(31), trace: true });
console.log("\nsample dive trace (mode y bvy pitch):");
console.log("  " + dv.trace.filter((_, i) => i % 2 === 0).map(s => `${s.mode}${s.y}/${s.bvy}/${s.pitch}`).join(" "));
console.log(`  -> ${dv.ended} ${(dv.ms / 1000).toFixed(2)}s tdVy=${dv.tdVy.toFixed(1)} tuck=${(dv.tuckFrac * 100).toFixed(0)}%`);
const cl = runCompanionLeg({ dx: 150, dy: -700, startY: 760, rng: mulberry32(31), trace: true });
console.log("sample climb trace (mode y bvy pitch):");
console.log("  " + cl.trace.filter((_, i) => i % 2 === 0).map(s => `${s.mode}${s.y}/${s.bvy}/${s.pitch}`).join(" "));

// ============================================================================
// COMPANION VERTICAL V2 — THE LIVE MODEL (1:1 mirror of parrotCompanion.ts).
// The flight redesign, validated here before it was ported to production.
// ----------------------------------------------------------------------------
// Fixes the study's confirmed defects while preserving what the cross-check said
// is load-bearing (20Hz tick, beat=0.42 aliasing, the sound dive regime):
//   FLARE   — landings DECELERATE to a near-stall. The bob's descent is bled to
//             ~0 as height-to-wire shrinks (tau/stopping-distance control, the
//             Lee-1993 idea the biomech lens cited), replacing the old
//             accelerate-into-then-floor-clamp thud (~150 px/s -> ~0).
//   BOUND   — climbs are real flap-bounding: a flap burst climbs, then wings
//             FOLD and the body FALLS a visible scallop (BOUND_SINK), then
//             re-flaps. Works on shallow climbs too (the old glide held level).
//   CLIMB   — peak climb speed lowered (CLIMB_MAX 13->10) so it is a clear
//             fraction of the dive; the asymmetry reads as effort, not an
//             elevator.
//   COUPLE  — climbing now costs forward speed (the pump no longer wins), so a
//             steep climb visibly slows horizontally instead of speeding up.
//   STEER   — vertical-dominant legs stop the horizontal ping-pong: a speed-
//             scaled turn deadband + a hold-x band when the leg is mostly vertical.
//   PITCH   — pitch tracks vertical SPEED (unsaturated) instead of pegging at the
//             clamp for 80% of a dive.
//   VARY    — per-leg jitter (launch, caps, burst timing) so repeated same-
//             geometry hops are not pixel-identical.
//   SOFT-CATCH — the dive-recovery flap spreads its damp over ~3 ticks (no jerk).
// Touchdown now GATES on soft rendered speed (|totalVy|), so a soft landing is
// enforced, not a floor-clamp artifact.
// ============================================================================

const VT2 = {
  V_K: 0.075,
  DIVE_MAX: 22, CLIMB_MAX: 12.5,
  A_DOWN: 0.25, A_UP_FLAP: 0.20,
  DZ: 40,                     // vertical deadzone: |dyErr| below this is "level"
  LEVEL_SINK: 2.5,           // gentle coast-sink between flaps on a level hop
  BOUND_SINK: 4,             // folded bound of a real climb: body falls ~80 px/s
  A_BOUND: 0.34,             // gravity-like convergence into the bound sink
  BOUND_REFLAP: 2,           // re-power the climb once the bound has sagged to +40 px/s
  DIVE_BVY: 9, DIVE_DY: 90, DIVE_YCAP: 7,
  TUCK_V: 8,
  FLARE_GATE: 9,             // committed descent above this brakes near the target
  FLARE_T: 5,                // dive brake: flare when height-to-lose < bvy*this
  FLARE_K: 0.55, FLARE_VMAX: 2.2, FLARE_A: 0.5, // landing bob-decel (tau control)
  A_PARK: 0.28,
  XV_DIVE: 0.35, XV_CLIMB: 0.7, CLIMB_SPD_CAP: 4.6, // forward-speed coupling (climbs cost speed)
  HOLD_X: 36,                // stop shuttling: within this x-error the bird coasts to a stop
  VERT_DOM_V: 90, VERT_DOM_X: 90, VERT_DOM_SCALE: 0.4, // damp x-authority on vertical legs
  TURN_DB_V: 0.5,            // extra turn deadband per px/tick of |hvx| (commit longer when fast)
  PITCH_K: 0.0088, PITCH_UP: 0.28, PITCH_DN: 0.38, PITCH_S: 0.32, PITCH_FLARE: 0.20,
  CATCH_TICKS: 3, CATCH_D: 0.95, // soft dive-catch spread over ticks
  TD_BVY: 3.0, TD_VY: 2.4,   // touchdown: baseline soft AND rendered speed soft
};

function runCompanionLegV2({ startX = 240, startY = 600, dx = 0, dy = 0, vh = 800,
                             rng, tyFn = null, retargets = [], trace = false }) {
  const V = VT2, dtMs = MAP.STEP_MS;
  let x = startX, baseY = startY, bvy = -2, vPitch = 0;
  let tx = startX + dx, tyBase = startY + dy;
  let legT = 0, parking = false, forceLand = false, ri = 0, elapsed = 0, catchT = 0;

  // per-leg variation — survives the caps, so repeated geometry differs
  const climbMax = V.CLIMB_MAX + (rng() - 0.5) * 3;
  const boundSink = V.BOUND_SINK + (rng() - 0.5) * 2.5;
  const launchVy = -2.4 + (rng() - 0.5) * 1.0;

  const dist = Math.abs(tx - x) + Math.max(0, -dy) * 1.5;
  const fly = newFly(clamp(3 + Math.floor(dist / 130), 3, 7));
  fly.vy = launchVy;
  let heading = Math.sign(tx - x) || -1, hvx = heading * MAP.KICK;
  let prevSide = Math.sign(tx - x);

  const tr = [];
  let peakDown = 0, peakUp = 0, flips = 0, yOver = 0, pitchSatTicks = 0, moveTicks = 0;
  let sagMax = 0, baseYLocalMin = baseY, climbHvxSum = 0, climbHvxN = 0, cruiseHvxSum = 0, cruiseHvxN = 0;
  let peakRenderDown = 0;

  for (let i = 0; i < 100000; i++) {
    if (ri < retargets.length && elapsed >= retargets[ri].ms) {
      tx = retargets[ri].tx; tyBase = retargets[ri].ty;
      parking = false; forceLand = false; legT = 0; catchT = 0;
      heading = Math.sign(tx - x) || heading; prevSide = Math.sign(tx - x);
      fly.flapping = true; fly.wp = 0;
      fly.flapsLeft = clamp(3 + Math.floor(Math.abs(tx - x) / 150), 3, 6);
      ri++;
    }
    const ty = clamp(tyFn ? tyFn(elapsed, tyBase) : tyBase, -240, vh + 240);
    const dyErr = ty - baseY;
    const climbing = dyErr < -V.DZ, descending = dyErr > V.DZ;

    // ---- re-power triggers (before stepFly so flapping is current) ----------
    const climbReflap = climbing && !fly.flapping && bvy >= V.BOUND_REFLAP;
    const diveFlare = descending && bvy > V.FLARE_GATE && dyErr < bvy * V.FLARE_T;
    if ((climbReflap || diveFlare) && !fly.flapping && !parking) {
      fly.flapping = true; fly.wp = 0;
      // climbs get long bursts (gain altitude), the dive flare gets a short brake
      fly.flapsLeft = climbReflap ? 5 + Math.floor(rng() * 4) : 3 + Math.floor(rng() * 2);
      catchT = V.CATCH_TICKS;                       // soft catch: spread the damp
    }

    // ---- vertical intent ----------------------------------------------------
    let want, accel;
    if (parking) {
      want = clamp(dyErr * V.V_K, -V.CLIMB_MAX, V.DIVE_MAX); accel = V.A_PARK;
    } else if (fly.flapping) {
      want = clamp(dyErr * V.V_K, -climbMax, V.DIVE_MAX);
      accel = want > bvy ? V.A_DOWN : V.A_UP_FLAP;
    } else if (descending) {
      want = clamp(dyErr * V.V_K, 0, V.DIVE_MAX); accel = V.A_DOWN;
    } else if (climbing) {                            // folded bound of a real climb: FALL a scallop
      want = boundSink; accel = V.A_BOUND;
    } else {                                          // level coast between flaps: hold, gentle sink
      want = V.LEVEL_SINK; accel = V.A_DOWN;
    }
    bvy += (want - bvy) * accel;
    const dive = !parking && bvy > V.DIVE_BVY && dyErr > V.DIVE_DY;

    // ---- parking latch ------------------------------------------------------
    const sideNow = Math.sign(tx - x);
    const crossed = sideNow !== 0 && prevSide !== 0 && sideNow !== prevSide;
    const nearBase = Math.abs(baseY - ty) < 16;
    if (!parking && (Math.abs(x - tx) < MAP.LAND_X * 1.6 || crossed) && nearBase &&
        Math.abs(bvy) < 8 && (fly.vy >= 0 || fly.y > -6)) parking = true;
    prevSide = sideNow || prevSide;

    stepFly(fly, parking || dive, rng);
    if (catchT > 0) { fly.vy *= V.CATCH_D; catchT--; }       // soft-catch spread
    if (dive && fly.y > V.DIVE_YCAP) { fly.y = V.DIVE_YCAP; if (fly.vy > 1) fly.vy = 1; }
    if (parking) {
      if (fly.flapping && fly.flapsLeft > 2) fly.flapsLeft = 2;
      // FLARE: bleed the bob's descent as it nears the wire -> rendered speed -> 0
      const above = Math.max(0, -fly.y);                     // engine units above wire
      const sink = Math.min(above * V.FLARE_K, V.FLARE_VMAX);
      fly.vy += (sink - fly.vy) * V.FLARE_A;
      if (fly.y > 0) { fly.y = 0; if (fly.vy > 0) fly.vy = 0; }
    }

    const totalVy = bvy + fly.vy * MAP.VS;         // px/tick, +down = rendered vertical speed
    const flyArc = Math.max(MAP.ARC_MIN, -fly.y * MAP.VS);
    const pt = parking ? V.PITCH_FLARE : clamp(-totalVy * V.PITCH_K, -V.PITCH_DN, V.PITCH_UP);
    vPitch += (pt - vPitch) * V.PITCH_S;
    const tuck = !fly.flapping && !parking && totalVy > V.TUCK_V;

    baseY += bvy;

    // ---- horizontal: coupling + anti-ping-pong ------------------------------
    const err = tx - x;
    const turnDb = MAP.TURN_DB + Math.abs(hvx) * V.TURN_DB_V;
    if (Math.sign(err) && Math.sign(err) !== heading && Math.abs(err) > turnDb) { heading = Math.sign(err); flips++; }
    if (parking) {
      hvx += (clamp((tx - x) * MAP.APPROACH_K, -MAP.APPROACH_MAX, MAP.APPROACH_MAX) - hvx) * MAP.APPROACH_ACCEL;
    } else {
      let spdEff = fly.spd + Math.max(0, fly.vy) * MAP.DIVE_XV + Math.max(0, bvy / MAP.VS) * V.XV_DIVE;
      const climbRate = Math.max(0, -bvy) / MAP.VS;          // engine-units of climb
      spdEff -= climbRate * V.XV_CLIMB;                       // climbing costs forward speed
      if (bvy < -6) spdEff = Math.min(spdEff, V.CLIMB_SPD_CAP);
      if (Math.abs(dyErr) > V.VERT_DOM_V && Math.abs(err) < V.VERT_DOM_X) spdEff *= V.VERT_DOM_SCALE; // damp x on vertical legs
      let desiredHvx = heading * Math.max(0.6, spdEff) * MAP.SPD_PX;
      if (Math.abs(err) < V.HOLD_X) desiredHvx = 0;           // arrived at target x: coast to a stop, no shuttle
      hvx += (desiredHvx - hvx) * MAP.ACCEL;
    }
    hvx = clamp(hvx, -MAP.VMAX, MAP.VMAX);
    x += hvx;
    legT += dtMs; elapsed += dtMs;
    if (legT > MAP.LEG_MS && !forceLand) { forceLand = true; parking = true; }

    // ---- metrics ------------------------------------------------------------
    peakDown = Math.max(peakDown, bvy); peakUp = Math.min(peakUp, bvy);
    peakRenderDown = Math.max(peakRenderDown, totalVy);
    if (climbing) {                                          // sag = local dip of baseY during a climb
      if (baseY < baseYLocalMin) baseYLocalMin = baseY;
      else sagMax = Math.max(sagMax, baseY - baseYLocalMin);
      if (fly.flapping) { climbHvxSum += Math.abs(hvx); climbHvxN++; }
    }
    if (Math.abs(dyErr) < V.DZ && !parking && fly.flapping) { cruiseHvxSum += Math.abs(hvx); cruiseHvxN++; }
    if (dy > 0) yOver = Math.max(yOver, baseY - (startY + dy));
    if (dy < 0) yOver = Math.max(yOver, (startY + dy) - baseY);
    if (!parking && Math.abs(totalVy) > 4) { moveTicks++; if (Math.abs(vPitch) >= V.PITCH_DN - 0.01 || Math.abs(vPitch) >= V.PITCH_UP - 0.01) pitchSatTicks++; }
    if (trace) tr.push({ ms: elapsed | 0, y: baseY | 0, arc: flyArc | 0, bvy: +bvy.toFixed(1), tvy: +totalVy.toFixed(1), pitch: +vPitch.toFixed(2), mode: parking ? "P" : dive ? "D" : tuck ? "t" : fly.flapping ? "f" : "b" });

    const touchdown = parking && (forceLand || Math.abs(x - tx) < MAP.LAND_X * 1.6) &&
      Math.abs(baseY - ty) < 10 && fly.y >= 0 && fly.vy >= -0.2 &&
      Math.abs(bvy) < V.TD_BVY && Math.abs(totalVy) < V.TD_VY;
    if (touchdown) {
      return { ended: "land", ms: elapsed, tdVy: totalVy, peakDown, peakUp, sagMax, flips, yOver,
        pitchSat: moveTicks ? pitchSatTicks / moveTicks : 0,
        climbHvx: climbHvxN ? climbHvxSum / climbHvxN : 0, cruiseHvx: cruiseHvxN ? cruiseHvxSum / cruiseHvxN : 0,
        usedForceLand: forceLand, landErr: Math.abs(x - tx), trace: tr };
    }
  }
  return { ended: "overflow", ms: elapsed, tdVy: 99, peakDown, peakUp, sagMax, flips, yOver, pitchSat: 1,
    climbHvx: 0, cruiseHvx: 0, usedForceLand: forceLand, landErr: Math.abs(x - tx), trace: tr };
}

function v2stats(label, runs) {
  const n = runs.length, landed = runs.filter(r => r.ended === "land");
  const ms = landed.map(r => r.ms).sort((a, b) => a - b);
  const p = q => ms[Math.min(ms.length - 1, Math.floor(q * ms.length))] || 0;
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const tdAbs = landed.map(r => Math.abs(r.tdVy) * 20);       // px/s
  const peakUp = runs.map(r => -r.peakUp * 20), peakDn = runs.map(r => r.peakDown * 20);
  console.log(`  ${label.padEnd(28)} land ${landed.length}/${n}` +
    ` | air p50=${(p(0.5) / 1000).toFixed(1)} p95=${(p(0.95) / 1000).toFixed(1)}s` +
    ` | td avg=${avg(tdAbs).toFixed(0)} max=${Math.max(...tdAbs).toFixed(0)}px/s` +
    ` | climb pk=${Math.max(...peakUp).toFixed(0)} dive pk=${Math.max(...peakDn).toFixed(0)}px/s` +
    ` | sag ${Math.max(...runs.map(r => r.sagMax)).toFixed(0)}px` +
    ` | flips ${avg(landed.map(r => r.flips)).toFixed(1)}` +
    ` | climbHvx ${(avg(landed.filter(r => r.climbHvx).map(r => r.climbHvx)) * 20).toFixed(0)}px/s` +
    ` | pitchSat ${(avg(landed.map(r => r.pitchSat)) * 100).toFixed(0)}%` +
    ` | yOver ${Math.max(...runs.map(r => r.yOver)).toFixed(0)}` +
    ` | forced ${runs.filter(r => r.usedForceLand).length}`);
}
function v2battery(label, fn, n = 500) {
  const runs = []; for (let i = 0; i < n; i++) runs.push(fn(mulberry32(i * 13 + 5)));
  v2stats(label, runs);
}

console.log("\n" + "=".repeat(110));
console.log("COMPANION VERTICAL V2 — flare landing, real bounding climbs, speed-coupled, unsaturated pitch");
console.log("=".repeat(110));
v2battery("hop, level 500px", rng => runCompanionLegV2({ dx: 500, dy: 0, rng }));
v2battery("hop next rule: +120x +40y", rng => runCompanionLegV2({ dx: 120, dy: 40, rng }));
v2battery("descend 300 (dx 300)", rng => runCompanionLegV2({ dx: 300, dy: 300, startY: 250, rng }));
v2battery("steep dive 700 (dx 150)", rng => runCompanionLegV2({ dx: 150, dy: 700, startY: 60, rng }));
v2battery("climb 300 (dx 300)", rng => runCompanionLegV2({ dx: 300, dy: -300, rng }));
v2battery("steep climb 700 (dx 150)", rng => runCompanionLegV2({ dx: 150, dy: -700, startY: 760, rng }));
v2battery("scroll-follow (ty +6/t 1s)", rng => runCompanionLegV2({ dx: 250, dy: 350, startY: 200, rng, tyFn: (ms, base) => base + Math.min(ms, 1000) / MAP.STEP_MS * 6 }));
v2battery("retarget @0.8s: 500 below", rng => runCompanionLegV2({ dx: 300, dy: -200, startY: 500, rng, retargets: [{ ms: 800, tx: 640, ty: 700 }] }));

function v2trace(label, opts) {
  const t = runCompanionLegV2({ ...opts, rng: mulberry32(31), trace: true });
  console.log(`\n${label} (mode baseY/arc/bvy/pitch):`);
  console.log("  " + t.trace.filter((_, i) => i % 2 === 0).map(s => `${s.mode}${s.y}/${s.arc}/${s.bvy}/${s.pitch}`).join(" "));
  console.log(`  -> ${t.ended} ${(t.ms / 1000).toFixed(2)}s td=${(Math.abs(t.tdVy) * 20).toFixed(0)}px/s sag=${t.sagMax.toFixed(0)}px flips=${t.flips}`);
}
v2trace("V2 level hop", { dx: 500, dy: 0 });
v2trace("V2 steep dive", { dx: 150, dy: 700, startY: 60 });
v2trace("V2 steep climb", { dx: 150, dy: -700, startY: 760 });
console.log(`  -> ${cl.ended} ${(cl.ms / 1000).toFixed(2)}s tdVy=${cl.tdVy.toFixed(1)} climbMax=${(-cl.maxClimb).toFixed(0)}`);
