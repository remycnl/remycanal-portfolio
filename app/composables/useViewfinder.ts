export type ViewfinderTheme = "lime" | "violet"

export type ViewfinderBackground = "white" | "black"

export interface ViewfinderTarget {
	el: HTMLElement
	label?: string
	bounds?: HTMLElement
}

export function useViewfinder() {
	const target = useState<ViewfinderTarget | null>("viewfinder:target", () => null)

	function lock(el: HTMLElement, label?: string, bounds?: HTMLElement) {
		if (target.value?.el === el) {
			if (target.value.label === label && target.value.bounds === bounds) return
			target.value = markRaw({ el, label, bounds })
			return
		}
		target.value = markRaw({ el, label, bounds })
	}

	function release(el?: HTMLElement) {
		if (!el || target.value?.el === el) target.value = null
	}

	return { target, lock, release }
}
