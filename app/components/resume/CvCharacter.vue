<script setup lang="ts">
import { computeCvPlacement, computeCvRange } from "@/utils/character/layout"
import { readResizeKey, readSafeTop } from "@/utils/character/viewport"

/**
 * Personnage du CV. À monter DANS le slot sticky de la bande blanche
 * (`data-character-slot="cv"`, dans la section `data-character-section="cv"`), qui clippe son
 * débordement (`overflow: clip`). Composant normal, pas `.client.vue` (voir HeroCharacter).
 *
 * Le slot est remonté AU-DESSUS de la bande (marge négative) et épinglé exactement sur la ligne
 * du personnage du hero : il est donc déjà « en place » dès le scroll 0, mais caché, car la
 * bande clippe ce qui dépasse. Le bord haut du CV, en montant, le dévoile : ce que le CV recouvre
 * côté noir réapparaît côté blanc, au même instant, sous le hero. Il reste sticky jusqu'à
 * `bottomGap` du bas de la bande (marge basse du slot), puis défile avec elle.
 *
 * Seules deux variables CSS sont calées sur le slot (`--cv-pin-top`, `--cv-above`) et sa boucle
 * de rendu n'est active que dans la plage de scroll où il est visible.
 */

const NEVER = 1e9

const rootRef = useTemplateRef<HTMLDivElement>("root")
const { cvReady, pinTop, above } = useResumeCharacterState()

const { ScrollTrigger } = useGsap()

// En pause tant que le bord du CV n'a pas atteint le personnage.
const isPaused = ref(true)

let rangeStart = NEVER
let rangeEnd = NEVER
let resizeKey = ""

let trigger: ReturnType<typeof ScrollTrigger.create> | null = null
let unsubscribeResize: (() => void) | null = null

function findSlot() {
	return (
		rootRef.value?.parentElement ??
		document.querySelector<HTMLElement>('[data-character-slot="cv"]')
	)
}

function measure() {
	const slot = findSlot()
	const strip = slot?.parentElement
	const section = slot?.closest<HTMLElement>('[data-character-section="cv"]')

	if (!slot || !strip || !section) {
		return
	}

	const placement = computeCvPlacement({
		heroCharPinTop: pinTop.value,
		heroAbove: above.value,
		safeTop: readSafeTop(),
	})

	slot.style.setProperty("--cv-pin-top", `${placement.pinTop.toFixed(2)}px`)
	slot.style.setProperty("--cv-above", `${placement.above.toFixed(2)}px`)

	const range = computeCvRange({
		cvDocTop: section.getBoundingClientRect().top + window.scrollY,
		stripHeight: strip.offsetHeight,
		slotHeight: slot.getBoundingClientRect().height,
		pinTop: placement.pinTop,
		bottomGap: Number.parseFloat(getComputedStyle(slot).marginBottom) || 0,
	})

	rangeStart = range.revealScroll
	rangeEnd = range.leaveScroll

	resizeKey = readResizeKey()
}

onMounted(() => {
	measure()

	trigger = ScrollTrigger.create({
		start: () => rangeStart,
		end: () => rangeEnd,
		invalidateOnRefresh: true,
		onToggle: (self) => {
			isPaused.value = !self.isActive
		},
	})

	unsubscribeResize = useViewportResize(() => {
		// Changement purement vertical (barre d'URL mobile) : rien n'a bougé.
		if (readResizeKey() === resizeKey) {
			return
		}

		measure()

		trigger?.refresh()
	})
})

// Le hero recalcule son point d'épinglage au resize : le CV suit.
watch([pinTop, above], () => {
	measure()

	trigger?.refresh()
})

onBeforeUnmount(() => {
	trigger?.kill()
	trigger = null

	unsubscribeResize?.()
	unsubscribeResize = null

	cvReady.value = false
})
</script>

<template>
	<div ref="root" aria-hidden="true" class="cv-character">
		<ResumeCharacterScene
			:paused="isPaused"
			body-color="var(--color-white)"
			face-color="var(--color-gray-400)"
			@ready="cvReady = true"
		/>
	</div>
</template>

<style scoped>
.cv-character {
	position: absolute;
	inset: 0;

	pointer-events: none;
}
</style>
