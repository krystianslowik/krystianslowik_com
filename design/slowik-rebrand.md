# słowik — the rebrand from "parrot" (2026-07-04)

Full image/brand analysis and the decision record for renaming the site mascot
and chat from **the parrot** to **the słowik**. Produced by a five-analyst
review (naming, metaphor, sprite anatomy, touchpoint audit, adversarial judge).

## Decision

**Name: `słowik`** — lowercase Polish common noun, always with the definite
article in copy ("the słowik"). ASCII **`slowik`** in every machine surface:
filenames, identifiers, DOM ids, data attributes, and all of
`backend/src/routes/chat.ts` (that file is ASCII-"Slowik" by convention).
Capitalized **"Słowik" is reserved exclusively for the human.**

The logic: Słowik literally means *nightingale* in Polish. The hero already
glosses it (`słowik · /ˈswɔ·vik/ · Polish for "nightingale"`) — the mascot
becoming the słowik completes a story the site had already set up. Mascot,
domain, surname and SEO now reinforce each other, and every chat interaction
teaches a visitor what the name means and how to say it.

### Candidates considered

| candidate | brand fit | honesty | code | intl | distinct | verdict |
|---|---|---|---|---|---|---|
| **słowik** (lowercase, ł) | 10 | 8 | 9 | 6 | 10 | **winner** |
| slowik (ASCII display) | 7 | 8 | 10 | 7 | 8 | code slug only — displayed, it reads as a typo to Poles and exactly matches the domain spelling (max impersonation ambiguity) |
| nightingale (English) | 7 | 6 | 7 | 9 | 4 | the gloss, not the name — Florence Nightingale owns the word; surname asset wasted |
| Słowik (capitalized) | 5 | 3 | 9 | 6 | 9 | impersonation by construction |
| słowiczek (diminutive) | 6 | 7 | 6 | 3 | 9 | tips dry into cute; unpronounceable for the primary audience |
| Nachtigall (German) | 4 | 5 | 7 | 5 | 5 | wrong language for a Polish name; dark historical baggage (capitalized) |
| Luscinia (Latin genus) | 4 | 3 | 8 | 5 | 7 | sounds named by a branding agency; needs two hops to reach the surname |
| Philomela (myth) | 3 | 2 | 7 | 4 | 8 | the myth is rape/mutilation/infanticide; her defining trait is being unable to speak — inverse of the honesty brand |

### Guardrails (non-negotiable)

1. **Lowercase + article everywhere.** "the słowik" reads as a creature even to
   English eyes; bare/capitalized "Słowik" reads as the man. The section label
   is stored lowercase (`label: "słowik"`) — `.mono-label` lowercases via CSS
   anyway, but screen readers and scrapers read DOM text.
2. **The gloss is load-bearing.** "Parrot" gave anti-impersonation distance for
   free; "słowik" does not. The chat intro must carry the disambiguation:
   Polish for nightingale, also my surname, *this one is the bird*, the living
   Słowik is the one you email.
3. **Nav stays `chat`.** The nav is where recruiters scan fastest; "słowik" is
   the section heading, not the nav word. `#chat`, `a[href="#chat"]`, and the
   nav accent rule are untouched.
4. **Diacritic split.** UTF-8 "słowik" in human-readable copy (fonts verified:
   latin-ext ships in the imported fontsource files; the hero renders "Słowik"
   today). ASCII "slowik" in code and in the backend file.

## The honesty framing: a clockwork nightingale

"Stochastic parrot" (Bender et al.) was the old honesty device. The
replacement is **Andersen's "The Nightingale" (1843)**: the emperor's jewelled
mechanical nightingale that imitates the real bird — a canonical
artificial-copy-vs-the-real-thing story. The chat is *the clockwork słowik*:
openly the wind-up copy, never the man. The shared surname becomes the honesty
joke instead of an impersonation risk ("it carries my name because it's the
wind-up version of me; the real one answers email").

Supporting fact (verified): the common nightingale is a **vocal learner** — it
sings a repertoire of ~190 song types (max ~250) copied from adult tutors, and
sings only what it was taught. That carries "trained on my notes" truthfully.

Framing rules from the analysis:

- Do NOT import Andersen's "sings the same song every time" — false for an LLM.
  Use only: artificial / copy / not-the-real-one / mechanism can wind down.
- Do NOT celebrate "recombines songs into new sequences" — that advertises
  confabulation, the exact thing the honesty stance warns against. Neutral
  form only: *it sings what it was taught*.
- The Bender citation survives inside the backend persona — "a stochastic
  parrot in nightingale feathers" — where the AI-literate will actually find it.
- Keep the frame light: it's the wind-up copy, not a broken toy.
- Honesty is stated in plain words (trained on notes / says "don't know" /
  verify with me), never left to the allusion.

### Voice

The parrot squawked; the słowik sings — and, being clockwork, *winds down*.

- speech-bubble bank (`KRAAS` → `SONGS`): terse song transliterations
  ("fiu-fiu!", "tju-tju-tju", "jug-jug!", "hweet—", …) instead of kraas.
- `squawk()` → `sing()`.
- refusal idiom: "that's a song I was never taught".
- daily cost-cap 429: "wound down for the day — the bird is resting."
- the 23:00 Europe/Berlin footer sleep now has species support — nightingales
  are famous night singers, so the copy may nod at it, lightly.

## Sprite update (2026-07-05): nightingale redraft rolled back

The nightingale sprite below was drawn and shipped, then **reverted by owner
preference** — the original crested silhouette (crest, hooked beak, single
round eye) read better, "the eye etc". The name, copy, honesty framing, and all
renames stay; only `drawHead`/`drawFull`/`drawFly` head-group, `favicon.svg`,
and the raster icons/og.png returned to the original art. The słowik is now
*named* for the nightingale but *drawn* as the original bird. The analysis
below is kept as the record of what was tried.

## Sprite: what makes it a parrot, what makes it a nightingale

All in the same 1-bit amber (#e0992e) 4×4-Bayer system; sizes, physics, poses,
mount APIs, `Opts` field names unchanged.

Parrot markers to remove:

1. **The two erectile crest triangles** (drawHead/drawFull/drawFly head-group,
   favicon.svg spike) — THE parrot signal. Nightingales are plain and smooth.
2. **The hooked psittacine beak polygon** — replaced by a thin, short,
   straight, pointed insectivore bill (~3px base wedge).

Nightingale markers to add:

1. **Large eye** — the species' defining facial mark (big dark eye, pale ring).
   Enlarged punch; ring version only where scale allows (tonal inversion: amber
   is the light ink, so the "pale" ring is an amber annulus).
2. **Broad rounded tail, cocked UP when perched** (drawFull) — the current
   down-hanging tail actively contradicts the species. `tailFlick` moves the
   tip in Y (nightingales flick the tail up), not X.
3. Pale underparts via the existing dither; slim body; slightly longer legs.

`crestUp` keeps its name (callers pass it by name) and is reinterpreted as a
small head-lift "song" gesture; the flight head-group's local `crest` becomes a
subtle head nudge (up on flare, down on tuck). Flight wing polygons, flare
tail-fan + feet, tuck dart + streaks, glide blade, shade band: untouched.

## Touchpoints

Renames: `src/lib/parrot.ts → slowik.ts`, `parrotFlight.ts → slowikFlight.ts`,
`parrotCompanion.ts → slowikCompanion.ts`, `ParrotChat.svelte →
SlowikChat.svelte`, `ParrotMark.astro → SlowikMark.astro`;
`window.__ksParrot → __ksSlowik`, `getParrot → getSlowik`, `ParrotCompanion →
SlowikCompanion`, `#parrot-input → #slowik-input` (with Base.astro's "/"
binding), `data-parrot-mark → data-slowik-mark`, `#parrot-404 → #slowik-404`,
`site.parrot → site.slowik`, `ParrotExchange → SlowikExchange`.

Not touched: `PUBLIC_CHAT_API_URL`, the `/chat` endpoint and chat-api
backend/k8s names, the API wire format, `#chat`/nav/perch-system contracts,
physics + tuning constants, amber token, asset file *paths* (pixels change,
paths don't), git history.

`design/` lab files keep their historical parrot names (the flight-sim harness
filename and battery names are load-bearing references); this file plus a
README pointer record the rebrand. New sprite studies go in new files.

Assets regenerated from the new mark: favicon.svg (hand-edited source),
favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, favicon.ico,
og.png (new bird + "a nightingale you can ask" line). `llms.txt`/`llms-full.txt`
re-synced in the same pass (repo rule: stale is worse than none).
