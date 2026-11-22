import { loadRouteLocation } from "vue-router"
import type { RouteLocationNormalized, RouteLocationResolved } from "vue-router"
import type { OverlayState } from "@/types/overlay"

/** `router.resolve()` gives a `null` name where a normalized route has none. */
function normalize(route: RouteLocationResolved): RouteLocationNormalized {
	return { ...route, name: route.name ?? undefined }
}

export default defineNuxtPlugin(async () => {
	const router = useRouter()

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

	// Loaded directly on an overlay (shared link, reload): its parent page is displayed behind it,
	// as if the overlay had been opened from there. Close and Escape then behave the same way.
	// It is decided here, from the URL, before anything renders: on the server as on the client,
	// so the very first paint is already the sheet over its parent.
	const entry = router.resolve(useRoute().fullPath)
	const parent = entry.meta.overlay?.parent
	if (parent) {
		try {
			// The parent page was never navigated to, so its component is still lazy: it has to be
			// loaded to be displayed behind the sheet, and to be the same component when the sheet
			// closes (otherwise the page is replaced, and the page transition plays).
			overlay.background = await loadRouteLocation(normalize(router.resolve(parent)))
			overlay.sheet = normalize(entry)
			overlay.locked = true
		} catch {
			// The parent cannot be loaded: the page is displayed on its own.
			overlay.background = null
		}
	}

	router.beforeEach((to, from) => {
		if (!overlay.armed && !overlay.background) {
			overlay.navigation = null
			return
		}

		const opening =
			overlay.armed &&
			Boolean(to.meta.overlay) &&
			!from.meta.overlay &&
			from.matched.length > 0
		const closing =
			Boolean(from.meta.overlay) && overlay.background?.fullPath === to.fullPath
		const leavingOverlay = Boolean(overlay.background) && !to.meta.overlay && !closing

		// From one entry to another inside the sheet (the "next" block): the page behind stays
		// where it is, and nothing transitions.
		const switching =
			Boolean(overlay.background) &&
			Boolean(from.meta.overlay) &&
			Boolean(to.meta.overlay)

		if (opening || closing || switching) {
			to.meta.scrollToTop = false
			to.meta.pageTransition = false
		}

		if (opening || closing) overlay.navigation = opening ? "opening" : "closing"
		else if (leavingOverlay) overlay.navigation = "page"
	})

	router.afterEach((to, from, failure) => {
		const armed = overlay.armed
		overlay.armed = false
		if (failure) {
			overlay.navigation = null
			return
		}

		if (to.meta.overlay) {
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

		// The first navigation did not end on the overlay it started with (redirect, error).
		if (from.matched.length === 0) {
			overlay.sheet = null
			overlay.locked = false
			return
		}

		if (to.fullPath === behind.fullPath) {
			overlay.slides = true
			overlay.sheet = null
			overlay.navigation = null

			if (Math.abs(window.scrollY - overlay.scrollY) > 1) {
				window.scrollTo({ top: overlay.scrollY, left: 0, behavior: "instant" })
			}
			return
		}

		overlay.slides = false
	})

	return { provide: { overlay } }
})
