import type { RouteLocationNormalized } from "vue-router"

export interface OverlayState {
	/** The page the overlay was opened from. It stays displayed, untouched, behind the overlay. */
	background: RouteLocationNormalized | null
	/** The overlay route being displayed. */
	sheet: RouteLocationNormalized | null
	/** The element of the sheet that scrolls: the scrollbar follows it while the sheet is open. */
	scroller: HTMLElement | null
	/** The page behind is frozen: from the opening to the end of the closing animation. */
	locked: boolean
	/** The sheet slides down when it closes; it disappears at once when another page takes over. */
	slides: boolean
	/** A card was just clicked: the next navigation opens an overlay. */
	armed: boolean
	/** Scroll of the page behind when the overlay opened: it must be the same when it closes. */
	scrollY: number
}
