import type { ComponentPublicInstance } from "vue"

export function useLoopHeight() {
	const height = shallowRef(0)
	let observer: ResizeObserver | undefined

	function loopRef(target: Element | ComponentPublicInstance | null) {
		observer?.disconnect()
		observer = undefined

		const el = target instanceof Element ? target : (target?.$el as Element | undefined)
		if (!(el instanceof HTMLElement)) return

		const update = () => {
			height.value = Math.round(el.getBoundingClientRect().height)
		}

		update()
		observer = new ResizeObserver(update)
		observer.observe(el)

		document.fonts?.ready.then(update)
	}

	onScopeDispose(() => observer?.disconnect())

	const loopStyle = computed(() => ({ "--loop-height": `${height.value}px` }))

	return { loopRef, loopStyle }
}
