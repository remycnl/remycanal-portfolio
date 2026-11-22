/**
 * Resolves the first time `el` enters the viewport.
 *
 * Used instead of ScrollTrigger for the text reveal inside the overlay: the overlay scrolls in
 * its own container, and an IntersectionObserver follows any scroll container.
 */
export function whenInView(el: Element, rootMargin = "0px 0px -15% 0px"): Promise<void> {
	return new Promise((resolve) => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return
				observer.disconnect()
				resolve()
			},
			{ rootMargin }
		)
		observer.observe(el)
	})
}
