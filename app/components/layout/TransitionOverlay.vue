<template>
	<div class="transition-overlay" :class="{ 'transition-overlay--active': active }">
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

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef")
const active = ref(false)
const transitionActive = usePageTransitionActive()

const DESKTOP_BREAKPOINT = 1024
const CELL_SIZE: Record<Breakpoint, number> = {
	mobile: 44,
	desktop: 72,
}
const COVER_DURATION = 780
const REVEAL_DURATION = 860

let engine: ReturnType<typeof createPixelWipeEngine> | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let activeColors: PixelWipeColors | null = null
let activeDirection: ResolvedPixelWipeDirection | null = null

function currentBreakpoint(): Breakpoint {
	return window.innerWidth >= DESKTOP_BREAKPOINT ? "desktop" : "mobile"
}

function themeColor(name: string) {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function resolveThemeColor(value: string | undefined, fallbackVar: string) {
	if (!value) return themeColor(fallbackVar)
	const trimmed = value.trim()
	if (trimmed.startsWith("--")) return themeColor(trimmed)
	const varMatch = trimmed.match(/^var\((--[\w-]+)\)$/)
	if (varMatch?.[1]) return themeColor(varMatch[1])
	return trimmed
}

function resolveColors(): PixelWipeColors {
	return {
		base: resolveThemeColor(props.baseColor, "--color-gray-light"),
		accent: resolveThemeColor(props.accentColor, "--color-lime"),
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

	activeColors = resolveColors()
	activeDirection = resolveDirection()

	await engine?.run({
		mode: "in",
		direction: activeDirection,
		colors: activeColors,
		duration: COVER_DURATION,
	})

	done()
}

async function reveal(done: () => void) {
	const colors = activeColors ?? resolveColors()
	const direction = activeDirection ?? resolveDirection()

	await engine?.run({
		mode: "out",
		direction,
		colors,
		duration: REVEAL_DURATION,
	})

	active.value = false
	transitionActive.value = false
	activeColors = null
	activeDirection = null
	done()
}

onMounted(() => {
	engine = createPixelWipeEngine({
		gsap: $gsap,
		getCanvas: () => canvasRef.value,
		getSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
		cellSize: () => CELL_SIZE[currentBreakpoint()],
	})
	engine.resize()
	window.addEventListener("resize", debouncedResize)
})

onUnmounted(() => {
	window.removeEventListener("resize", debouncedResize)
	if (resizeTimeout) clearTimeout(resizeTimeout)
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
}
</style>
