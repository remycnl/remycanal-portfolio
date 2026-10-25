<template>
	<div
		ref="rootRef"
		:style="{ '--sticker-size': `${lattice.stickerSize}px` }"
		class="pointer-events-none absolute inset-0 z-1 overflow-hidden"
		aria-hidden="true"
	>
		<img
			v-for="cell in lattice.cells"
			:key="cell.id"
			:src="cell.src"
			:style="{ left: `${cell.left}px`, top: `${cell.top}px` }"
			alt=""
			decoding="async"
			draggable="false"
			class="absolute size-(--sticker-size) object-contain opacity-0 select-none"
		/>
	</div>
</template>

<script setup lang="ts">
interface Props {
	/** Sticker image sources, cycled across the lattice. Four or more sources guarantee that no two neighbouring cells share a sticker. */
	srcs: readonly string[]
	/** Resting opacity of every sticker, from 0 to 1. Read at each pop. */
	opacity?: number
	/** Lattice spacing as a fraction of the container width. Read at each pop, never clamped. */
	cellRatio?: number
	/** Sticker box size as a fraction of the lattice spacing. Read at each pop. */
	stickerRatio?: number
}

interface StickerPatternHandle {
	/** Builds the lattice for the current container size, then plays the radial pop-in wave. */
	pop: () => Promise<void>
	/** Plays the converging depop wave, then unmounts every sticker. Resolves once the lattice is empty. */
	depop: () => Promise<void>
}

interface StickerCell {
	id: string
	src: string
	rotate: number
	left: number
	top: number
	/** Normalized distance (0 to 1) from the wave origin at the top center of the container. */
	wave: number
}

interface Lattice {
	cells: readonly StickerCell[]
	stickerSize: number
}

const props = withDefaults(defineProps<Props>(), {
	opacity: 0.3,
	cellRatio: 0.3,
	stickerRatio: 0.8,
})

const ROTATIONS = [-12, 8, -6, 14] as const
const HEX_COLUMN_RATIO = Math.sqrt(3) / 2
const ENTER_SCALE = 0.25
const ENTER_Y = 28
const ENTER_ROTATE = 25
const POP_FADE_DURATION = 0.25
const POP_DURATION = 0.6
const POP_SPREAD = 0.7
const DEPOP_DURATION = 0.28
const DEPOP_SPREAD = 0.3

const EMPTY_LATTICE: Lattice = { cells: [], stickerSize: 0 }

const rootRef = useTemplateRef<HTMLElement>("rootRef")
const lattice = shallowRef<Lattice>(EMPTY_LATTICE)

function getStickerEls(root: HTMLElement) {
	return Array.from(root.children) as HTMLImageElement[]
}

function buildLattice(
	width: number,
	height: number,
	srcs: readonly string[],
	cellRatio: number,
	stickerRatio: number
): Lattice {
	if (!srcs.length || width <= 0 || height <= 0 || cellRatio <= 0) return EMPTY_LATTICE

	const cellSize = width * cellRatio
	const stickerSize = Math.round(cellSize * stickerRatio)
	const columnStep = cellSize * HEX_COLUMN_RATIO
	const cols = Math.ceil(width / columnStep) + 2
	const rows = Math.ceil(height / cellSize) + 2
	const startX = (width - (cols - 1) * columnStep) / 2
	const startY = (height - (rows - 1) * cellSize) / 2
	const half = stickerSize / 2
	const originX = width / 2
	const maxDistance = Math.hypot(originX, height)
	const cells: StickerCell[] = []

	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			const src = srcs[(col + row * 2) % srcs.length]
			if (!src) continue

			const cx = startX + col * columnStep
			const cy = startY + (row - 0.5 * (col % 2)) * cellSize

			if (cx + half <= 0 || cx - half >= width) continue
			if (cy + half <= 0 || cy - half >= height) continue

			cells.push({
				id: `${col}-${row}`,
				src,
				rotate: ROTATIONS[(col + row) % ROTATIONS.length] ?? 0,
				left: Math.round(cx - half),
				top: Math.round(cy - half),
				wave: Math.min(1, Math.hypot(cx - originX, cy) / maxDistance),
			})
		}
	}

	return { cells, stickerSize }
}

const { useGsapContext } = useGsap()

let pop: StickerPatternHandle["pop"] = () => Promise.resolve()
let depop: StickerPatternHandle["depop"] = () => Promise.resolve()

defineExpose<StickerPatternHandle>({
	pop: () => pop(),
	depop: () => depop(),
})

useGsapContext(({ gsap }) => {
	const d = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.01 : 1

	let timeline: ReturnType<typeof gsap.timeline> | null = null
	let session = 0

	const cellAt = (index: number) => lattice.value.cells[index]
	const restRotation = (index: number) => cellAt(index)?.rotate ?? 0
	const popDelay = (index: number) => (cellAt(index)?.wave ?? 0) * POP_SPREAD * d
	const depopDelay = (index: number) =>
		(1 - (cellAt(index)?.wave ?? 0)) * DEPOP_SPREAD * d

	function setWillChange(els: HTMLElement[], value: string) {
		for (const el of els) el.style.willChange = value
	}

	pop = async () => {
		const root = rootRef.value
		if (!root) return

		const run = ++session
		timeline?.kill()

		if (lattice.value.cells.length) {
			lattice.value = EMPTY_LATTICE
			await nextTick()
		}

		lattice.value = buildLattice(
			root.clientWidth,
			root.clientHeight,
			props.srcs,
			props.cellRatio,
			props.stickerRatio
		)
		await nextTick()

		const els = getStickerEls(root)
		await Promise.all(els.map((el) => el.decode().catch(() => undefined)))

		if (run !== session || !els.length) return

		const restOpacity = gsap.utils.clamp(0, 1, props.opacity)

		gsap.set(els, {
			opacity: 0,
			scale: ENTER_SCALE,
			y: ENTER_Y,
			rotation: (index: number) => restRotation(index) - ENTER_ROTATE,
			transformOrigin: "50% 50%",
		})

		timeline = gsap
			.timeline({
				onStart: () => setWillChange(els, "transform, opacity"),
				onComplete: () => setWillChange(els, "auto"),
			})
			.to(
				els,
				{
					opacity: restOpacity,
					duration: POP_FADE_DURATION * d,
					ease: "power1.out",
					stagger: popDelay,
				},
				0
			)
			.to(
				els,
				{
					y: 0,
					scale: 1,
					rotation: restRotation,
					duration: POP_DURATION * d,
					ease: "elastic.out(1, 0.55)",
					stagger: popDelay,
				},
				0
			)
	}

	depop = () => {
		session++
		timeline?.kill()

		const root = rootRef.value
		const els = root ? getStickerEls(root) : []

		if (!els.length) {
			lattice.value = EMPTY_LATTICE
			return Promise.resolve()
		}

		return new Promise<void>((resolve) => {
			timeline = gsap
				.timeline({
					onStart: () => setWillChange(els, "transform, opacity"),
					onComplete: () => {
						lattice.value = EMPTY_LATTICE
						resolve()
					},
				})
				.to(
					els,
					{
						opacity: 0,
						scale: ENTER_SCALE,
						y: ENTER_Y,
						rotation: `-=${ENTER_ROTATE}`,
						duration: DEPOP_DURATION * d,
						ease: "power2.in",
						stagger: depopDelay,
					},
					0
				)
		})
	}

	return () => {
		session++
		timeline?.kill()
	}
}, rootRef)
</script>
