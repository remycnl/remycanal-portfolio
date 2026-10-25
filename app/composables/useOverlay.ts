import type { InjectionKey } from "vue"

/** Provided by the overlay host: tells the content of a page that it is displayed in the sheet. */
export const OVERLAY_SHEET_KEY: InjectionKey<boolean> = Symbol("overlay-sheet")

export function useOverlay() {
	const { $overlay: overlay } = useNuxtApp()
	const router = useRouter()

	/** Call it on the click of a link to an overlay: the next navigation opens it above the current page. */
	function arm() {
		overlay.armed = true
	}

	/** Closes the overlay: back to the page it was opened from. */
	function close() {
		const behind = overlay.background
		if (!behind) return

		// Opened from that page: closing is going back, so the history stays clean.
		if (window.history.state?.back === behind.fullPath) router.back()
		else router.push(behind.fullPath)
	}

	return { overlay, arm, close }
}

/** The page the visitor sees: the one behind an overlay when there is one, else the current one. */
export function useVisibleRoute() {
	const route = useRoute()
	const { overlay } = useOverlay()

	return computed(() => overlay.background ?? route)
}
