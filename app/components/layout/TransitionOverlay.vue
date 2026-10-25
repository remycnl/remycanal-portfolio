<template>
	<div
		ref="rootRef"
		class="transition-overlay"
		:class="{ 'transition-overlay--active': active }"
	>
		<canvas ref="canvasRef" class="transition-overlay__canvas" />
	</div>
</template>

<script setup lang="ts">
import type {
	Breakpoint,
	PixelWipeColors,
	ResolvedPixelWipeDirection,
	ResponsivePixelWipeDirection,
} from "@/types/pixel-wipe"
import { readThemeColor } from "@/utils/theme/readThemeColor"

defineOptions({ name: "TransitionOverlay" })

interface TransitionOverlayProps {
	/** Solid color the wave settles into. Accepts a literal color, a bare CSS var name (`--color-orange-500`), or `var(--...)`. Falls back to `--color-white` when omitted. */
	baseColor?: string
	/** Color used for the cell fill and outline during the sweep. Accepts a literal color, a bare CSS var name (`--color-orange-500`), or `var(--...)`. Falls back to `--color-lime` when omitted. */
	accentColor?: string
	/**
	 * Sweep direction for the grid wave. `auto` follows viewport: left-to-right on
	 * desktop, top-to-bottom on mobile. A single value (e.g. `right`) applies to
	 * every breakpoint; pass `{ mobile, desktop }` to use a different direction
	 * per breakpoint. Falls back to `auto` when omitted.
	 */
	direction?: ResponsivePixelWipeDirection
}

const props = defineProps<TransitionOverlayProps>()

const { $gsap } = useNuxtApp()

const rootRef = useTemplateRef<HTMLDivElement>("rootRef")
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef")
const active = ref(false)
const transitionActive = usePageTransitionActive()
const covered = usePageCovered()

const DESKTOP_BREAKPOINT = 1024
const CELL_SIZE: Record<Breakpoint, number> = {
	mobile: 44,
	desktop: 72,
}
const COVER_DURATION = 780
const REVEAL_DURATION = 860

/**
 * Plafond de pixels du canvas de la vague. Illimité = bords parfaitement nets.
 * Si la console montre une latence de présentation élevée (`presentLatency`), essaie
 * `2_500_000` : le GPU a beaucoup moins de pixels à gérer, les bords sont un peu plus doux.
 */
const MAX_CANVAS_PIXELS = Number.POSITIVE_INFINITY

let engine: ReturnType<typeof createPixelWipeEngine> | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let activeColors: PixelWipeColors | null = null
let activeDirection: ResolvedPixelWipeDirection | null = null
let stopJankWatch: (() => void) | null = null

/* ───────────────────────── Diagnostic de jank (dev uniquement) ───────────────────────── */

type Phase =
	| "idle"
	| "cover"
	| "cover-paint"
	| "page-swap"
	| "stable-wait"
	| "reveal"
	| "reveal-paint"

interface LoafScript {
	invoker?: string
	invokerType?: string
	sourceURL?: string
	sourceFunctionName?: string
	duration: number
	forcedStyleAndLayoutDuration?: number
}

interface LoafEntry extends PerformanceEntry {
	renderStart?: number
	styleAndLayoutStart?: number
	paintTime?: number
	presentationTime?: number
	blockingDuration?: number
	scripts?: LoafScript[]
}

let phase: Phase = "idle"

const ms = (value: number) => Math.round(value)

function summarize(entry: LoafEntry) {
	const {
		startTime,
		duration,
		renderStart,
		styleAndLayoutStart,
		paintTime,
		presentationTime,
	} = entry

	return {
		phase,
		total: ms(duration),
		// Temps avant le début du rendu : scripts + attente. Sans script, le thread attendait.
		beforeRender: renderStart ? ms(renderStart - startTime) : null,
		// Callbacks requestAnimationFrame (dont le dessin de la vague).
		raf:
			renderStart && styleAndLayoutStart ? ms(styleAndLayoutStart - renderStart) : null,
		styleLayout:
			styleAndLayoutStart && paintTime ? ms(paintTime - styleAndLayoutStart) : null,
		// Du paint à l'affichage réel : GPU / compositeur. Sain : < 50 ms.
		presentLatency:
			paintTime && presentationTime ? ms(presentationTime - paintTime) : null,
		scripts: (entry.scripts ?? []).map((script) => {
			const source = `${script.sourceURL ?? ""}${
				script.sourceFunctionName ? `#${script.sourceFunctionName}` : ""
			}`
			return `${script.invokerType ?? ""} ${script.invoker ?? ""} ${source} ${ms(
				script.duration
			)}ms (layout forcé ${ms(script.forcedStyleAndLayoutDuration ?? 0)}ms)`.trim()
		}),
	}
}

/**
 * Journalise les frames longues pendant la transition, sous forme d'une ligne JSON à copier.
 * Tout est aussi accumulé dans `window.__transitionJank` : on peut donc fermer les DevTools
 * (ils faussent les mesures), faire la transition, puis les rouvrir et lire le tableau.
 */
function watchJank(): () => void {
	if (!import.meta.dev || typeof PerformanceObserver === "undefined") return () => {}

	const type = PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")
		? "long-animation-frame"
		: "longtask"

	const store = ((
		window as unknown as { __transitionJank?: unknown[] }
	).__transitionJank ??= [])

	try {
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const row = summarize(entry as LoafEntry)
				store.push(row)
				console.warn(`[transition] ${JSON.stringify(row)}`)
			}
		})
		observer.observe({ type })
		return () => observer.disconnect()
	} catch {
		return () => {}
	}
}

/* ─────────────────────────────────────────────────────────────────────────────────────── */

function currentBreakpoint(): Breakpoint {
	return window.innerWidth >= DESKTOP_BREAKPOINT ? "desktop" : "mobile"
}

function resolveColors(): PixelWipeColors {
	return {
		base: readThemeColor(props.baseColor, "oklch(0.937 0 0)"),
		accent: readThemeColor(props.accentColor, "oklch(0.928 0.2202 125)"),
	}
}

function resolveDirection(): ResolvedPixelWipeDirection {
	const direction = props.direction ?? "auto"
	if (typeof direction === "object") return direction[currentBreakpoint()]
	if (direction !== "auto") return direction
	return currentBreakpoint() === "desktop" ? "left" : "top"
}

function debouncedResize() {
	if (resizeTimeout) clearTimeout(resizeTimeout)
	resizeTimeout = setTimeout(() => engine?.resize(), 80)
}

async function cover(done: () => void) {
	active.value = true
	transitionActive.value = true
	stopJankWatch?.()
	stopJankWatch = watchJank()

	activeColors = resolveColors()
	activeDirection = resolveDirection()

	phase = "cover"
	await engine?.run({
		mode: "in",
		direction: activeDirection,
		colors: activeColors,
		duration: COVER_DURATION,
	})

	// On laisse le navigateur PRÉSENTER la dernière frame (écran 100 % couvert) avant que la
	// page change : sinon le montage de la nouvelle page bloque le thread dans la même tâche
	// et l'écran reste figé sur une vague incomplète pendant tout le montage.
	phase = "cover-paint"
	await waitForPaint()

	// The screen is fully covered: what must change out of sight changes now.
	phase = "page-swap"
	covered.value = true
	done()
}

async function reveal(done: () => void) {
	const colors = activeColors ?? resolveColors()
	const direction = activeDirection ?? resolveDirection()

	// Écran toujours couvert : la nouvelle page finit de se monter (layout, images visibles
	// décodées, tâches différées) pour que la vague démarre sur un thread principal calme.
	phase = "stable-wait"
	await waitForStablePage()

	// The screen starts to uncover: nothing may change in plain sight from here.
	covered.value = false

	phase = "reveal"
	await engine?.run({
		mode: "out",
		direction,
		colors,
		duration: REVEAL_DURATION,
	})

	// Dernière frame présentée avant de libérer les intros de page (travail lourd).
	phase = "reveal-paint"
	await waitForPaint()

	active.value = false
	transitionActive.value = false
	activeColors = null
	activeDirection = null
	phase = "idle"
	stopJankWatch?.()
	stopJankWatch = null
	done()
}

onMounted(() => {
	engine = createPixelWipeEngine({
		gsap: $gsap,
		getCanvas: () => canvasRef.value,
		// Taille réelle de l'overlay (fixed inset-0), pas window.innerWidth/innerHeight :
		// évite le décalage avec la barre d'URL mobile ou une scrollbar.
		getSize: () => {
			const rect = rootRef.value?.getBoundingClientRect()
			return { width: rect?.width ?? 0, height: rect?.height ?? 0 }
		},
		cellSize: () => CELL_SIZE[currentBreakpoint()],
		maxPixels: MAX_CANVAS_PIXELS,
	})
	engine.resize()
	window.addEventListener("resize", debouncedResize)
})

onUnmounted(() => {
	window.removeEventListener("resize", debouncedResize)
	if (resizeTimeout) clearTimeout(resizeTimeout)
	stopJankWatch?.()
	engine?.destroy()
})

defineExpose({ cover, reveal })
</script>

<style scoped>
.transition-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	pointer-events: none;
}
.transition-overlay--active {
	pointer-events: auto;
}
.transition-overlay__canvas {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
}
</style>
