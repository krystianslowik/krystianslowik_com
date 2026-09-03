import { getCollection } from "astro:content";

/** Published posts, newest first — the ONE ordering every list, feed and
 *  prev/next link on the site derives from. */
export async function publishedPosts() {
  return (await getCollection("writing", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
