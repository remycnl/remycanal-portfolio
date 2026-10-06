const DESKTOP_POINTER_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)"

export function useDesktopPointer() {
	const isDesktopPointer = shallowRef(false)
	let mediaQuery: MediaQueryList | null = null

	function update() {
		isDesktopPointer.value = mediaQuery?.matches ?? false
	}

	onMounted(() => {
		mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY)
		update()
		mediaQuery.addEventListener("change", update)
	})

	onBeforeUnmount(() => {
		mediaQuery?.removeEventListener("change", update)
		mediaQuery = null
	})

	return isDesktopPointer
}
