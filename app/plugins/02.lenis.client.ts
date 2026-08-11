import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

/**
 * Se charge après 01.gsap.client.ts (ordre garanti par le préfixe
 * numérique) : ScrollTrigger doit déjà être enregistré avant qu'on
 * lui envoie des updates.
 */
export default defineNuxtPlugin((nuxtApp) => {
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches

	const lenis = new Lenis({
		duration: prefersReducedMotion ? 0 : 1.2,
		smoothWheel: !prefersReducedMotion,
		syncTouch: false,
	})

	// Chaque frame Lenis doit invalider les positions ScrollTrigger
	lenis.on("scroll", ScrollTrigger.update)

	// Lenis tourne sur le ticker de GSAP (pas son propre rAF) pour rester
	// sur la même boucle que tes ScrollTrigger — évite le jitter d'1-2
	// frames entre scroll et animations.
	function update(time: number) {
		lenis.raf(time * 1000) // gsap.ticker donne des secondes, Lenis attend des ms
	}
	gsap.ticker.add(update)
	gsap.ticker.lagSmoothing(0)

	// En dev, le HMR peut ré-exécuter ce plugin sans nettoyer l'ancienne
	// instance -> scroll qui devient de plus en plus lourd à chaque save.
	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			gsap.ticker.remove(update)
			lenis.destroy()
		})
	}

	// Recalcule les positions ScrollTrigger une fois le contenu de la
	// nouvelle page monté après chaque navigation.
	nuxtApp.hook("page:finish", () => {
		ScrollTrigger.refresh()
	})

	// Remonte en haut au changement de route (sauf si on cible une ancre
	// #id sur la nouvelle page) — Vue Router ne s'en charge plus, voir
	// app/router.options.ts.
	const router = useRouter()
	router.afterEach((to) => {
		if (to.hash) return
		lenis.scrollTo(0, { immediate: true })
	})

	return {
		provide: { lenis },
	}
})
