let refreshTimeout: ReturnType<typeof setTimeout> | undefined
let deferredFlushPending = false

export function useScrollRefresh() {
	function resyncAndRefresh() {
		const nuxtApp = useNuxtApp()
		;(nuxtApp as any).$lenis?.resize?.()
		;(nuxtApp as any).$ScrollTrigger?.refresh()
	}

	/**
	 * Un refresh force des layouts (30 à 50 ms avec des pins) : pendant que la vague couvre ou
	 * découvre l'écran, il se verrait. Écran couvert ou aucune transition : il part tout de suite.
	 */
	function isUncovering() {
		return usePageTransitionActive().value && !usePageCovered().value
	}

	/** Une seule exécution, juste après la fin de la transition, quand le thread est au repos. */
	function flushAfterTransition() {
		if (deferredFlushPending) return
		deferredFlushPending = true

		waitForPageTransition().then(() => {
			const run = () => {
				deferredFlushPending = false
				resyncAndRefresh()
			}

			if ("requestIdleCallback" in window) {
				window.requestIdleCallback(run, { timeout: 300 })
			} else {
				setTimeout(run, 150)
			}
		})
	}

	function runOrDefer() {
		if (isUncovering()) flushAfterTransition()
		else resyncAndRefresh()
	}

	function refresh(debounceMs = 100) {
		if (!import.meta.client) return
		clearTimeout(refreshTimeout)
		refreshTimeout = setTimeout(runOrDefer, debounceMs)
	}

	function refreshImmediate() {
		if (!import.meta.client) return
		clearTimeout(refreshTimeout)
		runOrDefer()
	}

	return { refresh, refreshImmediate }
}
