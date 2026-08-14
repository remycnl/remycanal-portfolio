<script setup lang="ts">
type Variant = "black" | "black-light" | "white" | "gray-light" | "lime" | "violet"

const BG: Record<Variant, string> = {
	black: "bg-black",
	"black-light": "bg-black-light",
	white: "bg-white",
	"gray-light": "bg-gray-light",
	lime: "bg-lime",
	violet: "bg-violet",
}

const TEXT_ON: Record<Variant, string> = {
	black: "text-white",
	"black-light": "text-white",
	white: "text-black",
	"gray-light": "text-black",
	lime: "text-black",
	violet: "text-white",
}

const ICON_BASE_ON_BUBBLE: Record<Variant, "white" | "black"> = {
	black: "white",
	"black-light": "white",
	white: "black",
	"gray-light": "black",
	lime: "black",
	violet: "white",
}

const ICON_TEXT_CLASS: Record<"white" | "black" | "black-light" | "gray-light", string> =
	{
		white: "text-white",
		black: "text-black",
		"black-light": "text-black-light",
		"gray-light": "text-gray-light",
	}

function resolveIconVariant(pill: Variant, bubble: Variant) {
	const base = ICON_BASE_ON_BUBBLE[bubble]
	if (pill === "black-light" && base === "black") return "black-light"
	if (pill === "gray-light" && base === "white") return "gray-light"
	return base
}

type Size = "extrasmall" | "small" | "normal" | "medium" | "large"

interface SizeConfig {
	pillClass: string
	bubbleClass: string
	prClass: string
	iconClass: string
	text: string
}

const SIZES: Record<Size, SizeConfig> = {
	extrasmall: {
		pillClass:
			"h-[clamp(1.75rem,1.662rem_+_0.352vw,2rem)] px-[clamp(1rem,0.956rem_+_0.176vw,1.125rem)]",
		bubbleClass:
			"h-[clamp(1.75rem,1.662rem_+_0.352vw,2rem)] w-[clamp(1.75rem,1.662rem_+_0.352vw,2rem)]",
		prClass: "pr-[clamp(1.75rem,1.662rem_+_0.352vw,2rem)]",
		iconClass: "w-[clamp(0.6875rem,0.6435rem_+_0.176vw,0.8125rem)]",
		text: "text-xs",
	},
	small: {
		pillClass:
			"h-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)] px-[clamp(1.25rem,1.162rem_+_0.352vw,1.5rem)]",
		bubbleClass:
			"h-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)] w-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		prClass: "pr-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		iconClass: "w-[clamp(0.8125rem,0.7575rem_+_0.22vw,0.96875rem)]",
		text: "text-sm",
	},
	normal: {
		pillClass:
			"h-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)] px-[clamp(1.5rem,1.412rem_+_0.352vw,1.75rem)]",
		bubbleClass:
			"h-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)] w-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)]",
		prClass: "pr-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)]",
		iconClass: "w-[clamp(0.9375rem,0.8714rem_+_0.264vw,1.125rem)]",
		text: "text-base",
	},
	medium: {
		pillClass:
			"h-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)] px-[clamp(1.6875rem,1.577rem_+_0.44vw,2rem)]",
		bubbleClass:
			"h-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)] w-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)]",
		prClass: "pr-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)]",
		iconClass: "w-[clamp(1.09375rem,1.0168rem_+_0.308vw,1.3125rem)]",
		text: "text-lg",
	},
	large: {
		pillClass:
			"h-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)] px-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		bubbleClass:
			"h-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)] w-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)]",
		prClass: "pr-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)]",
		iconClass: "w-[clamp(1.3125rem,1.2245rem_+_0.352vw,1.5625rem)]",
		text: "text-xl",
	},
}

interface Props {
	label?: string
	size?: Size
	pill?: Variant
	bubble?: Variant
	nuxtlink?: boolean
	to?: string
}

const props = withDefaults(defineProps<Props>(), {
	label: "Button",
	size: "normal",
	pill: "black",
	bubble: "lime",
	nuxtlink: true,
	to: undefined,
})

const size = computed(() => SIZES[props.size])

const pillClasses = computed(() => [
	BG[props.pill],
	TEXT_ON[props.pill],
	size.value.pillClass,
])
// L'élément "outer" (position) ne porte QUE la taille, pas de fond.
const bubbleOuterClasses = computed(() => [size.value.bubbleClass])
// L'élément "visual" porte le fond + forme : c'est LUI qui reçoit le scale
// de press, donc c'est bien toute la bulle (fond + icône) qui se compresse.
const bubbleVisualClasses = computed(() => [BG[props.bubble]])
const iconClasses = computed(() => [
	ICON_TEXT_CLASS[resolveIconVariant(props.pill, props.bubble)],
	size.value.iconClass,
])

const rootEl = shallowRef<HTMLElement | any>(null)
const pillEl = shallowRef<HTMLElement | null>(null)
// bubbleEl : position uniquement (x, y) — mesure aussi offsetWidth pour le travel.
const bubbleEl = shallowRef<HTMLElement | null>(null)
// bubbleScaleEl : scale/rotation/opacity de la timeline d'entrée.
const bubbleScaleEl = shallowRef<HTMLElement | null>(null)
// bubblePressEl : fond visible + icône. C'est CET élément que le press scale
// cible → visuellement "toute la bulle" réagit au clic. Comme il s'agit d'un
// 3e élément distinct (transform séparé de bubbleScaleEl), aucun conflit
// GSAP n'est possible, quel que soit l'état d'avancement de la timeline.
const bubblePressEl = shallowRef<HTMLElement | null>(null)

const { gsap } = useGsap()

let tl: gsap.core.Timeline | null = null
let timelineReady = false
let ro: ResizeObserver | null = null
let resizeRaf = 0

const reduceMotion =
	typeof window !== "undefined" &&
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function buildTimeline() {
	if (!bubbleEl.value || !bubbleScaleEl.value) return

	const travel = pillEl.value?.offsetWidth ?? 0
	const shift = bubbleEl.value.offsetWidth

	tl?.kill()

	const toggleWillChange = (v: "transform" | "auto") =>
		gsap.set([pillEl.value, bubbleEl.value, bubbleScaleEl.value], { willChange: v })

	if (reduceMotion) {
		tl = gsap
			.timeline({
				paused: true,
				onStart: () => toggleWillChange("transform"),
				onReverseComplete: () => toggleWillChange("auto"),
			})
			.to(pillEl.value, { x: shift, duration: 0.25, ease: "power2.out" }, 0)
			.to(bubbleEl.value, { x: -travel, duration: 0.25, ease: "power2.out" }, 0)
		return
	}

	tl = gsap
		.timeline({
			paused: true,
			defaults: { transformOrigin: "50% 50%", force3D: true },
			onStart: () => toggleWillChange("transform"),
			onReverseComplete: () => toggleWillChange("auto"),
		})
		.to(pillEl.value, { x: shift, duration: 0.48, ease: "power3.inOut" }, 0)
		.to(
			pillEl.value,
			{ scaleY: 0.92, scaleX: 1.015, duration: 0.12, ease: "power2.out" },
			0
		)
		.to(
			pillEl.value,
			{ scaleY: 1, scaleX: 1, duration: 0.36, ease: "elastic.out(1, 0.55)" },
			0.12
		)
		// Position (bubbleEl) : x/y du trajet
		.to(
			bubbleEl.value,
			{ x: () => -travel * 0.52, y: -5, duration: 0.18, ease: "power2.in" },
			0
		)
		.to(
			bubbleEl.value,
			{ x: () => -travel, y: 0, duration: 0.22, ease: "power3.out" },
			0.16
		)
		// Scale/rotation/opacity du bounce (bubbleScaleEl) — séparé du press.
		.to(
			bubbleScaleEl.value,
			{ scale: 0.2, rotation: -180, opacity: 0.12, duration: 0.18, ease: "power2.in" },
			0
		)
		.to(
			bubbleScaleEl.value,
			{ scale: 1.1, rotation: 0, opacity: 1, duration: 0.22, ease: "power3.out" },
			0.16
		)
		.to(bubbleScaleEl.value, { scale: 1, duration: 0.14, ease: "power2.out" }, 0.38)
}

function ensureTimeline() {
	if (timelineReady) return
	buildTimeline()
	timelineReady = true
}

/**
 * ---------------------------------------------------------------------
 * STATE MACHINE — source de vérité unique. Toute transition passe par
 * setState(), jamais d'appel direct à tl.play()/reverse() ailleurs.
 * ---------------------------------------------------------------------
 */
type UIState = "idle" | "hover" | "pressed"
let state: UIState = "idle"
let activePointerId: number | null = null

function applyVisualForState(next: UIState) {
	ensureTimeline()
	if (next === "idle") tl?.reverse()
	else tl?.play()
}

function setState(next: UIState) {
	if (state === next) return
	state = next
	applyVisualForState(next)
}

/** Résout le vrai noeud DOM, que rootEl soit un HTMLElement ou une instance
 * de composant (ex: NuxtLink) qui expose $el. */
function resolveEl(ref: any): HTMLElement | null {
	if (!ref) return null
	if (ref instanceof HTMLElement) return ref
	if (ref.$el instanceof HTMLElement) return ref.$el
	return null
}

/** Hit-test réel aux coordonnées données — fiable même sous pointer capture
 * (contrairement à :hover qui peut rester "collé" tant que la capture n'a
 * pas été relâchée depuis assez longtemps pour que le navigateur recalcule). */
function isPointOverElement(el: HTMLElement | null, x: number, y: number): boolean {
	if (!el || typeof document === "undefined") return false
	const hit = document.elementFromPoint(x, y)
	return !!(hit && el.contains(hit))
}

function onPointerEnter(e: PointerEvent) {
	if (e.pointerType === "touch") return
	if (state === "pressed") return
	setState("hover")
}

function onPointerLeave(e: PointerEvent) {
	if (e.pointerType === "touch") return
	if (state === "pressed") return
	setState("idle")
}

function onFocus() {
	if (state === "pressed") return
	setState("hover")
}
function onFocusOut() {
	if (state === "pressed") return
	setState("idle")
}

function onPointerDown(e: PointerEvent) {
	if (activePointerId !== null) return // ignore un 2e pointeur pendant un press
	activePointerId = e.pointerId

	const target = e.currentTarget as HTMLElement
	target.setPointerCapture?.(e.pointerId)

	setState("pressed")
	pressDown()

	window.addEventListener("pointerup", onWindowRelease)
	window.addEventListener("pointercancel", onWindowRelease)
	window.addEventListener("blur", onWindowBlur)
	document.addEventListener("visibilitychange", onVisibilityChange)
}

function resolvePointerUp(
	pointerId: number | null,
	target: HTMLElement | null,
	clientX: number | null,
	clientY: number | null,
	pointerType: string | undefined
) {
	if (activePointerId === null) return
	if (pointerId !== null && pointerId !== activePointerId) return

	if (target && target.hasPointerCapture?.(activePointerId!)) {
		target.releasePointerCapture(activePointerId!)
	}
	activePointerId = null

	window.removeEventListener("pointerup", onWindowRelease)
	window.removeEventListener("pointercancel", onWindowRelease)
	window.removeEventListener("blur", onWindowBlur)
	document.removeEventListener("visibilitychange", onVisibilityChange)

	releasePress()

	// Pas de coordonnées fiables (blur/visibilitychange) ou tactile → idle,
	// c'est l'état sûr par défaut, jamais de risque de rester "collé" en hover.
	if (pointerType === "touch" || clientX === null || clientY === null) {
		setState("idle")
		return
	}

	setState(isPointOverElement(target, clientX, clientY) ? "hover" : "idle")
}

function onPointerUp(e: PointerEvent) {
	resolvePointerUp(
		e.pointerId,
		e.currentTarget as HTMLElement,
		e.clientX,
		e.clientY,
		e.pointerType
	)
}
function onPointerCancel(e: PointerEvent) {
	resolvePointerUp(
		e.pointerId,
		e.currentTarget as HTMLElement,
		e.clientX,
		e.clientY,
		e.pointerType
	)
}
function onLostPointerCapture(e: PointerEvent) {
	resolvePointerUp(
		e.pointerId,
		e.currentTarget as HTMLElement,
		e.clientX,
		e.clientY,
		e.pointerType
	)
}
function onWindowRelease(e: PointerEvent) {
	resolvePointerUp(
		e.pointerId,
		resolveEl(rootEl.value),
		e.clientX,
		e.clientY,
		e.pointerType
	)
}
function onWindowBlur() {
	resolvePointerUp(activePointerId, resolveEl(rootEl.value), null, null, undefined)
}
function onVisibilityChange() {
	if (document.hidden) {
		resolvePointerUp(activePointerId, resolveEl(rootEl.value), null, null, undefined)
	}
}

/**
 * Feedback de press — cible bubblePressEl, qui porte le fond ET l'icône :
 * c'est donc bien "toute la bulle" qui réagit visuellement. S'applique
 * immédiatement, que la timeline d'entrée soit finie ou non, car c'est un
 * élément distinct de celui animé par la timeline (bubbleScaleEl).
 */
function pressDown() {
	if (!bubblePressEl.value) return
	gsap.to(bubblePressEl.value, {
		scale: 0.86,
		duration: 0.16,
		ease: "power2.out",
		overwrite: "auto",
	})
}
function releasePress() {
	if (!bubblePressEl.value) return
	gsap.to(bubblePressEl.value, {
		scale: 1,
		duration: 0.32,
		ease: "back.out(2.4)",
		overwrite: "auto",
	})
}

onMounted(() => {
	if (pillEl.value && "ResizeObserver" in window) {
		ro = new ResizeObserver(() => {
			if (!tl || tl.progress() !== 0) return
			cancelAnimationFrame(resizeRaf)
			resizeRaf = requestAnimationFrame(() => buildTimeline())
		})
		ro.observe(pillEl.value)
	}
})

onUnmounted(() => {
	cancelAnimationFrame(resizeRaf)
	ro?.disconnect()
	tl?.kill()
	if (bubbleEl.value) gsap.killTweensOf(bubbleEl.value)
	if (bubbleScaleEl.value) gsap.killTweensOf(bubbleScaleEl.value)
	if (bubblePressEl.value) gsap.killTweensOf(bubblePressEl.value)
	window.removeEventListener("pointerup", onWindowRelease)
	window.removeEventListener("pointercancel", onWindowRelease)
	window.removeEventListener("blur", onWindowBlur)
	document.removeEventListener("visibilitychange", onVisibilityChange)
})

const NuxtLinkComp = resolveComponent("NuxtLink")
const rootTag = computed(() => (props.nuxtlink ? NuxtLinkComp : "button"))
const rootAttrs = computed(() =>
	props.nuxtlink ? { to: props.to ?? "#" } : { type: "button" }
)
</script>

<template>
	<component
		:is="rootTag"
		ref="rootEl"
		v-bind="rootAttrs"
		:class="size.prClass"
		class="relative inline-flex items-center contain-layout outline-none"
		@pointerenter="onPointerEnter"
		@pointerleave="onPointerLeave"
		@pointerdown="onPointerDown"
		@pointerup="onPointerUp"
		@pointercancel="onPointerCancel"
		@lostpointercapture="onLostPointerCapture"
		@focus="onFocus"
		@focusout="onFocusOut"
	>
		<span
			ref="bubbleEl"
			:class="bubbleOuterClasses"
			class="absolute top-1/2 right-0 z-0 -translate-y-1/2"
		>
			<span ref="bubbleScaleEl" class="flex h-full w-full items-center justify-center">
				<span
					ref="bubblePressEl"
					:class="bubbleVisualClasses"
					class="flex h-full w-full items-center justify-center rounded-full pl-1"
				>
					<svg
						:class="iconClasses"
						class="block aspect-16/19"
						viewBox="0 0 16 19"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="1.61321" cy="1.61321" r="1.5" fill="currentColor" />
						<circle cx="5.73583" cy="1.61321" r="1.5" fill="currentColor" />
						<circle cx="5.73583" cy="5.5566" r="1.5" fill="currentColor" />
						<circle cx="9.85851" cy="5.5566" r="1.5" fill="currentColor" />
						<circle cx="9.85851" cy="9.5" r="1.5" fill="currentColor" />
						<circle cx="13.9811" cy="9.5" r="1.5" fill="currentColor" />
						<circle cx="5.73583" cy="13.4434" r="1.5" fill="currentColor" />
						<circle cx="9.85851" cy="13.4434" r="1.5" fill="currentColor" />
						<circle cx="1.61321" cy="17.3868" r="1.5" fill="currentColor" />
						<circle cx="5.73583" cy="17.3868" r="1.5" fill="currentColor" />
					</svg>
				</span>
			</span>
		</span>
		<span
			ref="pillEl"
			:class="pillClasses"
			class="relative z-10 font-vg5000 flex items-center justify-center rounded-full whitespace-nowrap"
		>
			<span :class="size.text">
				{{ label }}
			</span>
		</span>
	</component>
</template>
