<script setup lang="ts">
interface PatternHandle {
	pop: () => Promise<void>
	depop: () => Promise<void>
}

withDefaults(
	defineProps<{
		title?: string
		text?: string
		label?: string
		to?: string
		/** Four or more sources, so that no two neighbouring cells share a sticker. */
		stickers?: readonly string[]
	}>(),
	{
		title: "Every project starts somehow.",
		text: "And hey, follow me on social media!",
		label: "Contact me",
		to: "/contact",
		stickers: () => [
			"/stickers/character_violet.svg",
			"/stickers/flower_violet.svg",
			"/stickers/dog_violet.svg",
			"/stickers/characterFull_violet.svg",
      "/stickers/computer_violet.svg",
		],
	},
)

const DESKTOP_QUERY = "(min-width: 1024px)"

/**
 * Pattern scale per viewport width, first match wins, 1 below the smallest step.
 * Lower is smaller and denser. The card is full width below lg and half width from lg,
 * so the steps follow the card size to keep stickers around the same size everywhere.
 */
const PATTERN_SCALES = [
	{ minWidth: 1536, scale: 0.5 },
	{ minWidth: 1280, scale: 0.6 },
	{ minWidth: 1024, scale: 0.75 },
	{ minWidth: 768, scale: 0.5 },
] as const

/**
 * Colors by context, the only place to change them.
 * - page: from lg, the text and the button sit on the page background.
 * - card: below lg, the text and the button sit on the violet card.
 */
const REVEAL_THEME = { page: "violet", card: "black" } as const
const BUTTON_COLORS = {
	page: { pill: "violet", bubble: "violet", text: "white", icon: "white" },
	card: { pill: "black", bubble: "black", text: "white", icon: "white" },
} as const

const matchesDesktop = () => window.matchMedia(DESKTOP_QUERY).matches

const cardRef = useTemplateRef<HTMLElement>("card")
const patternRef = useTemplateRef<PatternHandle>("pattern")
const patternScale = ref(1)

// Read synchronously on the client: the reveal directive runs before `onMounted`.
const isDesktop = ref(import.meta.client ? matchesDesktop() : false)
const revealTheme = computed(() => (isDesktop.value ? REVEAL_THEME.page : REVEAL_THEME.card))

let observer: IntersectionObserver | null = null
let unsubscribeResize: (() => void) | null = null
let started = false
let lastWidth = 0
let lastHeight = 0

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function resolvePatternScale() {
	const width = window.innerWidth
	return PATTERN_SCALES.find((step) => width >= step.minWidth)?.scale ?? 1
}

/**
 * On a real width change: updates the breakpoint, then replays the pop if the card size
 * or the pattern scale really changed (a pinch-zoom alone won't).
 */
async function onViewportResize() {
	isDesktop.value = matchesDesktop()

	const card = cardRef.value
	if (!card) return

	const width = card.clientWidth
	const height = card.clientHeight
	const scale = resolvePatternScale()
	const sameSize = Math.abs(width - lastWidth) < 2 && Math.abs(height - lastHeight) < 2
	if (sameSize && scale === patternScale.value) return

	lastWidth = width
	lastHeight = height
	patternScale.value = scale

	// Before the first reveal there is nothing to rebuild: the pop will use the new scale.
	if (!started) return
	await nextTick()
	void patternRef.value?.pop()
}

onMounted(() => {
	const card = cardRef.value
	if (!card) return

	patternScale.value = resolvePatternScale()

	// The pattern pops the first time the card is seen.
	observer = new IntersectionObserver(
		async ([entry]) => {
			if (!entry?.isIntersecting) return
			observer?.disconnect()

			// The card height depends on the title on mobile, so wait for the fonts before measuring.
			await Promise.race([document.fonts?.ready, wait(1000)])
			if (!card.isConnected) return

			lastWidth = card.clientWidth
			lastHeight = card.clientHeight
			started = true
			void patternRef.value?.pop()
		},
		{ threshold: 0.3 },
	)
	observer.observe(card)

	unsubscribeResize = useViewportResize(onViewportResize)
})

onBeforeUnmount(() => {
	observer?.disconnect()
	unsubscribeResize?.()
	unsubscribeResize = null
})
</script>

<template>
	<section class="section-p-x pb-section">
		<!--
			< lg : a single violet card, white text, pattern behind, button in the card.
			≥ lg : text and button on the left, square violet card with the pattern on the right.
		-->
		<div
			class="relative isolate flex min-h-136 flex-col overflow-hidden rounded-lg bg-violet p-edge text-white lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-center lg:gap-12 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:text-black xl:gap-20"
		>
			<!-- Text -->
			<div class="relative z-10 flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:gap-8">
				<!-- The key replays the reveal with the right theme if the breakpoint is crossed. -->
				<h2
					:key="revealTheme"
					v-text-reveal="{ theme: revealTheme }"
					class="font-lineal-black max-w-[7em] text-[clamp(2.5rem,11.5vw,4rem)] leading-[0.95] tracking-[-0.03em] text-balance lg:text-[clamp(3.5rem,5.8vw,6.5rem)]"
				>
					{{ title }}
				</h2>
				<p
					class="max-w-[16em] text-[clamp(1.125rem,4.4vw,1.5rem)] leading-[1.2] text-pretty lg:text-[clamp(1.125rem,1.6vw,1.75rem)]"
				>
					{{ text }}
				</p>

				<!-- From lg: under the text, on the page -->
				<div class="hidden self-start lg:block">
					<UiAnimatedButton v-bind="BUTTON_COLORS.page" :label="label" :to="to" size="large" />
				</div>
			</div>

			<!-- Visual: fills the block below lg, becomes the right-hand card from lg -->
			<div
				ref="card"
				class="absolute inset-0 z-0 overflow-hidden lg:relative lg:inset-auto lg:col-start-2 lg:row-start-1 lg:aspect-square lg:rounded-lg lg:bg-violet"
			>
				<UiStickerPattern
					ref="pattern"
					:srcs="stickers"
					:opacity="0.6"
					:scale="patternScale"
				/>

				<!-- Below lg: bottom-right of the card -->
				<div class="absolute right-5 bottom-5 z-10 sm:right-8 sm:bottom-8 lg:hidden">
					<UiAnimatedButton
						v-bind="BUTTON_COLORS.card"
						class="w-full sm:w-auto"
						:label="label"
						:to="to"
						size="large"
					/>
				</div>
			</div>
		</div>
	</section>
</template>