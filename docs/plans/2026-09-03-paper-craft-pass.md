# Paper Craft Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the 2026 craft checklist to the uncommitted paper redesign (serif display, grain, disciplined motion, tap targets) and close all 15 code-review findings, without changing structure or copy meaning.

**Architecture:** Astro 5 static site; tokens live in `src/styles/global.css` (`@theme`), copy in `src/data/site.ts`, components render only. The bird is a page singleton (`src/lib/slowikCompanion.ts`); its flight physics are NOT touched. Discovery text files become build-time endpoints like `rss.xml.ts`.

**Tech Stack:** Astro 5, Svelte 5 (one island), Tailwind 4 (`@theme` tokens, OKLCH), `@fontsource-variable/newsreader`, Python 3 + Pillow for two raster steps, Google Chrome headless for screenshots.

**Design note:** `docs/plans/2026-09-03-paper-craft-pass-design.md`.

**Verification model:** this repo has no unit test suite. Each task ends with `npm run typecheck` (fast, `astro check`) and a grep; the last task runs the full build and screenshots. Commits: the owner commits; do not commit inside tasks.

**Working tree:** implement IN PLACE (no worktree) — the paper redesign exists only as uncommitted changes here.

---

### Task 1: Tokens, fonts, grain, motion (`global.css`)

**Files:**
- Modify: `src/styles/global.css`
- Create: `public/grain.png` (generated)

**Step 1: Generate the grain tile** (scratchpad script, output into `public/`)

```python
# grain.py — 128x128 RGBA: black pixels with random alpha; opacity is tuned in CSS
import random
from PIL import Image
random.seed(7)
im = Image.new("RGBA", (128, 128))
im.putdata([(0, 0, 0, random.randint(0, 255)) for _ in range(128 * 128)])
im.save("public/grain.png", optimize=True)
```
Run: `python3 <scratchpad>/grain.py && ls -la public/grain.png` — expect a file around 16 KB.

**Step 2: Fonts.** After the `opsz-italic.css` import add:
```css
@import "@fontsource-variable/newsreader/opsz.css";
```
and update the comment above the imports to say "Newsreader roman + italic (variable optical size)".

**Step 3: Tokens.** In `@theme` replace the `--color-accent-bright` line with:
```css
  /* The one amber, lifted for the inverted ink panels — a derived state of
     --color-accent, not a second colour. Static value first; the @supports
     block below locks it to the accent's hue where relative colour exists. */
  --color-accent-on-ink: oklch(0.76 0.14 60);
```
Replace the three motion tokens with:
```css
  /* Interaction grammar — ONE speed, ONE curve for every hover/press/focus
     transition (Tailwind's transition-* utilities read these defaults).
     Fast ease-out reads as "the UI answered", not "the UI animated". */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --default-transition-duration: 140ms;
  --default-transition-timing-function: var(--ease-out);
```
Directly after the closing `}` of `@theme` add:
```css
@supports (color: oklch(from red l c h)) {
  :root { --color-accent-on-ink: oklch(from var(--color-accent) 0.76 0.14 h); }
}
```

**Step 4: Literals to tokens.**
```css
::selection { background: color-mix(in oklab, var(--color-accent) 26%, transparent); color: var(--color-fg); }
::-webkit-scrollbar-thumb { background: color-mix(in oklab, var(--color-fg) 18%, transparent); border-radius: 2px; }
```
Reword the `overflow-x: clip` comment: "clip (not hidden): kills stray horizontal scroll on small screens without turning body into a scroll container (SheetFrame is position: fixed and must stay viewport-anchored)".

**Step 5: Component classes.** Inside `@layer components` add after `.mono`:
```css
  /* Display voice — Newsreader roman. Structure (the name, section titles,
     subheads, the big email) is set in this; titles of pieces stay italic.
     Serif capitals need far less negative tracking than the old grotesk. */
  .display {
    font-family: var(--font-serif);
    font-weight: 600;
    font-optical-sizing: auto;
    letter-spacing: -0.02em;
  }

  /* SheetFrame's frosted marginalia tiles — the site's only glass. Solid enough
     to carry text on their own; the blur is a hint, not a material. */
  .frame-tile {
    background: color-mix(in oklab, var(--color-bg) 88%, transparent);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
  @media (prefers-reduced-transparency: reduce) {
    .frame-tile { background: var(--color-bg); -webkit-backdrop-filter: none; backdrop-filter: none; }
  }
```

**Step 6: Grain.** After the `body { ... }` rule add:
```css
/* Paper grain — one pre-rendered 128px tile of alpha noise, laid over
   everything at a few percent. A fixed pseudo-element, never a live
   feTurbulence filter (that is computed per pixel, per paint). */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  background: url("/grain.png") repeat 0 0 / 128px 128px;
  opacity: 0.05;
}
```

**Step 7: Reveals and reduced motion.** Change the reveal transition to
`transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out);` and replace the final reduced-motion block with:
```css
@media (prefers-reduced-motion: reduce) {
  /* fewer and gentler, not zero: keyframe motion goes, movement transitions go,
     the 140ms colour/opacity answers stay (they aid comprehension, not motion) */
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
  html.reveal-armed [data-reveal] { transition: none; }
}
```

**Step 8: Verify.** `grep -n "accent-bright\|ease-out-quint\|0.001ms" src/styles/global.css` → only the animation lines remain. `npm run typecheck` passes (Tailwind class errors surface at build; run `npm run build` once here too).

---

### Task 2: Display serif, tap targets, label fixes in components

**Files:**
- Modify: `src/components/Hero.astro`, `Work.astro`, `Chat.astro`, `Record.astro`, `Contact.astro`, `SheetFrame.astro`, `src/pages/404.astro`, `src/pages/writing/index.astro`

Rules applied everywhere: replace `font-bold ... tracking-[-0.05em|-0.055em]` on titles with the `display` class; remove every `!` utility prefix on `.mono-label` elements (utilities already beat the components layer); phone-visible controls get `inline-flex min-h-11 items-center` instead of `py-2`.

**Hero.astro**
- h1 → `class="display text-[clamp(3.5rem,17vw,11rem)] uppercase leading-[0.88] sm:text-[clamp(3.7rem,15vw,14rem)] lg:text-[clamp(8rem,17vw,14rem)]"`
- `mono-label !text-fg` → `mono-label text-fg` (two places)
- chip buttons → `class="mono-label inline-flex min-h-11 items-center transition-colors before:content-['['] after:content-[']'] hover:text-accent active:text-accent"`
- press-slash link → `class="mono-label inline-flex min-h-11 items-center text-accent transition-colors hover:text-accent-hi"`

**Work.astro**
- h2 → `class="display text-[clamp(3rem,9vw,8rem)] uppercase leading-[0.85]"`
- outlined numeral `<p>`: `font-bold` → `display`
- h3 → `class="display text-2xl leading-tight sm:text-4xl"`
- `!text-accent-bright` → `text-accent-on-ink` (two places); `border-accent-bright` → `border-accent-on-ink`; `!border-bg/25 !text-bg/60` → `border-bg/25 text-bg/60`

**Chat.astro**
- h2 → `class="display mt-3 text-[clamp(2.8rem,8vw,7rem)] uppercase leading-[0.85]"`

**Record.astro**
- section → `class="border-b-2 border-fg bg-elevated"` (single 2px seam with Chat)
- h2 → `class="display mt-3 text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.85]"`
- both h3 → `class="display text-xl uppercase tracking-[0.02em]"`
- HEAD span → `class="mono-label ml-2 normal-case text-accent"`

**Contact.astro**
- email link → `class="display block break-all text-[clamp(2rem,7vw,5.5rem)] lowercase leading-[0.95] transition-colors hover:text-accent active:text-accent"`
- copy button → `class="mono-label inline-flex min-h-11 items-center border border-fg px-3 transition-colors hover:border-accent hover:text-accent active:bg-accent/10"`
- social links → `class="mono-label inline-flex min-h-11 items-center normal-case transition-colors hover:text-accent active:text-accent"` with text `{social.label} · {social.handle} →`

**SheetFrame.astro**
- `<header ... data-sheet-frame>`
- mark link: replace `bg-bg/88 ... backdrop-blur-sm` with `frame-tile`, add `data-frame-tile`; `<SlowikMark scale={1} />` (no width class → native 34x24)
- `!text-[9px]` → `text-[9px]`
- nav `<ul>`: `frame-tile` + `data-frame-tile` instead of `bg-bg/88 ... backdrop-blur-sm`
- bottom wrapper div: add `normal-case`; both `<p>`: `frame-tile px-2 py-1` + `data-frame-tile`
- comment: "Fixed marginalia: this is the sheet's frame, not a navigation bar. The companion renders at z-35 and passes beneath these tiles; it clips its hit box against `[data-frame-tile]`."

**404.astro**: h1 → `class="display mt-4 text-4xl sm:text-5xl"`; delete `Astro.response.status = 404;` (Task 7 owns the rest).

**writing/index.astro**: h1 → `class="display text-2xl uppercase tracking-[0.02em] sm:text-3xl"`.

**Verify:** `grep -rn '!text-\|!border-\|accent-bright\|backdrop-blur' src/components src/pages` → no matches. `npm run typecheck` passes.

---

### Task 3: One copy source (`site.ts` and readers)

**Files:**
- Modify: `src/data/site.ts`, `Work.astro`, `Chat.astro`, `Record.astro`, `Contact.astro`, `src/lib/schema.ts:116-124`, `src/pages/rss.xml.ts:13`, `src/pages/writing/index.astro:21`

**Step 1: Types.** In `SiteContent`:
- delete `hero`, `now`, `stack` (and the `NowCard`, `StackColumn` interfaces)
- add `export interface SectionHead { index: string; title: string; meta?: string; }`
- add to `WorkItem`: `/** one of the three case files on the cover; the rest ship only in llms-full.txt */ featured?: boolean;`
- `identity`: add `/** one factual paragraph, consumed by llms-full.txt */ about: string;`
- add `sections: { work: SectionHead; chat: SectionHead; record: SectionHead; contact: SectionHead };`
- `work: { items: WorkItem[] }` (drop `lead`, `count`)
- `writing: { lead: string; title: string; description: string }`
- `slowik`: drop `heroTitle`, `heroBlurb`, `chatTitle`, `chatMeta`
- `contact: { blurb: string; email: string; socials: SocialLink[] }`
- `colophon: { titleBlock: TitleCell[]; copyright: string; version: string; commit: string }`

**Step 2: Values.**
```ts
  identity: {
    name: "Krystian Słowik",
    monogram: "ks",
    role: "I handle enterprise support and integrations at n8n. I fix failures the docs don't cover and write down what worked.",
    manifesto: "Root cause over vibes. I read the source when the docs lie.",
    about: "Krystian fixes systems nobody documented, then writes the play so they stay fixed. He builds internal tooling, MCP servers and automation; maintains a three-node bare-metal Kubernetes homelab; studies cybersecurity part-time; and speaks Polish, English and German.",
  },

  sections: {
    work: { index: "§01 / evidence", title: "Case files", meta: "three selected cases" },
    chat: { index: "§02 / live unit", title: "Remote diagnostics", meta: "channel open · best effort" },
    record: { index: "§03 / record", title: "Record" },
    contact: { index: "§04 / direct line", title: "Contact" },
  },
```
- `work: { items: [...] }` with `featured: true` on items 01, 02 and 04.
- `writing: { lead: "Dispatches", title: "Writing | Krystian Słowik", description: "Notes on incidents, homelab Kubernetes and keeping systems quiet." }`
- delete the `hero`, `now`, `stack` blocks, `contact.lead/slipNo`, `colophon.lead/notes`, `slowik.heroTitle/heroBlurb/chatTitle/chatMeta`
- colophon titleBlock "set in" → `"newsreader · helvetica neue · jetbrains mono"`

**Step 3: Readers.**
- Work.astro: `const { work, sections } = site; const selected = work.items.filter((item) => item.featured);` and render `{sections.work.index}`, `{sections.work.title}`, `{sections.work.meta}`.
- Chat.astro: `const { slowik, sections } = site;` render `{sections.chat.index}`, `{sections.chat.title}`, `{sections.chat.meta}`.
- Record.astro: `{site.sections.record.index}` / `{site.sections.record.title}`; h3s render `{site.experience.lead}` + `{site.experience.meta}` and `{site.writing.lead}`.
- Contact.astro: `{sections.contact.index}`; sr-only h2 `{sections.contact.title}`.
- schema.ts `writingIndexSchema`: `name: site.writing.title, description: site.writing.description`.
- rss.xml.ts: `description: site.writing.description`.
- writing/index.astro: `<Base title={site.writing.title} description={site.writing.description} schema={schema}>`, h1 text `{site.writing.lead}`.

**Verify:** `grep -rn "heroTitle\|heroBlurb\|chatTitle\|chatMeta\|slipNo\|colophon.notes\|site.now\|site.stack\|work.lead\|work.count\|\[\"01\"" src` → nothing. `npm run typecheck` passes (it is the guard: any reader of a deleted field fails here).

---

### Task 4: llms endpoints and manifest

**Files:**
- Create: `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- Delete: `public/llms.txt`, `public/llms-full.txt`
- Modify: `public/site.webmanifest`

**`src/pages/llms.txt.ts`**
```ts
import type { APIContext } from "astro";
import { site } from "@data/site";

// /llms.txt (llmstxt.org) — generated from site.ts at build time so it can never
// drift from the page copy. /llms-full.txt is the long form.
const TEXT = { headers: { "Content-Type": "text/plain; charset=utf-8" } };

export function GET({ site: base }: APIContext) {
  const home = (base ?? new URL(site.meta.url)).href;
  const abs = (p: string) => new URL(p, home).href;
  const featured = site.work.items.filter((w) => w.featured);
  const lines = [
    `# ${site.identity.name}`,
    "",
    `> ${site.meta.description}`,
    "",
    site.identity.manifesto,
    "",
    "## Site",
    "",
    `- [Home](${home}): ${site.sections.work.title}, the słowik chat, the record, writing and contact.`,
    `- [Writing](${abs("/writing/")}): ${site.writing.description}`,
    `- [Ask the słowik](${abs("/#chat")}): ${site.slowik.intro}`,
    "",
    `## ${site.sections.work.title}`,
    "",
    ...featured.map((w) => `- [${w.title}](${abs("/#work")}): ${w.outcome}`),
    "",
    "## Contact",
    "",
    `- [Email](mailto:${site.contact.email}): ${site.contact.email}`,
    ...site.contact.socials.map((s) => `- [${s.label}](${s.href}): ${s.handle}`),
    `- [Full details](${abs("/llms-full.txt")})`,
    "",
  ];
  return new Response(lines.join("\n"), TEXT);
}
```

**`src/pages/llms-full.txt.ts`**
```ts
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { site } from "@data/site";

// /llms-full.txt — everything site.ts and the writing collection know, in
// plain text, generated at build time (see llms.txt.ts).
const TEXT = { headers: { "Content-Type": "text/plain; charset=utf-8" } };

export async function GET({ site: base }: APIContext) {
  const home = (base ?? new URL(site.meta.url)).href;
  const abs = (p: string) => new URL(p, home).href;
  const posts = (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const lines = [
    `# ${site.identity.name}`,
    "",
    `> ${site.meta.description}`,
    "",
    "## About",
    "",
    site.identity.about,
    "",
    "## Experience",
    "",
    ...site.experience.items.map((e) => `- ${e.date}: ${e.role}`),
    "",
    "## Work",
    "",
    ...site.work.items.flatMap((w) => [`### ${w.title}`, "", `${w.blurb} ${w.action} ${w.outcome}`, ""]),
    "## Writing",
    "",
    ...posts.map((p) => `- [${p.data.title}](${abs(`/writing/${p.id}/`)}): ${p.data.blurb}`),
    "",
    "## Contact",
    "",
    `- Email: ${site.contact.email}`,
    ...site.contact.socials.map((s) => `- ${s.label}: ${s.href}`),
    `- Ask the słowik: ${abs("/#chat")}. ${site.slowik.footnote}`,
    "",
  ];
  return new Response(lines.join("\n"), TEXT);
}
```
Delete the two static files: `rm public/llms.txt public/llms-full.txt`.

**Manifest:** `description` → the exact `site.meta.description` string; `theme_color` and `background_color` → `#f2f0ea`.

**Verify:** `npm run build` then `head -20 dist/llms.txt && grep -c "^- " dist/llms-full.txt` — titles match site.ts ("Imaging pipeline, end to end"), post titles match the mdx.

---

### Task 5: Colour sync — sprite ink, favicon, console, theme-color, icons

**Files:**
- Modify: `src/lib/slowik.ts:11`, `public/favicon.svg`, `src/layouts/Base.astro:122`, `src/components/SEO.astro:31`
- Rewrite in place: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/favicon-32.png`

- slowik.ts: `const AMBER: [number, number, number] = [149, 78, 0]; // --color-accent oklch(0.50 0.125 60) in sRGB (#954e00) — keep in lockstep with global.css`
- favicon.svg: `#f1ece0` → `#f2f0ea` (two places), `#b26a10` → `#954e00`
- Base.astro console style: `color:#954e00`
- SEO.astro: `const THEME = "#f2f0ea"; // --color-bg oklch(0.955 0.008 92) in sRGB; matches the web manifest`
- Icons (scratchpad script; each file has exactly these two colours):
```python
from PIL import Image
MAP = {(0xf1, 0xec, 0xe0): (0xf2, 0xf0, 0xea), (0xb2, 0x6a, 0x10): (0x95, 0x4e, 0x00)}
for p in ["public/icon-192.png", "public/icon-512.png", "public/apple-touch-icon.png", "public/favicon-32.png"]:
    im = Image.open(p).convert("RGBA")
    im.putdata([(*MAP.get(px[:3], px[:3]), px[3]) for px in im.getdata()])
    im.save(p, optimize=True)
    print(p, sorted({px[:3] for px in im.getdata()}))
```
Expected print: each file lists exactly `[(149, 78, 0), (242, 240, 234)]`.

**Verify:** `grep -rn "b26a10\|f1ece0\|178, 106, 16" src public` → nothing.

---

### Task 6: Bird bubble, hit box, chat rail

**Files:**
- Modify: `src/lib/slowikCompanion.ts` (constructor ~145-175, `placeBubble` ~752, loop ~855-865), `src/components/SlowikChat.svelte`

**Companion**
- Replace `private navEl: HTMLElement | null = document.querySelector("header");` with
  `private tiles: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>("[data-frame-tile]")); // SheetFrame's frosted tiles — the only things that occlude the bird`
- Constructor comment: "z 35: BELOW the fixed SheetFrame marginalia (z-40) — owner's call: the bird passes UNDER the frosted tiles (behind the glass), never over the menu. The hero-name perch bias keeps it from roosting half-hidden up there."
- Bubble cssText →
```ts
    this.bub.style.cssText =
      "position:fixed;left:0;top:0;opacity:0;transform:translateY(4px);transition:opacity .2s var(--ease-out),transform .2s var(--ease-out);" +
      "font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;line-height:1.2;letter-spacing:.08em;color:var(--color-accent);white-space:nowrap;pointer-events:none;" +
      // a paper pill: the chirp stays legible over the ink panels and wherever scroll-follow takes it
      "padding:2px 6px;border:1px solid var(--color-border);border-radius:2px;background:color-mix(in oklab,var(--color-bg) 92%,transparent);";
```
- `placeBubble`: `this.bub.style.top = \`${y - 22}px\`;` (pill is ~21px tall).
- Hit-box block →
```ts
    // hit box tracks the visible sprite (flight sprite is wider/taller than the
    // perched one), clipped against SheetFrame's frosted tiles — the sprite
    // passes behind them (z 35 vs 40), so the occluded part must not be tappable
    // and a tap on a tile always reaches the tile. The rest of the frame is
    // transparent and pointer-events-none, so a bird there stays tappable.
    const hitW = this.flying ? this.flightCv.width : FULL.w * SCALE;
    let hitTop = this.flying ? rY - rArc - this.flightCv.height * 0.72 : rY - feetPx - this.hop;
    let hitH = this.flying ? this.flightCv.height : FULL.h * SCALE;
    const hitL = rX - hitW / 2, hitR = hitL + hitW;
    for (const tile of this.tiles) {
      const r = tile.getBoundingClientRect();
      if (r.right <= hitL || r.left >= hitR || r.bottom <= hitTop || r.top >= hitTop + hitH) continue;
      const cut = Math.min(hitTop + hitH, r.bottom) - hitTop; // keep only what shows below the tile
      hitH = Math.max(0, hitH - cut); hitTop += cut;
    }
    this.hit.style.width = `${hitW}px`;
    this.hit.style.height = `${hitH}px`;
    this.hit.style.pointerEvents = hitH > 0 ? "auto" : "none";
    this.hit.style.transform = `translate(${rX - hitW / 2}px, ${hitTop}px)`;
```

**SlowikChat.svelte**
- add `let railEl: HTMLDivElement;` next to `stageEl`; `<div class="wire-rail" bind:this={railEl} aria-hidden="true"></div>`
- `measureStage`:
```ts
  // the same breakpoint the rail/card CSS keys on — never derive layout from stage width
  const compactMq = matchMedia("(max-width: 639px)");
  function measureStage() {
    stageW = stageEl.clientWidth;
    compact = compactMq.matches;
    railY = railEl?.offsetTop || (compact ? 130 : 200); // the drawn rail is the single source of truth
    cardW = Math.min(300, stageW - 90);
    gap = Math.round(cardW * 0.77);
  }
```
- styles: `.wire-world { transition: transform 0.6s var(--ease-out); }`; `.wire-card .box` shadow → `box-shadow: 2px 2px 0 color-mix(in oklab, var(--color-fg) 10%, transparent);` and transition → `max-height 0.35s var(--ease-out), border-color 140ms, opacity 0.3s`; inside the existing reduced-motion block add `.wire-card .box { transition-property: border-color, opacity; }`.

**Verify:** `grep -n 'querySelector("header")\|sticky\|cubic-bezier' src/lib/slowikCompanion.ts src/components/SlowikChat.svelte` → nothing. `npm run typecheck` passes.

---

### Task 7: Remove the dev-404 machinery

**Files:**
- Modify: `astro.config.mjs`
- Delete: `src/pages/[...path].astro`, empty dir `src/pages/[path]/`

Replace the `let devCommand` line and the whole `dev404` object with:
```js
// Dev only: accept slash-less URLs so a mistyped path lands on the custom 404
// page instead of Astro's trailing-slash error overlay. Production keeps "always".
const devTrailingSlash = {
  name: "project-dev-trailing-slash",
  hooks: {
    "astro:config:setup": ({ command, updateConfig }) => {
      if (command === "dev") updateConfig({ trailingSlash: "ignore" });
    },
  },
};
```
and `integrations: [devTrailingSlash, ...]`. Then `rm 'src/pages/[...path].astro' && rmdir 'src/pages/[path]'`.

**Verify:** `npm run dev` for ~5s: no `[config]` adapter warning and no `getStaticPaths() ignored` line; `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/zzz-nope` → `404`.

---

### Task 8: Docs — CLAUDE.md corrections, AGENTS.md pointer

**Files:** `CLAUDE.md`, `AGENTS.md`

CLAUDE.md sentence replacements (exact):
1. "`theme-color` `#161719`" → "`theme-color` `#f2f0ea` — the paper `--color-bg` in sRGB, same value in `site.webmanifest`".
2. In the discovery paragraph replace "`llms.txt` + `llms-full.txt` (llmstxt.org; **keep llms-full.txt in sync with `site.ts` or delete it** — stale is worse than none)" with "`llms.txt` + `llms-full.txt` are NOT static: `src/pages/llms.txt.ts` and `llms-full.txt.ts` generate them from `site.ts` + the writing collection at build time (llmstxt.org)".
3. Perch list: replace "(section rules, work cards, writing post titles, contact social links, the Experience HEAD row, hero panel, the hero SURNAME — `data-perch="name"`, the OG spot and boot perch, biased +120 so it wins whenever the hero is on screen — telemetry strip, footer)" with "(section rules: the case-file articles, the Record head, the HEAD row, post titles, the Contact block; the hero SURNAME — `data-perch="name"`, the OG spot and boot perch, biased +120 so it wins whenever the hero is on screen; the chat `wire`; the footer)".
4. Replace "The bird renders at z 35 — BELOW the sticky nav (z-40): **owner's explicit call — the bird passes UNDER the frosted bar, never over the menu** (do not "fix" this by raising z). The hit box is clipped to below the nav's live bottom edge, so the occluded part of the sprite is not tappable and menu taps always win." with "There is no nav bar: `SheetFrame.astro` is a fixed, pointer-events-none frame whose four frosted tiles (`[data-frame-tile]`: mark, page index, clock, revision) are the only things that occlude the bird. The bird renders at z 35 — BELOW those tiles (z-40): **owner's explicit call — the bird passes UNDER the frosted tiles, never over the menu** (do not "fix" this by raising z). The hit box is clipped against the tiles' live rects, so the occluded part of the sprite is not tappable and menu taps always win."
5. Conventions, styling bullet: append " The theme is warm paper (`--color-bg` oklch 0.955) with one burnt-amber accent; `--color-accent-on-ink` is that accent lifted for the two inverted ink panels, not a second colour. Type roles: `.display` (Newsreader roman 600) for structure, Newsreader italic for titles of pieces, `.mono-label` for apparatus, system sans for body. `body::before` lays a pre-rendered grain tile (`public/grain.png`) over the page — never a live SVG filter."
6. Mobile-first bullet: "(nav links `py-3` below sm)" → "(SheetFrame page-index links `py-3`, chips and contact links `min-h-11`)".

AGENTS.md → replace the whole file with:
```markdown
# AGENTS.md

Agent guidance for this repository lives in `CLAUDE.md` at the repo root — layout, commands, architecture notes and conventions. Read that file; it is the single source of truth and this one deliberately carries no copy of it.
```

**Verify:** `grep -n "161719\|sticky nav\|telemetry strip\|Codex" CLAUDE.md AGENTS.md` → nothing.

---

### Task 9: OG image re-shoot

**Files:**
- Create then delete: `src/pages/og-card.astro`
- Rewrite: `public/og.png`

Temporary page (uses the real tokens, serif and bird):
```astro
---
import "../styles/global.css";
import { site } from "@data/site";
import SlowikMark from "@components/SlowikMark.astro";
const [forename, surname] = site.identity.name.split(" ");
---
<html lang="en">
  <head><meta charset="utf-8" /><style>html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }</style></head>
  <body class="bg-bg text-fg font-sans antialiased">
    <div class="flex h-[630px] w-[1200px] flex-col justify-between border-t-4 border-fg px-16 pb-12 pt-8">
      <div class="flex items-center justify-between">
        <p class="mono-label text-fg">{site.manual.docNo} · cover / identity</p>
        <SlowikMark scale={3} />
      </div>
      <h1 class="display text-[11rem] uppercase leading-[0.85]">{forename}<br />{surname}</h1>
      <div class="flex items-end justify-between gap-10 border-t border-border pt-5">
        <p class="max-w-[720px] text-2xl leading-snug text-fg-2">{site.identity.role}</p>
        <p class="mono-label whitespace-nowrap text-accent">krystianslowik.com</p>
      </div>
    </div>
  </body>
</html>
```
With `npm run dev` running:
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1200,630 --virtual-time-budget=6000 --screenshot=public/og.png http://localhost:4321/og-card/
```
View `public/og.png`; if the name overflows, drop to `text-[10rem]`. Then `rm src/pages/og-card.astro`.

**Verify:** `python3 -c "from PIL import Image; im=Image.open('public/og.png'); print(im.size, im.getpixel((10,600)))"` → `(1200, 630)` and a paper-coloured pixel, not charcoal. `ls src/pages` shows no `og-card.astro`.

---

### Task 10: Full verification and reviewer pass

1. `npm run typecheck` → 0 errors.
2. `npm run build` → completes; `ls dist/llms.txt dist/llms-full.txt dist/grain.png`.
3. Greps across `src public CLAUDE.md AGENTS.md`: no `accent-bright`, `b26a10`, `f1ece0`, `ease-out-quint`, `Codex`, `[...path]`.
4. Headless screenshots of `http://localhost:4321/` at `390,844`, `700,900`, `1280,900` (`--window-size`, `--virtual-time-budget=6000`) into the scratchpad; view each: serif name and titles render (not Georgia), grain visible but faint, chip row wraps at 44px rows, single 2px seam between Chat and Record, wire rail at the card stems at 700 wide.
5. Bubble over ink: in Chrome (claude-in-chrome), scroll to the second case file, run `window.__ksSlowik.sing()` and screenshot — the chirp sits in a paper pill.
6. Dispatch a separate reviewer agent (`oh-my-claudecode:code-reviewer` or `superpowers:code-reviewer`) with the design note and this plan; address its findings before reporting completion.
