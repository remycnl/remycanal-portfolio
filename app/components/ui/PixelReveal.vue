<template>
	<canvas ref="canvasRef" class="ui-pixel-reveal" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { PixelWipeColors, ResolvedPixelWipeDirection } from "@/types/pixel-wipe"
import { readThemeColor } from "@/utils/theme/readThemeColor"

interface Props {
	active: boolean
	direction?: ResolvedPixelWipeDirection
	baseColor?: string
	accentColor?: string
	cellSize?: number
	inDuration?: number
	outDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
	direction: "corners",
	baseColor: "--color-violet",
	accentColor: "--color-gray-light",
	inDuration: 620,
	outDuration: 420,
})

const emit = defineEmits<{ opened: []; closed: [] }>()

const { $gsap } = useNuxtApp()
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef")

let engine: ReturnType<typeof createPixelWipeEngine> | null = null
let resizeFrame: number | null = null
let stopWatch: (() => void) | null = null

function resolveColors(): PixelWipeColors {
	return {
		base: readThemeColor(props.baseColor, "oklch(0.5 0.2 290)"),
		accent: readThemeColor(props.accentColor, "oklch(0.8 0 0)"),
	}
}

function cellSizeFor() {
	if (props.cellSize) return props.cellSize
	const shortSide = Math.min(window.innerWidth, window.innerHeight)
	return Math.max(18, Math.min(48, Math.round(shortSide / 16)))
}

async function playIn() {
	await engine?.run({
		mode: "in",
		direction: props.direction,
		colors: resolveColors(),
		duration: props.inDuration,
	})
	// Le pop des liens et des stickers (travail lourd) démarre sur `opened` :
	// on laisse d'abord présenter la dernière frame de la vague.
	await waitForPaint(1)
	emit("opened")
}

async function playOut() {
	await engine?.run({
		mode: "out",
		direction: props.direction,
		colors: resolveColors(),
		duration: props.outDuration,
	})
	await waitForPaint(1)
	emit("closed")
}

function scheduleResize() {
	if (resizeFrame !== null) return
	resizeFrame = requestAnimationFrame(() => {
		resizeFrame = null
		engine?.resize()
	})
}

onMounted(() => {
	engine = createPixelWipeEngine({
		gsap: $gsap,
		getCanvas: () => canvasRef.value,
		// Taille réelle du canvas (100 % de son conteneur), pas celle de la fenêtre :
		// le buffer reste ainsi aligné sur les pixels physiques réellement affichés.
		getSize: () => {
			const rect = canvasRef.value?.getBoundingClientRect()
			return { width: rect?.width ?? 0, height: rect?.height ?? 0 }
		},
		cellSize: () => cellSizeFor(),
	})
	engine.resize()

	window.addEventListener("resize", scheduleResize, { passive: true })
	window.visualViewport?.addEventListener("resize", scheduleResize, { passive: true })

	stopWatch = watch(
		() => props.active,
		(isActive) => (isActive ? playIn() : playOut())
	)

	if (props.active) playIn()
})

onUnmounted(() => {
	stopWatch?.()
	window.removeEventListener("resize", scheduleResize)
	window.visualViewport?.removeEventListener("resize", scheduleResize)
	if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
	engine?.destroy()
})
</script>

<style scoped>
.ui-pixel-reveal {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	pointer-events: none;
	display: block;
	contain: strict;
}
</style>
