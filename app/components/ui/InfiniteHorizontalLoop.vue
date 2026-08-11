<template>
	<div
		ref="wrapperEl"
		class="relative w-full overflow-hidden"
		role="marquee"
		:aria-label="text"
	>
		<div ref="railEl" class="flex w-max">
			<span
				v-for="n in repeatCount"
				:key="n"
				class="flex items-center whitespace-nowrap will-change-transform"
				:class="itemClass"
				:style="{ marginInlineEnd: '3vw' }"
			>
				{{ text }}
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { horizontalLoop } from "~/utils/gsap/horizontalLoop"

interface Props {
	text: string
	itemClass?: string
	/** Nombre de répétitions du texte — assez pour couvrir large + marge de sécurité au resize */
	repeatCount?: number
	/** Vitesse de croisière, en "unités" gsap (1 ≈ 100px/s) — reste lente par défaut */
	baseSpeed?: number
	/** Multiplicateur max de vitesse appliqué au pic du scroll */
	maxScrollBoost?: number
	/** Activer/désactiver l'accélération liée au scroll */
	enableScrollBoost?: boolean
	/** Activer/désactiver le changement de sens via le scroll */
	enableDirection?: boolean
	/** Sens par défaut lorsque le sens est forcé ou initialement */
	defaultDirection?: "right" | "left"
}

const props = withDefaults(defineProps<Props>(), {
	itemClass: "uppercase font-lineal-heavy text-[6vw] pr-[3vw]",
	repeatCount: 12,
	baseSpeed: 0.4,
	maxScrollBoost: 14,
	enableScrollBoost: true,
	enableDirection: true,
	defaultDirection: "left",
})

const wrapperEl = ref<HTMLElement | null>(null)
const railEl = ref<HTMLElement | null>(null)

const { useGsapContext } = useGsap()

useGsapContext(({ gsap, ScrollTrigger }) => {
	if (!railEl.value) return
	const items = Array.from(railEl.value.children) as HTMLElement[]
	if (!items.length) return

	const loop = horizontalLoop(gsap, items, {
		repeat: -1,
		speed: props.baseSpeed,
		paddingRight: 0,
	})

	const baseDir = props.defaultDirection === "right" ? -1 : 1
	let scrollDir = 1

	// Système à inertie piloté par un ticker continu :
	// rawVelocity capte le pic de vélocité du scroll, currentTimeScale
	// avance en douceur vers sa cible frame par frame — jamais de saut.
	let rawVelocity = 0
	let currentTimeScale = baseDir

	// Plus FRICTION est proche de 1, plus la vélocité retombe lentement après l'arrêt du scroll.
	const FRICTION = 0.92
	// Plus SMOOTHING est grand, plus currentTimeScale rejoint vite sa cible.
	const SMOOTHING = 0.18
	const VELOCITY_DIVISOR = 160

	const scrollTrigger = ScrollTrigger.create({
		trigger: wrapperEl.value,
		start: "top bottom",
		end: "bottom top",
		onUpdate(self) {
			if (props.enableDirection) {
				scrollDir = self.direction || scrollDir
			} else {
				scrollDir = 1
			}
			const v = Math.abs(self.getVelocity())
			rawVelocity = Math.max(rawVelocity, v)
		},
	})

	function tick() {
		// deltaRatio() rend le calcul indépendant du framerate (60/120/144Hz...)
		const ratio = gsap.ticker.deltaRatio()

		rawVelocity *= Math.pow(FRICTION, ratio)

		const boost = props.enableScrollBoost
			? gsap.utils.clamp(0, props.maxScrollBoost, rawVelocity / VELOCITY_DIVISOR)
			: 0

		const effectiveDirection = props.enableDirection ? baseDir * scrollDir : baseDir
		const target = effectiveDirection * (1 + boost)

		const lerpFactor = 1 - Math.pow(1 - SMOOTHING, ratio)
		currentTimeScale += (target - currentTimeScale) * lerpFactor

		loop.timeScale(currentTimeScale)
	}

	gsap.ticker.add(tick)

	return () => {
		scrollTrigger.kill()
		gsap.ticker.remove(tick)
	}
}, wrapperEl)
</script>
