import type { MaybeRefOrGetter } from "vue"

type MaybeElement = HTMLElement | null | undefined

interface ScrollParallaxOptions {
	/** Intensity between -1 and 1. The sign sets the direction, the magnitude sets the travel distance and the smoothing lag. */
	depth: MaybeRefOrGetter<number>
	/** Maximum vertical travel of the content in pixels at the lg breakpoint and above. */
	maxShiftDesktop?: number
	/** Maximum vertical travel of the content in pixels below the lg breakpoint. */
	maxShiftMobile?: number
	/** Maximum counter-movement of the media inside its frame, as a percentage of its own height. */
	mediaShift?: number
}

const DEFAULT_SHIFT_DESKTOP_PX = 90
const DEFAULT_SHIFT_MOBILE_PX = 56
const DEFAULT_MEDIA_SHIFT_PERCENT = 11
const BASE_RATE = 9
const RATE_SPREAD = 6

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

export function useScrollParallax(
	trigger: MaybeRefOrGetter<MaybeElement>,
	content: MaybeRefOrGetter<MaybeElement>,
	media: MaybeRefOrGetter<MaybeElement>,
	options: ScrollParallaxOptions
) {
	const { $gsap: gsap, $ScrollTrigger: ScrollTrigger } = useNuxtApp()

	let mediaQuery: ReturnType<typeof gsap.matchMedia> | null = null

	onMounted(() => {
		const triggerEl = toValue(trigger)
		const contentEl = toValue(content)
		const mediaEl = toValue(media)
		const d = clamp(toValue(options.depth), -1, 1)

		if (!triggerEl || !contentEl || d === 0) return

		const shiftDesktop = options.maxShiftDesktop ?? DEFAULT_SHIFT_DESKTOP_PX
		const shiftMobile = options.maxShiftMobile ?? DEFAULT_SHIFT_MOBILE_PX
		const mediaShift = options.mediaShift ?? DEFAULT_MEDIA_SHIFT_PERCENT

		mediaQuery = gsap.matchMedia()

		mediaQuery.add(
			{
				isDesktop: "(min-width: 1024px)",
				motionAllowed: "(prefers-reduced-motion: no-preference)",
			},
			(context) => {
				const { isDesktop, motionAllowed } = (context.conditions ?? {}) as {
					isDesktop?: boolean
					motionAllowed?: boolean
				}

				if (!motionAllowed) return

				const maxShift = isDesktop ? shiftDesktop : shiftMobile
				const rate = BASE_RATE - Math.abs(d) * RATE_SPREAD

				const setContentY = gsap.quickSetter(contentEl, "y", "px")
				const setMediaY = mediaEl ? gsap.quickSetter(mediaEl, "yPercent") : null

				let target = 0
				let current = 0

				function toRange(progress: number) {
					return progress * 2 - 1
				}

				function apply() {
					setContentY(current * d * maxShift)
					setMediaY?.(-current * d * mediaShift)
				}

				function tick(_time: number, deltaTime: number) {
					current += (target - current) * expSmoothingFactor(rate, deltaTime / 1000)
					apply()
				}

				const scrollTrigger = ScrollTrigger.create({
					trigger: triggerEl,
					start: "top bottom",
					end: "bottom top",
					onUpdate: (self) => {
						target = toRange(self.progress)
					},
					onToggle: (self) => {
						target = toRange(self.progress)
						if (self.isActive) {
							gsap.ticker.add(tick, false, true)
							return
						}
						gsap.ticker.remove(tick)
						current = target
						apply()
					},
				})

				target = toRange(scrollTrigger.progress)
				current = target
				apply()

				return () => {
					gsap.ticker.remove(tick)
					scrollTrigger.kill()
				}
			}
		)
	})

	onBeforeUnmount(() => {
		mediaQuery?.revert()
		mediaQuery = null
	})
}
