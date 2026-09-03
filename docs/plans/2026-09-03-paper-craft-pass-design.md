# Paper craft pass — design note (2026-09-03)

Scope: a slight redesign of the uncommitted "operator's handbook" paper theme,
applying the theme-agnostic items of the 2026 dark/light-driven practice
document, plus all 15 findings of the 2026-09-02 code review. No structural or
copy changes. Direction chosen by the owner: stay on paper (not deep-dark);
display face Newsreader roman; craft pass plus all review fixes in one pass.

## 1. The look

Typography — four roles, three families:
- Display: Newsreader Variable roman, weight 600, optical sizing auto. Applied to
  the hero name, section h2s, case-file h3 titles, subheads ("Revision log",
  "Dispatches"), the giant email link, the 404 h1 and the archive h1. Uppercase
  stays where it is today; tracking loosens from -0.055em to about -0.02em.
- Titles of pieces and pull quotes: Newsreader italic (unchanged role).
- Apparatus: JetBrains Mono (unchanged).
- Body: system sans stack (unchanged) — serif display over a plain body.
- New import: `@fontsource-variable/newsreader/opsz.css` (roman). No new package.
- Colophon "set in" cell updated.

Colour — one accent:
- `--color-accent` stays oklch(0.50 0.125 60) (#954e00).
- `--color-accent-bright` becomes `--color-accent-on-ink`: same hue, lifted
  lightness for the two inverted panels. Relative colour syntax with a static
  fallback declared first.
- Raw literals (chat card shadow, ::selection, scrollbar thumb) -> color-mix from tokens.
- Sprite ink AMBER, favicon.svg, console tag -> #954e00.
- theme-color and manifest colours -> #f2f0ea (the actual --color-bg sRGB).

Texture:
- `public/grain.png`: 128x128 tiled alpha noise (~23 KB), generated once
  (seeded, PIL). Applied as a fixed full-viewport pseudo-element with normal
  blending at opacity 0.05 (tuned by screenshot, 0.03-0.06) — black alpha noise
  composited normally is visually identical to a darkening blend mode here, so
  no `mix-blend-mode` is set. No live feTurbulence.

Deliberately skipped: specular top-edge highlights and layered shadows (paper
has no elevation); the chat cards keep their hard 2px print offset.

## 2. Motion, interaction, the bird

- One curve: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` is the default
  transition timing and replaces the hand-rolled beziers in reveals and the chat
  (camera, card expansion). Hover stays 140ms. Reveals keep 16px rise / ~0.5s.
- Reduced motion softens, not zeroes: drop keyframe animations and movement
  transitions; keep colour/opacity transitions.
- Frosted marginalia tiles share one `.frame-tile` class; under
  `prefers-reduced-transparency: reduce` they flatten to solid paper.
- Tap targets: hero chips, press-slash link, contact links, copy button ->
  min-height 44px (`min-h-11`), label weight unchanged.
- Bird: chirp bubble in a paper pill with a hairline (legible over ink panels);
  hit-box clips against the four `[data-frame-tile]` rects, trimming from
  whichever side a tile enters, instead of the transparent header band; header
  mark at native 34px (no CSS stretch); ink matches accent. Flight physics untouched.
- Chat compact flag: read the rail's live offsetTop from the DOM, so the JS
  anchor and the CSS layout share one source (fixes the 640-747px band).

## 3. Content plumbing, cleanup, verification

Copy source:
- Components read from site.ts: work.lead + work.meta (renamed from `count`),
  experience.lead/meta, writing.lead, slowik.chatTitle, contact.lead.
- Deleted from site.ts: hero, now, stack, colophon.lead/notes, slowik.heroTitle/
  heroBlurb, contact.slipNo.
- `WorkItem.featured?: boolean` replaces the `["01","02","04"]` index list.
- `writing.title` + `writing.description` in site.ts feed the archive page head,
  the Blog JSON-LD and the RSS channel.

Discovery files:
- `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` generate from site.ts
  and the writing collection; the static copies in public/ are deleted.
- site.webmanifest description synced by hand.
- og.png re-shot from the running site at 1200x630 (real serif + bird).
- icon-192/512, apple-touch-icon, favicon-32: two colours remapped in place.

Cleanup:
- Delete `src/pages/[...path].astro`, the `astro:route:setup` hook, the
  `devCommand` global, `Astro.response.status = 404` in 404.astro, and the empty
  `src/pages/[path]/` dir. Outcome: the dev-404 integration AND the dev
  trailing-slash flip were both removed, and `astro.config.mjs` was restored to
  HEAD — Astro's own dev middleware already serves a 404 page linking to the
  slashed URL, and the flip hid slash-less links that production redirects.
- HEAD marker and social labels: `normal-case`. LinkedIn separator removed.
- Record: `border-b-2` only (single 2px seam with Chat).
- CLAUDE.md: correct theme-color, nav/SheetFrame, perch list, deleted sections.
  AGENTS.md -> three-line pointer to CLAUDE.md.
- Reword the stale "sticky nav" comments (slowikCompanion.ts x2, global.css).

Verification:
- `npm run typecheck` and `npm run build` pass.
- Screenshots at 390 / 700 / 1280: serif, grain, bubble over ink, wire alignment.
- grep: no component reads a deleted site.ts field; no `accent-bright`, no
  `b26a10`, no `f1ece0` left in src/ or public/.
- Separate reviewer pass before completion (no self-approval).
