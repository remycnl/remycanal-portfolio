import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

export default defineNuxtPlugin((nuxtApp) => {
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches

	const lenis = new Lenis({
		duration: prefersReducedMotion ? 0 : 1.2,
		smoothWheel: !prefersReducedMotion,
		syncTouch: false,
	})

	lenis.on("scroll", ScrollTrigger.update)

	function update(time: number) {
		lenis.raf(time * 1000)
	}
	gsap.ticker.add(update)

	gsap.ticker.lagSmoothing(1000, 16)

	let lastWidth = window.innerWidth
	let resizeTimeout: ReturnType<typeof setTimeout> | undefined
	function handleResize() {
		const width = window.innerWidth
		if (width === lastWidth) return
		lastWidth = width

		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(() => {
			lenis.resize()
			ScrollTrigger.refresh()
		}, 150)
	}
	window.addEventListener("resize", handleResize)

	function handleVisibilityChange() {
		if (document.hidden) return
		lenis.resize()
		ScrollTrigger.refresh()
	}
	document.addEventListener("visibilitychange", handleVisibilityChange)

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			gsap.ticker.remove(update)
			window.removeEventListener("resize", handleResize)
			document.removeEventListener("visibilitychange", handleVisibilityChange)
			clearTimeout(resizeTimeout)
			lenis.destroy()
		})
	}

	nuxtApp.hook("page:finish", () => {
		ScrollTrigger.refresh()
	})

	const router = useRouter()
	router.afterEach((to) => {
		if (to.hash) return
		lenis.scrollTo(0, { immediate: true })
	})

	return {
		provide: { lenis },
	}
})
