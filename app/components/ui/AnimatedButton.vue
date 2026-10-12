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
		text: "text-xs text-fit-x",
	},
	small: {
		pillClass:
			"h-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)] px-[clamp(1.25rem,1.162rem_+_0.352vw,1.5rem)]",
		bubbleClass:
			"h-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)] w-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		prClass: "pr-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		iconClass: "w-[clamp(0.8125rem,0.7575rem_+_0.22vw,0.96875rem)]",
		text: "text-sm text-fit-x",
	},
	normal: {
		pillClass:
			"h-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)] px-[clamp(1.5rem,1.412rem_+_0.352vw,1.75rem)]",
		bubbleClass:
			"h-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)] w-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)]",
		prClass: "pr-[clamp(2.5625rem,2.408rem_+_0.616vw,3rem)]",
		iconClass: "w-[clamp(0.9375rem,0.8714rem_+_0.264vw,1.125rem)]",
		text: "text-base text-fit-x",
	},
	medium: {
		pillClass:
			"h-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)] px-[clamp(1.6875rem,1.577rem_+_0.44vw,2rem)]",
		bubbleClass:
			"h-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)] w-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)]",
		prClass: "pr-[clamp(3rem,2.824rem_+_0.704vw,3.5rem)]",
		iconClass: "w-[clamp(1.09375rem,1.0168rem_+_0.308vw,1.3125rem)]",
		text: "text-lg text-fit-x",
	},
	large: {
		pillClass:
			"h-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)] px-[clamp(2.125rem,1.993rem_+_0.528vw,2.5rem)]",
		bubbleClass:
			"h-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)] w-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)]",
		prClass: "pr-[clamp(3.625rem,3.405rem_+_0.88vw,4.25rem)]",
		iconClass: "w-[clamp(1.3125rem,1.2245rem_+_0.352vw,1.5625rem)]",
		text: "text-xl text-fit-x",
	},
}

interface Props {
	/** Text displayed inside the pill. */
	label?: string
	/** Controls pill height, padding, icon size and text size. */
	size?: Size
	/** Background variant of the pill. */
	pill?: Variant
	/** Background variant of the icon bubble. */
	bubble?: Variant
	/** Renders a `NuxtLink` when true, otherwise a `button`. */
	nuxtlink?: boolean
	/** Destination used when `nuxtlink` is true. */
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

const pillClasses = computed(() => [TEXT_ON[props.pill], size.value.pillClass])
const pillBgClasses = computed(() => [BG[props.pill]])
const bubbleOuterClasses = computed(() => [size.value.bubbleClass])
const bubbleVisualClasses = computed(() => [BG[props.bubble]])
const iconClasses = computed(() => [
	ICON_TEXT_CLASS[resolveIconVariant(props.pill, props.bubble)],
	size.value.iconClass,
])

interface Els {
	pill: HTMLElement
	pillBg: HTMLElement
	bubble: HTMLElement
	bubbleScale: HTMLElement
	bubblePress: HTMLElement
}

const pillEl = shallowRef<HTMLElement | null>(null)
const pillBgEl = shallowRef<HTMLElement | null>(null)
const bubbleEl = shallowRef<HTMLElement | null>(null)
const bubbleScaleEl = shallowRef<HTMLElement | null>(null)
const bubblePressEl = shallowRef<HTMLElement | null>(null)

const { gsap } = useGsap()

const reduceMotion =
	typeof window !== "undefined" &&
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

const PRESS_IN = { duration: 0.16, ease: "power3.out", overwrite: "auto" } as const
const PRESS_OUT = reduceMotion
	? ({ duration: 0.2, ease: "power2.out", overwrite: "auto" } as const)
	: ({ duration: 0.55, ease: "back.out(2.2)", overwrite: "auto" } as const)

let els: Els | null = null
let tl: ReturnType<typeof gsap.timeline> | null = null
let ro: ResizeObserver | null = null
let travel = 0
let shift = 0
let active = false

const flags = { hover: false, focus: false, press: false }

function setWillChange(value: "transform" | "auto") {
	if (!els) return
	for (const el of [els.pill, els.bubble, els.bubbleScale]) {
		el.style.willChange = value
	}
}

function onRest() {
	if (!active) setWillChange("auto")
}

function buildTimeline({ pill, bubble, bubbleScale }: Els) {
	const timeline = gsap.timeline({
		paused: true,
		defaults: { force3D: true },
		onReverseComplete: onRest,
	})

	if (reduceMotion) {
		return timeline
			.to(pill, { x: () => shift, duration: 0.25, ease: "power2.out" }, 0)
			.to(bubble, { x: () => -travel, duration: 0.25, ease: "power2.out" }, 0)
	}

	return timeline
		.to(pill, { x: () => shift, duration: 0.6, ease: "back.inOut(1.35)" }, 0)
		.to(bubble, { x: () => -travel, duration: 0.5, ease: "power4.inOut" }, 0)
		.to(bubbleScale, { rotation: -360, duration: 0.5, ease: "power3.inOut" }, 0)
		.to(bubbleScale, { scale: 0.35, duration: 0.2, ease: "power2.in" }, 0)
		.to(bubbleScale, { scale: 1, duration: 0.4, ease: "back.out(2.4)" }, 0.2)
}

function refreshTimeline() {
	if (!tl) return
	const progress = tl.progress()
	tl.progress(0, true).invalidate().progress(progress, true)
}

function sync() {
	const next = flags.hover || flags.focus || flags.press
	if (next === active) return
	active = next
	if (!tl) return
	if (next) {
		setWillChange("transform")
		tl.timeScale(1).play()
		return
	}
	tl.timeScale(1.35).reverse()
}

function press(down: boolean) {
	if (!els) return
	const config = down ? PRESS_IN : PRESS_OUT
	gsap.to(els.pillBg, { ...config, scale: down ? 0.95 : 1 })
	gsap.to(els.bubblePress, { ...config, scale: down ? 0.8 : 1 })
}

function setPressed(value: boolean) {
	if (flags.press === value) return
	flags.press = value
	press(value)
}

function onPointerEnter(e: PointerEvent) {
	if (e.pointerType === "touch") return
	flags.hover = true
	sync()
}

function onPointerLeave() {
	flags.hover = false
	setPressed(false)
	sync()
}

function onPointerDown(e: PointerEvent) {
	if (!e.isPrimary || e.button !== 0) return
	setPressed(true)
	sync()
}

function onPointerRelease() {
	setPressed(false)
	sync()
}

function onFocus(e: FocusEvent) {
	flags.focus = (e.currentTarget as HTMLElement).matches(":focus-visible")
	sync()
}

function onFocusOut() {
	flags.focus = false
	sync()
}

onMounted(() => {
	const pill = pillEl.value
	const pillBg = pillBgEl.value
	const bubble = bubbleEl.value
	const bubbleScale = bubbleScaleEl.value
	const bubblePress = bubblePressEl.value
	if (!pill || !pillBg || !bubble || !bubbleScale || !bubblePress) return

	els = { pill, pillBg, bubble, bubbleScale, bubblePress }
	travel = pill.offsetWidth
	shift = bubble.offsetWidth
	tl = buildTimeline(els)

	ro = new ResizeObserver((entries) => {
		let changed = false
		for (const entry of entries) {
			const width = entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width
			if (entry.target === pill && width !== travel) {
				travel = width
				changed = true
			} else if (entry.target === bubble && width !== shift) {
				shift = width
				changed = true
			}
		}
		if (changed) refreshTimeline()
	})
	ro.observe(pill)
	ro.observe(bubble)
})

onBeforeUnmount(() => {
	ro?.disconnect()
	ro = null
	tl?.kill()
	tl = null
	if (els) gsap.killTweensOf([els.pillBg, els.bubblePress])
	els = null
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
		v-bind="rootAttrs"
		:class="size.prClass"
		class="relative inline-flex cursor-pointer touch-manipulation items-center align-middle contain-layout outline-none select-none [-webkit-tap-highlight-color:transparent]"
		@pointerenter="onPointerEnter"
		@pointerleave="onPointerLeave"
		@pointerdown="onPointerDown"
		@pointerup="onPointerRelease"
		@pointercancel="onPointerRelease"
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
			class="font-vg5000 relative z-10 flex items-center justify-center rounded-full whitespace-nowrap"
		>
			<span ref="pillBgEl" :class="pillBgClasses" class="absolute inset-0 -z-10 rounded-full" />
			<span :class="size.text">
				{{ label }}
			</span>
		</span>
	</component>
</template>