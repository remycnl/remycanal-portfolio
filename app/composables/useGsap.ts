import type { gsap as gsapValue } from "gsap"
import type { ScrollTrigger as ScrollTriggerValue } from "gsap/ScrollTrigger"

type GsapInstance = typeof gsapValue
type ScrollTriggerInstance = typeof ScrollTriggerValue

export function useGsap() {
	const { $gsap, $ScrollTrigger } = useNuxtApp()

	function useGsapContext(
		callback: (context: {
			gsap: GsapInstance
			ScrollTrigger: ScrollTriggerInstance
		}) => void | (() => void),
		scope?: Element | string | import("vue").Ref<Element | null>
	) {
		let ctx: ReturnType<GsapInstance["context"]> | undefined
		let cleanup: (() => void) | void

		onMounted(() => {
			const target = unref(scope as any)
			ctx = $gsap.context(() => {
				cleanup = callback({ gsap: $gsap, ScrollTrigger: $ScrollTrigger })
			}, target ?? undefined)
		})

		onUnmounted(() => {
			cleanup?.()
			ctx?.revert()
		})
	}

	return {
		gsap: $gsap,
		ScrollTrigger: $ScrollTrigger,
		useGsapContext,
	}
}
