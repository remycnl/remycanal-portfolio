/**
 * Délai après le début du rideau avant de lancer les intros de page.
 * Le rideau démarre à 0.5s dans la timeline du loader (expo.inOut, 1.3s) :
 * l'essentiel de l'ouverture visible se produit après ~0.3s, donc les textes
 * apparaissent sous le bord qui monte au lieu d'attendre la fin.
 */
const REVEAL_OVERLAP_MS = 1000

export async function waitForAppReady(): Promise<void> {
	const { isRevealing } = useLoadingState()

	// Navigation interne ou loader déjà passé : aucune attente
	if (isRevealing.value) return

	await new Promise<void>((resolve) => {
		const stop = watch(isRevealing, (revealing) => {
			if (revealing) {
				stop()
				resolve()
			}
		})
	})

	await new Promise<void>((resolve) => setTimeout(resolve, REVEAL_OVERLAP_MS))
}
