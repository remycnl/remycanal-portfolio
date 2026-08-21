// app/composables/useGsap.ts
import type { gsap as gsapValue } from "gsap"
import type { ScrollTrigger as ScrollTriggerValue } from "gsap/ScrollTrigger"
import type { Draggable as DraggableValue } from "gsap/Draggable"
import type { SplitText as SplitTextValue } from "gsap/SplitText"

type GsapInstance = typeof gsapValue
type ScrollTriggerInstance = typeof ScrollTriggerValue
type DraggableInstance = typeof DraggableValue
type SplitTextInstance = typeof SplitTextValue

export function useGsap() {
	const { $gsap, $ScrollTrigger, $Draggable, $SplitText } = useNuxtApp()

	function useGsapContext(
		callback: (context: {
			gsap: GsapInstance
			ScrollTrigger: ScrollTriggerInstance
			Draggable: DraggableInstance
			SplitText: SplitTextInstance
		}) => void | (() => void),
		scope?: Element | string | import("vue").Ref<Element | null>
	) {
		let ctx: ReturnType<GsapInstance["context"]> | undefined
		let cleanup: (() => void) | void

		onMounted(() => {
			const target = unref(scope as any)
			ctx = $gsap.context(() => {
				cleanup = callback({
					gsap: $gsap,
					ScrollTrigger: $ScrollTrigger,
					Draggable: $Draggable as DraggableInstance,
					SplitText: $SplitText as SplitTextInstance,
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
