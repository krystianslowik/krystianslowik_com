import rss from "@astrojs/rss";
import { site } from "@data/site";
import { publishedPosts } from "@lib/writing";
import type { APIContext } from "astro";

// /rss.xml — the writing feed. Linked from every <head> via rel=alternate.
export async function GET(context: APIContext) {
  const posts = await publishedPosts();
  return rss({
    title: site.writing.feedTitle,
    description: site.writing.description,
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
