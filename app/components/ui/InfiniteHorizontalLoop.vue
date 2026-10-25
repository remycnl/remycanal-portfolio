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

function resolveResponsive<T>(value: ResponsiveValue<T>, tier: Tier): T {
	if (!isResponsiveObject<T>(value)) return value as T
	for (let i = TIER_ORDER.indexOf(tier); i >= 0; i--) {
		const key = TIER_ORDER.at(i)
		if (key && value[key] !== undefined) return value[key] as T
	}
	return undefined as unknown as T
}

function nextFrames(count = 2) {
	return new Promise<void>((resolve) => {
		const step = () => (count-- <= 0 ? resolve() : requestAnimationFrame(step))
		step()
	})
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
	return Promise.race([promise, new Promise<void>((resolve) => setTimeout(resolve, ms))])
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
	/** Trims each item to cap height and baseline so the spacing above and below the text is exactly `fitPadding`. */
	fit?: boolean
	/** Vertical padding applied on each side of a `fit` item. Use `em` so it scales with the font size. */
	fitPadding?: ResponsiveValue<string>
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
	fit: false,
	fitPadding: "0.2em",
})

const wrapperEl = shallowRef<HTMLElement | null>(null)
const railEl = shallowRef<HTMLElement | null>(null)

const tier = shallowRef<Tier>("mobile")
const fontsReady = useFontsReady()
const nuxtApp = useNuxtApp()

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
const rFitPadding = computed(() => resolveResponsive(props.fitPadding, tier.value))

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

const itemStyle = computed(() => ({
	marginInlineEnd: "3vw",
	paddingBlock: props.fit ? rFitPadding.value : undefined,
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
	const FONTS_TIMEOUT = 1500

	let loop: ReturnType<typeof horizontalLoop> | null = null
	let items: HTMLElement[] = []
	let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
	let intersectionObserver: IntersectionObserver | null = null
	let sizeObserver: ResizeObserver | null = null
	let lastWidth = 0
	let generation = 0
	let rawVelocity = 0
	let currentTimeScale = 1
	let scrollDir = 1
	let disposed = false
	let rebuildQueued = false

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

	// Reconstruit la boucle dès que la largeur d'un item change
	// (largeur 0 pendant une transition, swap de font tardif, etc.)
	function watchSize(el: HTMLElement) {
		sizeObserver?.disconnect()
		lastWidth = el.offsetWidth
		sizeObserver = new ResizeObserver(() => {
			const w = el.offsetWidth
			if (w && w !== lastWidth) {
				lastWidth = w
				rebuild()
			}
		})
		sizeObserver.observe(el)
	}

	function teardown() {
		generation++
		document.removeEventListener("visibilitychange", handleVisibilityChange)
		intersectionObserver?.disconnect()
		sizeObserver?.disconnect()
		scrollTrigger?.kill()
		gsap.ticker.remove(tick)
		loop?.kill()
		if (items.length) gsap.set(items, { clearProps: "transform" })
		loop = null
		items = []
		scrollTrigger = null
		intersectionObserver = null
		sizeObserver = null
	}

	/**
	 * Une reconstruction remet les transforms à zéro, relit le layout et recrée la timeline :
	 * jamais pendant que la vague découvre la page (ça se verrait). On attend que ce soit
	 * invisible (écran couvert ou transition terminée) ; plusieurs demandes = une seule.
	 */
	function rebuild() {
		if (disposed || rebuildQueued) return
		rebuildQueued = true

		waitUntilSafeToWork().then(() => {
			rebuildQueued = false
			if (disposed) return
			teardown()
			nextTick(init)
		})
	}

	/** Après une transition : on ne reconstruit que si la largeur a réellement changé. */
	function rebuildIfNeeded() {
		const first = items[0]
		if (loop && first && first.offsetWidth === lastWidth) return
		rebuild()
	}

	async function init() {
		const id = generation

		// Fonts, avec un timeout pour ne jamais rester bloqué
		await withTimeout(waitForFontsReady(fontsReady), FONTS_TIMEOUT)
		// Laisse le layout et la transition de page se stabiliser
		await nextFrames(2)
		// Pas de construction visible pendant la vague de découverte
		await waitUntilSafeToWork()

		if (id !== generation || !railEl.value || !wrapperEl.value) return

		items = Array.from(railEl.value.children) as HTMLElement[]
		const firstItem = items[0]
		const lastItem = items.at(-1)
		if (!firstItem || !lastItem) return

		// Toujours observer : si la largeur est 0 ou change plus tard, on reconstruit
		watchSize(firstItem)

		if (!wrapperEl.value.offsetWidth || !firstItem.offsetWidth) return

		gsap.set(items, { clearProps: "transform" })

		const baseDir = rDefaultDirection.value === "right" ? -1 : 1
		currentTimeScale = baseDir
		rawVelocity = 0

		const gap = parseFloat(getComputedStyle(lastItem).marginRight) || 0

		loop = horizontalLoop(gsap, items, {
			repeat: -1,
			speed: rBaseSpeed.value,
			paddingRight: gap,
		})
		loop.pause()

		// Timeline invalide (NaN ou 0) : on la jette, l'observer retentera
		const duration = loop.duration()
		if (!Number.isFinite(duration) || duration <= 0) {
			loop.kill()
			loop = null
			gsap.set(items, { clearProps: "transform" })
			return
		}

		document.addEventListener("visibilitychange", handleVisibilityChange)

		if (reducedMotion) {
			loop.timeScale(baseDir)
			loop.play()
			return
		}

		intersectionObserver = new IntersectionObserver(
			([entry]) => {
				if (!entry) return

				if (entry.isIntersecting) {
					rawVelocity = 0
					loop?.play()
					gsap.ticker.add(tick)
				} else {
					loop?.pause()
					gsap.ticker.remove(tick)
				}
			},
			{ threshold: 0 }
		)
		intersectionObserver.observe(wrapperEl.value)

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
		})
	}

	init()

	const stopPropsWatch = watch(
		[rRepeatCount, rBaseSpeed, rEnableScrollBoost, rEnableDirection, rDefaultDirection],
		rebuild,
		{ flush: "post" }
	)

	const stopViewportResize = useViewportResize(rebuild, 200)

	// À la fin de la transition de page : reconstruction seulement si la largeur a changé
	const unhookTransition = nuxtApp.hook("page:transition:finish", rebuildIfNeeded)

	return () => {
		disposed = true
		unhookTransition()
		stopPropsWatch()
		stopViewportResize()
		teardown()
	}
}, wrapperEl)
</script>

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
					class="block size-fit whitespace-nowrap will-change-transform select-none"
					:class="[fit ? 'text-fit' : '', itemClass]"
					:style="itemStyle"
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
