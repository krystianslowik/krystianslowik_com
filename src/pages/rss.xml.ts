import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "@data/site";
import type { APIContext } from "astro";

// /rss.xml — the writing feed. Linked from every <head> via rel=alternate.
export async function GET(context: APIContext) {
  const posts = (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  return rss({
    title: "Krystian Słowik — writing",
    description: "Notes on keeping systems boring: postmortems, homelab k8s, and the craft of reliability.",
    site: context.site ?? site.meta.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.blurb,
      pubDate: p.data.pubDate,
      link: `/writing/${p.id}/`,
      categories: p.data.tags,
    })),
    customData: "<language>en</language>",
  });
}
