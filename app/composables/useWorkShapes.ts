import type { Ref, WatchSource } from "vue"
import { computeWorkShapes, type WorkShape } from "@/utils/work-shapes.ts"

/**
 * Mesure la grille et fournit la forme (`clip-path`) de chaque carte.
 *
 * - Les mesures utilisent `offset*` / `clientWidth`, insensibles aux transforms d'un
 *   parent (transition de page, scale), contrairement à `getBoundingClientRect()`.
 * - La hauteur des cartes ne dépend que de la largeur (`aspect-ratio`) : on ne re-mesure
 *   donc que quand la largeur change, pas quand la barre d'URL mobile se rétracte.
 * - `ResizeObserver` notifie après le layout et avant le paint : pas besoin de `rAF`.
 *
 * @param grid Élément qui contient les cellules `[data-path]`.
 * @param source Source réactive qui, en changeant, impose de re-mesurer (la liste des projets).
 */
export function useWorkShapes(grid: Readonly<Ref<HTMLElement | null>>, source: WatchSource) {
	const shapes = shallowRef<Record<string, WorkShape>>({})
	const ready = ref(false)

	let observer: ResizeObserver | undefined
	let lastWidth = -1

	function measure() {
		const el = grid.value
		if (!el) return

		const width = el.clientWidth
		if (width < 1) return

		const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-path]"), (node) => ({
			path: node.dataset.path!,
			x: node.offsetLeft,
			y: node.offsetTop,
			w: node.offsetWidth,
			h: node.offsetHeight,
		}))

		shapes.value = computeWorkShapes(cells, width)
		ready.value = true
	}

	watch(source, () => measure(), { flush: "post" })

	onMounted(() => {
		const el = grid.value
		if (!el) return

		// La première notification arrive avant le premier paint : mesure initiale incluse.
		observer = new ResizeObserver(([entry]) => {
			const width = entry?.contentRect.width ?? 0
			if (Math.abs(width - lastWidth) < 1) return
			lastWidth = width
			measure()
		})
		observer.observe(el)
	})

	onBeforeUnmount(() => observer?.disconnect())

	return { shapes, ready }
}