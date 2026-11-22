interface EntrySeo {
	title: string
	description?: string
	image?: string
}

/** SEO and social sharing tags of a content page. */
export function useEntrySeo({ title, description, image }: EntrySeo) {
	useSeoMeta({
		title,
		description,
		ogTitle: title,
		ogDescription: description,
		ogImage: image,
		...(image && { ogImageWidth: 1200, ogImageHeight: 630 }),
	})
}
