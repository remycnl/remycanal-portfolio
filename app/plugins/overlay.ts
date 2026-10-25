import type { OverlayState } from "@/types/overlay"

/** Safety net: an overlay never stays if the page transition does not report back. */
const DISMISS_TIMEOUT_MS = 4000

export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter()

	// Shallow on purpose: route objects must never become deep reactive proxies.
	const overlay = shallowReactive<OverlayState>({
		background: null,
		sheet: null,
		scroller: null,
		locked: false,
		slides: true,
		armed: false,
		scrollY: 0,
	})

	/** Another page takes over: the sheet stays until the page transition has covered the screen. */
	function dismissWhenCovered() {
		const sheet = overlay.sheet
		overlay.slides = false

		let timer: ReturnType<typeof setTimeout> | undefined
		let stop: (() => void) | undefined

		const dismiss = () => {
			stop?.()
			clearTimeout(timer)
			if (overlay.sheet === sheet) overlay.sheet = null
		}

		stop = nuxtApp.hooks.hookOnce("page:transition:finish", dismiss)
		timer = setTimeout(dismiss, DISMISS_TIMEOUT_MS)
	}

	// Opening or closing an overlay never scrolls the page behind. Nuxt reads `scrollToTop` on the
	// destination route, which is its official way to skip the scroll of a navigation.
	router.beforeEach((to, from) => {
		if (!overlay.armed && !overlay.background) return

		const opening =
			overlay.armed &&
			Boolean(to.meta.overlay) &&
			!from.meta.overlay &&
			from.matched.length > 0
		const closing =
			Boolean(from.meta.overlay) && overlay.background?.fullPath === to.fullPath

		if (opening || closing) to.meta.scrollToTop = false
	})

	router.afterEach((to, from, failure) => {
		const armed = overlay.armed
		overlay.armed = false
		if (failure) return

		if (to.meta.overlay) {
			// Opened from a card: the page it comes from stays behind. Anything else (direct access,
			// reload, back/forward from another page) shows the article as a regular page.
			if (armed && !overlay.background && from.matched.length > 0 && !from.meta.overlay) {
				overlay.background = from
				overlay.scrollY = window.scrollY
			}

			if (overlay.background) {
				overlay.sheet = to
				overlay.slides = true
				overlay.locked = true
			}
			return
		}

		const behind = overlay.background
		if (!behind) return
		overlay.background = null

		// Back to the page it was opened from: it never moved. The check below only protects against
		// anything that could have moved it, so that it comes back exactly as it was.
		if (to.fullPath === behind.fullPath) {
			overlay.slides = true
			overlay.sheet = null

			if (Math.abs(window.scrollY - overlay.scrollY) > 1) {
				window.scrollTo({ top: overlay.scrollY, left: 0, behavior: "instant" })
			}
			return
		}

		dismissWhenCovered()
	})

	return { provide: { overlay } }
})
