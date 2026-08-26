<template>
	<div class="relative w-full" :style="outerStyle">
		<div
			ref="wrapperEl"
			class="flex items-center overflow-hidden"
			:class="rotation ? 'absolute top-1/2 left-1/2' : 'relative w-full'"
			role="marquee"
			:aria-label="text"
			:style="innerStyle"
		>
			<span
				v-if="outline"
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0"
				:style="outlineLineStyle('top')"
			/>
			<div ref="railEl" class="flex w-max">
				<span
					v-for="n in repeatCount"
					:key="n"
					class="flex items-center whitespace-nowrap will-change-transform"
					:class="itemClass"
					:style="{ marginInlineEnd: '3vw' }"
				>
					{{ text }}
				</span>
			</div>
			<span
				v-if="outline"
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0"
				:style="outlineLineStyle('bottom')"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { horizontalLoop } from "~/utils/gsap/horizontalLoop"

interface Props {
	text: string
	itemClass?: string
	repeatCount?: number
	baseSpeed?: number
	maxScrollBoost?: number
	enableScrollBoost?: boolean
	enableDirection?: boolean
	defaultDirection?: "right" | "left"
	bg?: string
	rotation?: number
	height?: string
	rotatedWidth?: string
	outline?: boolean
	outlineColor?: string
	outlineWidth?: string
	outlineOffset?: string
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

const outerStyle = computed(() => ({
	height: props.height,
	background: props.rotation ? undefined : props.bg,
}))

const innerStyle = computed(() => ({
	...(props.rotation
		? {
				width: props.rotatedWidth,
				height: props.height,
				background: props.bg,
				transform: `translate(-50%, -50%) rotate(${props.rotation}deg)`,
			}
		: { height: "100%" }),
	contain: "style paint",
}))

function outlineLineStyle(side: "top" | "bottom") {
	return {
		[side]: props.outlineOffset,
		height: props.outlineWidth,
		background: props.outlineColor,
	}
}

const { useGsapContext } = useGsap()

useGsapContext(({ gsap, ScrollTrigger }) => {
	if (!railEl.value) return
	const items = Array.from(railEl.value.children) as HTMLElement[]
	if (!items.length) return

	const reducedMotion =
		props.respectReducedMotion &&
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches

	const loop = horizontalLoop(gsap, items, {
		repeat: -1,
		speed: props.baseSpeed,
		paddingRight: 0,
	})

	if (reducedMotion) {
		loop.timeScale(props.defaultDirection === "right" ? -1 : 1)
		return () => loop.kill()
	}

	const baseDir = props.defaultDirection === "right" ? -1 : 1
	let scrollDir = 1

	let rawVelocity = 0
	let currentTimeScale = baseDir

	const FRICTION = 0.92
	const SMOOTHING = 0.18
	const VELOCITY_DIVISOR = 160
	const MAX_RAW_VELOCITY = 6000
	const MAX_DELTA_RATIO = 3
	const enableScrollBoost = props.enableScrollBoost
	const enableDirection = props.enableDirection
	const maxScrollBoost = props.maxScrollBoost

	const scrollTrigger = ScrollTrigger.create({
		trigger: wrapperEl.value,
		start: "top bottom",
		end: "bottom top",
		invalidateOnRefresh: true,
		onUpdate(self) {
			if (enableDirection) {
				scrollDir = self.direction || scrollDir
			}
			const v = Math.min(Math.abs(self.getVelocity()), MAX_RAW_VELOCITY)
			rawVelocity = Math.max(rawVelocity, v)
		},
		onToggle(self) {
			if (self.isActive) {
				rawVelocity = 0
				loop.play()
				gsap.ticker.add(tick)
			} else {
				loop.pause()
				gsap.ticker.remove(tick)
			}
		},
	})

	function handleVisibilityChange() {
		if (!document.hidden) {
			rawVelocity = 0
		}
	}
	document.addEventListener("visibilitychange", handleVisibilityChange)

	function tick() {
		const ratio = Math.min(gsap.ticker.deltaRatio(), MAX_DELTA_RATIO)

		rawVelocity *= Math.pow(FRICTION, ratio)

		const boost = enableScrollBoost
			? gsap.utils.clamp(0, maxScrollBoost, rawVelocity / VELOCITY_DIVISOR)
			: 0

		const effectiveDirection = enableDirection ? baseDir * scrollDir : baseDir
		const target = effectiveDirection * (1 + boost)

		const lerpFactor = 1 - Math.pow(1 - SMOOTHING, ratio)
		currentTimeScale += (target - currentTimeScale) * lerpFactor

		loop.timeScale(currentTimeScale)
	}

	return () => {
		document.removeEventListener("visibilitychange", handleVisibilityChange)
		scrollTrigger.kill()
		gsap.ticker.remove(tick)
		loop.kill()
	}
}, wrapperEl)
</script>
