<script setup lang="ts">
import type { ViewfinderBackground, ViewfinderTheme } from "@/composables/useViewfinder"

const { theme = "lime", background = "white" } = defineProps<{
	theme?: ViewfinderTheme
	background?: ViewfinderBackground
}>()

const CURSOR_SIZE = 44
const PADDING = 20
const CORNER_REST = 10
const CORNER_HOVER = 18
const CORNER_THICKNESS = 2
const CROSS_SIZE = 8
const CROSS_THICKNESS = 2
const PRESS_REST = 3
const PRESS_HOVER = 6
const POOL_SIZE = 3
const HOVER_MARGIN = 6
const MOVE_GRACE = 120
const COORD_GAP = 12
const COORD_EDGE = 12
const COORD_HEIGHT = 10

const CORNERS = [
	{ right: false, bottom: false },
	{ right: true, bottom: false },
	{ right: false, bottom: true },
	{ right: true, bottom: true },
]

const themes: Record<ViewfinderTheme, { bg: string; text: string }> = {
	lime: { bg: "bg-lime", text: "text-black" },
	violet: { bg: "bg-violet", text: "text-white" },
}

const tones: Record<ViewfinderBackground, { color: string; opacity: number }> = {
	white: { color: "var(--color-gray-dark)", opacity: 0.25 },
	black: { color: "var(--color-black-light)", opacity: 1 },
}

const coordTones: Record<ViewfinderBackground, { color: string; opacity: number }> = {
	white: { color: "var(--color-gray-dark)", opacity: 0.8 },
	black: { color: "var(--color-gray-dark)", opacity: 1 },
}

const ui = computed(() => themes[theme])
const lineStyle = computed(() => ({
	background: tones[background].color,
	opacity: tones[background].opacity,
}))
const coordStyle = computed(() => ({
	color: coordTones[background].color,
	opacity: coordTones[background].opacity,
}))

const { target, release } = useViewfinder()
const { gsap } = useGsap()

const rootRef = useTemplateRef<HTMLElement>("rootRef")
const hLineRef = useTemplateRef<HTMLElement>("hLineRef")
const vLineRef = useTemplateRef<HTMLElement>("vLineRef")
const cornerRefs = useTemplateRef<HTMLElement[]>("cornerRefs")
const crossRef = useTemplateRef<HTMLElement>("crossRef")
const coordRef = useTemplateRef<HTMLElement>("coordRef")
const badgePosRefs = useTemplateRef<HTMLElement[]>("badgePosRefs")

interface BadgeSlot {
	badge: HTMLElement
	setX: (value: number) => void
	setY: (value: number) => void
	/** Card à laquelle ce badge est collé */
	el: HTMLElement | null
	/** Élément mesuré pour positionner ce badge, par défaut `el` */
	bounds: HTMLElement | null
	/** Seule animation en cours sur ce badge */
	tween: ReturnType<typeof gsap.to> | null
	busy: boolean
	age: number
}

interface CornerSlot {
	right: boolean
	bottom: boolean
	setX: (value: number) => void
	setY: (value: number) => void
	setScaleH: (value: number) => void
	setScaleV: (value: number) => void
}

let ctx: ReturnType<typeof gsap.context> | undefined
let cleanup: (() => void) | undefined

onMounted(async () => {
	await nextTick()

	const rootEl = rootRef.value
	const hLineEl = hLineRef.value
	const vLineEl = vLineRef.value
	const cornerEls = cornerRefs.value
	const crossEl = crossRef.value
	const coordEl = coordRef.value
	const posEls = badgePosRefs.value

	if (
		!rootEl ||
		!hLineEl ||
		!vLineEl ||
		!cornerEls ||
		cornerEls.length === 0 ||
		!crossEl ||
		!coordEl ||
		!posEls ||
		posEls.length === 0
	) {
		console.warn("[viewfinder] refs manquantes")
		return
	}

	if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	ctx = gsap.context(() => {
		const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
		const state = { mix: 0, press: 0 }
		let vw = window.innerWidth
		let vh = window.innerHeight
		let rect: DOMRect | null = null
		let visible = false
		let running = false
		let lastCornerScale = -1
		let lastMove = 0
		let lastCoord = ""
		let coordWidth = 0

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t
		const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
		const pad = (n: number) => String(Math.max(n, 0)).padStart(4, "0")

		const coordText = document.createTextNode("X 0000 Y 0000")
		coordEl.appendChild(coordText)

		const measureCoord = () => {
			coordWidth = coordEl.offsetWidth
		}

		measureCoord()
		document.fonts?.ready.then(measureCoord)

		/* ───────── Coins ───────── */

		const restScale = CORNER_REST / CORNER_HOVER
		const corners: CornerSlot[] = []

		for (const cornerEl of cornerEls) {
			const armH = cornerEl.querySelector<HTMLElement>("[data-arm-h]")
			const armV = cornerEl.querySelector<HTMLElement>("[data-arm-v]")
			if (!armH || !armV) continue

			const right = cornerEl.dataset.right === "true"
			const bottom = cornerEl.dataset.bottom === "true"

			gsap.set(armH, {
				width: CORNER_HOVER,
				height: CORNER_THICKNESS,
				xPercent: right ? -100 : 0,
				yPercent: bottom ? -100 : 0,
				transformOrigin: right ? "100% 0" : "0 0",
				scaleX: restScale,
			})
			gsap.set(armV, {
				width: CORNER_THICKNESS,
				height: CORNER_HOVER,
				xPercent: right ? -100 : 0,
				yPercent: bottom ? -100 : 0,
				transformOrigin: bottom ? "0 100%" : "0 0",
				scaleY: restScale,
			})

			corners.push({
				right,
				bottom,
				setX: gsap.quickSetter(cornerEl, "x", "px") as (value: number) => void,
				setY: gsap.quickSetter(cornerEl, "y", "px") as (value: number) => void,
				setScaleH: gsap.quickSetter(armH, "scaleX") as (value: number) => void,
				setScaleV: gsap.quickSetter(armV, "scaleY") as (value: number) => void,
			})
		}

		/* ───────── Badges ───────── */

		let tick = 0
		let active: BadgeSlot | null = null

		const slots: BadgeSlot[] = posEls.map((pos) => {
			const badge = pos.querySelector<HTMLElement>("[data-badge]")!
			gsap.set(badge, { yPercent: 100 })
			return {
				badge,
				setX: gsap.quickSetter(pos, "x", "px") as (value: number) => void,
				setY: gsap.quickSetter(pos, "y", "px") as (value: number) => void,
				el: null,
				bounds: null,
				tween: null,
				busy: false,
				age: 0,
			}
		})

		const placeSlot = (slot: BadgeSlot, r: DOMRect) => {
			slot.setX(Math.round(r.right + PADDING))
			slot.setY(Math.round(r.top - PADDING))
		}

		const stopSlotTween = (slot: BadgeSlot) => {
			slot.tween?.kill()
			slot.tween = null
			gsap.killTweensOf(slot.badge)
		}

		const resetSlot = (slot: BadgeSlot) => {
			slot.tween = null
			slot.busy = false
			slot.el = null
			slot.bounds = null
		}

		const freeSlot = (slot: BadgeSlot) => {
			stopSlotTween(slot)
			gsap.set(slot.badge, { yPercent: 100 })
			resetSlot(slot)
		}

		const acquireSlot = (el: HTMLElement, bounds: HTMLElement | undefined) => {
			let slot = slots.find((s) => !s.busy)
			if (!slot) slot = slots.reduce((a, b) => (a.age < b.age ? a : b))
			stopSlotTween(slot)
			slot.busy = true
			slot.el = el
			slot.bounds = bounds ?? null
			slot.age = ++tick
			return slot
		}

		const revealSlot = (slot: BadgeSlot) => {
			slot.tween = gsap.fromTo(
				slot.badge,
				{ yPercent: 100 },
				{
					yPercent: 0,
					duration: reduced ? 0 : 0.45,
					delay: reduced ? 0 : 0.15,
					ease: "power3.out",
					overwrite: false,
				}
			)
		}

		const releaseSlot = (slot: BadgeSlot) => {
			stopSlotTween(slot)
			slot.tween = gsap.to(slot.badge, {
				yPercent: 100,
				duration: reduced ? 0 : 0.3,
				ease: "power3.in",
				overwrite: false,
				onComplete: () => resetSlot(slot),
			})
		}

		/* ───────── Setters ───────── */

		const set = {
			hLineY: gsap.quickSetter(hLineEl, "y", "px"),
			vLineX: gsap.quickSetter(vLineEl, "x", "px"),
			crossX: gsap.quickSetter(crossEl, "x", "px"),
			crossY: gsap.quickSetter(crossEl, "y", "px"),
			coordX: gsap.quickSetter(coordEl, "x", "px"),
			coordY: gsap.quickSetter(coordEl, "y", "px"),
		}

		/* ───────── Hover ───────── */

		const isHovering = (el: HTMLElement, r: DOMRect) => {
			if (el.matches(":focus-visible")) return true

			const moving = performance.now() - lastMove < MOVE_GRACE
			if (moving && el.matches(":hover")) return true

			return (
				pointer.x >= r.left - HOVER_MARGIN &&
				pointer.x <= r.right + HOVER_MARGIN &&
				pointer.y >= r.top - HOVER_MARGIN &&
				pointer.y <= r.bottom + HOVER_MARGIN
			)
		}

		/* ───────── Render ───────── */

		const render = () => {
			const t = target.value

			if (t) {
				rect = (t.bounds ?? t.el).getBoundingClientRect()
				if (!isHovering(t.el, rect)) release(t.el)
			}

			const m = state.mix
			const lm = clamp(m, 0, 1)

			// Boîte du viseur (curseur libre → carte verrouillée)
			let x = pointer.x - CURSOR_SIZE / 2
			let y = pointer.y - CURSOR_SIZE / 2
			let w = CURSOR_SIZE
			let h = CURSOR_SIZE

			if (rect && m !== 0) {
				x = lerp(x, rect.left - PADDING, m)
				y = lerp(y, rect.top - PADDING, m)
				w = lerp(w, rect.width + PADDING * 2, m)
				h = lerp(h, rect.height + PADDING * 2, m)
			}

			const inset = state.press * lerp(PRESS_REST, PRESS_HOVER, m)
			x += inset
			y += inset
			w -= inset * 2
			h -= inset * 2

			const px = Math.round(pointer.x)
			const py = Math.round(pointer.y)
			const fx = Math.round(x)
			const fy = Math.round(y)
			const fw = Math.round(w)
			const fh = Math.round(h)

			// Coins
			const cornerScale =
				Math.round((lerp(CORNER_REST, CORNER_HOVER, m) / CORNER_HOVER) * 1000) / 1000
			const scaleChanged = cornerScale !== lastCornerScale
			if (scaleChanged) lastCornerScale = cornerScale

			for (const corner of corners) {
				corner.setX(corner.right ? fx + fw : fx)
				corner.setY(corner.bottom ? fy + fh : fy)
				if (scaleChanged) {
					corner.setScaleH(cornerScale)
					corner.setScaleV(cornerScale)
				}
			}

			// Lignes : toujours pleines, calées sur le pointeur
			set.hLineY(py)
			set.vLineX(px)

			// Mini croix : centre du viseur
			set.crossX(Math.round(fx + fw / 2))
			set.crossY(Math.round(fy + fh / 2))

			// Coordonnées
			const coord = `X ${pad(px)} Y ${pad(py)}`
			if (coord !== lastCoord) {
				lastCoord = coord
				coordText.nodeValue = coord
			}

			const below = fy + fh + COORD_GAP
			const above = fy - COORD_GAP - COORD_HEIGHT
			const flipY = below + COORD_HEIGHT > vh - COORD_EDGE
			const restX =
				fx + fw + COORD_GAP + coordWidth > vw - COORD_EDGE
					? fx - COORD_GAP - coordWidth
					: fx + fw + COORD_GAP
			const hoverX = fx + fw - coordWidth

			set.coordX(
				Math.round(
					clamp(lerp(restX, hoverX, lm), COORD_EDGE, vw - COORD_EDGE - coordWidth)
				)
			)
			set.coordY(
				Math.round(
					clamp(
						lerp(flipY ? above : below, below, lm),
						COORD_EDGE,
						vh - COORD_EDGE - COORD_HEIGHT
					)
				)
			)

			// Badges
			for (const slot of slots) {
				if (!slot.busy || !slot.el) continue

				if (!slot.el.isConnected) {
					if (slot === active) active = null
					freeSlot(slot)
					continue
				}

				placeSlot(
					slot,
					slot.el === t?.el && rect
						? rect
						: (slot.bounds ?? slot.el).getBoundingClientRect()
				)
			}
		}

		/* ───────── Cycle de vie ───────── */

		const start = () => {
			if (running) return
			running = true
			gsap.ticker.add(render)
		}

		const stop = () => {
			if (!running) return
			running = false
			gsap.ticker.remove(render)
		}

		const pressDown = () => {
			gsap.to(state, {
				press: 1,
				duration: reduced ? 0 : 0.18,
				ease: "power3.out",
				overwrite: "auto",
			})
		}

		const releasePress = () => {
			gsap.to(state, {
				press: 0,
				duration: reduced ? 0 : 0.6,
				ease: "power4.out",
				overwrite: "auto",
			})
		}

		const show = () => {
			if (visible) return
			visible = true
			start()
			render()
			gsap.to(rootEl, { opacity: 1, duration: 0.25, overwrite: "auto" })
		}

		const hide = () => {
			visible = false
			releasePress()
			release()
			gsap.to(rootEl, {
				opacity: 0,
				duration: 0.25,
				overwrite: "auto",
				onComplete: () => {
					if (!visible) stop()
				},
			})
		}

		/* ───────── Événements ───────── */

		const syncPointer = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return
			pointer.x = e.clientX
			pointer.y = e.clientY
			lastMove = performance.now()
			show()
		}

		const onDown = (e: PointerEvent) => {
			if (e.pointerType !== "mouse" || e.button !== 0) return
			syncPointer(e)
			pressDown()
		}

		const onUp = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return
			releasePress()
		}

		const onResize = () => {
			vw = window.innerWidth
			vh = window.innerHeight
			measureCoord()
		}

		const unwatch = watch(target, (t) => {
			const isActive = t !== null
			if (isActive) show()

			for (const slot of slots) {
				if (slot !== active && slot.busy) freeSlot(slot)
			}

			gsap.to(state, {
				mix: isActive ? 1 : 0,
				duration: reduced ? 0 : isActive ? 0.6 : 0.45,
				ease: isActive ? "power4.out" : "power3.out",
				overwrite: "auto",
			})

			if (active && t && active.el === t.el) {
				stopSlotTween(active)
				active.badge.textContent = t.label ?? ""
				placeSlot(active, (t.bounds ?? t.el).getBoundingClientRect())
				return
			}

			if (active) {
				if (t) freeSlot(active)
				else releaseSlot(active)
				active = null
			}

			if (t) {
				const slot = acquireSlot(t.el, t.bounds)
				slot.badge.textContent = t.label ?? ""
				placeSlot(slot, (t.bounds ?? t.el).getBoundingClientRect())
				revealSlot(slot)
				active = slot
			}
		})

		window.addEventListener("pointerover", syncPointer, { passive: true, capture: true })
		window.addEventListener("pointermove", syncPointer, { passive: true, capture: true })
		window.addEventListener("pointerdown", onDown, { passive: true, capture: true })
		window.addEventListener("pointerup", onUp, { passive: true })
		window.addEventListener("pointercancel", onUp, { passive: true })
		window.addEventListener("blur", releasePress)
		window.addEventListener("resize", onResize, { passive: true })
		document.documentElement.addEventListener("mouseleave", hide)

		cleanup = () => {
			unwatch()
			stop()
			release()
			window.removeEventListener("pointerover", syncPointer, { capture: true })
			window.removeEventListener("pointermove", syncPointer, { capture: true })
			window.removeEventListener("pointerdown", onDown, { capture: true })
			window.removeEventListener("pointerup", onUp)
			window.removeEventListener("pointercancel", onUp)
			window.removeEventListener("blur", releasePress)
			window.removeEventListener("resize", onResize)
			document.documentElement.removeEventListener("mouseleave", hide)
		}
	}, rootEl)
})

onBeforeUnmount(() => {
	cleanup?.()
	ctx?.revert()
})
</script>

<template>
	<div
		ref="rootRef"
		aria-hidden="true"
		class="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0 contain-strict"
	>
		<!-- Lignes : toujours pleines, traversent le viseur -->
		<span
			ref="hLineRef"
			class="absolute top-0 left-0 h-px w-screen will-change-transform"
			:style="lineStyle"
		/>
		<span
			ref="vLineRef"
			class="absolute top-0 left-0 h-screen w-px will-change-transform"
			:style="lineStyle"
		/>

		<!-- Coins -->
		<div
			v-for="(corner, i) in CORNERS"
			:key="i"
			ref="cornerRefs"
			:data-right="corner.right"
			:data-bottom="corner.bottom"
			class="absolute top-0 left-0 h-0 w-0 will-change-transform"
		>
			<span data-arm-h :class="[ui.bg, 'absolute top-0 left-0 will-change-transform']" />
			<span data-arm-v :class="[ui.bg, 'absolute top-0 left-0 will-change-transform']" />
		</div>

		<!-- Mini croix au centre du viseur -->
		<div ref="crossRef" class="absolute top-0 left-0 h-0 w-0 will-change-transform">
			<span
				:class="[ui.bg, 'absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2']"
				:style="{ width: `${CROSS_SIZE}px`, height: `${CROSS_THICKNESS}px` }"
			/>
			<span
				:class="[ui.bg, 'absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2']"
				:style="{ width: `${CROSS_THICKNESS}px`, height: `${CROSS_SIZE}px` }"
			/>
		</div>

		<!-- Coordonnées -->
		<div
			ref="coordRef"
			:style="coordStyle"
			class="font-vg5000 absolute top-0 left-0 text-[10px] leading-none tracking-widest whitespace-nowrap tabular-nums will-change-transform"
		/>

		<!-- Badges -->
		<div
			v-for="n in POOL_SIZE"
			:key="n"
			ref="badgePosRefs"
			class="absolute top-0 left-0 h-0 w-0 will-change-transform"
		>
			<div class="absolute right-0 bottom-3 overflow-hidden rounded-xs">
				<div
					data-badge
					:class="[
						ui.bg,
						ui.text,
						'font-vg5000 rounded-xs px-3 py-1.5 text-xs leading-none tracking-widest whitespace-nowrap uppercase',
					]"
				/>
			</div>
		</div>
	</div>
</template>
