import Lenis from "lenis"
import type { Ref } from "vue"

/**
 * Smooth scroll for the overlay: a second Lenis instance bound to it, with the options of the page
 * one, so both scrolls feel the same while staying independent. It lives as long as the element.
 */
export function useOverlayScroll(
	wrapperRef: Readonly<Ref<HTMLElement | null>>,
	contentRef: Readonly<Ref<HTMLElement | null>>
) {
	const { $gsap } = useNuxtApp()
	const pageLenis = useLenis()

	let stop: (() => void) | undefined

	function teardown() {
		stop?.()
		stop = undefined
	}

	watch(
		[wrapperRef, contentRef],
		([wrapper, content]) => {
			teardown()
			if (!wrapper || !content || !pageLenis) return

			const {
				duration,
				easing,
				lerp,
				smoothWheel,
				syncTouch,
				wheelMultiplier,
				touchMultiplier,
			} = pageLenis.options

			const lenis = new Lenis({
				wrapper,
				content,
				eventsTarget: wrapper,
				duration,
				easing,
				lerp,
				smoothWheel,
				syncTouch,
				wheelMultiplier,
				touchMultiplier,
			})

			const update = (time: number) => lenis.raf(time * 1000)
			$gsap.ticker.add(update)

			stop = () => {
				$gsap.ticker.remove(update)
				lenis.destroy()
			}
		},
		{ flush: "post" }
	)

	onBeforeUnmount(teardown)
}
