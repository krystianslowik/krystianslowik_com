// ============================================================================
// SŁOWIK — 1-bit amber-on-paper sprite + physics flight engine.
// The site's bird (słowik = nightingale). The sprite ART is the original
// crested silhouette — crest, hooked beak, round eye — kept by owner
// preference over the plainer nightingale draft. Ported from the design
// study (design/parrot-1bit.html). Single ink (amber);
// "shadow" is 1-bit dither, never a second colour. Geometry is rasterised to
// pixels at runtime so it stays crisp at any integer scale.
// ============================================================================

const AMBER: [number, number, number] = [149, 78, 0]; // --color-accent oklch(0.50 0.125 60) in sRGB (#954e00) — keep in lockstep with global.css

export type Wing = "up" | "mid" | "down" | "tuck" | "flare" | "glide";
export interface Opts {
  dx?: number; dy?: number; pitch?: number;
  wing?: Wing; eye?: "open" | "closed"; mouth?: "open" | "closed";
  crestUp?: number; eyeShift?: number; tailFlick?: number; fly?: boolean;
  /** omit the drawn perch bar (the wire chat provides its own wire to stand on) */
  noPerch?: boolean;
}

const HEAD = { w: 34, h: 24 };
export const FULL = { w: 40, h: 46 };
export const FLY = { w: 56, h: 108 };
const FLY_BASELINE = 36;

function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }

// ---- head mark (favicon / inline) ----------------------------------------
function drawHead(c: CanvasRenderingContext2D, o: Opts) {
  c.clearRect(0, 0, HEAD.w, HEAD.h);
  c.save(); c.translate(o.dx || 0, o.dy || 0);
  c.globalCompositeOperation = "source-over"; c.fillStyle = "#fff";
  const lift = o.crestUp || 0;
  c.beginPath(); c.arc(18, 13, 9, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(20, 6); c.lineTo(32, 3 - lift); c.lineTo(23, 13); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(17, 5); c.lineTo(26, 3 - lift); c.lineTo(21, 11); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(13, 10); c.lineTo(6, 12); c.lineTo(5, 17); c.lineTo(9, 16); c.lineTo(12, 14); c.closePath(); c.fill();
  if (o.mouth === "open") {
    c.beginPath(); c.moveTo(6, 18); c.lineTo(10, 18); c.lineTo(10, 21); c.lineTo(7, 21); c.closePath(); c.fill();
    c.globalCompositeOperation = "destination-out"; c.fillRect(5, 17, 7, 1.1); c.globalCompositeOperation = "source-over";
  }
  const ex = 17 + (o.eyeShift || 0);
  c.globalCompositeOperation = "destination-out";
  if (o.eye === "closed") c.fillRect(ex - 2, 11.4, 6, 1.4);
  else { c.beginPath(); c.arc(ex, 11.6, 2.2, 0, Math.PI * 2); c.fill(); }
  c.globalCompositeOperation = "source-over";
  c.restore();
}

// ---- flight pose ----------------------------------------------------------
// Wing states carry the physics: down/mid/up = the flap cycle, glide = wings held
// flat, tuck = the folded dive dart, flare = the wings-forward airbrake landing.
// The head is drawn in a counter-rotated sub-frame so the gaze stays near-level
// while the body pitches — the bird's real gaze stabilization.
function drawFly(c: CanvasRenderingContext2D, o: Opts) {
  c.clearRect(0, 0, FLY.w, FLY.h);
  const pitch = o.pitch || 0;
  const wing = o.wing || "mid";
  const tuck = wing === "tuck", flare = wing === "flare";
  c.save(); c.translate(o.dx || 0, (o.dy || 0) + FLY_BASELINE);
  if (pitch) { c.translate(30, 26); c.rotate(pitch); c.translate(-30, -26); }
  c.globalCompositeOperation = "source-over"; c.fillStyle = "#fff";

  // body — a lean dart in a committed dive, rounded otherwise
  if (tuck) { c.beginPath(); c.ellipse(32, 26, 15, 5.5, 0, 0, Math.PI * 2); c.fill(); }
  else { c.beginPath(); c.ellipse(31, 26, 13, 7, 0, 0, Math.PI * 2); c.fill(); }

  // tail — fanned airbrake on flare, aligned on the dart, tapered otherwise
  if (flare) { c.beginPath(); c.moveTo(39, 22); c.lineTo(53, 17); c.lineTo(56, 27); c.lineTo(53, 37); c.lineTo(39, 31); c.closePath(); c.fill(); }
  else if (tuck) { c.beginPath(); c.moveTo(41, 24.5); c.lineTo(55, 25.5); c.lineTo(56, 26.5); c.lineTo(55, 27.5); c.lineTo(41, 28.5); c.closePath(); c.fill(); }
  else { c.beginPath(); c.moveTo(39, 23); c.lineTo(52, 25); c.lineTo(54, 27); c.lineTo(52, 29); c.lineTo(39, 31); c.closePath(); c.fill(); }

  let w: number[][];
  if (wing === "up") w = [[25, 26], [28, 9], [31, 1], [39, 15], [35, 27]];
  else if (wing === "down") w = [[25, 25], [29, 39], [34, 45], [45, 33], [34, 26]];
  else if (tuck) w = [[27, 24], [38, 22], [47, 25], [40, 28], [30, 27]]; // swept flat along the dart
  else if (flare) w = [[25, 26], [28, 9], [31, 1], [39, 15], [35, 27]];  // raised airbrake (the proven up-wing; tail fan + feet carry the flare)
  else if (wing === "glide") w = [[25, 23], [41, 15], [55, 17], [47, 24], [33, 26]]; // long flat blade, held above the shade band
  else w = [[25, 24], [37, 17], [50, 18], [45, 26], [34, 27]];           // mid
  c.beginPath(); c.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) c.lineTo(w[i][0], w[i][1]); c.closePath(); c.fill();

  // underside shade band (skip on the lean dart — reads cleaner as a silhouette)
  if (!tuck) {
    c.globalCompositeOperation = "source-atop"; c.fillStyle = "#888";
    c.beginPath(); c.moveTo(0, 33); c.lineTo(56, 21); c.lineTo(56, 48); c.lineTo(0, 48); c.closePath(); c.fill();
    c.globalCompositeOperation = "source-over";
  }

  // feather carves (destination-out cut-outs — the house idiom)
  c.globalCompositeOperation = "destination-out"; c.lineWidth = 1; c.strokeStyle = "#000";
  c.beginPath(); c.moveTo(28, 24); c.lineTo(34, 27); c.stroke(); // wing-base separation
  if (flare) { c.beginPath(); c.moveTo(44, 23); c.lineTo(54, 19); c.moveTo(44, 27); c.lineTo(55, 27); c.moveTo(44, 31); c.lineTo(54, 35); c.stroke(); } // fanned tail feathers
  else { c.beginPath(); c.moveTo(42, 25); c.lineTo(52, 26.4); c.moveTo(42, 29); c.lineTo(52, 27.6); c.stroke(); }
  if (tuck) { // short slit only — a full-length rib splits the dart into slivers
    c.beginPath(); c.moveTo(40, 23.5); c.lineTo(32, 25); c.stroke();
  } else {
    const bm = [(w[0][0] + w[w.length - 1][0]) / 2, (w[0][1] + w[w.length - 1][1]) / 2];
    c.beginPath(); c.moveTo(w[2][0], w[2][1]); c.lineTo(bm[0], bm[1]); c.stroke(); // wing central rib
    if (wing === "glide") { c.beginPath(); c.moveTo(50, 18.5); c.lineTo(36, 23.5); c.stroke(); } // second primary on the blade
  }
  c.globalCompositeOperation = "source-over";

  // feet reaching for the perch on the flare (white strokes, the drawFull leg idiom)
  if (flare) {
    c.strokeStyle = "#fff"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(30, 31); c.lineTo(28, 41); c.moveTo(35, 31); c.lineTo(34, 41); c.stroke();
  }
  // dive speed-streaks: faint 25% ink trailing under the dart (auto-dithered dashes)
  if (tuck) {
    c.strokeStyle = "#555"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(18, 21); c.lineTo(30, 21); c.moveTo(14, 26); c.lineTo(28, 26); c.moveTo(18, 31); c.lineTo(30, 31); c.stroke();
  }

  // head group — counter-rotated so the gaze holds near-level under body pitch
  c.save();
  c.translate(15, 19); c.rotate(-pitch * 0.62); c.translate(-15, -19);
  c.globalCompositeOperation = "source-over"; c.fillStyle = "#fff";
  c.beginPath(); c.arc(15, 19, 8, 0, Math.PI * 2); c.fill();
  const crest = flare ? 3 : tuck ? -2 : 0; // crest raised alert on the flare, slicked in the dive
  c.beginPath(); c.moveTo(17, 12 - crest); c.lineTo(26, 9 - crest); c.lineTo(20, 18); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(11, 16); c.lineTo(4, 18); c.lineTo(4, 22); c.lineTo(7, 22); c.lineTo(10, 20); c.closePath(); c.fill(); // beak
  c.globalCompositeOperation = "destination-out";
  if (o.eye === "closed") c.fillRect(12, 17.4, 6, 1.4);
  else { c.beginPath(); c.arc(14, 17.6, 2.2, 0, Math.PI * 2); c.fill(); }
  c.globalCompositeOperation = "source-over";
  c.restore();

  c.restore();
}

// ---- perched pose (sitting on a branch, with states) ----------------------
function drawFull(c: CanvasRenderingContext2D, o: Opts) {
  c.clearRect(0, 0, FULL.w, FULL.h);
  c.save(); c.translate(o.dx || 0, o.dy || 0);
  c.globalCompositeOperation = "source-over"; c.fillStyle = "#fff";
  const lift = o.crestUp || 0, tf = o.tailFlick || 0;
  c.beginPath(); c.ellipse(23, 24, 9, 12, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(18, 13, 9, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(20, 5); c.lineTo(32, 2 - lift); c.lineTo(23, 13); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(17, 4); c.lineTo(26, 2 - lift); c.lineTo(21, 11); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(13, 10); c.lineTo(6, 12); c.lineTo(5, 17); c.lineTo(9, 16); c.lineTo(12, 14); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(22, 33); c.lineTo(33, 30); c.lineTo(28 + tf, 46); c.lineTo(21, 44); c.closePath(); c.fill();
  c.strokeStyle = "#fff"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(17, 34); c.lineTo(17, 40); c.moveTo(23, 34); c.lineTo(23, 40); c.stroke();
  if (o.mouth === "open") {
    c.beginPath(); c.moveTo(6, 18); c.lineTo(10, 18); c.lineTo(10, 21); c.lineTo(7, 21); c.closePath(); c.fill();
    c.globalCompositeOperation = "destination-out"; c.fillRect(5, 17, 7, 1.1); c.globalCompositeOperation = "source-over";
  }
  const ex = 17 + (o.eyeShift || 0);
  c.globalCompositeOperation = "destination-out";
  if (o.eye === "closed") c.fillRect(ex - 2, 11.4, 6, 1.4);
  else { c.beginPath(); c.arc(ex, 11.6, 2.2, 0, Math.PI * 2); c.fill(); }
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(22, 17); c.quadraticCurveTo(29, 22, 27, 31); c.stroke();
  c.globalCompositeOperation = "source-over";
  c.restore();
  if (!o.noPerch) { c.fillStyle = "#fff"; c.fillRect(6, 40, 28, 2); } // perch (grounded)
}

// ---- rasterise geometry -> 1-bit amber canvas -----------------------------
type Which = "head" | "fly" | "full";
const SPRITE: Record<Which, { size: { w: number; h: number }; draw: (c: CanvasRenderingContext2D, o: Opts) => void }> = {
  head: { size: HEAD, draw: drawHead },
  fly: { size: FLY, draw: drawFly },
  full: { size: FULL, draw: drawFull },
};
// The "shader": one amber ink, tone via a 4x4 ordered (Bayer) dither. The draw
// functions paint in greys (#fff solid, #bbb ~75%, #888 ~50%, #555 ~25%); each
// grey's luminance picks how many pixels of the 4x4 cell survive, the rest drop
// out (left transparent). Still literally 1-bit-per-pixel — amber@255 or
// nothing — but with four tones for depth, shade and dive-trail ghosts instead
// of a single 50%.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function buildBase(which: Which, o: Opts): HTMLCanvasElement {
  const n = SPRITE[which].size;
  const off = document.createElement("canvas"); off.width = n.w; off.height = n.h;
  SPRITE[which].draw(off.getContext("2d")!, o);
  const src = off.getContext("2d")!.getImageData(0, 0, n.w, n.h).data;
  const base = document.createElement("canvas"); base.width = n.w; base.height = n.h;
  const bctx = base.getContext("2d")!; const img = bctx.createImageData(n.w, n.h);
  for (let y = 0; y < n.h; y++) for (let x = 0; x < n.w; x++) {
    const i = (y * n.w + x) * 4;
    if (src[i + 3] <= 128) continue;
    if (src[i] < 250) { // below near-white: ordered dither by ink tone
      const cover = (src[i] / 255) * 16; // pixels kept per 4x4 cell
      if (BAYER4[(y & 3) * 4 + (x & 3)] >= cover) continue; // the ground shows through
    }
    img.data[i] = AMBER[0]; img.data[i + 1] = AMBER[1]; img.data[i + 2] = AMBER[2]; img.data[i + 3] = 255;
  }
  bctx.putImageData(img, 0, 0);
  return base;
}

function blit(ctx: CanvasRenderingContext2D, base: HTMLCanvasElement, x: number, y: number, scale: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, base.width, base.height, x, y, base.width * scale, base.height * scale);
}

// ---- head mark: gentle blink loop -----------------------------------------
export function mountHead(canvas: HTMLCanvasElement, scale = 4): () => void {
  canvas.width = HEAD.w * scale; canvas.height = HEAD.h * scale;
  const ctx = canvas.getContext("2d")!;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = (eye: "open" | "closed") => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(ctx, buildBase("head", { eye }), 0, 0, scale);
  };
  render("open");
  if (reduce) return () => {};
  const id = setInterval(() => { render("closed"); setTimeout(() => render("open"), 130); }, 3200);
  return () => clearInterval(id);
}

// ---- perched mark with reactive states (used by the chat panel) -----------
export type PerchState = "online" | "thinking" | "sleep";
export interface PerchHandle { setState: (s: PerchState) => void; destroy: () => void; }

export function mountPerched(canvas: HTMLCanvasElement, scale = 3): PerchHandle {
  canvas.width = FULL.w * scale; canvas.height = FULL.h * scale;
  const ctx = canvas.getContext("2d")!;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let state: PerchState = "online";
  let t = 0;
  const frame = () => {
    t += 66;
    let o: Opts;
    if (state === "sleep") o = { eye: "closed" };
    else if (state === "thinking")
      o = { mouth: Math.floor(t / 350) % 2 ? "open" : "closed", eye: t % 3200 < 130 ? "closed" : "open" };
    else
      o = { eye: t % 3000 < 130 ? "closed" : "open", tailFlick: t % 5200 < 260 ? 2 : 0, crestUp: t % 8000 < 420 ? 2 : 0 };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(ctx, buildBase("full", o), 0, 0, scale);
  };
  frame();
  if (reduce) return { setState: (s) => { state = s; frame(); }, destroy: () => {} };
  const id = setInterval(frame, 66);
  return { setState: (s) => { state = s; }, destroy: () => clearInterval(id) };
}

// ---- flight behaviour engine (physics, emergent) --------------------------
const P = {
  gravity: 0.2, lift: 0.3, vDrag: 0.92, diveDrag: 0.99, diveBoost: 0.13, catch: 0.9,
  thrust: 2, drag: 0.96, beat: 0.42, pitch: 0.13, pitchSmooth: 0.4, startFlapY: 7,
  ceiling: -30, floor: 12, flapMin: 2, flapMax: 12,
};

interface FlyState {
  y: number; vy: number; wp: number; flapping: boolean; flapsLeft: number;
  glideT: number; blink: number; pitch: number; spd: number; dist: number;
}

function newFlyState(): FlyState {
  return { y: 0, vy: 0, wp: 0, flapping: true, flapsLeft: 5, glideT: 0, blink: 0, pitch: 0, spd: 3, dist: 0 };
}

function stepFly(s: FlyState): Opts {
  s.vy += P.gravity;
  if (s.flapping) s.vy -= P.lift;
  else if (s.vy > 0) s.vy += P.diveBoost;
  s.vy *= s.vy > 0 ? P.diveDrag : P.vDrag;
  s.vy = clamp(s.vy, -3, 4.5);
  s.y += s.vy;
  if (s.flapping) {
    s.spd += P.thrust; s.wp += P.beat;
    if (s.wp >= 1) { s.wp -= 1; s.flapsLeft--; if (s.flapsLeft <= 0) { s.flapping = false; s.glideT = 0; } }
  } else {
    s.glideT++;
    if (s.y > P.startFlapY || s.glideT > 80) {
      const lo = Math.min(P.flapMin, P.flapMax), hi = Math.max(P.flapMin, P.flapMax);
      s.vy *= P.catch; s.flapping = true; s.flapsLeft = lo + Math.floor(Math.random() * (hi - lo + 1)); s.wp = 0;
    } else if (Math.random() < 0.012) { s.flapping = true; s.flapsLeft = 1; s.wp = 0; }
  }
  s.spd *= P.drag; s.spd = clamp(s.spd, 0.6, 8); s.dist += s.spd;
  if (s.y < P.ceiling) { s.y = P.ceiling; if (s.vy < 0) s.vy *= -0.15; }
  if (s.y > P.floor) { s.y = P.floor; if (s.vy > 0) s.vy *= -0.15; }
  const target = clamp(-s.vy * P.pitch, -0.24, 0.24);
  s.pitch += (target - s.pitch) * P.pitchSmooth;
  if (s.blink > 0) s.blink--; else if (Math.random() < 0.012) s.blink = 2;
  const f = s.wp % 1;
  return {
    fly: true, dy: Math.round(s.y), pitch: s.pitch, eye: s.blink > 0 ? "closed" : "open",
    wing: s.flapping ? (f < 0.4 ? "down" : f < 0.65 ? "mid" : f < 0.9 ? "up" : "mid") : "mid",
  };
}

// ---- full-screen / banner loader: the słowik flies across (right -> left) --
export function mountLoader(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  const s = newFlyState();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scale = 4, dpr = 1, vw = 0, vh = 0;
  const resize = () => {
    dpr = window.devicePixelRatio || 1; vw = canvas.clientWidth; vh = canvas.clientHeight;
    canvas.width = vw * dpr; canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    scale = Math.max(3, Math.round((vh * 0.6) / FLY.h));
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const draw = () => {
    const o = reduce ? { wing: "mid" as Wing, eye: "open" as const, dy: 0, pitch: 0 } : stepFly(s);
    ctx.clearRect(0, 0, vw, vh);
    const sW = FLY.w * scale, sH = FLY.h * scale;
    const span = vw + sW, x = vw - ((s.dist * scale) % span);
    const y = (vh - sH) / 2;
    const base = buildBase("fly", o);
    blit(ctx, base, x, y, scale);
    blit(ctx, base, x - span, y, scale);
  };
  draw();
  if (reduce) { return () => ro.disconnect(); }
  const id = setInterval(draw, 66);
  return () => { clearInterval(id); ro.disconnect(); };
}
