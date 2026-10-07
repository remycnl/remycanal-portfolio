<script setup lang="ts">
import type { GsapInstance } from "@/composables/useGsap"

export type BadgeState = "idle" | "press" | "drag" | "loading" | "view"

export interface BadgeProps {
	/** Background color of the pill. Accepts any CSS color or a Tailwind theme variable, e.g. `var(--color-lime)`. */
	bgColor?: string
	/** Text color of the pill. Accepts any CSS color or a Tailwind theme variable, e.g. `var(--color-black)`. */
	textColor?: string
	/** Externally controlled state. When defined it overrides the pointer-derived states (idle, press, drag). */
	state?: BadgeState
	/** Label per state. Missing states fall back to the built-in default label. States sharing the same label share the same text layer, so switching between them only animates the pill. */
	labels?: Partial<Record<BadgeState, string>>
	/** Controlled visibility. When defined, the badge is shown only while `true`. When undefined, it shows whenever the pointer is inside the boundary. */
	active?: boolean
	/** Area that is tracked by the badge. `parent` follows the pointer inside the parent element, `window` follows it across the whole page. */
	boundary?: "parent" | "window"
	/** Pixel offset applied to the badge relative to the pointer position. */
	offset?: { x: number; y: number }
	/** Follow stiffness. Higher values make the badge catch up with the pointer faster. */
	followRate?: number
	/** Multiplier of the velocity-driven tilt and squash-and-stretch. `0` disables the motion. */
	motion?: number
}

type Setter = (value: number) => void

interface Setters {
	x: Setter
	y: Setter
	rotation: Setter
	scaleX: Setter
	scaleY: Setter
}

const STATES: readonly BadgeState[] = ["idle", "press", "drag", "loading", "view"]

const DEFAULT_LABELS: Record<BadgeState, string> = {
	idle: "Explore",
	press: "Hold",
	drag: "Dragging",
	loading: "Loading",
	view: "View",
}

const STATE_SCALE: Record<BadgeState, number> = {
	idle: 1,
	press: 0.88,
	drag: 1.1,
	loading: 1,
	view: 1,
}

const DRAG_THRESHOLD = 6
const MAX_DELTA = 0.05
const VELOCITY_RATE = 12
const MAX_TILT = 16
const TILT_PER_SPEED = 0.01
const STRETCH_PER_SPEED = 0.00022
const MAX_STRETCH = 0.22
const SETTLE_DISTANCE = 0.05
const SETTLE_SPEED = 2
const HIDDEN_SCALE = 0.4

const props = withDefaults(defineProps<BadgeProps>(), {
	bgColor: "var(--color-lime)",
	textColor: "var(--color-black)",
	state: undefined,
	labels: () => ({}),
	active: undefined,
	boundary: "window",
	offset: () => ({ x: 76, y: 44 }),
	followRate: 14,
	motion: 1,
})

const { gsap, useGsapContext } = useGsap()

const rootRef = useTemplateRef<HTMLDivElement>("root")
const motionRef = useTemplateRef<HTMLDivElement>("motion")
const presenceRef = useTemplateRef<HTMLDivElement>("presence")
const pillRef = useTemplateRef<HTMLDivElement>("pill")

const interactionState = shallowRef<BadgeState>("idle")
const activeState = computed<BadgeState>(() => props.state ?? interactionState.value)

const labelMap = computed<Record<BadgeState, string>>(
	() =>
		Object.fromEntries(
			STATES.map((state) => [state, props.labels[state] ?? DEFAULT_LABELS[state]])
		) as Record<BadgeState, string>
)

function resolveItem(state: BadgeState): BadgeState {
	if (state === "loading") return state
	return (
		STATES.find((s) => s !== "loading" && labelMap.value[s] === labelMap.value[state]) ??
		state
	)
}

const itemStates = computed(() => STATES.filter((state) => resolveItem(state) === state))

const itemRefs = new Map<BadgeState, HTMLElement>()
const widths = new Map<BadgeState, number>()

let setters: Setters | null = null
let spinnerTween: ReturnType<GsapInstance["to"]> | null = null
let displayed: BadgeState = activeState.value
let shownItem: BadgeState = resolveItem(displayed)
let ready = false
let reducedMotion = false
let visible = false
let tickerActive = false
let atRest = true
let hasPointer = false
let pressed = false
let pressX = 0
let pressY = 0
let x = 0
let y = 0
let targetX = 0
let targetY = 0
let velocityX = 0
let velocityY = 0

function registerItem(state: BadgeState, el: unknown) {
	if (el instanceof HTMLElement) itemRefs.set(state, el)
	else itemRefs.delete(state)
}

function measureWidths() {
	for (const [state, item] of itemRefs) {
		const inner = item.firstElementChild
		if (inner instanceof HTMLElement) widths.set(state, inner.offsetWidth)
	}
}

function refreshLayout() {
	const pill = pillRef.value
	if (!ready || !pill) return
	measureWidths()
	shownItem = resolveItem(displayed)
	for (const [state, item] of itemRefs) {
		gsap.set(item, { opacity: state === shownItem ? 1 : 0, yPercent: 0 })
	}
	const width = widths.get(shownItem)
	if (width) gsap.set(pill, { width })
}

function writeFrame() {
	if (!setters) return
	const intensity = reducedMotion ? 0 : props.motion
	const rotation = gsap.utils.clamp(
		-MAX_TILT,
		MAX_TILT,
		velocityX * TILT_PER_SPEED * intensity
	)
	const stretchX = Math.min(
		Math.abs(velocityX) * STRETCH_PER_SPEED * intensity,
		MAX_STRETCH
	)
	const stretchY = Math.min(
		Math.abs(velocityY) * STRETCH_PER_SPEED * intensity,
		MAX_STRETCH
	)
	setters.x(x + props.offset.x)
	setters.y(y + props.offset.y)
	setters.rotation(rotation)
	setters.scaleX(1 + stretchX - stretchY * 0.5)
	setters.scaleY(1 + stretchY - stretchX * 0.5)
}

function tick(_time: number, deltaTime: number) {
	if (atRest) return
	const delta = Math.min(deltaTime / 1000, MAX_DELTA)
	if (delta <= 0) return
	const follow = expSmoothingFactor(props.followRate, delta)
	const smoothing = expSmoothingFactor(VELOCITY_RATE, delta)
	const nextX = x + (targetX - x) * follow
	const nextY = y + (targetY - y) * follow
	velocityX += ((nextX - x) / delta - velocityX) * smoothing
	velocityY += ((nextY - y) / delta - velocityY) * smoothing
	x = nextX
	y = nextY
	const settled =
		Math.abs(targetX - x) < SETTLE_DISTANCE &&
		Math.abs(targetY - y) < SETTLE_DISTANCE &&
		Math.hypot(velocityX, velocityY) < SETTLE_SPEED
	if (settled) {
		x = targetX
		y = targetY
		velocityX = 0
		velocityY = 0
		atRest = true
	}
	writeFrame()
}

function reveal() {
	const root = rootRef.value
	const presence = presenceRef.value
	if (visible || !root || !presence) return
	visible = true
	if (!tickerActive) {
		x = targetX
		y = targetY
		velocityX = 0
		velocityY = 0
		atRest = true
		writeFrame()
		gsap.set(root, { willChange: "transform" })
		gsap.ticker.add(tick)
		tickerActive = true
	}
	gsap.to(presence, {
		opacity: 1,
		scale: 1,
		duration: 0.5,
		ease: "back.out(1.8)",
		overwrite: true,
	})
}

function conceal() {
	const root = rootRef.value
	const presence = presenceRef.value
	if (!visible || !root || !presence) return
	visible = false
	gsap.to(presence, {
		opacity: 0,
		scale: HIDDEN_SCALE,
		duration: 0.3,
		ease: "power3.in",
		overwrite: true,
		onComplete: () => {
			if (visible || !tickerActive) return
			gsap.ticker.remove(tick)
			tickerActive = false
			gsap.set(root, { willChange: "auto" })
		},
	})
}

function pauseSpinner() {
	if (shownItem !== "loading") spinnerTween?.pause()
}

function transitionTo(next: BadgeState) {
	const pill = pillRef.value
	if (!ready || !pill || next === displayed) return
	displayed = next
	const nextItem = resolveItem(next)

	if (nextItem !== shownItem) {
		shownItem = nextItem
		for (const [state, item] of itemRefs) {
			const opacity = Number(gsap.getProperty(item, "opacity"))
			if (state === nextItem) {
				if (opacity < 0.05) gsap.set(item, { yPercent: 80 })
				gsap.to(item, {
					opacity: 1,
					yPercent: 0,
					duration: 0.35,
					delay: 0.08,
					ease: "power3.out",
					overwrite: true,
				})
			} else if (opacity > 0) {
				gsap.to(item, {
					opacity: 0,
					yPercent: -80,
					duration: 0.2,
					ease: "power2.in",
					overwrite: true,
					onComplete: state === "loading" ? pauseSpinner : undefined,
				})
			}
		}
	}

	if (nextItem === "loading") spinnerTween?.play()

	const width = widths.get(nextItem)
	if (width) {
		gsap.to(pill, { width, duration: 0.5, ease: "expo.out", overwrite: "auto" })
	}
	gsap.to(pill, {
		scale: STATE_SCALE[next],
		duration: next === "press" ? 0.2 : 0.7,
		ease: next === "press" ? "power3.out" : "elastic.out(1, 0.55)",
		overwrite: "auto",
	})
}

function onPointerMove(event: PointerEvent) {
	if (event.pointerType === "touch") return
	targetX = event.clientX
	targetY = event.clientY
	hasPointer = true
	if (!visible && props.active !== false) reveal()
	atRest = false
	if (
		pressed &&
		interactionState.value === "press" &&
		Math.hypot(event.clientX - pressX, event.clientY - pressY) > DRAG_THRESHOLD
	) {
		interactionState.value = "drag"
	}
}

function onPointerLeave() {
	hasPointer = false
	conceal()
}

function onPointerDown(event: PointerEvent) {
	if (event.pointerType === "touch" || event.button !== 0) return
	pressed = true
	pressX = event.clientX
	pressY = event.clientY
	interactionState.value = "press"
}

function release() {
	if (!pressed) return
	pressed = false
	interactionState.value = "idle"
}

watch(activeState, (next) => transitionTo(next))

watch(
	() => props.active,
	(next) => {
		if (!ready) return
		if (next === false) conceal()
		else if (hasPointer) reveal()
	}
)

watch(labelMap, async () => {
	await nextTick()
	refreshLayout()
})

useGsapContext(() => {
	const root = rootRef.value
	const motion = motionRef.value
	const presence = presenceRef.value
	const pill = pillRef.value
	const target =
		props.boundary === "parent" ? root?.parentElement : document.documentElement
	if (!root || !motion || !presence || !pill || !target) return

	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
	ready = true

	setters = {
		x: gsap.quickSetter(root, "x", "px") as Setter,
		y: gsap.quickSetter(root, "y", "px") as Setter,
		rotation: gsap.quickSetter(motion, "rotation", "deg") as Setter,
		scaleX: gsap.quickSetter(motion, "scaleX") as Setter,
		scaleY: gsap.quickSetter(motion, "scaleY") as Setter,
	}

	gsap.set(root, { xPercent: -50, yPercent: -50 })
	gsap.set(presence, { opacity: 0, scale: HIDDEN_SCALE })
	displayed = activeState.value
	measureWidths()
	shownItem = resolveItem(displayed)
	const initialItem = itemRefs.get(shownItem)
	if (initialItem) gsap.set(initialItem, { opacity: 1 })
	const initialWidth = widths.get(shownItem)
	if (initialWidth) gsap.set(pill, { width: initialWidth })
	gsap.set(pill, { scale: STATE_SCALE[displayed] })

	const spinner = itemRefs.get("loading")?.querySelector("[data-spinner]")
	if (spinner) {
		spinnerTween = gsap.to(spinner, {
			rotation: 360,
			duration: 0.8,
			ease: "none",
			repeat: -1,
			paused: shownItem !== "loading",
		})
	}

	document.fonts?.ready.then(refreshLayout)

	target.addEventListener("pointermove", onPointerMove, { passive: true, capture: true })
	target.addEventListener("pointerleave", onPointerLeave, { passive: true })
	target.addEventListener("pointerdown", onPointerDown, { passive: true })
	window.addEventListener("pointerup", release, { passive: true })
	window.addEventListener("pointercancel", release, { passive: true })
	window.addEventListener("blur", release)

	return () => {
		ready = false
		visible = false
		hasPointer = false
		target.removeEventListener("pointermove", onPointerMove, true)
		target.removeEventListener("pointerleave", onPointerLeave)
		target.removeEventListener("pointerdown", onPointerDown)
		window.removeEventListener("pointerup", release)
		window.removeEventListener("pointercancel", release)
		window.removeEventListener("blur", release)
		gsap.ticker.remove(tick)
		tickerActive = false
		spinnerTween?.kill()
		spinnerTween = null
		setters = null
		gsap.killTweensOf([root, motion, presence, pill, ...itemRefs.values()])
	}
}, rootRef)
</script>

<template>
	<div
		ref="root"
		class="font-vg5000 pointer-events-none fixed top-0 left-0 z-500 text-[0.9rem] font-semibold tracking-[0.14em] uppercase"
		aria-hidden="true"
	>
		<div ref="motion">
			<div ref="presence" class="opacity-0">
				<div
					ref="pill"
					class="relative h-[2.7em] overflow-hidden rounded-full leading-none antialiased transition-colors duration-300"
					:style="{ backgroundColor: bgColor, color: textColor }"
				>
					<span
						v-for="item in itemStates"
						:key="item"
						:ref="(el) => registerItem(item, el)"
						class="absolute inset-0 flex items-center justify-center opacity-0"
					>
						<span
							class="box-fit inline-block w-max items-center gap-[0.7em] px-[1.5em] whitespace-nowrap"
						>
							<span
								v-if="item === 'loading'"
								data-spinner
								class="shrink-0 rounded-full"
							/>
							{{ labelMap[item] }}
						</span>
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
