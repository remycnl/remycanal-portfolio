<template>
	<div
		ref="containerEl"
		class="grid-beams pointer-events-none absolute inset-0 overflow-hidden"
		:data-theme="theme"
		:style="cssVars"
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

type GridTheme = "white" | "black" | "lime" | "violet"

const DESKTOP_BREAKPOINT = 1024
const MOBILE_SPACING = 48
const DESKTOP_SPACING = 96

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
	interval: 5000,
	poolSize: 3,
	beamLength: 0.18,
	darken: 30,
	durationMin: 3200,
	durationMax: 4800,
})

// Seules variables injectées en inline : elles dépendent uniquement des props,
// donc identiques côté serveur et côté client (plus de mismatch d'hydratation).
const cssVars = computed(() => ({
	"--beam-keep": `${100 - props.darken}%`,
	"--beam-darken": `${props.darken}%`,
}))

const spacingPx = ref(DESKTOP_SPACING)

let spacingMediaQuery: MediaQueryList | null = null

function updateSpacing() {
	if (props.spacing !== undefined) {
		spacingPx.value = props.spacing
		return
	}

	spacingPx.value = spacingMediaQuery?.matches ? DESKTOP_SPACING : MOBILE_SPACING
}

watch(() => props.spacing, updateSpacing)

const containerEl = useTemplateRef<HTMLElement>("containerEl")
const beamEls: (HTMLElement | null)[] = []

function setBeamRef(el: Element | ComponentPublicInstance | null, i: number) {
	beamEls[i] = (el as HTMLElement) ?? null
}

let width = 0
let height = 0

const activeColumns = new Set<number>()

let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null

let isVisible = true
let reduceMotion = false
let destroyed = false

const timeouts: ReturnType<typeof setTimeout>[] = []
const runningAnimations = new Set<Animation>()

function columnCount() {
	return Math.max(1, Math.floor(width / spacingPx.value) + 1)
}

function randomBetween(min: number, max: number) {
	return min + Math.random() * (max - min)
}

function measure() {
	if (!containerEl.value) return

	width = containerEl.value.clientWidth
	height = containerEl.value.clientHeight
}

function pickAvailableColumn(): number | null {
	const total = columnCount()
	const available: number[] = []

	for (let c = 0; c < total; c++) {
		if (!activeColumns.has(c)) {
			available.push(c)
		}
	}

	if (available.length === 0) return null

	const index = Math.floor(Math.random() * available.length)

	return available[index] ?? null
}

function fireBeam(beamIndex: number) {
	const el = beamEls[beamIndex]

	if (!el || !isVisible || reduceMotion || !height) return

	const col = pickAvailableColumn()

	if (col === null) {
		const retryId = setTimeout(() => fireBeam(beamIndex), 250)

		timeouts.push(retryId)

		return
	}

	activeColumns.add(col)

	const x = col * spacingPx.value
	const beamPx = Math.max(height * props.beamLength, 40)
	const duration = randomBetween(props.durationMin, props.durationMax)

	el.style.transform = `translate3d(${x}px, ${-beamPx}px, 0)`
	el.style.height = `${beamPx}px`

	const anim = el.animate(
		[
			{
				transform: `translate3d(${x}px, ${-beamPx}px, 0)`,
				opacity: 0,
			},
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
		{
			duration,
			easing: "cubic-bezier(0.4, 0, 0.2, 1)",
			fill: "forwards",
		}
	)

	runningAnimations.add(anim)

	anim.finished
		.catch(() => {})
		.finally(() => {
			runningAnimations.delete(anim)
			activeColumns.delete(col)
		})
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
	spacingMediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

	updateSpacing()

	spacingMediaQuery.addEventListener("change", updateSpacing)

	measure()

	reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	if (containerEl.value) {
		resizeObserver = new ResizeObserver(() => measure())

		resizeObserver.observe(containerEl.value)

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]

				if (entry) {
					isVisible = entry.isIntersecting
				}
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

	runningAnimations.forEach((animation) => {
		animation.cancel()
	})

	resizeObserver?.disconnect()
	intersectionObserver?.disconnect()

	spacingMediaQuery?.removeEventListener("change", updateSpacing)
})
</script>

<style scoped>
.grid-beams {
	/* Couleur de base : thème "white" par défaut, comme avant */
	--beam-base: var(--color-gray-light, oklch(0.937 0 0));
	--beam-color: color-mix(
		in oklch,
		var(--beam-base) var(--beam-keep),
		black var(--beam-darken)
	);

	mask-image: radial-gradient(
		ellipse at center,
		black 0%,
		black 20%,
		rgb(0 0 0 / 0.75) 40%,
		rgb(0 0 0 / 0.4) 60%,
		rgb(0 0 0 / 0.12) 80%,
		transparent 95%
	);
	-webkit-mask-image: radial-gradient(
		ellipse at center,
		black 0%,
		black 20%,
		rgb(0 0 0 / 0.75) 40%,
		rgb(0 0 0 / 0.4) 60%,
		rgb(0 0 0 / 0.12) 80%,
		transparent 95%
	);
}

.grid-beams[data-theme="white"] {
	--beam-base: var(--color-gray-light, oklch(0.937 0 0));
}

.grid-beams[data-theme="black"] {
	--beam-base: var(--color-black-light, oklch(0.3043 0.0043 17.39));
}

.grid-beams[data-theme="lime"] {
	--beam-base: var(--color-lime-dark, oklch(0.6034 0.1497 123.94));
}

.grid-beams[data-theme="violet"] {
	--beam-base: var(--color-violet-light, oklch(0.7457 0.2614 283.1));
}

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
		var(--beam-color) 20%,
		var(--beam-color) 80%,
		transparent
	);
}
</style>
