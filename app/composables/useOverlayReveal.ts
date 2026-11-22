import { inject, toValue, type MaybeRefOrGetter } from "vue"
import { whenInView } from "@/utils/whenInView"

/** Accent color provided by LayoutOverlayArticle to the Markdown content. */
export const OVERLAY_REVEAL_THEME = "overlay-reveal-theme"

/**
 * Options for `v-text-reveal` on content that plays once it scrolls into view.
 * The accent follows the overlay (lime on dark, violet on light, none on a colored work page).
 */
export function useOverlayReveal() {
	const accent = inject<MaybeRefOrGetter<string>>(OVERLAY_REVEAL_THEME, "lime")

	return {
		theme: toValue(accent),
		sequence: (el: HTMLElement) => ({ opened: whenInView(el) }),
	}
}
