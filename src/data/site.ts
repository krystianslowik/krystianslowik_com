// ============================================================================
// CONTENT LAYER — single source of truth for all site copy.
// Everything the page renders comes from here, so content can be swapped
// wholesale later without touching components. Keep it typed.
// ============================================================================

export interface NavItem { label: string; href: string; }

export interface SectionHead { index: string; title: string; meta?: string; }

export interface WorkItem {
  index: string;
  /** one of the three case files on the cover; the rest ship only in llms-full.txt */
  featured?: boolean;
  title: string;
  blurb: string;
  tags: string[];
  problem: string;
  action: string;
  outcome: string;
  whatIdDoDifferently: string;
}

export interface ExperienceRow { date: string; role: string; head?: boolean; }

export interface SocialLink { label: string; handle: string; href: string; }

export interface SlowikExchange { you: string; slowik: string; }

export interface TitleCell { k: string; v: string; }

/** The page presents itself as a printed operator's handbook; this is its document apparatus. */
export interface ManualMeta {
  docNo: string;
  revision: string;
  effective: string;
  sheet: string;
  /** phrases running along the cover's bottom tape */
  marquee: string[];
}

export interface SiteContent {
  meta: { title: string; description: string; url: string; ogImage: string };
  identity: {
    name: string;
    role: string;       // sub-headline
    manifesto: string;  // tagline
    /** one factual paragraph, consumed by llms-full.txt */
    about: string;
  };
  nav: NavItem[];
  status: { location: string };
  manual: ManualMeta;
  sections: { work: SectionHead; chat: SectionHead; record: SectionHead; contact: SectionHead };
  work: { items: WorkItem[] };
  experience: { lead: string; meta: string; items: ExperienceRow[] };
  writing: { lead: string; title: string; feedTitle: string; description: string };
  slowik: {
    intro: string;
    seeded: SlowikExchange;
    placeholder: string;
    /** starter questions — click auto-sends them to the chat (hero + island) */
    chips: string[];
    footnote: string;
  };
  contact: { blurb: string; email: string; socials: SocialLink[] };
  colophon: { titleBlock: TitleCell[]; copyright: string; version: string; commit: string };
}

export const site: SiteContent = {
  meta: {
    title: "Krystian Słowik | support & integrations engineer",
    description:
      "Enterprise support & integrations engineer at n8n. I debug Kubernetes deployments and AI pipelines at source. Ask the słowik.",
    url: "https://krystianslowik.com",
    ogImage: "/og.png",
  },

  identity: {
    name: "Krystian Słowik",
    role: "I handle enterprise support and integrations at n8n. I fix failures the docs don't cover and write down what worked.",
    manifesto: "Root cause over vibes. I read the source when the docs lie.",
    about:
      "Krystian fixes systems nobody documented, then writes the play so they stay fixed. He builds internal tooling, MCP servers and automation; maintains a three-node bare-metal Kubernetes homelab; studies cybersecurity part-time; and speaks Polish, English and German.",
  },

  nav: [
    { label: "work", href: "/#work" },
    { label: "chat", href: "/#chat" },
    { label: "writing", href: "/#writing" },
    { label: "contact", href: "/#contact" },
  ],

  status: { location: "Münster · DE" },

  manual: {
    docNo: "doc. ks-2026",
    revision: "rev. d",
    effective: "effective 2026-07",
    sheet: "sheet 1 of 1",
    marquee: [
      "support & integrations",
      "enterprise kubernetes",
      "debugging AI pipelines at source",
      "n8n",
      "homelab k8s",
      "root cause over vibes",
      "Münster · DE",
      "the słowik sings only what it was taught",
    ],
  },

  sections: {
    work: { index: "§01 / evidence", title: "Case files", meta: "three selected cases" },
    chat: { index: "§02 / live unit", title: "Remote diagnostics", meta: "channel open · best effort" },
    record: { index: "§03 / record", title: "Record" },
    contact: { index: "§04 / direct line", title: "Contact" },
  },

  work: {
    items: [
      {
        index: "01",
        featured: true,
        title: "Imaging pipeline, end to end",
        blurb:
          "I built the imaging pipeline from ingest through detection and delivery.",
        tags: ["Python + C#", "RabbitMQ", "computer vision", "hybrid on-prem"],
        problem:
          "~20 minutes per file before anyone saw the contents; results lived outside the system people worked in.",
        action:
          "I built content-addressed ingest and a native tiler that ran in about 1.5 seconds per file. A RabbitMQ-fed service ran the custom model and sent results to the operational app across on-prem GPU and cloud.",
        outcome:
          "Files became available almost immediately. The results stayed in the system used for billing and reporting.",
        whatIdDoDifferently: "CI/CD and backups first.",
      },
      {
        index: "02",
        featured: true,
        title: "An n8n node, because the platform was missing one",
        blurb:
          "Plain had no n8n node. So I shipped one to the community.",
        tags: ["n8n", "custom node", "GraphQL", "community package"],
        problem:
          "Every workflow needed its own hand-written GraphQL requests, including authentication and filters.",
        action:
          "I wrapped Plain's GraphQL API in n8n-nodes-plainapi. It has 34 operations, one typed credential, filtering and sorting, and no runtime dependencies. It ships through npm and Community Nodes.",
        outcome:
          "One install and a credential replaced all of it.",
        whatIdDoDifferently: "Ship it the first time I hit the gap.",
      },
      {
        index: "03",
        title: "Reusable deployment plays, not one-off fixes",
        blurb:
          "Sole author of an enterprise Kubernetes deployment playbook.",
        tags: ["Helm", "methodology", "docs as product"],
        problem:
          "Every deployment re-derived the same decisions, then re-broke in the same places.",
        action:
          "I documented execution modes, Helm tradeoffs, sizing and hardening. Each troubleshooting entry came from an incident that happened.",
        outcome:
          "Deployments start from the play, not a blank page.",
        whatIdDoDifferently: "The second time you explain something, write it down.",
      },
      {
        index: "04",
        featured: true,
        title: "Finding the fault in enterprise deployments",
        blurb:
          "EKS and AKS incidents rarely point at the layer that failed.",
        tags: ["Kubernetes", "TLS/mTLS", "Grafana", "source-level RCA"],
        problem:
          "The first explanation is usually wrong. Someone has often stated it with confidence already.",
        action:
          "I check MTU, SNI, proxy settings, DNS and egress, then read the product source if the docs stop short. If there is no fix or date, I say that.",
        outcome:
          "The customer gets a fix at the failing layer and evidence their infrastructure team can use.",
        whatIdDoDifferently: "Bring the packet capture earlier.",
      },
      {
        index: "05",
        title: "AI pipelines, debugged where they broke",
        blurb:
          "Multi-provider agent pipelines failing somewhere in the middle.",
        tags: ["LLM pipelines", "MCP", "multi-provider", "production"],
        problem:
          "Failures look like model quality problems. Usually aren't.",
        action:
          "Trace at the failing layer: schema-mismatched tool calls, silent context truncation, retry cascades on provider 429s. Vendor claims verified at source.",
        outcome:
          "I identify whether the failure is in the model, the prompt or the infrastructure between them.",
        whatIdDoDifferently: "Trust the reproduction, not the reply.",
      },
    ],
  },

  experience: {
    lead: "Revision history",
    meta: "newest revision first",
    items: [
      { date: "2026-01", role: "Senior product support engineer, IC3 enterprise at n8n (remote)", head: true },
      { date: "2025-01", role: "Senior product support engineer at Cognigy · AI/LLM/NLU SME on k8s (to 2025-12)" },
      { date: "2024-06", role: "Fullstack cloud engineer at jaraco GmbH (part-time, to 2026)" },
      { date: "2022-08", role: "2nd level technical support at Trusted Shops (to 2025-01)" },
      { date: "2022-07", role: "Game operator for plemiona.pl at InnoGames (co-op)" },
      { date: "2015-19", role: "Computer science at ZST Kolbuszowa · CISCO IT Essentials · olympiad laureate" },
    ],
  },

  writing: {
    lead: "Dispatches",
    title: "Writing | Krystian Słowik",
    feedTitle: "Krystian Słowik | writing",
    description: "Notes on incidents, homelab Kubernetes and keeping systems quiet.",
  },

  slowik: {
    intro:
      "Słowik means nightingale in Polish and is my surname. This bird learned from my notes. It runs on my backend, so your browser never calls a model vendor.",
    seeded: {
      you: "what's your on-call philosophy?",
      slowik:
        "A pager means a human needs to decide something now. Everything else belongs in a ticket or an automation. Ask about something outside my notes and I'll say I don't know.",
    },
    placeholder: "ask about k8s, the homelab, or me…",
    chips: ["what do you do at n8n?", "tell me about a bad incident", "when do you read source?", "what have you shipped?", "how do you stop repeat incidents?"],
    footnote: "this bird repeats its notes. verify anything load-bearing with me.",
  },

  contact: {
    blurb: "Best path is email. I read everything, answer most.",
    email: "hej@krystianslowik.com",
    socials: [
      { label: "GitHub", handle: "@krystianslowik", href: "https://github.com/krystianslowik" },
      { label: "LinkedIn", handle: "/in/krystianslowik", href: "https://www.linkedin.com/in/krystianslowik/" },
    ],
  },

  colophon: {
    titleBlock: [
      { k: "drawn by", v: "k. słowik · münster, de" },
      { k: "set in", v: "newsreader · helvetica neue · jetbrains mono" },
      { k: "process", v: "astro static build · zero trackers, zero cookies" },
      { k: "ink", v: "one burnt amber on paper" },
    ],
    copyright: "© 2026 Krystian Słowik · Münster",
    version: "v2026.7",
    commit: "e8d3a1f",
  },
};
