<template>
	<div class="relative w-full" :style="outerStyle">
		<div
			ref="wrapperEl"
			class="flex items-center overflow-hidden"
			:class="rRotation ? 'absolute top-1/2 left-1/2' : 'relative w-full'"
			role="marquee"
			:aria-label="text"
			:style="innerStyle"
		>
			<span
				v-if="rOutline"
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0"
				:style="outlineLineStyle('top')"
			/>
			<div ref="railEl" class="flex w-max">
				<span
					v-for="n in rRepeatCount"
					:key="n"
					class="flex items-center whitespace-nowrap will-change-transform select-none"
					:class="itemClass"
					:style="{ marginInlineEnd: '3vw' }"
				>
					{{ text }}
				</span>
			</div>
			<span
				v-if="rOutline"
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0"
				:style="outlineLineStyle('bottom')"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { horizontalLoop } from "@/utils/gsap/horizontalLoop"

type Tier = "mobile" | "tablet" | "desktop"
type ResponsiveValue<T> = T | Partial<Record<Tier, T>>

const TIER_ORDER: Tier[] = ["mobile", "tablet", "desktop"]
const TABLET_MIN = 768
const DESKTOP_MIN = 1024

function isResponsiveObject<T>(value: unknown): value is Partial<Record<Tier, T>> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		Object.keys(value).some((k) => TIER_ORDER.includes(k as Tier))
	)
}

/** Cascade mobile-first : tablet hérite de mobile si absent, desktop hérite de tablet puis mobile. */
function resolveResponsive<T>(value: ResponsiveValue<T>, tier: Tier): T {
	if (!isResponsiveObject<T>(value)) return value as T
	for (let i = TIER_ORDER.indexOf(tier); i >= 0; i--) {
		const key = TIER_ORDER.at(i)
		if (key && value[key] !== undefined) return value[key] as T
	}
	return undefined as unknown as T
}

interface Props {
	text: string
	itemClass?: string
	repeatCount?: ResponsiveValue<number>
	baseSpeed?: ResponsiveValue<number>
	maxScrollBoost?: ResponsiveValue<number>
	enableScrollBoost?: ResponsiveValue<boolean>
	enableDirection?: ResponsiveValue<boolean>
	defaultDirection?: ResponsiveValue<"right" | "left">
	bg?: string
	rotation?: ResponsiveValue<number>
	height?: ResponsiveValue<string>
	rotatedWidth?: ResponsiveValue<string>
	outline?: ResponsiveValue<boolean>
	outlineColor?: ResponsiveValue<string>
	outlineWidth?: ResponsiveValue<string>
	outlineOffset?: ResponsiveValue<string>
	respectReducedMotion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	itemClass: "uppercase font-lineal-heavy text-[6vw] pr-[3vw]",
	repeatCount: 12,
	baseSpeed: 0.4,
	maxScrollBoost: 14,
	enableScrollBoost: true,
	enableDirection: true,
	defaultDirection: "left",
	rotation: 0,
	height: "auto",
	rotatedWidth: "150%",
	outline: false,
	outlineColor: "currentColor",
	outlineWidth: "10px",
	outlineOffset: "10px",
	respectReducedMotion: true,
})

const wrapperEl = shallowRef<HTMLElement | null>(null)
const railEl = shallowRef<HTMLElement | null>(null)

// --- Tracking du tier courant (mobile / tablet / desktop) ---
const tier = shallowRef<Tier>("mobile")

onMounted(() => {
	const tabletMql = window.matchMedia(`(min-width: ${TABLET_MIN}px)`)
	const desktopMql = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)

	function updateTier() {
		tier.value = desktopMql.matches ? "desktop" : tabletMql.matches ? "tablet" : "mobile"
	}

	updateTier()
	tabletMql.addEventListener("change", updateTier)
	desktopMql.addEventListener("change", updateTier)

	onScopeDispose(() => {
		tabletMql.removeEventListener("change", updateTier)
		desktopMql.removeEventListener("change", updateTier)
	})
})
// --- Résolution des props responsive pour le tier courant ---
const rRepeatCount = computed(() => resolveResponsive(props.repeatCount, tier.value))
const rBaseSpeed = computed(() => resolveResponsive(props.baseSpeed, tier.value))
const rMaxScrollBoost = computed(() =>
	resolveResponsive(props.maxScrollBoost, tier.value)
)
const rEnableScrollBoost = computed(() =>
	resolveResponsive(props.enableScrollBoost, tier.value)
)
const rEnableDirection = computed(() =>
	resolveResponsive(props.enableDirection, tier.value)
)
const rDefaultDirection = computed(() =>
	resolveResponsive(props.defaultDirection, tier.value)
)
const rRotation = computed(() => resolveResponsive(props.rotation, tier.value))
const rHeight = computed(() => resolveResponsive(props.height, tier.value))
const rRotatedWidth = computed(() => resolveResponsive(props.rotatedWidth, tier.value))
const rOutline = computed(() => resolveResponsive(props.outline, tier.value))
const rOutlineColor = computed(() => resolveResponsive(props.outlineColor, tier.value))
const rOutlineWidth = computed(() => resolveResponsive(props.outlineWidth, tier.value))
const rOutlineOffset = computed(() => resolveResponsive(props.outlineOffset, tier.value))

const outerStyle = computed(() => ({
	height: rHeight.value,
	background: rRotation.value ? undefined : props.bg,
}))

const innerStyle = computed(() => ({
	...(rRotation.value
		? {
				width: rRotatedWidth.value,
				height: rHeight.value,
				background: props.bg,
				transform: `translate(-50%, -50%) rotate(${rRotation.value}deg)`,
			}
		: { height: "100%" }),
	contain: "style paint",
}))

function outlineLineStyle(side: "top" | "bottom") {
	return {
		[side]: rOutlineOffset.value,
		height: rOutlineWidth.value,
		background: rOutlineColor.value,
	}
}

const { useGsapContext } = useGsap()

useGsapContext(({ gsap, ScrollTrigger }) => {
	if (!railEl.value) return

	const reducedMotion =
		props.respectReducedMotion &&
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches

	const FRICTION = 0.92
	const SMOOTHING = 0.18
	const VELOCITY_DIVISOR = 160
	const MAX_RAW_VELOCITY = 6000
	const MAX_DELTA_RATIO = 3

	let loop: ReturnType<typeof horizontalLoop> | null = null
	let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
	let rawVelocity = 0
	let currentTimeScale = 1
	let scrollDir = 1

	function tick() {
		if (!loop) return
		const ratio = Math.min(gsap.ticker.deltaRatio(), MAX_DELTA_RATIO)
		rawVelocity *= Math.pow(FRICTION, ratio)

		const boost = rEnableScrollBoost.value
			? gsap.utils.clamp(0, rMaxScrollBoost.value, rawVelocity / VELOCITY_DIVISOR)
			: 0

		const baseDir = rDefaultDirection.value === "right" ? -1 : 1
		const effectiveDirection = rEnableDirection.value ? baseDir * scrollDir : baseDir
		const target = effectiveDirection * (1 + boost)

		const lerpFactor = 1 - Math.pow(1 - SMOOTHING, ratio)
		currentTimeScale += (target - currentTimeScale) * lerpFactor

		loop.timeScale(currentTimeScale)
	}

	function handleVisibilityChange() {
		if (!document.hidden) rawVelocity = 0
	}

	function teardown() {
		document.removeEventListener("visibilitychange", handleVisibilityChange)
		scrollTrigger?.kill()
		gsap.ticker.remove(tick)
		loop?.kill()
		loop = null
		scrollTrigger = null
	}

	function init() {
		if (!railEl.value) return
		const items = Array.from(railEl.value.children) as HTMLElement[]
		if (!items.length) return

		const baseDir = rDefaultDirection.value === "right" ? -1 : 1
		currentTimeScale = baseDir
		rawVelocity = 0

		loop = horizontalLoop(gsap, items, {
			repeat: -1,
			speed: rBaseSpeed.value,
			paddingRight: 0,
		})

		if (reducedMotion) {
			loop.timeScale(baseDir)
			return
		}

		scrollTrigger = ScrollTrigger.create({
			trigger: wrapperEl.value,
			start: "top bottom",
			end: "bottom top",
			invalidateOnRefresh: true,
			onUpdate(self) {
				if (rEnableDirection.value) scrollDir = self.direction || scrollDir
				const v = Math.min(Math.abs(self.getVelocity()), MAX_RAW_VELOCITY)
				rawVelocity = Math.max(rawVelocity, v)
			},
			onToggle(self) {
				if (self.isActive) {
					rawVelocity = 0
					loop?.play()
					gsap.ticker.add(tick)
				} else {
					loop?.pause()
					gsap.ticker.remove(tick)
				}
			},
		})
	}

	document.addEventListener("visibilitychange", handleVisibilityChange)
	init()

	// Rebuild la loop quand le tier change repeatCount, baseSpeed ou la direction
	const stopWatch = watch(
		[rRepeatCount, rBaseSpeed, rEnableScrollBoost, rEnableDirection, rDefaultDirection],
		() => {
			teardown()
			nextTick(init)
		},
		{ flush: "post" }
	)

	return () => {
		stopWatch()
		teardown()
	}
}, wrapperEl)
</script>
