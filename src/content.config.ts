import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()),
    category: z.enum([
      "contrast-therapy",
      "tampa-local",
      "athletic-recovery",
      "first-timer",
      "community",
      "health-conditions",
    ]),
    author: z.string().default("The Sauna Guys"),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
