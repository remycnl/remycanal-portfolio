import { defineCollection, defineContentConfig, z } from "@nuxt/content"

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

const periodSchema = z.object({
	start: monthSchema,
	end: monthSchema.nullable().default(null),
})

const linkSchema = z.object({
	label: z.string().min(1),
	url: z.string().url(),
})

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
		resume: defineCollection({
			type: "data",
			source: "curriculum.yml",
			schema: z.object({
				name: z.string().min(1),
				headline: z.string().min(1),
				location: z.string().min(1),
				availability: z.string().optional(),
				avatar: z.string().optional(),
				cv: z.string().optional(),
				email: z.string().email(),
				links: z.array(linkSchema).default([]),
				about: z.array(z.string().min(1)).default([]),
				experience: z
					.array(
						z.object({
							role: z.string().min(1),
							company: z.string().min(1),
							type: z.string().optional(),
							location: z.string().optional(),
							period: periodSchema,
							description: z.string().optional(),
							highlights: z.array(z.string().min(1)).default([]),
							skills: z.array(z.string().min(1)).default([]),
						}),
					)
					.default([]),
				education: z
					.array(
						z.object({
							school: z.string().min(1),
							degree: z.string().min(1),
							field: z.string().optional(),
							period: periodSchema,
							description: z.string().optional(),
						}),
					)
					.default([]),
				projects: z
					.array(
						z.object({
							name: z.string().min(1),
							url: z.string().url().optional(),
							period: periodSchema.optional(),
							description: z.string().min(1),
							skills: z.array(z.string().min(1)).default([]),
						}),
					)
					.default([]),
				skills: z
					.array(
						z.object({
							label: z.string().min(1),
							items: z.array(z.string().min(1)).min(1),
						}),
					)
					.default([]),
				honors: z
					.array(
						z.object({
							title: z.string().min(1),
							issuer: z.string().min(1),
							date: monthSchema,
							description: z.string().optional(),
						}),
					)
					.default([]),
				languages: z
					.array(
						z.object({
							name: z.string().min(1),
							level: z.string().min(1),
						}),
					)
					.default([]),
			}),
		}),
	},
})