<script setup lang="ts">
import { computeHeroLayout, findStickyBlocker } from "@/utils/character/layout"
import { readResizeKey, readSmallViewportHeight } from "@/utils/character/viewport"

/**
 * Personnage du hero. À rendre dans `<ClientOnly>`, DANS le slot du hero
 * (`data-character-slot="hero"`, dans la section `data-character-section="hero"`, suivie du CV).
 *
 * ⚠️ Pas de suffixe `.client.vue` : pour ces composants Nuxt exécute le `setup` (donc les
 * `onMounted`) au premier montage, avant que le template réel soit rendu, et les template refs
 * y sont encore nulles. `<ClientOnly>` monte au contraire le composant normalement.
 *
 * Le hero entier est `position: sticky` (rideau) : son contenu, personnage compris, ne bouge
 * plus et c'est le CV, positionné plus haut dans la pile, qui glisse par-dessus et le masque.
 * Aucun JS pendant le scroll : on ne cale qu'une variable CSS (`--hero-pin-top`, utile
 * seulement si le hero est plus haut que l'écran) et on arme deux pauses :
 *  - la boucle de rendu, quand le CV a entièrement recouvert le personnage ;
 *  - les animations CSS du hero (`data-covered`), quand le CV a entièrement recouvert le hero.
 *
 * Contrainte CSS : aucun ancêtre du hero ne doit avoir un `overflow` autre que visible/clip
 * (sinon sticky n'a plus d'effet ; un warning en dev désigne l'élément fautif).
 */

// Valeur « jamais atteinte » tant que le CV n'est pas mesuré.
const NEVER = 1e9

const rootRef = useTemplateRef<HTMLDivElement>("root")
const { heroReady, pinTop, above } = useResumeCharacterState()

const { ScrollTrigger } = useGsap()

const isCovered = ref(false)

let section: HTMLElement | null = null
let coverScroll = NEVER
let fullCoverScroll = NEVER
let resizeKey = ""

let coverTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
let heroTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
let unsubscribeResize: (() => void) | null = null

function findSlot() {
	return (
		rootRef.value?.parentElement ??
		document.querySelector<HTMLElement>('[data-character-slot="hero"]')
	)
}

function measure() {
	const slot = findSlot()
	const hero = slot?.closest<HTMLElement>('[data-character-section="hero"]') ?? null

	if (!slot || !hero) {
		if (import.meta.dev) {
			console.warn(
				'[ResumeHeroCharacter] Il faut un parent [data-character-slot="hero"] dans une section [data-character-section="hero"].'
			)
		}

		return
	}

	section = hero

	// Le CV suit directement le hero : son haut ne dépend pas du décalage sticky du hero.
	const cv = hero.nextElementSibling
	const viewportHeight = readSmallViewportHeight()

	const layout = computeHeroLayout({
		slotOffset: slot.getBoundingClientRect().top - hero.getBoundingClientRect().top,
		sectionHeight: hero.offsetHeight,
		cvDocTop: cv ? cv.getBoundingClientRect().top + window.scrollY : NEVER,
		viewportHeight,
	})

	hero.style.setProperty("--hero-pin-top", `${layout.stickyTop.toFixed(2)}px`)

	coverScroll = cv ? layout.coverScroll : NEVER
	fullCoverScroll = cv ? layout.fullCoverScroll : NEVER

	pinTop.value = layout.charPinTop
	above.value = layout.cvAbove

	resizeKey = readResizeKey(viewportHeight)
}

onMounted(() => {
	measure()

	if (import.meta.dev && section) {
		const blocker = findStickyBlocker(section)

		if (blocker) {
			console.warn(
				"[ResumeHeroCharacter] `position: sticky` est neutralisé par l'overflow de cet ancêtre :",
				blocker,
				"→ utiliser overflow: clip ou le retirer."
			)
		}
	}

	coverTrigger = ScrollTrigger.create({
		start: () => coverScroll,
		end: "max",
		invalidateOnRefresh: true,
		onToggle: (self) => {
			isCovered.value = self.isActive
		},
	})

	heroTrigger = ScrollTrigger.create({
		start: () => fullCoverScroll,
		end: "max",
		invalidateOnRefresh: true,
		onToggle: (self) => {
			section?.toggleAttribute("data-covered", self.isActive)
		},
	})

	unsubscribeResize = useViewportResize(() => {
		// Changement purement vertical (barre d'URL mobile) : rien n'a bougé.
		if (readResizeKey() === resizeKey) {
			return
		}

		measure()

		coverTrigger?.refresh()
		heroTrigger?.refresh()
	})
})

onBeforeUnmount(() => {
	coverTrigger?.kill()
	coverTrigger = null

	heroTrigger?.kill()
	heroTrigger = null

	section?.removeAttribute("data-covered")
	section = null

	unsubscribeResize?.()
	unsubscribeResize = null

	heroReady.value = false
})
</script>

<template>
	<div ref="root" aria-hidden="true" class="hero-character">
		<ResumeCharacterScene :paused="isCovered" @ready="heroReady = true" />
	</div>
</template>

<style scoped>
.hero-character {
	position: absolute;
	inset: 0;

	pointer-events: none;
}
</style>
