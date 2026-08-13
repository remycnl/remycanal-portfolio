// app/composables/useGsap.ts
import type { gsap as gsapValue } from "gsap"
import type { ScrollTrigger as ScrollTriggerValue } from "gsap/ScrollTrigger"
import type { Draggable as DraggableValue } from "gsap/Draggable"

type GsapInstance = typeof gsapValue
type ScrollTriggerInstance = typeof ScrollTriggerValue
type DraggableInstance = typeof DraggableValue

export function useGsap() {
	const { $gsap, $ScrollTrigger, $Draggable } = useNuxtApp()

	function useGsapContext(
		callback: (context: {
			gsap: GsapInstance
			ScrollTrigger: ScrollTriggerInstance
			Draggable: DraggableInstance
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
		useGsapContext,
	}
}
