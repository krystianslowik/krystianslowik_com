// Deterministic check of SlowikChat wire-scroll motion: the glide decay and
// spring-back must be frame-rate independent (60Hz vs 120Hz phones).
// Mirrors glide()/springBack() in src/components/SlowikChat.svelte 1:1.

const clampCam = (x, min) => Math.min(0, Math.max(min, x));

function runGlide(v, hz, min = -1000) {
  let camX = -300;
  let vel = v;
  let t = 0;
  const dtFrame = 1000 / hz;
  for (let i = 0; i < 10000; i++) {
    const dt = Math.min(50, dtFrame);
    vel *= Math.exp(-dt / 220);
    const next = clampCam(camX + vel * dt, min);
    const stuck = next === camX;
    camX = next;
    t += dtFrame;
    if (Math.abs(vel) < 0.02 || stuck) break;
  }
  return { camX, ms: t };
}

function runSpring(from, hz, min = -1000) {
  let camX = from;
  const target = clampCam(camX, min);
  let t = 0;
  const dtFrame = 1000 / hz;
  for (let i = 0; i < 10000; i++) {
    const dt = Math.min(50, dtFrame);
    camX += (target - camX) * Math.min(1, dt / 110);
    t += dtFrame;
    if (Math.abs(target - camX) < 0.5) { camX = target; break; }
  }
  return { camX, ms: t };
}

let fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
  if (!ok) fail++;
};

// 1) glide distance must match across refresh rates (within 3%)
for (const v of [0.3, 0.8, 1.5, -1.5]) {
  const a = runGlide(v, 60);
  const b = runGlide(v, 120);
  const c = runGlide(v, 90);
  const da = a.camX + 300, db = b.camX + 300, dc = c.camX + 300;
  const spread = Math.max(Math.abs(da - db), Math.abs(da - dc));
  check(`glide v=${v}`, spread < Math.max(3, Math.abs(da) * 0.03),
    `60Hz→${da.toFixed(1)}px  90Hz→${dc.toFixed(1)}px  120Hz→${db.toFixed(1)}px`);
}

// 2) fast fling travels a sane distance (not off to infinity, not dead)
const fling = runGlide(1.5, 60);
check("fling distance sane", fling.camX + 300 > 150 && fling.camX + 300 < 600,
  `${(fling.camX + 300).toFixed(0)}px in ${fling.ms.toFixed(0)}ms`);

// 3) glide clamps at the wire's end and stops
const clamped = runGlide(-3, 60, -400);
check("glide stops at clamp", clamped.camX === -400, `ends at ${clamped.camX}`);

// 4) spring-back converges to the bound, frame-rate independent, under ~700ms
for (const hz of [60, 90, 120]) {
  const s = runSpring(80, hz); // 80px rubber overscroll past 0
  check(`spring ${hz}Hz`, s.camX === 0 && s.ms < 700, `settled in ${s.ms.toFixed(0)}ms`);
}

// 5) spring-back from the far end too
const s2 = runSpring(-1080, 60, -1000);
check("spring far end", s2.camX === -1000, `ends at ${s2.camX}`);

process.exit(fail ? 1 : 0);
