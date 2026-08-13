import type { MaybeRef } from "vue"

interface DragOptions {
	tiltStrength?: number
	/** Résistance au lancer inertiel. Défaut : 200. 600+ = quasi aucune glisse. */
	throwResistance?: number
	/**
	 * Résistance aux limites (bounds), de 0 à 1.
	 * 0 = aucune résistance, l'élément glisse comme si les bounds n'existaient pas.
	 * 1 = résistance totale, mur dur infranchissable, aucun dépassement possible.
	 * Défaut : 1 (contrainte stricte).
	 */
	edgeResistance?: number
	/** Rotation de repos en degrés, positive ou négative. Source de vérité unique — plus de classe Tailwind rotate-*. */
	baseRotation?: number
}

export function useDraggableSticker(
	target: MaybeRef<HTMLElement | null>,
	options: DragOptions = {}
) {
	const { useGsapContext } = useGsap()
	const {
		tiltStrength = 14,
		throwResistance = 200,
		edgeResistance = 1,
		baseRotation = 0,
	} = options

	useGsapContext(({ gsap, Draggable }) => {
		const el = unref(target)
		if (!el) return

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches
		if (prefersReducedMotion) return

		const boundsEl = el.closest<HTMLElement>("[data-drag-bounds]")
		if (!boundsEl) {
			if (import.meta.dev) {
				console.warn(
					`[useDraggableSticker] Aucun ancêtre avec "data-drag-bounds" trouvé pour`,
					el,
					`— le drag est désactivé.`
				)
			}
			return
		}

		const hasGrayscale = el.classList.contains("grayscale")
		const grayscalePart = hasGrayscale ? "grayscale(1) " : ""
		const restFilter = `${grayscalePart}drop-shadow(0 4px 10px rgba(0,0,0,0.10))`
		const liftFilter = `${grayscalePart}drop-shadow(0 20px 30px rgba(0,0,0,0.25))`

		gsap.set(el, { filter: restFilter, force3D: true })

		el.style.cursor = "grab"
		el.style.touchAction = "none"
		el.style.willChange = "transform, filter"

		let elevated = false

		const rotateTo = gsap.quickTo(el, "rotate", {
			duration: 0.35,
			ease: "power3",
		})

		const created = Draggable.create(el, {
			type: "x,y",
			bounds: boundsEl,
			edgeResistance,
			throwResistance,
			allowNativeTouchScrolling: false,
			inertia: { resistance: throwResistance },
			onPress() {
				if (!elevated) {
					gsap.set(el, { zIndex: 999 })
					elevated = true
				}
				el.style.cursor = "grabbing"
				gsap.to(el, {
					scale: 1.08,
					rotate: 0,
					filter: liftFilter,
					duration: 0.3,
					ease: "power2.out",
					overwrite: "auto",
				})
			},
			onDrag() {
				const tilt = gsap.utils.clamp(-tiltStrength, tiltStrength, this.deltaX * 1.6)
				rotateTo(tilt)
			},
			onRelease() {
				el.style.cursor = "grab"
				gsap.to(el, {
					scale: 1,
					rotate: baseRotation,
					filter: restFilter,
					duration: 0.6,
					ease: "elastic.out(1, 0.65)",
					overwrite: "auto",
				})
			},
		})

		const draggable = created[0]

		return () => {
			draggable?.kill()
			gsap.set(el, { clearProps: "cursor,zIndex,rotate,scale,filter,willChange" })
		}
	}, target as any)
}
