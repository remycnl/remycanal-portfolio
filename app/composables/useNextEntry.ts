export interface NextEntry {
	path: string
	title: string
	/** Position of the next entry, starting at 1. */
	index: number
	total: number
}

type Collection = "blog" | "playground" | "work"

/**
 * The entry that follows the current page in its collection (newest first).
 * The last one loops back to the first. Returns null when there is nothing to go to.
 */
export async function useNextEntry(collection: Collection) {
	const route = useRoute()

	const { data } = await useAsyncData(`next-${collection}-${route.path}`, async () => {
		const entries = (await queryCollection(collection)
			.order("date", "DESC")
			.select("path", "title")
			.all()) as { path: string; title: string }[]

		const current = entries.findIndex((entry) => entry.path === route.path)
		if (entries.length < 2 || current === -1) return null

		const index = (current + 1) % entries.length
		const next = entries[index]!

		return { path: next.path, title: next.title, index: index + 1, total: entries.length }
	})

	return data
}
