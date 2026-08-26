export default defineNuxtPlugin(() => {
	function setViewportHeight() {
		const height = window.visualViewport?.height ?? window.innerHeight
		document.documentElement.style.setProperty("--vh100", `${height}px`)
	}

	setViewportHeight()

	let lastWidth = window.visualViewport?.width ?? window.innerWidth
	let resizeTimeout: ReturnType<typeof setTimeout> | undefined

	function handleResize() {
		const width = window.visualViewport?.width ?? window.innerWidth
		if (width === lastWidth) return
		lastWidth = width

		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(setViewportHeight, 150)
	}

	function handleOrientationChange() {

		lastWidth = -1
		handleResize()
	}

	window.addEventListener("resize", handleResize, { passive: true })
	window.visualViewport?.addEventListener("resize", handleResize)
	window.addEventListener("orientationchange", handleOrientationChange, { passive: true })

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			window.removeEventListener("resize", handleResize)
			window.visualViewport?.removeEventListener("resize", handleResize)
			window.removeEventListener("orientationchange", handleOrientationChange)
			clearTimeout(resizeTimeout)
		})
	}
})
