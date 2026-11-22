<script setup lang="ts">
import { horizontalLoop } from "@/utils/gsap/horizontalLoop"

const DESKTOP_MIN = 1024

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
	/** Nombre de répétitions du texte. `desktop` (≥ 1024px) retombe sur `mobile` s'il est omis. */
	repeatCount?: number | { mobile: number; desktop?: number }
	baseSpeed?: number
	defaultDirection?: "right" | "left"
	bg?: string
	/** Trims each item to cap height and baseline so the spacing above and below the text is exactly `fitPadding`. */
	fit?: boolean
	/** Vertical padding applied on each side of a `fit` item. Use `em` so it scales with the font size. */
	fitPadding?: string
}

const props = withDefaults(defineProps<Props>(), {
	itemClass: "uppercase font-lineal-heavy text-[6vw] pr-[3vw]",
	repeatCount: 12,
	baseSpeed: 0.4,
	defaultDirection: "left",
	fit: false,
	fitPadding: "0.2em",
})

const wrapperEl = shallowRef<HTMLElement | null>(null)
const railEl = shallowRef<HTMLElement | null>(null)

const fontsReady = useFontsReady()
const nuxtApp = useNuxtApp()

// Seul le breakpoint desktop compte : mobile et tablette partagent la même valeur.
const isDesktop = shallowRef(false)
let desktopMql: MediaQueryList | undefined

function syncDesktop() {
	isDesktop.value = !!desktopMql?.matches
}

onMounted(() => {
	desktopMql = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)
	syncDesktop()
	desktopMql.addEventListener("change", syncDesktop)
})

onBeforeUnmount(() => desktopMql?.removeEventListener("change", syncDesktop))

const repeat = computed(() => {
	const value = props.repeatCount
	if (typeof value === "number") return value
	return isDesktop.value ? (value.desktop ?? value.mobile) : value.mobile
})

// `right` fait défiler dans le sens inverse de la timeline GSAP.
const baseDir = computed(() => (props.defaultDirection === "right" ? -1 : 1))

const itemStyle = computed(() => ({
	marginInlineEnd: "3vw",
	paddingBlock: props.fit ? props.fitPadding : undefined,
}))

const { useGsapContext } = useGsap()

useGsapContext(({ gsap, ScrollTrigger }) => {
	if (!railEl.value) return

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	const FRICTION = 0.92
	const SMOOTHING = 0.18
	const VELOCITY_DIVISOR = 160
	const MAX_RAW_VELOCITY = 6000
	const MAX_DELTA_RATIO = 3
	const MAX_SCROLL_BOOST = 14
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

		const boost = gsap.utils.clamp(0, MAX_SCROLL_BOOST, rawVelocity / VELOCITY_DIVISOR)
		const target = baseDir.value * scrollDir * (1 + boost)

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

		currentTimeScale = baseDir.value
		rawVelocity = 0

		const gap = parseFloat(getComputedStyle(lastItem).marginRight) || 0

		loop = horizontalLoop(gsap, items, {
			repeat: -1,
			speed: props.baseSpeed,
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
			loop.timeScale(baseDir.value)
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
				scrollDir = self.direction || scrollDir
				const v = Math.min(Math.abs(self.getVelocity()), MAX_RAW_VELOCITY)
				rawVelocity = Math.max(rawVelocity, v)
			},
		})
	}

	init()

	const stopPropsWatch = watch([repeat, () => props.baseSpeed, baseDir], rebuild, {
		flush: "post",
	})

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
	<div class="relative w-full" :style="{ background: bg }">
		<div
			ref="wrapperEl"
			class="relative flex w-full items-center overflow-hidden"
			role="marquee"
			:aria-label="text"
			style="contain: style paint"
		>
			<div ref="railEl" class="flex w-max">
				<span
					v-for="n in repeat"
					:key="n"
					class="block size-fit whitespace-nowrap will-change-transform select-none"
					:class="[fit ? 'text-fit' : '', itemClass]"
					:style="itemStyle"
				>
					{{ text }}
				</span>
			</div>
		</div>
	</div>
</template>
