import Lenis from "lenis"

export default defineNuxtPlugin({
	name: "lenis",
	dependsOn: ["gsap"],
	setup(nuxtApp) {
		const gsap = nuxtApp.$gsap
		const ScrollTrigger = nuxtApp.$ScrollTrigger

		ScrollTrigger.config({ ignoreMobileResize: true })

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

		const unsubscribeResize = useViewportResize(() => {
			lenis.resize()
			ScrollTrigger.refresh()
		})

		function handleVisibilityChange() {
			if (document.hidden) return
			lenis.resize()
			ScrollTrigger.refresh()
		}
		document.addEventListener("visibilitychange", handleVisibilityChange)

		if (import.meta.hot) {
			import.meta.hot.dispose(() => {
				gsap.ticker.remove(update)
				unsubscribeResize()
				document.removeEventListener("visibilitychange", handleVisibilityChange)
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
	},
})
