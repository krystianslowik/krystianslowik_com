<script lang="ts">
  import { onMount } from "svelte";
  import { sendChat, ChatApiError, type ChatMessage } from "../lib/chatApi";
  import { getSlowik, type SlowikCompanion } from "../lib/slowikCompanion";

  type SlowikData = {
    label: string;
    status: string;
    seeded: { you: string; slowik: string };
    placeholder: string;
    chips: string[];
    footnote: string;
  };
  let { slowik: copy }: { slowik: SlowikData } = $props();

  type Msg = { role: "you" | "słowik"; text: string; pending?: boolean; err?: boolean };
  let msgs = $state<Msg[]>([]);
  let announce = $state("");
  let input = $state("");
  let busy = $state(false);
  let camX = $state(0);
  let manual = $state(false); // user owns the camera: kills the 0.6s transition while true

  let stageEl: HTMLDivElement;
  let bird: SlowikCompanion | null = null;

  // wire geometry — the conversation is a horizontal timeline the companion perches on
  const RAIL_Y = 200;
  const START = 70;
  let stageW = 1120;
  let cardW = $state(300);
  let gap = $state(230);
  let focusI = 0; // index of the card the bird is anchored to

  const worldX = (i: number) => START + i * gap;
  const contentW = () => (msgs.length ? worldX(msgs.length - 1) + cardW + START : 0);
  const clampCam = (x: number) => Math.min(0, Math.max(Math.min(0, stageW - contentW()), x));
  const anchorOf = (i: number) =>
    Math.max(60, Math.min(stageW - 60, worldX(i) + camX + cardW + 30));

  function focus(i: number) {
    focusI = i;
    bird?.pullToWire();
  }

  function addCard(role: Msg["role"], text: string, pending = false): number {
    const i = msgs.length;
    msgs.push({ role, text, pending });
    stopGlide();
    if (!drag?.active) manual = false; // a mid-drag finger keeps authority over the camera
    camX = clampCam(stageW * 0.5 - cardW * 0.5 - worldX(i));
    focus(i);
    return i;
  }

  // —— manual left-right scroll: trackpad/wheel + pointer drag with a short glide ——
  // The wire stays a transform camera (not a native scroller) so expanded cards can
  // still overflow the stage vertically and the bird's anchor math keeps working.
  type Drag = { id: number; x: number; y: number; cam0: number; lastX: number; lastT: number; v: number; active: boolean };
  let drag: Drag | null = null;
  let dragged = false; // swallow the click that follows a drag
  let glideRaf = 0;
  let wheelT: ReturnType<typeof setTimeout> | undefined;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function stopGlide() {
    if (glideRaf) { cancelAnimationFrame(glideRaf); glideRaf = 0; }
  }

  function onWheel(e: WheelEvent) {
    let dx = e.deltaX;
    if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(dx)) dx = e.deltaY;
    if (!dx || Math.abs(dx) < Math.abs(e.deltaY)) return; // vertical intent — the page keeps it
    e.preventDefault(); // also stops the browser's history swipe at the clamped ends
    stopGlide();
    manual = true;
    camX = clampCam(camX - dx);
    clearTimeout(wheelT);
    wheelT = setTimeout(() => (manual = false), 160);
  }

  function onPointerDown(e: PointerEvent) {
    if (!e.isPrimary) return;
    stopGlide();
    dragged = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cam0: camX, lastX: e.clientX, lastT: e.timeStamp, v: 0, active: false };
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.pointerType === "mouse" && !(e.buttons & 1)) { drag = null; return; } // release happened off-stage
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // vertical scroll wins
      if (Math.abs(dx) < 6) return; // slop — a tap is still a tap
      drag.active = true;
      manual = true;
      try { stageEl.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    }
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    const inst = (e.clientX - drag.lastX) / dt;
    drag.v = drag.v === 0 ? inst : inst * 0.6 + drag.v * 0.4; // smooth touch jitter
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    // rubber-band past the ends: overscroll at 0.3x so the edge answers the
    // finger instead of going dead; released overscroll springs back
    const raw = drag.cam0 + dx;
    const min = Math.min(0, stageW - contentW());
    camX = raw > 0 ? raw * 0.3 : raw < min ? min + (raw - min) * 0.3 : raw;
  }

  function onPointerUp(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    const { active, v, lastT } = drag;
    drag = null;
    if (!active) { manual = false; return; }
    dragged = true;
    if (reduceMotion()) { camX = clampCam(camX); manual = false; return; }
    if (camX !== clampCam(camX)) { springBack(); return; }
    const vel = e.timeStamp - lastT > 80 ? 0 : v; // a held finger means "stop", not "fling"
    if (Math.abs(vel) < 0.15) { manual = false; return; }
    glide(vel);
  }

  function onPointerCancel(e: PointerEvent) {
    if (drag?.id !== e.pointerId) return;
    drag = null;
    camX = clampCam(camX);
    manual = false;
  }

  function glide(v: number) {
    // time-based decay (tau 220ms), NOT per-frame: a per-frame factor runs the
    // glide twice as hot on 120Hz phones — same trap the flight engine avoids
    let vel = v; // px/ms at release
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      vel *= Math.exp(-dt / 220);
      const next = clampCam(camX + vel * dt);
      const stuck = next === camX;
      camX = next;
      if (Math.abs(vel) < 0.02 || stuck) { glideRaf = 0; manual = false; return; }
      glideRaf = requestAnimationFrame(step);
    };
    stopGlide();
    glideRaf = requestAnimationFrame(step);
  }

  function springBack() {
    const target = clampCam(camX);
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      camX += (target - camX) * Math.min(1, dt / 110);
      if (Math.abs(target - camX) < 0.5) { camX = target; glideRaf = 0; manual = false; return; }
      glideRaf = requestAnimationFrame(step);
    };
    stopGlide();
    glideRaf = requestAnimationFrame(step);
  }

  function onClickCapture(e: MouseEvent) {
    if (!dragged) return;
    dragged = false;
    e.stopPropagation();
    e.preventDefault();
  }

  function errorText(e: unknown): string {
    if (e instanceof ChatApiError && e.status === 429 && e.apiMessage) return e.apiMessage;
    if (e instanceof DOMException && e.name === "TimeoutError")
      return "the wire went quiet — that took too long. ask again in a moment.";
    return "the wire went quiet — my backend hiccuped. give it a second and ask again.";
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    input = "";
    busy = true;
    addCard("you", q);
    let pendingI = -1;
    const t = setTimeout(() => {
      if (busy) pendingI = addCard("słowik", "rummaging through my notes…", true);
    }, 600);
    let reply: string;
    let failed = false;
    try {
      const conversation: ChatMessage[] = msgs
        .filter((m) => !m.pending && !m.err)
        .map((m) => ({ role: m.role === "słowik" ? "assistant" : "user", content: m.text }));
      reply = await sendChat(conversation, AbortSignal.timeout(45_000));
    } catch (e) {
      reply = errorText(e);
      failed = true;
    }
    clearTimeout(t);
    if (pendingI >= 0) {
      msgs[pendingI].text = reply;
      msgs[pendingI].pending = false;
      msgs[pendingI].err = failed;
    } else {
      const i = addCard("słowik", reply);
      msgs[i].err = failed;
    }
    announce = `słowik: ${reply}`;
    bird?.sing();
    busy = false;
  }

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    ask(input);
  }

  onMount(() => {
    stageW = stageEl.clientWidth;
    cardW = Math.min(300, stageW - 90);
    gap = Math.round(cardW * 0.77);

    bird = getSlowik();
    bird.registerWire(stageEl, () => {
      if (!stageEl || !stageEl.isConnected) return null;
      const r = stageEl.getBoundingClientRect();
      if (r.width === 0) return null;
      // live anchor: reads camX each call, so the bird rides the wire while
      // the user scrolls the conversation left-right
      return { x: r.left + anchorOf(focusI), y: r.top + RAIL_Y };
    });

    stageEl.addEventListener("wheel", onWheel, { passive: false });

    const t1 = setTimeout(() => addCard("słowik", copy.seeded.slowik), 420);
    addCard("you", copy.seeded.you);

    // hero starter pills dispatch this; send the question automatically
    const onAsk = (e: Event) => {
      const t = (e as CustomEvent<string>).detail;
      if (typeof t === "string" && t.trim()) ask(t);
    };
    window.addEventListener("slowik:ask", onAsk);

    const onResize = () => {
      stageW = stageEl.clientWidth;
      cardW = Math.min(300, stageW - 90);
      gap = Math.round(cardW * 0.77);
      const i = msgs.length - 1;
      if (i >= 0) camX = clampCam(stageW * 0.5 - cardW * 0.5 - worldX(i));
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(wheelT);
      stopGlide();
      stageEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("slowik:ask", onAsk);
      bird?.unregister("wire");
      bird = null;
    };
  });
</script>

<div>
  <div
    class="wire-stage"
    bind:this={stageEl}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerCancel}
    onclickcapture={onClickCapture}
  >
    <div class="wire-rail" aria-hidden="true"></div>
    <div class="wire-world" class:manual style="transform: translateX({camX}px)">
      {#each msgs as m, i (i)}
        <div
          class="wire-card {m.role === 'słowik' ? 'swk' : 'you'}"
          class:live={i === msgs.length - 1}
          class:dim={i < msgs.length - 2}
          style="left: {worldX(i)}px; width: {cardW}px"
        >
          <div class="stem" aria-hidden="true"></div>
          <button type="button" class="box" onclick={() => focus(i)}>
            <span class="who mono-label" class:text-accent={m.role === "słowik"}>{m.role}</span>
            <span class:pending={m.pending}>{m.text}</span>
          </button>
        </div>
      {/each}
    </div>
  </div>

  <form onsubmit={onSubmit} class="mx-auto mt-5 max-w-2xl rounded-md border border-border px-4 py-3 transition-colors focus-within:border-accent/60">
    <div class="flex items-center gap-3">
      <span class="font-mono text-accent" aria-hidden="true">›</span>
      <input
        id="slowik-input"
        bind:value={input}
        placeholder={busy ? "rummaging…" : copy.placeholder}
        aria-label="ask the słowik"
        class="min-w-0 flex-1 bg-transparent font-mono text-base outline-none placeholder:text-muted sm:text-sm"
      />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        class="rounded-sm bg-accent px-3.5 py-2 text-bg transition hover:bg-accent-hi active:bg-accent disabled:opacity-40 disabled:hover:bg-accent"
        aria-label="send">↵</button>
    </div>
  </form>
  <div class="mt-3 flex flex-wrap justify-center gap-2">
    {#each copy.chips as chip}
      <button
        type="button"
        onclick={() => ask(chip)}
        disabled={busy}
        class="mono-label rounded-sm border border-border px-3 py-2 text-muted transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-accent active:bg-accent/10 disabled:opacity-40"
      >{chip}</button>
    {/each}
  </div>
  <p class="mono-label mt-4 text-center leading-relaxed">
    {copy.footnote}
  </p>
  <p class="sr-only" role="status" aria-live="polite">{announce}</p>
</div>

<style>
  .wire-stage {
    position: relative;
    margin-top: 2rem;
    height: 380px;
    overflow-x: clip;
    overflow-y: visible;
    /* vertical pans stay native (page scroll); horizontal is the wire's */
    touch-action: pan-y;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
  }
  .wire-rail {
    position: absolute; left: 0; right: 0; top: 200px; height: 1px;
    background: var(--color-border);
  }
  .wire-world {
    position: absolute; inset: 0;
    transition: transform 0.6s cubic-bezier(0.33, 1, 0.5, 1);
    /* own compositor layer: drags/glides only composite, never repaint the cards */
    will-change: transform;
  }
  .wire-world.manual { transition: none; }
  @media (prefers-reduced-motion: reduce) {
    .wire-world { transition: none; }
  }

  .wire-card { position: absolute; }
  .wire-card .stem {
    position: absolute; left: 18px; width: 1px;
    background: var(--color-border);
  }
  .wire-card.you { top: 212px; }
  .wire-card.you .stem { top: -12px; height: 12px; }
  .wire-card.swk { bottom: 212px; }
  .wire-card.swk .stem { bottom: -12px; height: 12px; }

  .wire-card .box {
    position: relative; display: block; width: 100%; text-align: left;
    border: 1px solid var(--color-border);
    background: var(--color-elevated);
    border-radius: 6px; padding: 11px 14px;
    font-size: 0.875rem; line-height: 1.55; color: var(--color-fg);
    overflow: hidden; max-height: 118px;
    transition:
      max-height 0.35s cubic-bezier(0.33, 1, 0.5, 1),
      border-color 0.2s,
      opacity 0.3s;
  }
  .wire-card .box::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 30px;
    background: linear-gradient(transparent, var(--color-elevated));
    pointer-events: none;
  }
  .wire-card .box:hover, .wire-card .box:focus-visible, .wire-card.live .box { max-height: 330px; overflow-y: auto; }
  .wire-card .box:hover::after, .wire-card .box:focus-visible::after, .wire-card.live .box::after { opacity: 0; }
  .wire-card.swk .box {
    border-color: color-mix(in oklab, var(--color-accent) 30%, var(--color-border));
    background: color-mix(in oklab, var(--color-accent) 7%, var(--color-bg));
  }
  .wire-card.swk .box::after {
    background: linear-gradient(transparent, color-mix(in oklab, var(--color-accent) 7%, var(--color-bg)));
  }
  .wire-card.dim .box { opacity: 0.55; }
  .wire-card .who { display: block; margin-bottom: 4px; }
  .wire-card .pending { color: var(--color-muted); font-style: italic; }
</style>
