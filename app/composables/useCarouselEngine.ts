import type { ShallowRef } from "vue"
import type { gsap as GsapStatic } from "gsap"
import type { ScrollTrigger as ScrollTriggerStatic } from "gsap/ScrollTrigger"
import type { SpringState } from "~/utils/smoothing"
import { approach, expSmoothingFactor, rubberBand, stepSpring } from "~/utils/smoothing"

type ElementRef = Readonly<ShallowRef<HTMLElement | null>>
type SpringKey = "focus" | "press" | "skew" | "shift" | "pointerX" | "pointerY"
type SpringRecord = Record<SpringKey, number>
type Smooth = (rate: number) => number
type Phase = "scroll" | "drag" | "spring"

export interface CarouselPointer {
	x: number
	y: number
	/** True while a mouse hovers a card and should drive its tilt */
	live: boolean
}

export interface CarouselBridge {
	getHoveredIndex: () => number | null
	getPressedIndex: () => number | null
	getPointer: () => CarouselPointer
	onActiveChange: (index: number) => void
	onDragStart: () => void
}

export interface CarouselElements {
	/** Scroll-pinned wrapper whose height equals the viewport height plus the travel distance */
	section: ElementRef
	/** Sticky full-screen frame in which the active card is centered */
	viewport: ElementRef
	/** Clipping frame that receives the finger drag on touch layouts */
	surface: ElementRef
	/** Flex track translated along the carousel axis */
	track: ElementRef
}

export interface CarouselEngineOptions extends CarouselElements {
	cards: HTMLElement[]
	bridge: CarouselBridge
}

interface EngineConfig {
	gsap: typeof GsapStatic
	ScrollTrigger: typeof ScrollTriggerStatic
	section: HTMLElement
	viewport: HTMLElement
	surface: HTMLElement
	track: HTMLElement
	cards: HTMLElement[]
	isMobile: boolean
	reduceMotion: boolean
	scrollTo: (y: number) => void
	bridge: CarouselBridge
}

interface Engine {
	wake: () => void
	destroy: () => void
}

interface DragState {
	pointerId: number
	/** True once the gesture passed the slop threshold and locked onto the carousel axis */
	active: boolean
	/** True when the finger landed on a moving carousel and stopped it */
	catching: boolean
	startX: number
	startY: number
	startPosition: number
	lastX: number
	lastTime: number
	/** Filtered finger velocity in px/s, positive when moving toward the next card */
	velocity: number
}

interface Slot extends SpringRecord {
	card: HTMLElement
	image: HTMLElement | null
	center: number
}

const DESKTOP_QUERY = "(min-width: 64rem)"
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

const AXES = {
	horizontal: {
		padStart: "paddingLeft",
		padEnd: "paddingRight",
		gap: "columnGap",
		size: "offsetWidth",
		extent: "clientWidth",
		skew: "skewX",
		translate: (px: number) => `translate3d(${px}px, 0, 0)`,
	},
	vertical: {
		padStart: "paddingTop",
		padEnd: "paddingBottom",
		gap: "rowGap",
		size: "offsetHeight",
		extent: "clientHeight",
		skew: "skewY",
		translate: (px: number) => `translate3d(0, ${px}px, 0)`,
	},
} as const

const SPRING_KEYS: SpringKey[] = ["focus", "press", "skew", "shift", "pointerX", "pointerY"]

const RATES: SpringRecord = {
	focus: 10,
	press: 12,
	skew: 10,
	shift: 9,
	pointerX: 10,
	pointerY: 10,
}

const TRACK_RATE = 16
const PRESS_IN_RATE = 24
const MAX_FRAME_MS = 100

const DRAG_SLOP = 8
const DRAG_FOLLOW_RATE = 55
const VELOCITY_RATE = 30
const VELOCITY_STALE_MS = 90
const THROW_TIME = 0.2
const MAX_THROW_CARDS = 1.5
const SPRING_OMEGA = 11
const RUBBER_LIMIT = 0.25
const CATCH_VELOCITY = 20
const CATCH_DISTANCE = 4
const REST_DISTANCE = 0.05
const REST_VELOCITY = 1
const CLICK_GUARD_MS = 80

const MIN_SCALE = 0.84
const PRESS_SCALE = 0.96
const FOCUS_FALLOFF = 0.68
const DIM_MIN = 0.5
const IMAGE_SCALE = 1.15
const PARALLAX_PERCENT = 4
const POINTER_PERCENT = 2.5
const MAX_TILT = 7
const MAX_SKEW = 5
const VELOCITY_REF = 2400
const PERSPECTIVE = 1000
const VISIBILITY_MARGIN = 0.25

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

const preventDefault = (event: Event) => event.preventDefault()

function snapToNearest(values: readonly number[], value: number) {
	let best = values[0] ?? 0
	let bestDistance = Math.abs(best - value)
	for (const candidate of values) {
		const candidateDistance = Math.abs(candidate - value)
		if (candidateDistance >= bestDistance) continue
		best = candidate
		bestDistance = candidateDistance
	}
	return best
}

function createSpringRecord(): SpringRecord {
	return { focus: 0, press: 0, skew: 0, shift: 0, pointerX: 0, pointerY: 0 }
}

function createDragState(): DragState {
	return {
		pointerId: -1,
		active: false,
		catching: false,
		startX: 0,
		startY: 0,
		startPosition: 0,
		lastX: 0,
		lastTime: 0,
		velocity: 0,
	}
}

function createSlot(card: HTMLElement): Slot {
	return {
		card,
		image: card.querySelector<HTMLElement>("img"),
		center: 0,
		focus: -1,
		press: 0,
		skew: 0,
		shift: 0,
		pointerX: 0,
		pointerY: 0,
	}
}

function settleSlot(slot: Slot, targets: SpringRecord, factors: SpringRecord) {
	let changed = false
	for (const key of SPRING_KEYS) {
		const next = approach(slot[key], targets[key], factors[key])
		if (next === slot[key]) continue
		slot[key] = next
		changed = true
	}
	return changed
}

function createEngine(config: EngineConfig): Engine | undefined {
	const {
		gsap,
		ScrollTrigger,
		section,
		viewport,
		surface,
		track,
		isMobile,
		reduceMotion,
		scrollTo,
		bridge,
	} = config

	const slots = config.cards.map(createSlot)
	if (slots.length === 0) return undefined

	const stacks = Array.from(viewport.querySelectorAll<HTMLElement>("[data-stack]"), (stack) =>
		Array.from(stack.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
	)
	const axis = isMobile ? AXES.horizontal : AXES.vertical
	const imageScale = reduceMotion ? 1 : IMAGE_SCALE
	const targets = createSpringRecord()
	const factors = createSpringRecord()
	const trackState: SpringState = { position: 0, velocity: 0 }
	const drag = createDragState()
	const controller = new AbortController()
	const { signal } = controller

	let centers: number[] = [0]
	let snapProgress: number[] = [0]
	let distance = 0
	let extent = 1
	let pitch = 1
	let trackTarget = 0
	let writtenPosition = Number.NaN
	let writtenIndex = Number.NaN
	let writtenScroll = Number.NaN
	let lastActive = -1
	let phase: Phase = "scroll"
	let trigger: ScrollTriggerStatic | undefined
	let visible = false
	let awake = false
	let destroyed = false

	function measure() {
		const first = slots[0]
		if (!first) return

		extent = Math.max(viewport[axis.extent], 1)
		const padding = Math.max((extent - first.card[axis.size]) / 2, 0)
		track.style[axis.padStart] = `${padding}px`
		track.style[axis.padEnd] = `${padding}px`

		const gap = Number.parseFloat(window.getComputedStyle(track)[axis.gap]) || 0
		let cursor = padding

		for (const slot of slots) {
			const size = slot.card[axis.size]
			slot.center = cursor + size / 2 - extent / 2
			cursor += size + gap
		}

		centers = slots.map(({ center }) => center)
		distance = Math.max(centers.at(-1) ?? 0, 0)
		pitch = centers.length > 1 ? distance / (centers.length - 1) : extent
		snapProgress = distance > 0 ? centers.map((center) => clamp(center / distance, 0, 1)) : [0]
		section.style.height = `${viewport.clientHeight + distance}px`
	}

	function scrollPositionFor(center: number) {
		if (!trigger) return window.scrollY
		const span = trigger.end - trigger.start
		return trigger.start + (distance > 0 ? (center / distance) * span : 0)
	}

	function syncScroll() {
		const y = scrollPositionFor(clamp(trackState.position, 0, distance))
		if (Math.abs(y - writtenScroll) < 0.5) return
		writtenScroll = y
		scrollTo(y)
	}

	function endSpring() {
		syncScroll()
		phase = "scroll"
		writtenScroll = Number.NaN
	}

	function paint(slot: Slot) {
		const scale =
			(MIN_SCALE + (1 - MIN_SCALE) * slot.focus) * (1 - (1 - PRESS_SCALE) * slot.press)

		slot.card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${-slot.pointerY * MAX_TILT}deg) rotateY(${slot.pointerX * MAX_TILT}deg) ${axis.skew}(${slot.skew}deg) scale(${scale})`

		if (!slot.image) return

		const x = -slot.pointerX * POINTER_PERCENT + (isMobile ? slot.shift : 0)
		const y = -slot.pointerY * POINTER_PERCENT + (isMobile ? 0 : slot.shift)

		slot.image.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${imageScale})`
		slot.image.style.opacity = String(DIM_MIN + (1 - DIM_MIN) * slot.focus)
	}

	function writeStacks() {
		const index = clamp(trackState.position / pitch, 0, slots.length - 1)
		if (index === writtenIndex) return
		writtenIndex = index

		for (const stack of stacks) {
			for (const [position, item] of stack.entries()) {
				item.style.translate = `0 calc(${position - index} * (100% + var(--stack-gap)))`
			}
		}
	}

	function follow(factor: number, delta: number) {
		const previous = trackState.position
		trackState.position = approach(previous, trackTarget, factor)
		trackState.velocity = delta > 0 ? (trackState.position - previous) / delta : 0
	}

	function stepTrack(smooth: Smooth, delta: number) {
		if (phase === "drag") {
			follow(smooth(DRAG_FOLLOW_RATE), delta)
			return
		}

		if (phase === "scroll") {
			follow(smooth(TRACK_RATE), delta)
			return
		}

		if (!reduceMotion) {
			stepSpring(trackState, trackTarget, SPRING_OMEGA, delta)

			const resting =
				Math.abs(trackTarget - trackState.position) < REST_DISTANCE &&
				Math.abs(trackState.velocity) < REST_VELOCITY
			if (!resting) return
		}

		trackState.position = trackTarget
		trackState.velocity = 0
		endSpring()
	}

	function render(delta: number, instant: boolean) {
		const smooth: Smooth = (rate) =>
			instant || reduceMotion ? 1 : expSmoothingFactor(rate, delta)

		for (const key of SPRING_KEYS) factors[key] = smooth(RATES[key])
		const releaseFactor = factors.press
		const pressInFactor = smooth(PRESS_IN_RATE)

		if (instant) {
			trackState.position = trackTarget
			trackState.velocity = 0
			if (phase === "spring") endSpring()
		} else {
			stepTrack(smooth, delta)
		}

		if (phase !== "scroll") syncScroll()

		if (trackState.position !== writtenPosition) {
			writtenPosition = trackState.position
			track.style.transform = axis.translate(-trackState.position)
		}

		writeStacks()

		const skewTarget = reduceMotion
			? 0
			: clamp(trackState.velocity / VELOCITY_REF, -1, 1) * MAX_SKEW

		const hoveredIndex = bridge.getHoveredIndex()
		const pressedIndex = bridge.getPressedIndex()
		const pointer = bridge.getPointer()
		const hoveredSlot = hoveredIndex === null ? undefined : slots[hoveredIndex]

		let pointerX = 0
		let pointerY = 0

		if (hoveredSlot && pointer.live && !reduceMotion) {
			const rect = hoveredSlot.card.getBoundingClientRect()
			if (rect.width > 0 && rect.height > 0) {
				pointerX = clamp(((pointer.x - rect.left) / rect.width) * 2 - 1, -1, 1)
				pointerY = clamp(((pointer.y - rect.top) / rect.height) * 2 - 1, -1, 1)
			}
		}

		let animating =
			phase !== "scroll" || trackState.position !== trackTarget || trackState.velocity !== 0
		let nearest = Infinity
		let nearestIndex = 0

		for (const [index, slot] of slots.entries()) {
			const offset = slot.center - trackState.position
			const offsetAbs = Math.abs(offset)
			if (offsetAbs < nearest) {
				nearest = offsetAbs
				nearestIndex = index
			}

			const pressed = pressedIndex === index
			const hovered = slot === hoveredSlot

			targets.focus = easeInOutSine(1 - clamp(offsetAbs / (extent * FOCUS_FALLOFF), 0, 1))
			targets.press = pressed ? 1 : 0
			targets.skew = skewTarget
			targets.shift = reduceMotion ? 0 : -clamp(offset / extent, -1, 1) * PARALLAX_PERCENT
			targets.pointerX = hovered ? pointerX : 0
			targets.pointerY = hovered ? pointerY : 0
			factors.press = pressed ? pressInFactor : releaseFactor

			if (!settleSlot(slot, targets, factors)) continue
			paint(slot)
			animating = true
		}

		if (nearestIndex !== lastActive) {
			lastActive = nearestIndex
			bridge.onActiveChange(nearestIndex)
		}

		return animating
	}

	function tick(_time: number, deltaTime: number) {
		if (!render(Math.min(deltaTime, MAX_FRAME_MS) / 1000, false)) sleep()
	}

	function wake() {
		if (!visible || awake || destroyed) return
		awake = true
		gsap.ticker.add(tick)
	}

	function sleep() {
		if (!awake) return
		awake = false
		gsap.ticker.remove(tick)
	}

	function isNearViewport() {
		const rect = section.getBoundingClientRect()
		const margin = window.innerHeight * VISIBILITY_MARGIN
		return rect.bottom > -margin && rect.top < window.innerHeight + margin
	}

	function reveal(index: number) {
		const slot = slots[index]
		if (!slot) return
		scrollTo(scrollPositionFor(slot.center))
	}

	function mountScrollDriver() {
		trigger = ScrollTrigger.create({
			trigger: section,
			start: "top top",
			end: () => `+=${distance}`,
			onUpdate: (self) => {
				if (phase !== "scroll") return
				trackTarget = self.progress * distance
				wake()
			},
			onRefresh: (self) => {
				if (phase === "scroll") trackTarget = self.progress * distance
				render(0, true)
			},
			snap: {
				snapTo: (progress: number) =>
					phase === "scroll" ? snapToNearest(snapProgress, progress) : progress,
				inertia: false,
				duration: { min: 0.25, max: 0.5 },
				ease: "power3.out",
				delay: 0,
			},
		})

		trackTarget = trigger.progress * distance
		ScrollTrigger.addEventListener("refreshInit", measure)

		return () => {
			ScrollTrigger.removeEventListener("refreshInit", measure)
			trigger?.kill()
			trigger = undefined
		}
	}

	function mountDragLayer() {
		let suppressClick = false
		let clickTimer = 0

		const isMoving = () =>
			Math.abs(trackState.velocity) > CATCH_VELOCITY ||
			Math.abs(trackTarget - trackState.position) > CATCH_DISTANCE

		function resumeScroll() {
			phase = "scroll"
			writtenScroll = Number.NaN
			trackTarget = trigger ? trigger.progress * distance : trackState.position
			wake()
		}

		function release(now: number, flick: boolean) {
			const fresh = flick && now - drag.lastTime <= VELOCITY_STALE_MS
			const reach = pitch * MAX_THROW_CARDS
			const projected = fresh ? clamp(drag.velocity * THROW_TIME, -reach, reach) : 0

			trackTarget = snapToNearest(centers, trackTarget + projected)
			phase = "spring"
			wake()
		}

		function onPointerDown(event: PointerEvent) {
			if (!event.isPrimary) return
			if (event.pointerType === "mouse" && event.button !== 0) return

			drag.pointerId = event.pointerId
			drag.active = false
			drag.catching = isMoving()
			drag.startX = event.clientX
			drag.startY = event.clientY
			drag.lastX = event.clientX
			drag.lastTime = event.timeStamp
			drag.velocity = 0

			if (drag.catching) {
				trackTarget = trackState.position
				trackState.velocity = 0
				phase = "drag"
			}

			drag.startPosition = trackState.position
			wake()
		}

		function onPointerMove(event: PointerEvent) {
			if (event.pointerId !== drag.pointerId) return

			const dx = event.clientX - drag.startX

			if (!drag.active) {
				const dy = event.clientY - drag.startY
				if (Math.hypot(dx, dy) < DRAG_SLOP) return

				if (Math.abs(dy) > Math.abs(dx)) {
					drag.pointerId = -1
					if (drag.catching) resumeScroll()
					return
				}

				drag.active = true
				drag.startPosition = trackState.position + dx
				phase = "drag"
				bridge.onDragStart()
			}

			const dt = (event.timeStamp - drag.lastTime) / 1000
			if (dt > 0) {
				drag.velocity = approach(
					drag.velocity,
					(drag.lastX - event.clientX) / dt,
					expSmoothingFactor(VELOCITY_RATE, dt)
				)
				drag.lastTime = event.timeStamp
				drag.lastX = event.clientX
			}

			trackTarget = rubberBand(drag.startPosition - dx, 0, distance, extent * RUBBER_LIMIT)
			wake()
		}

		function onPointerEnd(event: PointerEvent) {
			if (event.pointerId !== drag.pointerId) return

			const wasActive = drag.active
			const wasCatching = drag.catching
			drag.pointerId = -1
			drag.active = false

			if (!wasActive) {
				if (!wasCatching) return
				if (event.type === "pointercancel") {
					resumeScroll()
					return
				}
			}

			suppressClick = true
			window.clearTimeout(clickTimer)
			clickTimer = window.setTimeout(() => {
				suppressClick = false
			}, CLICK_GUARD_MS)

			release(event.timeStamp, wasActive && event.type === "pointerup")
		}

		function onClick(event: MouseEvent) {
			if (!suppressClick) return
			if (!(event.target instanceof Node) || !surface.contains(event.target)) return
			event.preventDefault()
			event.stopPropagation()
		}

		function onWheel() {
			if (phase === "spring") resumeScroll()
		}

		surface.addEventListener("pointerdown", onPointerDown, { passive: true, signal })
		window.addEventListener("pointermove", onPointerMove, { passive: true, signal })
		window.addEventListener("pointerup", onPointerEnd, { passive: true, signal })
		window.addEventListener("pointercancel", onPointerEnd, { passive: true, signal })
		window.addEventListener("click", onClick, { capture: true, signal })
		window.addEventListener("wheel", onWheel, { passive: true, signal })

		return () => {
			window.clearTimeout(clickTimer)
		}
	}

	function resetStyles() {
		section.style.height = ""
		track.style.transform = ""
		track.style[axis.padStart] = ""
		track.style[axis.padEnd] = ""

		for (const { card, image } of slots) {
			card.style.transform = ""
			if (!image) continue
			image.style.transform = ""
			image.style.opacity = ""
		}
	}

	measure()

	const unmounts = [mountScrollDriver(), ...(isMobile ? [mountDragLayer()] : [])]

	surface.addEventListener(
		"focusin",
		(event) => {
			const target = event.target
			if (!(target instanceof HTMLElement) || !target.matches(":focus-visible")) return
			const index = slots.findIndex(({ card }) => card.contains(target))
			if (index !== -1) reveal(index)
		},
		{ signal }
	)
	surface.addEventListener(
		"scroll",
		() => {
			surface.scrollLeft = 0
			surface.scrollTop = 0
		},
		{ passive: true, signal }
	)
	surface.addEventListener("dragstart", preventDefault, { signal })

	render(0, true)
	visible = isNearViewport()

	const observer = new IntersectionObserver(
		(entries) => {
			visible = entries.at(-1)?.isIntersecting ?? false
			if (!visible) {
				sleep()
				return
			}
			render(0, true)
			wake()
		},
		{ rootMargin: `${VISIBILITY_MARGIN * 100}% 0px` }
	)
	observer.observe(section)

	wake()

	function destroy() {
		if (destroyed) return
		destroyed = true
		sleep()
		observer.disconnect()
		controller.abort()
		for (const unmount of unmounts) unmount()
		resetStyles()
	}

	return { wake, destroy }
}

export function useCarouselEngine({
	section,
	viewport,
	surface,
	track,
	cards,
	bridge,
}: CarouselEngineOptions) {
	const { useGsapContext } = useGsap()
	const lenis = useLenis()
	let engine: Engine | undefined

	function scrollTo(y: number) {
		if (lenis) lenis.scrollTo(y, { immediate: true })
		else window.scrollTo({ top: y, behavior: "instant" })
	}

	useGsapContext(({ gsap, ScrollTrigger }) => {
		const sectionEl = section.value
		const viewportEl = viewport.value
		const surfaceEl = surface.value
		const trackEl = track.value
		if (!sectionEl || !viewportEl || !surfaceEl || !trackEl) return

		const nodes = {
			section: sectionEl,
			viewport: viewportEl,
			surface: surfaceEl,
			track: trackEl,
		}
		const layoutQuery = window.matchMedia(DESKTOP_QUERY)
		const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)

		function mount() {
			engine?.destroy()
			engine = createEngine({
				gsap,
				ScrollTrigger,
				...nodes,
				cards,
				isMobile: !layoutQuery.matches,
				reduceMotion: motionQuery.matches,
				scrollTo,
				bridge,
			})
		}

		mount()
		layoutQuery.addEventListener("change", mount)
		motionQuery.addEventListener("change", mount)

		return () => {
			layoutQuery.removeEventListener("change", mount)
			motionQuery.removeEventListener("change", mount)
			engine?.destroy()
			engine = undefined
		}
	}, section)

	return { wake: () => engine?.wake() }
}