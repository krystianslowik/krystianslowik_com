import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Writing / notes — MD + MDX, content swapped freely later.
const writing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(), // feeds article:modified_time + BlogPosting.dateModified + honest sitemap lastmod
    tags: z.array(z.string()).default([]),    // feeds article:tag + BlogPosting.keywords
    readingTime: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
