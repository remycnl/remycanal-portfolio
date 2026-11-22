/**
 * Hauteur du viewport « small » (100svh). Contrairement à `window.innerHeight`, elle ne bouge
 * pas quand la barre d'URL d'un navigateur mobile apparaît ou disparaît pendant le scroll :
 * on évite ainsi de recalculer (lectures de layout + refresh ScrollTrigger) en boucle.
 */
export function readSmallViewportHeight(): number {
	const probe = document.createElement("div")

	probe.style.cssText =
		"position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none"

	document.body.appendChild(probe)

	const height = probe.offsetHeight

	probe.remove()

	return height > 0 ? height : window.innerHeight
}

/** Clé de resize : un changement purement vertical dû à la barre d'URL ne la modifie pas. */
export function readResizeKey(smallViewportHeight = readSmallViewportHeight()): string {
	return `${window.innerWidth}x${smallViewportHeight}`
}

/**
 * Bas du header s'il est fixe ou sticky (+ marge), pour que le personnage du CV ne se colle
 * jamais dessous. 0 sinon.
 */
export function readSafeTop(gap = 12): number {
	const header = document.querySelector("header")

	if (!header) {
		return 0
	}

	const { position } = getComputedStyle(header)

	if (position !== "fixed" && position !== "sticky") {
		return 0
	}

	return header.getBoundingClientRect().bottom + gap
}
