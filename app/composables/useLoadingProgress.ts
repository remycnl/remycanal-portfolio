interface LoadingProgressController {
	isComplete: Ref<boolean>
	bind: (trackEl: HTMLElement, counterEl: HTMLElement) => () => void
}

const CEILING_VALUE = 0.9
const MAX_SPEED = 1.3
const BASE_CRUISE_SPEED = 1.0
const APPROACH_SHARPNESS = 5
const MIN_SPEED_RATIO = 0.1

const LIVELINESS_AMPLITUDE = 0.4
const LIVELINESS_FREQUENCY = 1.8

const HARD_TIMEOUT_MS = 9000

export function useLoadingProgress(): LoadingProgressController {
	const isComplete = useState("app-loading-complete", () => false)

	const isPageReady = usePageReadiness()
	const isFontsReady = useFontsReady()
	const isLogoReady = useLogoScenePreload()

	const isAppReady = computed(
		() => isPageReady.value && isFontsReady.value && isLogoReady.value
	)

	const bind = (trackEl: HTMLElement, counterEl: HTMLElement) => {
		const { $gsap } = useNuxtApp()

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		let travelRange = 0
		let lastRounded = -1
		let target = CEILING_VALUE
		let hasFinished = false
		let elapsed = 0
		let hardTimeoutId: ReturnType<typeof setTimeout> | undefined

		const noiseAt = (t: number) =>
			(Math.sin(t * LIVELINESS_FREQUENCY * Math.PI * 2) +
				0.5 * Math.sin(t * LIVELINESS_FREQUENCY * Math.PI * 2 * 2.3 + 1.1)) /
			1.5

		const measureTravelRange = () => {
			const trackStyles = window.getComputedStyle(trackEl)
			const horizontalPadding =
				parseFloat(trackStyles.paddingLeft) + parseFloat(trackStyles.paddingRight)
			travelRange = Math.max(
				trackEl.clientWidth - horizontalPadding - counterEl.offsetWidth,
				0
			)
		}

		const setX = $gsap.quickSetter(counterEl, "x", "px")
		const state = { value: 0 }

		const render = () => {
			const rounded = Math.round(state.value * 100)
			if (rounded !== lastRounded) {
				lastRounded = rounded
				counterEl.textContent = `${rounded}%`
			}
			setX(state.value * travelRange)
		}

		measureTravelRange()
		render()

		const resizeObserver = new ResizeObserver(measureTravelRange)
		resizeObserver.observe(trackEl)
		resizeObserver.observe(counterEl)

		const tick = (_time: number, deltaMs: number) => {
			if (hasFinished) return

			const dt = deltaMs / 1000
			elapsed += dt

			const remaining = target - state.value

			if (remaining <= 0.0005) {
				state.value = target
				render()
				if (target === 1) {
					hasFinished = true
					$gsap.ticker.remove(tick)
					clearTimeout(hardTimeoutId)
					isComplete.value = true
				}
				return
			}

			const proportionalSpeed = remaining * APPROACH_SHARPNESS
			let speed = Math.min(
				MAX_SPEED,
				Math.max(proportionalSpeed, MAX_SPEED * MIN_SPEED_RATIO)
			)

			if (proportionalSpeed >= BASE_CRUISE_SPEED) {
				const wobble = 1 + noiseAt(elapsed) * LIVELINESS_AMPLITUDE
				speed = $gsap.utils.clamp(
					MAX_SPEED * MIN_SPEED_RATIO,
					MAX_SPEED,
					BASE_CRUISE_SPEED * wobble
				)
			}

			state.value = Math.max(state.value, Math.min(target, state.value + speed * dt))
			render()
		}

		if (prefersReducedMotion) {
			state.value = 1
			render()
			isComplete.value = true
		} else {
			$gsap.ticker.add(tick)

			hardTimeoutId = setTimeout(() => {
				if (hasFinished) return
				console.warn(
					"[useLoadingProgress] Timeout de sécurité atteint : passage forcé à la complétion."
				)
				target = 1
			}, HARD_TIMEOUT_MS)
		}

		const stopWatching = watch(
			isAppReady,
			(ready) => {
				if (ready) target = 1
			},
			{ immediate: true }
		)

		return () => {
			stopWatching()
			$gsap.ticker.remove(tick)
			clearTimeout(hardTimeoutId)
			resizeObserver.disconnect()
		}
	}

	return { isComplete, bind }
}
