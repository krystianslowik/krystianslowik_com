import { defineConfig, passthroughImageService } from "astro/config";
import { readFileSync, readdirSync } from "node:fs";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Read post dates at config-load time (astro:content is not importable here) so
// the sitemap can carry honest lastmod. updatedDate wins over pubDate when set.
const WRITING = new URL("./src/content/writing/", import.meta.url);
const lastmodBySlug = Object.fromEntries(
  readdirSync(WRITING)
    .filter((f) => /\.(md|mdx)$/.test(f))
    .map((f) => {
      const src = readFileSync(new URL(f, WRITING), "utf8");
      const upd = src.match(/^updatedDate:\s*(\S+)/m)?.[1];
      const pub = src.match(/^pubDate:\s*(\S+)/m)?.[1];
      const d = upd ?? pub;
      return [f.replace(/\.(md|mdx)$/, ""), d ? new Date(d) : undefined];
    }),
);
const BUILD_DATE = new Date().toISOString();

// Static site. The AI chat talks to an external Express backend
// (chat-api.krystianslowik.com) directly from the browser, so no server
// runtime/adapter is needed here — just static assets on Cloudflare.
export default defineConfig({
  site: "https://krystianslowik.com",
  output: "static",
  trailingSlash: "always",
  integrations: [
    svelte(),
    mdx(),
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (path === "/") return { ...item, priority: 1.0, changefreq: "weekly", lastmod: BUILD_DATE };
        if (path === "/writing/") return { ...item, priority: 0.8, changefreq: "weekly", lastmod: BUILD_DATE };
        const slug = path.match(/^\/writing\/([^/]+)\/$/)?.[1];
        const pub = slug && lastmodBySlug[slug];
        if (pub) return { ...item, priority: 0.6, changefreq: "yearly", lastmod: pub.toISOString() };
        return item;
      },
    }),
  ],
  image: { service: passthroughImageService() },
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
});
