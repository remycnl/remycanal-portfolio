/**
 * Nuxt Content charge (et décompresse, ~80 ms de thread principal) le dump SQL de chaque
 * collection à la PREMIÈRE requête côté client. Sans ça, ce travail tombe en pleine vague de
 * transition. On le fait donc au repos, une collection par créneau d'inactivité.
 *
 * À placer dans `plugins/content-warmup.client.ts`.
 */

// Remplace par les noms de TES collections (voir `content.config.ts`).
const COLLECTIONS = ["blog", "playground", "resume"] as const

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.hook("app:mounted", () => {
		const schedule = (callback: () => void) => {
			if ("requestIdleCallback" in window) {
				window.requestIdleCallback(callback, { timeout: 3000 })
			} else {
				setTimeout(callback, 400)
			}
		}

		let index = 0

		const warmNext = () => {
			const name = COLLECTIONS[index++]
			if (!name) return

			queryCollection(name)
				.first()
				.catch(() => undefined)
				.finally(() => schedule(warmNext))
		}

		schedule(warmNext)
	})
})
