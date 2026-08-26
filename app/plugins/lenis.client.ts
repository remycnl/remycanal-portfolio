import Lenis from "lenis"

export default defineNuxtPlugin({
	name: "lenis",
	dependsOn: ["gsap"],
	setup(nuxtApp) {
		const gsap = nuxtApp.$gsap
		const ScrollTrigger = nuxtApp.$ScrollTrigger

		// Ignore les resize purement liés à la barre d'outils/adresse mobile
		// (delta de hauteur sans delta de largeur) : évite qu'un refresh
		// ScrollTrigger ne recalcule les positions de trigger en plein
		// scroll actif sur une section pinnée (useStackSection).
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

		// Empêche le rubber-band natif (l'élastique en haut/bas de page) de
		// perturber la position virtuelle de Lenis pendant les transitions
		// d'animation de la barre d'adresse sous WebKit (Safari / Brave iOS).
		document.documentElement.style.overscrollBehaviorY = "none"
		document.body.style.overscrollBehaviorY = "none"

		let lastWidth = window.visualViewport?.width ?? window.innerWidth
		let resizeTimeout: ReturnType<typeof setTimeout> | undefined

		function commitResize() {
			lenis.resize()
			ScrollTrigger.refresh()
		}

		/**
		 * On compare sur la LARGEUR, jamais la hauteur : sous WebKit
		 * (Safari/Brave iOS), l'animation de la barre d'adresse fait varier
		 * `innerHeight`/`visualViewport.height` en continu, frame par frame,
		 * sans rapport avec un vrai changement de viewport. La largeur, elle,
		 * ne bouge jamais dans ce cas — seule une vraie rotation d'écran ou
		 * un redimensionnement de fenêtre la change. On neutralise ainsi le
		 * bruit responsable du "stop + retour en arrière" au changement de
		 * sens de scroll, sans jamais ignorer les vrais resize.
		 */
		function handleResize() {
			const width = window.visualViewport?.width ?? window.innerWidth
			if (width === lastWidth) return
			lastWidth = width

			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(commitResize, 150)
		}

		window.addEventListener("resize", handleResize)
		window.visualViewport?.addEventListener("resize", handleResize)

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
				window.visualViewport?.removeEventListener("resize", handleResize)
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
	},
})
