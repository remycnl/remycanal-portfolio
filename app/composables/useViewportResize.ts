type ViewportWidthChangeCallback = () => void

let attached = false
let lastWidth = 0
let debounceTimeout: ReturnType<typeof setTimeout> | undefined

const listeners = new Set<ViewportWidthChangeCallback>()

function getViewportWidth() {
	return window.visualViewport?.width ?? window.innerWidth
}

function handleResize(debounceMs: number) {
	const width = getViewportWidth()
	if (width === lastWidth) return
	lastWidth = width

	clearTimeout(debounceTimeout)
	debounceTimeout = setTimeout(() => {
		listeners.forEach((callback) => callback())
	}, debounceMs)
}

function attach(debounceMs: number) {
	if (attached) return
	attached = true
	lastWidth = getViewportWidth()

	const onResize = () => handleResize(debounceMs)
	window.addEventListener("resize", onResize, { passive: true })
	window.visualViewport?.addEventListener("resize", onResize)
}

export function useViewportResize(
	callback: ViewportWidthChangeCallback,
	debounceMs = 150
) {
	attach(debounceMs)
	listeners.add(callback)

	return function unsubscribe() {
		listeners.delete(callback)
	}
}
