<template>
	<div
		ref="rootRef"
		:style="{ '--sticker-size': `${lattice.stickerSize}px` }"
		class="pointer-events-none absolute inset-0 z-1 overflow-hidden"
		aria-hidden="true"
	>
		<!-- The span is the parallax layer, the img keeps the pop-in transforms. -->
		<span
			v-for="cell in lattice.cells"
			:key="cell.id"
			:style="{ left: `${cell.left}px`, top: `${cell.top}px` }"
			class="absolute block size-(--sticker-size)"
		>
			<img
				:src="cell.src"
				alt=""
				decoding="async"
				draggable="false"
				class="size-full object-contain opacity-0 select-none"
			/>
		</span>
	</div>
</template>

<script setup lang="ts">
interface Props {
	/** Sticker image sources, cycled across the lattice. Four or more sources guarantee that no two neighbouring cells share a sticker. */
	srcs: readonly string[]
	/** Resting opacity of every sticker, from 0 to 1. Pass `false` to turn opacity off: stickers stay fully opaque and pop in and out with scale only, no fade. Read at each pop and depop. */
	opacity?: number | false
	/** Lattice spacing as a fraction of the container width. Read at each pop, never clamped. */
	cellRatio?: number
	/** Sticker box size as a fraction of the lattice spacing. Read at each pop. */
	stickerRatio?: number
	/** Scale of the whole pattern, stickers and spacing together. 1 keeps the container-relative sizing, below 1 gives smaller and denser stickers. Read at each pop. */
	scale?: number
	/** Intensity of the pointer parallax, from 0 (off) upwards. Only runs on desktop with a fine pointer. */
	parallax?: number
	/** Holds `pop()` until the app is revealed (loader) and any page transition is over, so the wave plays on a visible page. Off by default. Read at each pop. */
	waitForReady?: boolean
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

interface Mover {
	el: HTMLElement
	/** Sticker center, in container coordinates. */
	cx: number
	cy: number
	/** Layer depth: the higher, the further the sticker drifts and the quicker it follows. */
	depth: number
	/** Spring frequency (rad/s) and damping ratio, slightly different for every sticker. */
	omega: number
	zeta: number
	/** Current offset and velocity. */
	x: number
	y: number
	r: number
	vx: number
	vy: number
	vr: number
}

const props = withDefaults(defineProps<Props>(), {
	opacity: 0.3,
	cellRatio: 0.3,
	stickerRatio: 0.8,
	scale: 1,
	parallax: 1,
	waitForReady: false,
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

/** Max counter-drift of a sticker at depth 1 across the container, as a fraction of the amplitude unit. */
const PARALLAX_DRIFT = 0.075
/** Max push away from the pointer at depth 1, as a fraction of the amplitude unit. */
const PUSH_DISTANCE = 0.14
/** Max tilt (deg) next to the pointer at depth 1. */
const PUSH_TILT = 6
/** Max tilt (deg) at depth 1 following the pointer across the container. */
const DRIFT_TILT = 1.5

const EMPTY_LATTICE: Lattice = { cells: [], stickerSize: 0 }

const rootRef = useTemplateRef<HTMLElement>("rootRef")
const lattice = shallowRef<Lattice>(EMPTY_LATTICE)

function getLayerEls(root: HTMLElement) {
	return Array.from(root.children) as HTMLElement[]
}

function getStickerEls(root: HTMLElement) {
	return Array.from(root.querySelectorAll("img"))
}

function buildLattice(
	width: number,
	height: number,
	srcs: readonly string[],
	cellRatio: number,
	stickerRatio: number,
	scale: number
): Lattice {
	if (!srcs.length || width <= 0 || height <= 0 || cellRatio <= 0 || scale <= 0)
		return EMPTY_LATTICE

	const cellSize = width * cellRatio * scale
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
const isDesktopPointer = useDesktopPointer()

/** General wait: the app reveal first (loader), then any page transition still running. */
async function waitForPageReady() {
	await waitForAppReady()
	await waitForPageTransition()
}

let pop: StickerPatternHandle["pop"] = () => Promise.resolve()
let depop: StickerPatternHandle["depop"] = () => Promise.resolve()

defineExpose<StickerPatternHandle>({
	pop: () => pop(),
	depop: () => depop(),
})

useGsapContext(({ gsap }) => {
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
	const d = reduceMotion ? 0.01 : 1

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

	/* ---------------------------------- Parallax ---------------------------------- */
	/*
	 * Every sticker is a small damped spring chasing a target offset. The target mixes
	 * a global drift (opposite to the pointer, deeper layers move more) and a soft
	 * gaussian push away from the pointer. The pointer itself is smoothed, and the whole
	 * effect eases in and out, so nothing ever snaps. The ticker sleeps once settled.
	 */

	const pointer = { x: 0, y: 0, active: false }
	let movers: Mover[] = []
	let parallaxOn = false
	let awake = false
	let wasInside = false
	let presence = 0
	let smoothX = 0
	let smoothY = 0

	function buildMovers(root: HTMLElement) {
		const { cells, stickerSize } = lattice.value
		const half = stickerSize / 2

		movers = getLayerEls(root).map((el, index) => {
			const cell = cells[index]
			// Deterministic pseudo-random depth in [0.5, 1.31], so neighbours never share a layer.
			const depth = 0.5 + ((index * 7) % 10) * 0.09

			return {
				el,
				cx: (cell?.left ?? 0) + half,
				cy: (cell?.top ?? 0) + half,
				depth,
				omega: 6 + depth * 3,
				zeta: 0.7 + ((index * 3) % 5) * 0.05,
				x: 0,
				y: 0,
				r: 0,
				vx: 0,
				vy: 0,
				vr: 0,
			}
		})
	}

	function resetMovers() {
		for (const mover of movers) {
			mover.x = mover.y = mover.r = 0
			mover.vx = mover.vy = mover.vr = 0
			mover.el.style.transform = ""
			mover.el.style.willChange = "auto"
		}
		presence = 0
		wasInside = false
	}

	function isInside(rect: DOMRect) {
		return (
			pointer.active &&
			pointer.x >= rect.left &&
			pointer.x <= rect.right &&
			pointer.y >= rect.top &&
			pointer.y <= rect.bottom
		)
	}

	function wake() {
		if (awake || !parallaxOn || !movers.length) return
		awake = true
		for (const mover of movers) mover.el.style.willChange = "transform"
		gsap.ticker.add(tick)
	}

	function sleep() {
		if (!awake) return
		awake = false
		gsap.ticker.remove(tick)
	}

	/** Wakes the ticker only when the pointer is, or just was, over the pattern. */
	function maybeWake() {
		if (awake || !parallaxOn || !movers.length) return
		const root = rootRef.value
		if (!root) return
		if (presence > 0.001 || isInside(root.getBoundingClientRect())) wake()
	}

	function clearMovers() {
		sleep()
		resetMovers()
		movers = []
	}

	function tick(_time: number, deltaTime: number) {
		const root = rootRef.value
		if (!root || !movers.length) {
			sleep()
			return
		}

		const dt = Math.min(deltaTime, 50) / 1000
		const strength = Math.max(0, props.parallax)
		const rect = root.getBoundingClientRect()
		const inside = strength > 0 && isInside(rect)
		const goal = inside ? 1 : 0

		presence += (goal - presence) * (1 - Math.exp(-dt * 4))
		let activity = Math.abs(goal - presence)

		if (inside) {
			const targetX = pointer.x - rect.left
			const targetY = pointer.y - rect.top

			if (wasInside) {
				const follow = 1 - Math.exp(-dt * 9)
				smoothX += (targetX - smoothX) * follow
				smoothY += (targetY - smoothY) * follow
			} else {
				smoothX = targetX
				smoothY = targetY
			}
			activity += Math.abs(targetX - smoothX) + Math.abs(targetY - smoothY)
		}
		wasInside = inside

		const size = lattice.value.stickerSize
		// Amplitudes grow with the stickers but keep a floor, so small stickers still feel alive.
		const unit = 60 + size * 0.5
		const sigma = 60 + size
		const soft = sigma * 0.25
		const nx = rect.width ? (smoothX / rect.width) * 2 - 1 : 0
		const ny = rect.height ? (smoothY / rect.height) * 2 - 1 : 0
		const lift = presence * strength

		for (const mover of movers) {
			const dx = mover.cx - smoothX
			const dy = mover.cy - smoothY
			const dist = Math.hypot(dx, dy)
			const near = Math.exp(-((dist / sigma) ** 2))
			const drift = unit * PARALLAX_DRIFT * mover.depth
			const push = (unit * PUSH_DISTANCE * mover.depth * near) / (dist + soft)
			const side = Math.max(-1, Math.min(1, dx / sigma))

			const targetX = lift * (-nx * drift + dx * push)
			const targetY = lift * (-ny * drift + dy * push)
			const targetR =
				lift * (side * near * PUSH_TILT * mover.depth - nx * DRIFT_TILT * mover.depth)

			const stiffness = mover.omega * mover.omega
			const damping = 2 * mover.zeta * mover.omega

			mover.vx += (stiffness * (targetX - mover.x) - damping * mover.vx) * dt
			mover.vy += (stiffness * (targetY - mover.y) - damping * mover.vy) * dt
			mover.vr += (stiffness * (targetR - mover.r) - damping * mover.vr) * dt
			mover.x += mover.vx * dt
			mover.y += mover.vy * dt
			mover.r += mover.vr * dt

			activity +=
				Math.abs(targetX - mover.x) +
				Math.abs(targetY - mover.y) +
				Math.abs(mover.vx) * 0.1 +
				Math.abs(mover.vy) * 0.1 +
				Math.abs(targetR - mover.r) * 0.1 +
				Math.abs(mover.vr) * 0.02

			mover.el.style.transform = `translate3d(${mover.x.toFixed(2)}px, ${mover.y.toFixed(2)}px, 0) rotate(${mover.r.toFixed(2)}deg)`
		}

		if (activity / movers.length < 0.01) {
			if (!inside && presence < 0.01) resetMovers()
			sleep()
		}
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType === "touch") return
		pointer.x = event.clientX
		pointer.y = event.clientY
		pointer.active = true
		maybeWake()
	}

	function onPointerOut() {
		pointer.active = false
		maybeWake()
	}

	function onScroll() {
		if (pointer.active) maybeWake()
	}

	function syncParallax() {
		const next = !reduceMotion && isDesktopPointer.value
		if (next === parallaxOn) return
		parallaxOn = next

		if (next) {
			window.addEventListener("pointermove", onPointerMove, { passive: true })
			window.addEventListener("scroll", onScroll, { passive: true })
			window.addEventListener("blur", onPointerOut)
			document.documentElement.addEventListener("pointerleave", onPointerOut)

			const root = rootRef.value
			if (root && lattice.value.cells.length && !movers.length) buildMovers(root)
			return
		}

		window.removeEventListener("pointermove", onPointerMove)
		window.removeEventListener("scroll", onScroll)
		window.removeEventListener("blur", onPointerOut)
		document.documentElement.removeEventListener("pointerleave", onPointerOut)
		pointer.active = false
		clearMovers()
	}

	const stopWatchingPointer = watch(isDesktopPointer, syncParallax)
	syncParallax()

	/* ------------------------------------ Waves ----------------------------------- */

	pop = async () => {
		if (!rootRef.value) return

		const run = ++session

		if (props.waitForReady) {
			await waitForPageReady()
			// A newer pop / depop, or an unmount, took over while waiting.
			if (run !== session) return
		}

		const root = rootRef.value
		if (!root) return

		timeline?.kill()
		clearMovers()

		if (lattice.value.cells.length) {
			lattice.value = EMPTY_LATTICE
			await nextTick()
		}

		lattice.value = buildLattice(
			root.clientWidth,
			root.clientHeight,
			props.srcs,
			props.cellRatio,
			props.stickerRatio,
			props.scale
		)
		await nextTick()

		const els = getStickerEls(root)
		await Promise.all(els.map((el) => el.decode().catch(() => undefined)))

		if (run !== session || !els.length) return

		if (parallaxOn) buildMovers(root)

		const fade = props.opacity !== false
		const restOpacity =
			typeof props.opacity === "number" ? gsap.utils.clamp(0, 1, props.opacity) : 1

		gsap.set(els, {
			// Without fade the stickers still start hidden (class) and are shown here, so they grow from nothing.
			opacity: fade ? 0 : 1,
			scale: fade ? ENTER_SCALE : 0,
			y: ENTER_Y,
			rotation: (index: number) => restRotation(index) - ENTER_ROTATE,
			transformOrigin: "50% 50%",
		})

		timeline = gsap.timeline({
			onStart: () => setWillChange(els, "transform, opacity"),
			onComplete: () => setWillChange(els, "auto"),
		})

		if (fade) {
			timeline.to(
				els,
				{
					opacity: restOpacity,
					duration: POP_FADE_DURATION * d,
					ease: "power1.out",
					stagger: popDelay,
				},
				0
			)
		}

		timeline.to(
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
		clearMovers()

		const root = rootRef.value
		const els = root ? getStickerEls(root) : []

		if (!els.length) {
			lattice.value = EMPTY_LATTICE
			return Promise.resolve()
		}

		const fade = props.opacity !== false

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
						...(fade ? { opacity: 0 } : {}),
						scale: fade ? ENTER_SCALE : 0,
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
		clearMovers()

		stopWatchingPointer()
		window.removeEventListener("pointermove", onPointerMove)
		window.removeEventListener("scroll", onScroll)
		window.removeEventListener("blur", onPointerOut)
		document.documentElement.removeEventListener("pointerleave", onPointerOut)
	}
}, rootRef)
</script>
