import type { APIContext } from "astro";
import { site } from "@data/site";

// /llms.txt (llmstxt.org) — generated from site.ts at build time so it can never
// drift from the page copy. /llms-full.txt is the long form.
// The header only matters under `astro dev`; in the static deploy the MIME
// type comes from the .txt extension.
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
    "## Work",
    "",
    ...featured.map((w) => `- [${w.title}](${abs("/#work")}): ${w.outcome}`),
    "",
    "## Contact",
    "",
    `- [Email](mailto:${site.contact.email}): ${site.contact.email}`,
    ...site.contact.socials.map((s) => `- [${s.label}](${s.href}): ${s.handle}`),
    "",
    "## Optional",
    "",
    `- [Full details](${abs("/llms-full.txt")}): every case file, the full record and all posts.`,
    "",
  ];
  return new Response(lines.join("\n"), TEXT);
}
