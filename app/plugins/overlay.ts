import type { OverlayState } from "@/types/overlay"

export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter()

	// Shallow on purpose: route objects must never become deep reactive proxies.
	const overlay = shallowReactive<OverlayState>({
		navigation: null,
		background: null,
		sheet: null,
		scroller: null,
		locked: false,
		slides: true,
		armed: false,
		scrollY: 0,
	})

	// Overlay navigation owns its own sheet animation. The page transition must not cover the page
	// behind or reset its scroll position.
	router.beforeEach((to, from) => {
		if (!overlay.armed && !overlay.background) return

		const opening =
			overlay.armed &&
			Boolean(to.meta.overlay) &&
			!from.meta.overlay &&
			from.matched.length > 0
		const closing =
			Boolean(from.meta.overlay) && overlay.background?.fullPath === to.fullPath
		const leavingOverlay = Boolean(overlay.background) && !to.meta.overlay && !closing

		if (opening || closing) {
			to.meta.scrollToTop = false
			to.meta.pageTransition = false
			overlay.navigation = opening ? "opening" : "closing"
		} else if (leavingOverlay) {
			overlay.navigation = "page"
		}
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

		overlay.slides = false
	})

	return { provide: { overlay } }
})
