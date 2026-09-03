// ============================================================================
// JSON-LD (schema.org) factories — one source of truth for structured data.
// Every graph embeds the Person node (rich-results validators reject a bare
// @id reference to a node defined on another page), so each page's graph is
// self-contained. Facts come from src/data/site.ts — nothing hard-coded twice.
// ============================================================================

import { site } from "@data/site";

const ORIGIN = site.meta.url; // https://krystianslowik.com
const abs = (path: string) => new URL(path, ORIGIN).href;
const HOME = abs("/");
const PERSON_ID = `${HOME}#person`;
const WEBSITE_ID = `${HOME}#website`;

const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: site.identity.name,
  url: HOME,
  jobTitle: "Support & integrations engineer",
  worksFor: { "@type": "Organization", name: "n8n" },
  address: { "@type": "PostalAddress", addressLocality: "Münster", addressCountry: "DE" },
  email: `mailto:${site.contact.email}`,
  knowsAbout: [
    "Kubernetes", "AI agent pipelines", "enterprise support engineering",
    "n8n", "integrations", "site reliability", "homelab infrastructure",
  ],
  sameAs: site.contact.socials.map((s) => s.href),
  image: abs(site.meta.ogImage),
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: HOME,
  name: site.identity.name,
  description: site.meta.description,
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
};

const authorRef = { "@type": "Person" as const, name: site.identity.name, url: HOME };

function breadcrumb(trail: { name: string; item: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: t.item,
    })),
  };
}

type Graph = Record<string, unknown>;
const doc = (graph: Graph[]) => ({ "@context": "https://schema.org", "@graph": graph });

/** Home is a ProfilePage about the Person. */
export function homeSchema(title: string) {
  return doc([
    website,
    person,
    {
      "@type": "ProfilePage",
      "@id": `${HOME}#webpage`,
      url: HOME,
      name: title,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: { "@id": PERSON_ID },
      inLanguage: "en",
    },
  ]);
}

export interface PostMeta {
  title: string;
  description: string;
  url: string;            // absolute, trailing-slashed
  datePublished: string;  // ISO
  dateModified: string;   // ISO
  keywords?: string[];
  image: string;          // absolute
}

/** A writing post: BlogPosting + BreadcrumbList (+ the Person as author/publisher). */
export function postSchema(p: PostMeta) {
  return doc([
    person,
    {
      "@type": "BlogPosting",
      "@id": `${p.url}#article`,
      headline: p.title,
      description: p.description,
      datePublished: p.datePublished,
      dateModified: p.dateModified,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      mainEntityOfPage: p.url,
      url: p.url,
      image: p.image,
      inLanguage: "en",
      ...(p.keywords && p.keywords.length ? { keywords: p.keywords.join(", ") } : {}),
    },
    breadcrumb([
      { name: "Home", item: HOME },
      { name: "Writing", item: abs("/writing/") },
      { name: p.title, item: p.url },
    ]),
  ]);
}

/** The writing index: Blog listing + BreadcrumbList. */
export function writingIndexSchema(posts: { title: string; url: string; description: string; datePublished: string }[]) {
  return doc([
    {
      "@type": "Blog",
      "@id": `${abs("/writing/")}#blog`,
      url: abs("/writing/"),
      name: site.writing.title,
      description: site.writing.description,
      inLanguage: "en",
      author: authorRef,
      publisher: authorRef,
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        url: p.url,
        datePublished: p.datePublished,
        author: authorRef,
      })),
    },
    breadcrumb([
      { name: "Home", item: HOME },
      { name: "Writing", item: abs("/writing/") },
    ]),
  ]);
}
