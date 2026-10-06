import type { gsap as gsapValue } from "gsap"
import type { ScrollTrigger as ScrollTriggerValue } from "gsap/ScrollTrigger"
import type { Draggable as DraggableValue } from "gsap/Draggable"
import type { SplitText as SplitTextValue } from "gsap/SplitText"

export type GsapInstance = typeof gsapValue
export type ScrollTriggerInstance = typeof ScrollTriggerValue
export type DraggableInstance = typeof DraggableValue
export type SplitTextInstance = typeof SplitTextValue

export function useGsap() {
	const { $gsap, $ScrollTrigger, $Draggable, $SplitText } = useNuxtApp()

	function useGsapContext(
		callback: (context: {
			gsap: GsapInstance
			ScrollTrigger: ScrollTriggerInstance
			Draggable: DraggableInstance
			SplitText: SplitTextInstance
		}) => void | (() => void),
		scope?: MaybeRef<Element | string | null>
	) {
		let ctx: ReturnType<GsapInstance["context"]> | undefined
		let cleanup: (() => void) | void

		onMounted(() => {
			const target = unref(scope)
			ctx = $gsap.context(() => {
				cleanup = callback({
					gsap: $gsap,
					ScrollTrigger: $ScrollTrigger,
					Draggable: $Draggable,
					SplitText: $SplitText,
				})
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
		Draggable: $Draggable,
		SplitText: $SplitText,
		useGsapContext,
	}
}
