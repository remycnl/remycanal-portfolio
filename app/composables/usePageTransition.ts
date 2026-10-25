export function usePageTransitionActive() {
	return useState<boolean>("page-transition-active", () => false)
}

export async function waitForPageTransition() {
	if (import.meta.server) return

	const active = usePageTransitionActive()
	if (!active.value) return

	await new Promise<void>((resolve) => {
		const stop = watch(active, (value) => {
			if (value) return
			stop()
			resolve()
		})
	})
}

/**
 * Résout quand du travail lourd (reconstruction d'une boucle, refresh du scroll…) peut tourner
 * sans se voir : aucune transition en cours, ou écran entièrement couvert.
 * Pendant que la vague découvre la page, attend la fin de la transition (borné par `timeoutMs`).
 */
export async function waitUntilSafeToWork(timeoutMs = 3000) {
	if (import.meta.server) return
	if (!usePageTransitionActive().value || usePageCovered().value) return

	await Promise.race([
		waitForPageTransition(),
		new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
	])
}
