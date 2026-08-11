<!-- components/ui/GridBeams.vue -->
<template>
	<div
		ref="containerEl"
		class="pointer-events-none absolute inset-0 overflow-hidden"
		:style="maskStyle"
		aria-hidden="true"
	>
		<span
			v-for="(_, i) in poolSize"
			:key="i"
			:ref="(el) => setBeamRef(el, i)"
			class="beam-line"
		/>
	</div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue"

// Mêmes valeurs oklch que les utilities bg-grid-white / bg-grid-black /
// bg-grid-lime / bg-grid-violet (voir le CSS des @utility). Source unique de
// vérité pour rester synchro avec la grid sans dupliquer de couleurs à la main.
const THEMES = {
	white: "oklch(0.9 0.2202 125)",
	black: "oklch(0.22 0 0)",
	lime: "oklch(0.9 0.2202 125)",
	violet: "oklch(0.48 0.2455 293.81)",
} as const

type GridTheme = keyof typeof THEMES

// Même mask radial que les @utility bg-grid-* : le fondu sur les bords des
// traits est donc rigoureusement identique à celui de la grille en fond.
const GRID_MASK =
	"radial-gradient(ellipse at center, black 0%, black 20%, rgb(0 0 0 / 0.75) 40%, rgb(0 0 0 / 0.4) 60%, rgb(0 0 0 / 0.12) 80%, transparent 95%)"

interface Props {
	theme?: GridTheme
	spacing?: number
	interval?: number
	poolSize?: number
	beamLength?: number
	darken?: number
	durationMin?: number
	durationMax?: number
}

const props = withDefaults(defineProps<Props>(), {
	theme: "white",
	spacing: 96,
	interval: 4000,
	poolSize: 3,
	beamLength: 0.18,
	darken: 35,
	durationMin: 3200,
	durationMax: 4800,
})

const maskStyle = {
	maskImage: GRID_MASK,
	WebkitMaskImage: GRID_MASK,
}

// Couleur de la ligne de grille du thème actif, assombrie d'un cran pour
// rester discrète tout en restant dans la même famille de teinte.
const beamColor = computed(() => {
	const base = THEMES[props.theme]
	return `color-mix(in oklch, ${base} ${100 - props.darken}%, black ${props.darken}%)`
})

const containerEl = ref<HTMLElement | null>(null)
const beamEls: (HTMLElement | null)[] = []
function setBeamRef(el: Element | ComponentPublicInstance | null, i: number) {
	beamEls[i] = (el as HTMLElement) ?? null
}

let width = 0
let height = 0
let lastGlobalColumn = -1
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let isVisible = true
let reduceMotion = false
let destroyed = false
const timeouts: ReturnType<typeof setTimeout>[] = []
const runningAnimations = new Set<Animation>()

function columnCount() {
	return Math.max(1, Math.floor(width / props.spacing) + 1)
}

function randomBetween(min: number, max: number) {
	return min + Math.random() * (max - min)
}

function measure() {
	if (!containerEl.value) return
	width = containerEl.value.clientWidth
	height = containerEl.value.clientHeight
}

function fireBeam(beamIndex: number) {
	const el = beamEls[beamIndex]
	if (!el || !isVisible || reduceMotion || !height) return

	const total = columnCount()
	let col = lastGlobalColumn
	if (total > 1) {
		while (col === lastGlobalColumn) col = Math.floor(Math.random() * total)
	} else {
		col = 0
	}
	lastGlobalColumn = col

	const x = col * props.spacing
	const beamPx = Math.max(height * props.beamLength, 40)
	const duration = randomBetween(props.durationMin, props.durationMax)

	el.style.transform = `translate3d(${x}px, -${beamPx}px, 0)`
	el.style.height = `${beamPx}px`

	const anim = el.animate(
		[
			{ transform: `translate3d(${x}px, -${beamPx}px, 0)`, opacity: 0 },
			{
				transform: `translate3d(${x}px, ${-beamPx * 0.3}px, 0)`,
				opacity: 1,
				offset: 0.12,
			},
			{
				transform: `translate3d(${x}px, ${height * 0.88}px, 0)`,
				opacity: 1,
				offset: 0.85,
			},
			{
				transform: `translate3d(${x}px, ${height + beamPx}px, 0)`,
				opacity: 0,
			},
		],
		{ duration, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
	)

	runningAnimations.add(anim)
	anim.finished.catch(() => {}).finally(() => runningAnimations.delete(anim))
}

function scheduleBeam(beamIndex: number) {
	if (destroyed) return
	const jitter = randomBetween(props.interval * 0.5, props.interval * 1.5)
	const id = setTimeout(() => {
		fireBeam(beamIndex)
		scheduleBeam(beamIndex)
	}, jitter)
	timeouts.push(id)
}

onMounted(() => {
	measure()
	reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	if (containerEl.value) {
		resizeObserver = new ResizeObserver(() => measure())
		resizeObserver.observe(containerEl.value)

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				if (entry) isVisible = entry.isIntersecting
			},
			{ threshold: 0 }
		)
		intersectionObserver.observe(containerEl.value)
	}

	if (!reduceMotion) {
		for (let i = 0; i < props.poolSize; i++) {
			const initialDelay = randomBetween(0, props.interval)
			const id = setTimeout(() => {
				fireBeam(i)
				scheduleBeam(i)
			}, initialDelay)
			timeouts.push(id)
		}
	}
})

onBeforeUnmount(() => {
	destroyed = true
	timeouts.forEach(clearTimeout)
	runningAnimations.forEach((a) => a.cancel())
	resizeObserver?.disconnect()
	intersectionObserver?.disconnect()
})
</script>

<style scoped>
.beam-line {
	position: absolute;
	top: 0;
	left: 0;
	width: 1px;
	opacity: 0;
	will-change: transform, opacity;
	background: linear-gradient(
		to bottom,
		transparent,
		v-bind(beamColor) 20%,
		v-bind(beamColor) 80%,
		transparent
	);
}
</style>
