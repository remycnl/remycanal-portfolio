/**
 * État partagé du cycle de vie du loader.
 * - isComplete  : le compteur a atteint 100 %
 * - isRevealing : le rideau commence à se lever (scroll débloqué, intro de page possible)
 * - isRevealed  : l'animation de sortie est terminée (le loader peut être démonté)
 */
export function useLoadingState() {
	const isComplete = useState("app-loading-complete", () => false)
	const isRevealing = useState("app-loading-revealing", () => false)
	const isRevealed = useState("app-loading-revealed", () => false)

	return { isComplete, isRevealing, isRevealed }
}
