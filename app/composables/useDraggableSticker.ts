import type { MaybeRef } from "vue"

interface DragOptions {
	tiltStrength?: number

	/**
	 * Résistance au lancer inertiel.
	 *
	 * 200 = glisse normalement
	 * 600+ = très peu de glisse
	 */
	throwResistance?: number

	/**
	 * Résistance aux limites.
	 *
	 * 0 = aucun mur
	 * 1 = mur strict
	 */
	edgeResistance?: number

	/**
	 * Rotation de repos du sticker.
	 */
	baseRotation?: number

	/**
	 * Lissage du tilt.
	 *
	 * Plus bas = plus fluide/inertiel.
	 * Plus haut = plus réactif.
	 */
	tiltSmoothing?: number
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
		tiltSmoothing = 0.2,
	} = options

	useGsapContext(({ gsap, Draggable }) => {
		const el = unref(target)

		if (!el) return

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		if (prefersReducedMotion) return

		/*
		 * Le parent [data-drag-bounds] devient la zone
		 * dans laquelle le sticker peut être déplacé.
		 *
		 * Dans le header :
		 *
		 * fixed inset-0
		 *
		 * donc toute la fenêtre.
		 */
		const boundsEl =
			el.closest<HTMLElement>("[data-drag-bounds]") ?? document.documentElement

		const hasGrayscale = el.classList.contains("grayscale")

		const grayscalePart = hasGrayscale ? "grayscale(1) " : ""

		const restFilter = `${grayscalePart}drop-shadow(0 4px 10px rgba(0,0,0,0.10))`

		const liftFilter = `${grayscalePart}drop-shadow(0 20px 30px rgba(0,0,0,0.25))`

		el.style.cursor = "grab"
		el.style.touchAction = "none"
		el.style.willChange = "transform, filter"

		let elevated = false

		/*
		 * Tilt lissé.
		 */
		let smoothedTilt = 0

		/*
		 * Une seule source de vérité pour la rotation
		 * pendant le drag.
		 */
		const rotateTo = gsap.quickTo(el, "rotation", {
			duration: 0.25,
			ease: "power2.out",
		})

		const created = Draggable.create(el, {
			type: "x,y",

			bounds: boundsEl,

			edgeResistance,
			throwResistance,

			allowNativeTouchScrolling: false,

			inertia: {
				resistance: throwResistance,
			},

			onPress() {
				/*
				 * Le z-index élevé reste dans le stacking context
				 * de l'overlay.
				 *
				 * La box noire étant dans un stacking context z-10
				 * supérieur à l'overlay z-0, elle reste toujours devant.
				 */
				if (!elevated) {
					gsap.set(el, {
						zIndex: 999,
					})

					elevated = true
				}

				smoothedTilt = 0

				el.style.cursor = "grabbing"

				gsap.to(el, {
					scale: 1.08,
					filter: liftFilter,
					duration: 0.3,
					ease: "power2.out",
					overwrite: "auto",
				})

				rotateTo(0)
			},

			onDrag() {
				const rawTilt = gsap.utils.clamp(-tiltStrength, tiltStrength, this.deltaX * 1.6)

				smoothedTilt += (rawTilt - smoothedTilt) * tiltSmoothing

				rotateTo(smoothedTilt)
			},

			onRelease() {
				el.style.cursor = "grab"

				smoothedTilt = 0

				gsap.to(el, {
					scale: 1,
					filter: restFilter,
					duration: 0.6,
					ease: "elastic.out(1, 0.65)",
					overwrite: "auto",
				})

				rotateTo(baseRotation)
			},
		})

		const draggable = created[0]

		return () => {
			gsap.killTweensOf(el)

			draggable?.kill()

			gsap.set(el, {
				clearProps: "x,y,rotation,scale,cursor,zIndex,filter,willChange",
			})
		}
	}, target as any)
}
