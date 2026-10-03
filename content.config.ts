import { defineCollection, defineContentConfig, z } from "@nuxt/content"

export default defineContentConfig({
	collections: {
		blog: defineCollection({
			type: "page",
			source: "blog/*.md",
			schema: z.object({
				author: z.string().min(1),
				date: z.date(),
				image: z.string().min(1),
				description: z.string().min(1),
			}),
			indexes: [{ columns: ["date"] }],
		}),
		templates: defineCollection({
			type: "page",
			source: "templates/*.md",
			schema: z.object({
				author: z.string().min(1),
				price: z.string().min(1),
				tags: z.array(z.string().min(1)).min(1),
				teaser: z.boolean().default(false),
				image: z.string().min(1),
				description: z.string().min(1),
			}),
		}),
	},
})