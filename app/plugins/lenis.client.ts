import Lenis from "lenis"

export default defineNuxtPlugin({
	name: "lenis",
	dependsOn: ["gsap"],
	setup(nuxtApp) {
		const gsap = nuxtApp.$gsap
		const ScrollTrigger = nuxtApp.$ScrollTrigger

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		// Empêche le rubber-band natif (l'élastique en haut/bas de page) au
		// scroll — comportement purement visuel, sans effet sur le hide/show
		// natif de la barre d'adresse (qui reste piloté par le scroll natif
		// normal, jamais intercepté ici).
		document.documentElement.style.overscrollBehaviorY = "none"
		document.body.style.overscrollBehaviorY = "none"

		const lenis = new Lenis({
			duration: prefersReducedMotion ? 0 : 1.2,
			smoothWheel: !prefersReducedMotion,
			/**
			 * `syncTouch: true` fait piloter le geste tactile directement par
			 * Lenis, au lieu de laisser le scroll natif du navigateur gérer
			 * le touch. Nécessaire sur WebKit (Safari/Brave iOS) : avec
			 * `syncTouch: false`, WebKit gère seul son momentum scroll natif,
			 * et lors d'une inversion rapide de sens en pleine inertie, il
			 * recalcule son offset de façon abrupte — comportement que Lenis
			 * ne peut ni lisser ni corriger puisqu'il n'a pas la main sur le
			 * geste. En prenant le contrôle du touch lui-même, Lenis élimine
			 * ce conflit à la racine.
			 */
			syncTouch: true,
			syncTouchLerp: 0.075,
			touchInertiaMultiplier: 35,
		})

		lenis.on("scroll", ScrollTrigger.update)

		function update(time: number) {
			lenis.raf(time * 1000)
		}
		gsap.ticker.add(update)

		gsap.ticker.lagSmoothing(1000, 16)

		/**
		 * NB: on n'utilise volontairement PAS ScrollTrigger.normalizeScroll()
		 * ici. Il prend le contrôle total du scroll natif via ses propres
		 * transforms, ce qui entre en conflit direct avec le scroll virtuel
		 * déjà géré par Lenis (double pilotage) et empêche le navigateur de
		 * voir un vrai scroll natif se produire — désactivant de fait le
		 * hide/show automatique de la barre d'adresse mobile, qui reste
		 * bloquée ouverte. La fixation en `svh` (voir main.css) est le fix
		 * structurel correct : elle rend les hauteurs indépendantes de
		 * l'état de la barre d'adresse sans toucher au scroll natif.
		 */

		// Ignore les resize purement liés à la barre d'outils/adresse mobile
		// (delta de hauteur sans delta de largeur) : évite qu'un refresh
		// ScrollTrigger ne recalcule les positions de trigger en plein
		// scroll actif sur une section pinnée.
		ScrollTrigger.config({ ignoreMobileResize: true })

		let lastWidth = window.visualViewport?.width ?? window.innerWidth
		let resizeTimeout: ReturnType<typeof setTimeout> | undefined

		function commitResize() {
			lenis.resize()
			ScrollTrigger.refresh()
		}

		/**
		 * On compare uniquement sur la LARGEUR : sous WebKit, l'animation de
		 * la barre d'adresse fait varier la hauteur en continu sans rapport
		 * avec un vrai changement de viewport, alors que la largeur ne bouge
		 * jamais dans ce cas. Seule une vraie rotation d'écran ou un
		 * redimensionnement de fenêtre déclenche donc ce handler.
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