<script setup lang="ts">
export type BadgeState = "idle" | "press" | "drag" | "loading" | "view"

export interface BadgeProps {
	/** Background color of the pill. Accepts any CSS color or a Tailwind theme variable, e.g. `var(--color-lime)`. */
	bgColor?: string
	/** Text color of the pill. Accepts any CSS color or a Tailwind theme variable, e.g. `var(--color-black)`. */
	textColor?: string
	/** Externally controlled state. When defined it overrides the pointer-derived states (idle, press, drag). */
	state?: BadgeState
	/** Label per state. Missing states fall back to the built-in default label. The text animates whenever the resolved label changes, whether the state or the label itself changed. States that resolve to the same label only animate the pill scale. */
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

/** One text layer of the pill. A new layer is created each time the resolved face changes. */
interface Layer {
	id: number
	label: string
	loading: boolean
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
/** Below this opacity the pill counts as hidden: changes are applied instantly instead of animated. */
const SHOWN_OPACITY = 0.02

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

const fontsReady = useFontsReady()

const interactionState = shallowRef<BadgeState>("idle")
const activeState = computed<BadgeState>(() => props.state ?? interactionState.value)

const labelMap = computed<Record<BadgeState, string>>(
	() =>
		Object.fromEntries(
			STATES.map((state) => [state, props.labels[state] ?? DEFAULT_LABELS[state]])
		) as Record<BadgeState, string>
)

/** What the pill must currently display. */
const face = computed(() => ({
	label: labelMap.value[activeState.value],
	loading: activeState.value === "loading",
}))

/** Primitive key: a new `labels` object with identical content never triggers a transition. */
const faceKey = computed(() => `${face.value.loading ? "l" : "t"}|${face.value.label}`)

let layerSeq = 0
function createLayer(): Layer {
	return { id: ++layerSeq, ...face.value }
}

const layers = shallowRef<Layer[]>([createLayer()])
const layerEls = new Map<number, HTMLElement>()

let setters: Setters | null = null
let currentLayerId = layers.value[0]!.id
let displayed: BadgeState = activeState.value
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

function duration(value: number) {
	return reducedMotion ? 0 : value
}

function isShown() {
	const presence = presenceRef.value
	return !!presence && Number(gsap.getProperty(presence, "opacity")) > SHOWN_OPACITY
}

function registerLayer(id: number, el: unknown) {
	if (el instanceof HTMLElement) layerEls.set(id, el)
	else layerEls.delete(id)
}

function measureLayer(id: number) {
	const inner = layerEls.get(id)?.firstElementChild
	return inner instanceof HTMLElement ? inner.offsetWidth : 0
}

function dropLayer(id: number) {
	const el = layerEls.get(id)
	if (el) gsap.killTweensOf(el)
	layers.value = layers.value.filter((layer) => layer.id !== id)
}

function syncCurrentWidth() {
	const pill = pillRef.value
	if (!ready || !pill) return
	const width = measureLayer(currentLayerId)
	if (width) gsap.set(pill, { width })
}

/** Animated transition: the new layer enters from below, the old ones leave through the top. */
function swapTo(layer: Layer) {
	const pill = pillRef.value
	const el = layerEls.get(layer.id)
	if (!ready || !pill || !el) return

	currentLayerId = layer.id

	for (const [id, item] of layerEls) {
		if (id === layer.id) continue
		if (Number(gsap.getProperty(item, "opacity")) > 0.01) {
			gsap.to(item, {
				opacity: 0,
				yPercent: -80,
				duration: duration(0.2),
				ease: "power2.in",
				overwrite: true,
				onComplete: () => {
					if (id !== currentLayerId) dropLayer(id)
				},
			})
		} else {
			dropLayer(id)
		}
	}

	gsap.set(el, { opacity: 0, yPercent: 80 })
	gsap.to(el, {
		opacity: 1,
		yPercent: 0,
		duration: duration(0.35),
		delay: reducedMotion ? 0 : 0.08,
		ease: "power3.out",
		overwrite: true,
	})

	const width = measureLayer(layer.id)
	if (width) {
		gsap.to(pill, {
			width,
			duration: duration(0.5),
			ease: "expo.out",
			overwrite: "auto",
		})
	}
}

/** Instant transition, used while the pill is hidden. */
function snapTo(layer: Layer) {
	const el = layerEls.get(layer.id)
	if (!ready || !el) return
	currentLayerId = layer.id
	for (const id of [...layerEls.keys()]) {
		if (id !== layer.id) dropLayer(id)
	}
	gsap.set(el, { opacity: 1, yPercent: 0 })
	syncCurrentWidth()
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
		duration: duration(0.5),
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
		duration: duration(0.3),
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

function scalePill(next: BadgeState) {
	const pill = pillRef.value
	if (!ready || !pill || next === displayed) return
	displayed = next

	if (!isShown()) {
		gsap.killTweensOf(pill, "scale")
		gsap.set(pill, { scale: STATE_SCALE[next] })
		return
	}

	gsap.to(pill, {
		scale: STATE_SCALE[next],
		duration: duration(next === "press" ? 0.2 : 0.7),
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

watch(activeState, scalePill)

// Text transition: fires for state changes AND for label changes within the same state.
watch(faceKey, async () => {
	const layer = createLayer()
	if (!ready) {
		layers.value = [layer]
		currentLayerId = layer.id
		return
	}
	const animate = isShown()
	layers.value = [...layers.value, layer]
	await nextTick()
	if (!ready) return
	if (animate) swapTo(layer)
	else snapTo(layer)
})

watch(
	() => props.active,
	(next) => {
		if (!ready) return
		if (next === false) conceal()
		else if (hasPointer) reveal()
	}
)

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

	// Initial layer: shown immediately, no transition.
	currentLayerId = layers.value.at(-1)!.id
	const initial = layerEls.get(currentLayerId)
	if (initial) gsap.set(initial, { opacity: 1, yPercent: 0 })
	syncCurrentWidth()
	gsap.set(pill, { scale: STATE_SCALE[displayed] })

	waitForFontsReady(fontsReady).then(() => {
		if (ready) syncCurrentWidth()
	})

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
		setters = null
		gsap.killTweensOf([root, motion, presence, pill, ...layerEls.values()])
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
						v-for="layer in layers"
						:key="layer.id"
						:ref="(el) => registerLayer(layer.id, el)"
						class="absolute inset-0 flex items-center justify-center opacity-0 will-change-[transform,opacity]"
					>
						<span
							class="inline-flex w-max items-center gap-[0.7em] px-[1.5em] whitespace-nowrap"
						>
							<span
								v-if="layer.loading"
								class="size-cap shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-[spin_1.6s_linear_infinite]"
							/>
							<span class="text-fit block">{{ layer.label }}</span>
						</span>
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
