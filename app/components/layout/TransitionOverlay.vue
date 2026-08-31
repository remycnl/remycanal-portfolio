<template>
	<div class="transition-overlay" :class="{ 'transition-overlay--active': active }">
		<canvas ref="canvasRef" class="transition-overlay__canvas" />
	</div>
</template>

<script setup lang="ts">
import type {
	Breakpoint,
	ResponsiveSweepDirection,
	SweepDirection,
} from "@/types/transition-overlay"

defineOptions({ name: "TransitionOverlay" })

type GridCell = { x: number; y: number; w: number; h: number; t: number }
type EaseFn = (progress: number) => number
type OverlayColors = { base: string; accent: string }
type ResolvedDirection = Exclude<SweepDirection, "auto">

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
	direction?: ResponsiveSweepDirection
}

const props = defineProps<TransitionOverlayProps>()

const { $gsap } = useNuxtApp()

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef")
const active = ref(false)
const transitionActive = usePageTransitionActive()

// Config -----------------------------------------------------------------
const DESKTOP_BREAKPOINT = 1024
const CELL_SIZE: Record<Breakpoint, number> = {
	mobile: 44,
	desktop: 72,
}
const LEAD = 0.18
const SPREAD = 0.5
const STROKE_INSET = 1
const COVER_DURATION = 780
const REVEAL_DURATION = 860

let ctx: CanvasRenderingContext2D | null = null
let cells: GridCell[] = []
let ease: EaseFn | null = null

let isCovered = false
let lastFillColor = "#ffffff"

let activeColors: OverlayColors | null = null
let activeDirection: ResolvedDirection | null = null
let activeCellSize = 0

let tickerCb: ((time: number) => void) | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let lastW = 0
let lastH = 0

// Helpers ------------------------------------------------------------------
const themeColor = (name: string) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function currentBreakpoint(): Breakpoint {
	return window.innerWidth >= DESKTOP_BREAKPOINT ? "desktop" : "mobile"
}

function resolveCellSize() {
	return CELL_SIZE[currentBreakpoint()]
}

function resolveThemeColor(value: string | undefined, fallbackVar: string) {
	if (!value) return themeColor(fallbackVar)
	const trimmed = value.trim()
	if (trimmed.startsWith("--")) return themeColor(trimmed)
	const varMatch = trimmed.match(/^var\((--[\w-]+)\)$/)
	if (varMatch?.[1]) return themeColor(varMatch[1])
	return trimmed
}

function resolveColors(): OverlayColors {
	return {
		base: resolveThemeColor(props.baseColor, "--color-gray-light"),
		accent: resolveThemeColor(props.accentColor, "--color-lime"),
	}
}

function resolveDirection(): ResolvedDirection {
	const direction = props.direction ?? "auto"
	if (typeof direction === "object") return direction[currentBreakpoint()]
	if (direction !== "auto") return direction
	return currentBreakpoint() === "desktop" ? "left" : "top"
}

function axisNormFor(
	direction: ResolvedDirection,
	col: number,
	row: number,
	cols: number,
	rows: number
) {
	switch (direction) {
		case "left":
			return col / Math.max(cols - 1, 1)
		case "right":
			return 1 - col / Math.max(cols - 1, 1)
		case "top":
			return row / Math.max(rows - 1, 1)
		case "bottom":
			return 1 - row / Math.max(rows - 1, 1)
	}
}

// Canvas sizing --------------------------------------------------------------
function resizeCanvas() {
	const canvas = canvasRef.value
	if (!canvas) return

	const w = window.innerWidth
	const h = window.innerHeight
	if (w === lastW && h === lastH) return
	lastW = w
	lastH = h

	const dpr = Math.min(window.devicePixelRatio || 1, 2)
	canvas.width = w * dpr
	canvas.height = h * dpr
	canvas.style.width = `${w}px`
	canvas.style.height = `${h}px`
	ctx = canvas.getContext("2d")
	ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)

	if (isCovered && ctx) {
		ctx.fillStyle = lastFillColor
		ctx.fillRect(0, 0, w, h)
	}
}

function debouncedResize() {
	if (resizeTimeout) clearTimeout(resizeTimeout)
	resizeTimeout = setTimeout(resizeCanvas, 80)
}

// Grid + wave animation ------------------------------------------------------
function buildGrid(direction: ResolvedDirection, cellSize: number) {
	const cols = Math.ceil(window.innerWidth / cellSize)
	const rows = Math.ceil(window.innerHeight / cellSize)
	const list: GridCell[] = []
	const maxSpark = 1 - LEAD

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const axisNorm = axisNormFor(direction, col, row, cols, rows)
			const base = Math.min(axisNorm * (1 - SPREAD) + Math.random() * SPREAD, 1)
			list.push({
				x: col * cellSize,
				y: row * cellSize,
				w: cellSize,
				h: cellSize,
				t: base * maxSpark,
			})
		}
	}
	list.sort((a, b) => a.t - b.t)
	cells = list
}

function stopTicker() {
	if (tickerCb) {
		$gsap.ticker.remove(tickerCb)
		tickerCb = null
	}
}

function fillFullCanvas(
	mode: "cover" | "reveal",
	color: string,
	c2d: CanvasRenderingContext2D
) {
	if (mode === "cover") {
		c2d.fillStyle = color
		c2d.fillRect(0, 0, window.innerWidth, window.innerHeight)
	} else {
		c2d.clearRect(0, 0, window.innerWidth, window.innerHeight)
	}
}

function runWave(
	mode: "cover" | "reveal",
	duration: number,
	colors: OverlayColors,
	direction: ResolvedDirection,
	cellSize: number,
	onDone: () => void
) {
	const c2d = ctx
	if (!c2d) return onDone()

	stopTicker()

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
	const { base, accent } = colors
	lastFillColor = base

	buildGrid(direction, cellSize)

	if (reduceMotion) {
		fillFullCanvas(mode, base, c2d)
		isCovered = mode === "cover"
		return onDone()
	}

	const start = $gsap.ticker.time
	let sparkPointer = 0
	let settlePointer = 0

	tickerCb = (time: number) => {
		const rawProgress = Math.min((time - start) / (duration / 1000), 1)
		const progress = ease ? ease(rawProgress) : rawProgress

		c2d.beginPath()
		let sparked = false
		const strokeStart = sparkPointer
		while (sparkPointer < cells.length) {
			const cell = cells[sparkPointer]
			if (!cell || cell.t > progress) break
			c2d.rect(cell.x, cell.y, cell.w, cell.h)
			sparkPointer++
			sparked = true
		}
		if (sparked) {
			c2d.save()
			c2d.globalAlpha = 0.4
			c2d.fillStyle = accent
			c2d.fill()
			c2d.restore()

			c2d.beginPath()
			for (let i = strokeStart; i < sparkPointer; i++) {
				const cell = cells[i]
				if (!cell) continue
				c2d.rect(
					cell.x + STROKE_INSET,
					cell.y + STROKE_INSET,
					cell.w - STROKE_INSET * 2,
					cell.h - STROKE_INSET * 2
				)
			}
			c2d.save()
			c2d.globalAlpha = 0.9
			c2d.lineWidth = 1.5
			c2d.strokeStyle = accent
			c2d.stroke()
			c2d.restore()
		}

		c2d.beginPath()
		let settled = false
		while (settlePointer < cells.length) {
			const cell = cells[settlePointer]
			if (!cell || cell.t + LEAD > progress) break
			c2d.rect(cell.x, cell.y, cell.w, cell.h)
			settlePointer++
			settled = true
		}
		if (settled) {
			if (mode === "cover") {
				c2d.fillStyle = base
				c2d.fill()
			} else {
				c2d.save()
				c2d.globalCompositeOperation = "destination-out"
				c2d.fillStyle = "#000"
				c2d.fill()
				c2d.restore()
			}
		}

		if (rawProgress >= 1) {
			fillFullCanvas(mode, base, c2d)
			isCovered = mode === "cover"
			stopTicker()
			onDone()
		}
	}

	$gsap.ticker.add(tickerCb)
}

// Public API -----------------------------------------------------------------
function cover(done: () => void) {
	active.value = true
	transitionActive.value = true

	activeColors = resolveColors()
	activeDirection = resolveDirection()
	activeCellSize = resolveCellSize()

	runWave("cover", COVER_DURATION, activeColors, activeDirection, activeCellSize, done)
}

function reveal(done: () => void) {
	const colors = activeColors ?? resolveColors()
	const direction = activeDirection ?? resolveDirection()
	const cellSize = activeCellSize || resolveCellSize()

	runWave("reveal", REVEAL_DURATION, colors, direction, cellSize, () => {
		active.value = false
		transitionActive.value = false
		activeColors = null
		activeDirection = null
		activeCellSize = 0
		done()
	})
}

onMounted(() => {
	ease = $gsap.parseEase("sine.inOut")
	resizeCanvas()
	window.addEventListener("resize", debouncedResize)
})
onUnmounted(() => {
	window.removeEventListener("resize", debouncedResize)
	if (resizeTimeout) clearTimeout(resizeTimeout)
	stopTicker()
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
}
</style>
