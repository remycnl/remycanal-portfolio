<template>
	<canvas ref="canvasRef" class="ui-pixel-reveal" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { PixelWipeColors, ResolvedPixelWipeDirection } from "@/types/pixel-wipe"

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

function themeColor(name: string) {
	if (!name.startsWith("--")) return name
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function resolveColors(): PixelWipeColors {
	return {
		base: themeColor(props.baseColor),
		accent: themeColor(props.accentColor),
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
	emit("opened")
}

async function playOut() {
	await engine?.run({
		mode: "out",
		direction: props.direction,
		colors: resolveColors(),
		duration: props.outDuration,
	})
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
		getSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
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
