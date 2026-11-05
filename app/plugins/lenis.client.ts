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
			lerp: prefersReducedMotion ? 1 : 0.1,
			duration: prefersReducedMotion ? 0 : 1.1,
			smoothWheel: !prefersReducedMotion,
			syncTouch: false,
			wheelMultiplier: 0.92,
			touchMultiplier: 1,
			autoRaf: false,
		})

		let scrolling = false
		let scrollEndTimeout: ReturnType<typeof setTimeout> | undefined
		let pendingRefresh = false

		function onScroll() {
			scrolling = true
			clearTimeout(scrollEndTimeout)
			scrollEndTimeout = setTimeout(() => {
				scrolling = false
				if (pendingRefresh) {
					pendingRefresh = false
					refreshScroll()
				}
			}, 120)
			ScrollTrigger.update()
		}

		lenis.on("scroll", onScroll)

		function update(time: number) {
			lenis.raf(time * 1000)
		}
		gsap.ticker.add(update)

		// Lenis must receive the real frame delta. Catch-up frames create visible jumps.
		gsap.ticker.lagSmoothing(0)

		function refreshScroll() {
			if (scrolling) {
				pendingRefresh = true
				return
			}

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
				clearTimeout(scrollEndTimeout)
				gsap.ticker.remove(update)
				lenis.off("scroll", onScroll)
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
