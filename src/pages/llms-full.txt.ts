import type { APIContext } from "astro";
import { site } from "@data/site";
import { publishedPosts } from "@lib/writing";

// /llms-full.txt — everything site.ts and the writing collection know, in
// plain text, generated at build time (see llms.txt.ts).
// The header only matters under `astro dev`; in the static deploy the MIME
// type comes from the .txt extension.
const TEXT = { headers: { "Content-Type": "text/plain; charset=utf-8" } };

export async function GET({ site: base }: APIContext) {
  const home = (base ?? new URL(site.meta.url)).href;
  const abs = (p: string) => new URL(p, home).href;
  const posts = await publishedPosts();
  const lines = [
    `# ${site.identity.name}`,
    "",
    `> ${site.meta.description}`,
    "",
    "## About",
    "",
    site.identity.about,
    "",
    `- Role: ${site.identity.role}`,
    `- Location: ${site.status.location}`,
    "",
    "## Experience",
    "",
    ...site.experience.items.map((e) => `- ${e.date}: ${e.role}`),
    "",
    "## Work",
    "",
    ...site.work.items.flatMap((w) => [
      `### ${w.title}`,
      "",
      w.blurb,
      "",
      `Problem: ${w.problem}`,
      `Approach: ${w.action}`,
      `Outcome: ${w.outcome}`,
      `Tags: ${w.tags.join(", ")}`,
      "",
    ]),
    "## Writing",
    "",
    ...posts.map(
      (p) =>
        `- [${p.data.title}](${abs(`/writing/${p.id}/`)}) (${p.data.pubDate.toISOString().slice(0, 10)}): ${p.data.blurb}`,
    ),
    "",
    "## Contact",
    "",
    `- Email: ${site.contact.email}`,
    ...site.contact.socials.map((s) => `- ${s.label}: ${s.href}`),
    `- Ask the słowik: ${abs("/#chat")} (${site.slowik.footnote})`,
    "",
  ];
  return new Response(lines.join("\n"), TEXT);
}
