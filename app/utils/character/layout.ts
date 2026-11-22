/**
 * Géométrie du « rideau » entre le hero (épinglé) et le CV (qui glisse par-dessus).
 *
 * Le mouvement lui-même est du `position: sticky` pur. Ces fonctions ne servent qu'à calculer,
 * au chargement et au resize, les quelques valeurs CSS qui calent les deux personnages sur la
 * même ligne : celui du hero est recouvert par le bord haut du CV, celui du CV est révélé par
 * ce même bord.
 */

export interface HeroLayoutInput {
	/** Haut du slot du personnage, relatif au haut de la section hero (px). */
	slotOffset: number
	sectionHeight: number
	/** Haut du CV (= bas du hero) en coordonnées document. */
	cvDocTop: number
	/** Hauteur du viewport « small » (svh) : stable quand la barre d'URL mobile apparaît ou disparaît. */
	viewportHeight: number
}

export interface HeroLayout {
	/**
	 * `top` du hero sticky. 0 s'il tient dans l'écran ; négatif sinon, pour que son bas reste
	 * accessible : il défile d'abord, puis s'épingle quand son bas atteint le bas de l'écran.
	 */
	stickyTop: number
	/** Position viewport (px) du haut du personnage une fois le hero épinglé. */
	charPinTop: number
	/** Scroll à partir duquel le CV recouvre entièrement le personnage du hero. */
	coverScroll: number
	/** Scroll à partir duquel le CV recouvre entièrement le hero. */
	fullCoverScroll: number
	/**
	 * Distance entre le haut du slot du hero et le bas du hero (= haut du CV). Le slot du CV est
	 * remonté d'autant au-dessus de la bande blanche : il y est à la même place relative que
	 * celui du hero, quelle que soit la hauteur du viewport.
	 */
	cvAbove: number
}

export function computeHeroLayout(input: HeroLayoutInput): HeroLayout {
	const stickyTop = Math.min(0, input.viewportHeight - input.sectionHeight)
	const charPinTop = stickyTop + input.slotOffset

	return {
		stickyTop,
		charPinTop,
		coverScroll: input.cvDocTop - charPinTop,
		fullCoverScroll: input.cvDocTop - stickyTop,
		cvAbove: input.sectionHeight - input.slotOffset,
	}
}

export interface CvPlacementInput {
	/** `charPinTop` du personnage du hero. */
	heroCharPinTop: number
	/** `cvAbove` calculé par le hero. */
	heroAbove: number
	/** Bas du header fixe (+ marge), 0 s'il n'y en a pas : le personnage ne se colle jamais dessous. */
	safeTop: number
}

export interface CvPlacement {
	/** `top` sticky du personnage du CV : la ligne du personnage du hero, jamais sous le header. */
	pinTop: number
	/** Remontée (px) du slot AU-DESSUS de la bande blanche (marge négative). */
	above: number
}

export function computeCvPlacement(input: CvPlacementInput): CvPlacement {
	return {
		pinTop: Math.max(input.heroCharPinTop, input.safeTop),
		above: Math.max(input.heroAbove, 0),
	}
}

export interface CvRangeInput {
	cvDocTop: number
	stripHeight: number
	slotHeight: number
	pinTop: number
	/** Marge entre le personnage et le bas de la bande quand il arrête d'être sticky. */
	bottomGap: number
}

export interface CvRange {
	/** Scroll où le bord haut du CV atteint le bas du personnage : il commence à apparaître. */
	revealScroll: number
	/** Scroll où le personnage, repoussé par le bas de la bande, a quitté l'écran par le haut. */
	leaveScroll: number
}

export function computeCvRange(input: CvRangeInput): CvRange {
	return {
		revealScroll: input.cvDocTop - (input.pinTop + input.slotHeight),
		leaveScroll: input.cvDocTop + input.stripHeight - input.bottomGap,
	}
}

/**
 * `position: sticky` ne fonctionne pas si un ancêtre a un `overflow` autre que visible/clip :
 * il devient le conteneur de défilement. Renvoie ce premier ancêtre bloquant, s'il existe.
 */
export function findStickyBlocker(element: Element): HTMLElement | null {
	for (let node = element.parentElement; node; node = node.parentElement) {
		if (node === document.documentElement) {
			return null
		}

		const { overflowX, overflowY } = getComputedStyle(node)

		if (/(hidden|auto|scroll|overlay)/.test(`${overflowX} ${overflowY}`)) {
			return node
		}
	}

	return null
}
