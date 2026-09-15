let refreshTimeout: ReturnType<typeof setTimeout> | undefined

export function useScrollRefresh() {
	function resyncAndRefresh() {
		const nuxtApp = useNuxtApp()
		;(nuxtApp as any).$lenis?.resize?.()
		;(nuxtApp as any).$ScrollTrigger?.refresh()
	}

	function refresh(debounceMs = 100) {
		if (!import.meta.client) return
		clearTimeout(refreshTimeout)
		refreshTimeout = setTimeout(resyncAndRefresh, debounceMs)
	}

	function refreshImmediate() {
		if (!import.meta.client) return
		clearTimeout(refreshTimeout)
		resyncAndRefresh()
	}

	return { refresh, refreshImmediate }
}
