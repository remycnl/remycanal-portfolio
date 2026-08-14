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
	/**
	 * Facteur de lissage du tilt (0-1). Plus bas = plus fluide/inertiel,
	 * plus haut = plus réactif/collé au curseur. Défaut : 0.18.
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

		el.style.cursor = "grab"
		el.style.touchAction = "none"
		el.style.willChange = "transform, filter"

		let elevated = false
		// Valeur lissée (EMA) du tilt courant — évite que le bruit brut de
		// deltaX (surtout trackpad) ne produise des à-coups visuels.
		let smoothedTilt = 0

		// SEULE source de vérité pour "rotation" sur cet élément — press, drag
		// ET release passent tous par ce même quickTo. Ne jamais créer un
		// gsap.to(el, { rotation: ... }) concurrent : overwrite:"auto" tuerait
		// la portion "rotation" du tween interne de quickTo et le corromprait
		// (bug "not eligible for reset" au cycle press/drag/release suivant).
		//
		// Ease "power2.out" volontairement SANS overshoot (contrairement à
		// "back.out"/"elastic") : pour un tracking continu comme onDrag, une
		// ease à rebond relance un mini-rebond à chaque frame de mouvement,
		// et ces rebonds qui se chevauchent produisent un effet de va-et-vient
		// saccadé dès que le geste ralentit. power2.out reste fluide à toute
		// vitesse. Le rebond "tactile" est déjà assuré par le scale (elastic)
		// au press/release — pas besoin de le dupliquer sur la rotation.
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
			inertia: { resistance: throwResistance },
			onPress() {
				if (!elevated) {
					gsap.set(el, { zIndex: 999 })
					elevated = true
				}
				smoothedTilt = 0
				el.style.cursor = "grabbing"
				// scale + filter uniquement ici : aucune prop en commun avec le
				// quickTo ci-dessus, donc overwrite:"auto" ne peut rien casser.
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
				// Lissage exponentiel : la valeur envoyée à quickTo se rapproche
				// progressivement de la cible brute au lieu de la suivre 1:1.
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