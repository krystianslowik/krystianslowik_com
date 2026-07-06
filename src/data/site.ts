// ============================================================================
// CONTENT LAYER — single source of truth for all site copy.
// Everything the page renders comes from here, so content can be swapped
// wholesale later without touching components. Keep it typed.
// ============================================================================

export interface NavItem { label: string; href: string; }

export interface StatusField { k?: string; v: string; live?: boolean; }
export interface StatusReadout {
  /** labeled telemetry fields; `live` prefixes the value with the ticking clock */
  fields: StatusField[];
  availability: string;
}

export interface NowCard { key: string; label: string; body: string; }

export interface WorkItem {
  index: string;
  title: string;
  blurb: string;
  tags: string[];
  metric: string;
  problem: string;
  action: string;
  outcome: string;
  whatIdDoDifferently: string;
}

export interface ExperienceRow { hash: string; date: string; role: string; head?: boolean; }

export interface StackColumn { label: string; lines: string[]; }

export interface SocialLink { label: string; handle: string; href: string; }

export interface SlowikExchange { you: string; slowik: string; }

export interface SiteContent {
  meta: { title: string; description: string; url: string; ogImage: string };
  identity: {
    name: string;
    monogram: string;
    role: string;       // sub-headline
    manifesto: string;  // tagline
  };
  nav: NavItem[];
  status: StatusReadout;
  hero: { kicker: string; ctaPrimary: { label: string; href: string }; ctaSecondary: { label: string; href: string } };
  now: { updated: string; cards: NowCard[] };
  work: { lead: string; count: string; items: WorkItem[] };
  experience: { items: ExperienceRow[] };
  stack: { columns: StackColumn[] };
  slowik: {
    label: string;
    status: string;
    /** hero teaser: short headline + blurb over the clickable starter pills */
    heroTitle: string;
    heroBlurb: string;
    intro: string;
    seeded: SlowikExchange;
    placeholder: string;
    /** starter questions — click auto-sends them to the chat (hero + island) */
    chips: string[];
    footnote: string;
  };
  contact: { blurb: string; email: string; socials: SocialLink[] };
  colophon: { notes: string[]; copyright: string; version: string; commit: string };
}

export const site: SiteContent = {
  meta: {
    title: "Krystian Słowik — support & integrations engineer",
    description:
      "Enterprise support & integrations engineer at n8n. Kubernetes, AI agent pipelines, the auth layer. Plus a nightingale you can ask.",
    url: "https://krystianslowik.com",
    ogImage: "/og.png",
  },

  identity: {
    name: "Krystian Słowik",
    monogram: "ks",
    role: "Support and integrations engineer at n8n, enterprise tier. I get pulled into customer environments where Kubernetes, integrations, and AI pipelines are failing in ways nobody documented, and I build what makes them work: the fix, the custom node, the reusable play.",
    manifesto:
      "Root cause over vibes, but the deliverable is a working system in the customer's hands, not a diagnosis. I read the source when the docs lie.",
  },

  nav: [
    { label: "work", href: "/#work" },
    { label: "now", href: "/#now" },
    { label: "writing", href: "/#writing" },
    { label: "chat", href: "/#chat" },
    { label: "contact", href: "/#contact" },
  ],

  status: {
    fields: [
      { k: "loc", v: "Münster · DE" },
      { k: "time", v: "CET", live: true },
      { k: "focus", v: "enterprise k8s / AI agents" },
    ],
    // availability intentionally blank during review — "open to select work" reads as a
    // flight-risk signal to the same leadership deciding the promotion. Restore when ready.
    availability: "",
  },

  hero: {
    kicker: "[00] index",
    ctaPrimary: { label: "See selected work", href: "#work" },
    ctaSecondary: { label: "or ask the słowik", href: "#chat" },
  },

  now: {
    updated: "2026-07",
    cards: [
      { key: "role", label: "role", body: "Senior product support engineer (enterprise) at n8n. Self-hosted and cloud deployments across Kubernetes, distributed state, security boundaries, and AI agent pipelines that break in ways nobody documented. I build the fix and the tooling so it does not break the same way twice." },
      { key: "building", label: "building", body: "Internal tooling at work: MCP servers, Slack automation, CI/CD. Shipped n8n-nodes-plainapi, a community node for the Plain support platform, 34 operations across 8 resources. At home: a scanning console for the cluster, and the słowik at the bottom of this page." },
      { key: "learning", label: "learning", body: "Cybersecurity, part-time studies. And writing down anything I catch myself explaining twice." },
    ],
  },

  work: {
    lead: "Selected work",
    count: "the serious five",
    items: [
      {
        index: "01",
        title: "End-to-end delivery",
        blurb:
          "End-to-end delivery of an event-driven platform for gigabyte-scale imaging: content-addressed ingest, a native tiler, a domain-specific detection model, and the operational system on top.",
        tags: ["Python + C#", "RabbitMQ", "computer vision", "hybrid on-prem"],
        metric: "~20 min → 1.5 s / file",
        problem:
          "An instrument pipeline took roughly 20 minutes per file before anyone could look at the contents, and results lived outside the system people actually worked in.",
        action:
          "Built the chain end to end: a versioned, content-addressed ingest buffer, a native tiler integration that cut per-file processing to about 1.5 seconds, a detection service consuming tiles over RabbitMQ with a custom-trained model, results flowing into the operational app for lifecycle, billing and reporting, across on-prem GPU and cloud.",
        outcome:
          "A 20-minute batch step became near-real-time, landing in the same system where the work gets managed, invoiced and reported.",
        whatIdDoDifferently:
          "CI/CD and backups first, not last.",
      },
      {
        index: "02",
        title: "An n8n node, because the platform was missing one",
        blurb:
          "Plain is a support platform built for technical teams. n8n had no node for it, so I built and shipped one to the community: the full GraphQL surface wrapped in n8n's resource and operation model, with a typed credential and filter support.",
        tags: ["n8n", "custom node", "GraphQL", "community package"],
        metric: "34 operations, 8 resources, one credential",
        problem:
          "A high-value integration did not exist. Driving Plain from n8n meant hand-writing GraphQL in HTTP Request nodes and re-deriving auth, filters and pagination in every workflow.",
        action:
          "Built n8n-nodes-plainapi end to end: 34 operations across threads, customers, companies, emails, notes, labels, users and CSAT, full filter and sort support, a typed credential, strict mode, zero runtime deps. Published on npm, installable from Settings, Community Nodes.",
        outcome:
          "A bespoke need became a reusable node. Per-workflow GraphQL glue collapsed to one install and a credential.",
        whatIdDoDifferently:
          "Ship the node the first time I hit the gap, not the third.",
      },
      {
        index: "03",
        title: "Reusable deployment plays, not one-off fixes",
        blurb:
          "Sole author of an enterprise Kubernetes deployment playbook: execution-mode decisions, Helm chart tradeoffs, sizing, security hardening, and a troubleshooting index tied to real incidents. Every engagement codified into a play so the next deployment starts sharper.",
        tags: ["Helm", "methodology", "docs as product"],
        metric: "every engagement → a play",
        problem:
          "Every enterprise deployment re-derived the same decisions from scratch, and then hit the same incidents, which got re-diagnosed from scratch too.",
        action:
          "Codified the whole path into one playbook, verified against live deployments, with every troubleshooting entry indexed to incidents that actually happened rather than ones that might.",
        outcome:
          "Deployments start from the playbook instead of a blank page, and new incidents map to a known chapter more often than not.",
        whatIdDoDifferently:
          "Started it months later than I should have. The second time you explain something, write the play.",
      },
      {
        index: "04",
        title: "Enterprise deployments, debugged at source",
        blurb:
          "Enterprise deployments across EKS and AKS, where incidents arrive as symptoms with three plausible causes. TLS handshakes dying somewhere between cert validation, a proxy, a WAF and the network layer; licensing state that expires only in multi-instance mode, months apart.",
        tags: ["Kubernetes", "TLS/mTLS", "Grafana", "source-level RCA"],
        metric: "root cause > vibes",
        problem:
          "At enterprise scale the easy explanation is usually wrong, and it's often already been confidently stated by someone else. Multi-month recurrences span accounts with materially different architectures.",
        action:
          "Run the elimination chain, MTU, SNI, proxy env, DNS, egress paths, and read the product's source (licensing, leader election) instead of trusting the docs. Walk back the pet theory when the evidence kills it, including my own. Send the honest 'no fix, no date' update instead of overpromising.",
        outcome:
          "Fixes land where the bug actually lives, and customers get evidence their own infra teams can act on.",
        whatIdDoDifferently:
          "I used to argue against the theory; now I just bring the packet capture.",
      },
      {
        index: "05",
        title: "AI pipelines, debugged where they broke",
        blurb:
          "Enterprise agent systems running several model providers at once: tool calls that don't match the schema, context windows that truncate silently mid-chain, retry logic that cascades on provider 429s.",
        tags: ["LLM pipelines", "MCP", "multi-provider", "production"],
        metric: "sometimes it's the model",
        problem:
          "Agent failures look like model quality problems. Usually they aren't, but proving which layer actually broke takes reading source, not docs.",
        action:
          "Trace at the failing layer: the tool-call JSON the model generated versus the schema the node expects, contexts that truncate so the agent reasons on incomplete state, provider rate-limit retries that fire wrong and cascade. Verify vendor claims at source level, including correcting confident AI-generated answers before they become commitments.",
        outcome:
          "Honest diagnoses, model, prompt, or the infrastructure in between, and internal tooling so the next engineer doesn't re-derive the trace.",
        whatIdDoDifferently:
          "Trust the reproduction, not the reply. Including the AI's.",
      },
    ],
  },

  experience: {
    items: [
      { hash: "e8d3a1f", date: "2026-01", role: "Senior product support engineer, IC3 enterprise — n8n (remote)", head: true },
      { hash: "7b1e004", date: "2025-01", role: "Senior product support engineer — Cognigy · AI/LLM/NLU SME on k8s (→ 2025-12)" },
      { hash: "a3f9c2e", date: "2024-06", role: "Software engineer, fullstack cloud — jaraco GmbH (part-time, → 2026)" },
      { hash: "c40d18a", date: "2022-08", role: "2nd level technical support — Trusted Shops (→ 2025-01, left with a reference letter and an award)" },
      { hash: "b95fc27", date: "2022-07", role: "Game operator, plemiona.pl — InnoGames (co-op) · childhood game, other side of the banhammer" },
      { hash: "1f9aa75", date: "2015-19", role: "ZST Kolbuszowa — CS technikum, CISCO IT Essentials, olympiad laureate" },
    ],
  },

  stack: {
    columns: [
      { label: "operate", lines: ["Kubernetes — EKS, AKS, and kubeadm on bare metal", "Prometheus · Grafana · Loki · Jaeger", "Vault · Keycloak · mTLS · SSO (OIDC/SAML)", "Terraform · Helm · ArgoCD · GitHub Actions"] },
      { label: "build", lines: ["TypeScript · Python · Kotlin · Go — and PHP where it pays", "NestJS · FastAPI · Spring Boot · React/Next", "MCP servers, agents, n8n workflows — do it once, never again", "Postgres · Redis · RabbitMQ · Kafka", "YOLO · CVAT — models into systems, not notebooks"] },
      { label: "homelab", lines: ["3 bare-metal Ryzen nodes, kubeadm on Ubuntu, GitOps", "last rolling OS upgrade: three nodes, zero bytes lost", "where the bad ideas go first"] },
    ],
  },

  slowik: {
    label: "słowik",
    status: "online",
    heroTitle: "Ask the słowik anything.",
    heroBlurb:
      "Trained on my notes, talks and postmortems — it says “don't know” when it wasn't taught the answer.",
    intro:
      "słowik (SWOH-veek) — Polish for nightingale, and my surname. This one is the bird: a wind-up copy trained on my notes, talks and postmortems. It sings them back in my register — and says “don't know” when it wasn't taught the answer. The living Słowik is the one you email; the bird runs on my own backend, and your browser never calls a vendor.",
    seeded: {
      you: "what's your on-call philosophy?",
      slowik:
        "A pager should mean a human has to decide something right now. Everything else is a ticket — or an automation I still owe you. Ask me something I don't know and I'll say so.",
    },
    placeholder: "ask about k8s, the homelab, or me…",
    chips: ["why hire you?", "dropped into a fire?", "read the source?", "shipped an integration?", "one-off, or a play?"],
    footnote: "a wind-up bird repeats its songs, it doesn't think — verify anything load-bearing with me.",
  },

  contact: {
    blurb: "Best path is email. I read everything and reply to most of it.",
    email: "hej@krystianslowik.com",
    socials: [
      { label: "GitHub", handle: "@krystianslowik", href: "https://github.com/krystianslowik" },
      { label: "LinkedIn", handle: "/in/krystianslowik", href: "https://www.linkedin.com/in/krystianslowik/" },
    ],
  },

  colophon: {
    notes: [
      "Astro, static-first. The only hydrated island is the słowik — a 1-bit sprite on a fixed-tick physics engine, ~10 KB gzipped. Chat runs on my own infrastructure, no third-party model vendor in the request path.",
      "No trackers, no cookies, no consent banner. JS only where it earns its keep: the reveals and the bird. OKLCH palette, one amber, hairline depth — contrast measured, not assumed: body text AAA, labels AA.",
      "Keyboard-navigable end to end, visible focus rings; prefers-reduced-motion means the bird just perches. Helvetica Neue + JetBrains Mono, Newsreader for long-form. The słowik answers in Polish, English or German — like the man it's named after.",
    ],
    copyright: "© 2026 Krystian Słowik · Münster",
    version: "v2026.7",
    commit: "e8d3a1f",
  },
};
