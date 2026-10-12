export function useOpening() {
	const isOpening = shallowRef(false)
	const router = useRouter()
	let stopAfterEach: (() => void) | null = null

	function onPageShow(event: PageTransitionEvent) {
		if (event.persisted) isOpening.value = false
	}

	function attach() {
		if (stopAfterEach) return
		stopAfterEach = router.afterEach((_to, _from, failure) => {
			if (failure) isOpening.value = false
		})
		window.addEventListener("pageshow", onPageShow)
	}

	function detach() {
		stopAfterEach?.()
		stopAfterEach = null
		if (import.meta.client) window.removeEventListener("pageshow", onPageShow)
	}

	watch(isOpening, (opening) => (opening ? attach() : detach()), { flush: "sync" })
	onScopeDispose(detach)

	return isOpening
}
