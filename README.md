# krystianslowik.com

Personal site and its chat backend, two independently deployed apps in one repo.

| Path | What | Deploy |
|------|------|--------|
| root (`src/`, `public/`) | Astro 5 static site — Svelte 5 islands, Tailwind 4, MDX content | Cloudflare, automatic on push (Pages CI builds `dist/`) |
| `backend/` | "chat-api" — Express + TypeScript proxy for the słowik chat (OpenAI, rate limiting, optional MySQL logging) | k3s homelab via `backend/Dockerfile` + `backend/k8s/` |
| `design/` | Interactive HTML design studies + deterministic motion sims | not built, reference only |

## The słowik

The mascot is **the słowik** (Polish for nightingale — and the surname): a 1-bit
amber pixel bird with a real physics flight engine. One companion bird accompanies
the whole page — it perches on section rules and cards, follows your reading line
while you scroll, and lands on the chat wire. The chat renders the conversation as
cards on that wire; answers come from the backend, never from the browser.

Motion is tuned sim-first: `design/parrot-flight-sim.js` (flight/vertical model)
and `design/wire-scroll-sim.js` (chat wire scroll physics) are deterministic node
harnesses that mirror the live code — change the numbers there before touching
`src/lib/slowikFlight.ts`, `src/lib/slowikCompanion.ts`, or the chat camera.

## Principles

- No trackers, no cookies, no third-party requests: fonts are self-hosted, analytics don't exist, and the chat talks only to my own backend.
- Static first — the only hydrated island is the chat (`SlowikChat.svelte`).
- `prefers-reduced-motion` always degrades to a calm, static page.
- All copy lives in `src/data/site.ts`; components render content, they don't own it.

## Commands

Frontend (repo root):

```sh
npm run dev        # Astro dev server on :4321
npm run build      # static build → dist/
npm run typecheck  # astro check
npm run preview    # serve the built site
```

Backend (from `backend/`):

```sh
npm run dev        # tsx watch (PORT env, default 3000)
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit
```

Backend config is env-only — see `backend/.env.example`. `OPENAI_API_KEY` is
required; the server boots and serves `/chat` without a database.
