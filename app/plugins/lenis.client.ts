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

		function refreshScroll() {
			lenis.resize()
			ScrollTrigger.refresh()
		}

		const unsubscribeResize = useViewportResize(() => {
			refreshScroll()
		})

		function handleVisibilityChange() {
			if (document.hidden) return
			refreshScroll()
		}
		document.addEventListener("visibilitychange", handleVisibilityChange)

		let disposed = false
		let raf1: number | null = null
		let raf2: number | null = null

		function cancelPendingTransitionRefresh() {
			if (raf1 !== null) cancelAnimationFrame(raf1)
			if (raf2 !== null) cancelAnimationFrame(raf2)
			raf1 = raf2 = null
		}

		nuxtApp.hook("page:finish", async () => {
			await waitForPageTransition()
			if (disposed) return

			await nextTick()
			cancelPendingTransitionRefresh()
			raf1 = requestAnimationFrame(() => {
				raf2 = requestAnimationFrame(() => {
					if (!disposed) refreshScroll()
				})
			})
		})

		if (import.meta.hot) {
			import.meta.hot.dispose(() => {
				disposed = true
				cancelPendingTransitionRefresh()
				gsap.ticker.remove(update)
				unsubscribeResize()
				document.removeEventListener("visibilitychange", handleVisibilityChange)
				lenis.destroy()
			})
		}

		return {
			provide: { lenis },
		}
	},
})
