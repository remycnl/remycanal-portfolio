import { defineCollection, defineContentConfig, z } from "@nuxt/content"

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

const hexColorSchema = z
	.string()
	.regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Expected a hexadecimal color")

const workTags = [
	"Identité",
	"Branding",
	"Site web",
	"Application web",
	"E-commerce",
	"UI/UX",
	"Développement",
	"3D",
] as const

const periodSchema = z.object({
	start: monthSchema,
	/** Absent ou null = en cours : affiché « Now », durée calculée jusqu'au mois courant. */
	end: monthSchema.nullable().default(null),
})

/** Fields shared by the pages that open in the overlay. */
const tagsSchema = z.array(z.string().min(1)).default([])
const coverSchema = {
	image: z.string().min(1),
	/** Cover video (muted loop): `image` then serves as its poster. */
	video: z.string().optional(),
}

/** Fichier de /public, écrit depuis la racine : `/resume/toolbox/figma.svg`. */
const assetSchema = z
	.string()
	.startsWith("/", "Expected a path from /public, e.g. /resume/toolbox/figma.svg")

/** Cadre d'un logo : le fichier, et une couleur de fond facultative dont la bordure se déduit. */
const logoSchema = {
	logo: assetSchema,
	background: hexColorSchema.optional(),
}

/**
 * Contenu du panneau déroulé par le « + ». Le bouton n'apparaît que si au moins l'un des trois
 * est renseigné.
 */
const detailsSchema = {
	description: z.string().min(1).optional(),
	images: z
		.array(
			z.object({
				src: assetSchema,
				alt: z.string().min(1),
			})
		)
		.default([]),
	documents: z
		.array(
			z.object({
				label: z.string().min(1),
				/** Fichier de /public (PDF, doc…) ou URL complète. */
				href: z.union([assetSchema, z.string().url()]),
			})
		)
		.default([]),
}

const toolSchema = z.object({
	name: z.string().min(1),
	...logoSchema,
})

export default defineContentConfig({
	collections: {
		blog: defineCollection({
			type: "page",
			source: "blog/*.md",
			schema: z.object({
				author: z.string().min(1),
				date: z.date(),
				description: z.string().min(1),
				tags: tagsSchema,
				...coverSchema,
			}),
			indexes: [{ columns: ["date"] }],
		}),
		playground: defineCollection({
			type: "page",
			source: "playground/*.md",
			schema: z.object({
				date: z.date(),
				description: z.string().optional(),
				tags: tagsSchema,
				/** Dimensions of the cover: it keeps its ratio. */
				width: z.number().int().positive().optional(),
				height: z.number().int().positive().optional(),
				...coverSchema,
			}),
			indexes: [{ columns: ["date"] }],
		}),
		work: defineCollection({
			type: "page",
			source: "work/*.md",
			schema: z.object({
				date: monthSchema,
				tone: hexColorSchema,
				featured: z.boolean().default(false),
				tags: z.array(z.enum(workTags)).default([]),
				...coverSchema,
				image: coverSchema.image.optional(),
				client: z.string().optional(),
				role: z.string().optional(),
				/** Lien vers le projet en ligne. */
				url: z.string().url().optional(),
			}),
			indexes: [{ columns: ["date"] }, { columns: ["featured"] }],
		}),
		resume: defineCollection({
			type: "data",
			source: "curriculum.yml",
			schema: z.object({
				name: z.string().min(1),
				headline: z.string().min(1),
				linkedin: z.string().url(),
				/** Cible du bouton « Contact me » (mailto:). */
				email: z.string().email(),
				education: z
					.array(
						z.object({
							...logoSchema,
							/** Intitulé, affiché en gras. */
							degree: z.string().min(1),
							/** Suite de l'intitulé, séparée par « | ». */
							program: z.string().optional(),
							school: z.string().min(1),
							country: z.string().min(1),
							...detailsSchema,
						})
					)
					.default([]),
				experience: z
					.array(
						z.object({
							...logoSchema,
							role: z.string().min(1),
							/** Séparé du rôle par « @ ». */
							company: z.string().min(1),
							period: periodSchema,
							/** Séparé de la durée par « | ». */
							location: z.string().optional(),
							...detailsSchema,
						})
					)
					.default([]),
				toolbox: z.object({
					/** Toujours visibles. */
					featured: z.array(toolSchema).default([]),
					/** Révélés par « Voir toutes mes compétences… ». */
					more: z.array(toolSchema).default([]),
				}),
				awards: z
					.array(
						z.object({
							title: z.string().min(1),
							/** Séparé du titre par « @ ». */
							issuer: z.string().min(1),
							date: monthSchema,
							...detailsSchema,
						})
					)
					.default([]),
				languages: z.string().min(1),
			}),
		}),
	},
})
