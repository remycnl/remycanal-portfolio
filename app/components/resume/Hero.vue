<script setup lang="ts">
import { CHARACTER_SLOT_CLASSES } from "@/constants/character"

interface PatternHandle {
	pop: () => Promise<void>
	depop: () => Promise<void>
}

/** Four or more sources, so that no two neighbouring cells share a sticker. */
const PATTERN_STICKERS = [
	"/stickers/character_lime.svg",
	"/stickers/flower_lime.svg",
	"/stickers/dog_lime.svg",
	"/stickers/characterFull_lime.svg",
	"/stickers/computer_lime.svg",
] as const

/**
 * Pattern scale per viewport width, first match wins, 1 below the smallest step.
 * Lower is smaller and denser: the lime block grows with the screen, so the scale shrinks
 * with it to keep stickers around the same size everywhere.
 */
const PATTERN_SCALES = [
	{ minWidth: 1536, scale: 0.35 },
	{ minWidth: 1280, scale: 0.45 },
	{ minWidth: 768, scale: 0.55 },
] as const

const MASCOT = "/stickers/characterFull_lime.svg"
const CV_URL = "/cv.pdf"
const STATUS = "Currently seeking a final-year internship."
const SUBTITLE =
	"A look back at the experiences that shaped me and the path I'm building."

/**
 * Cat cells. Each hero block is a zone of the cat (useSprite singleton, auto-initialised by
 * useCatZone) and it wanders between them on its own, in all directions.
 *
 * - `host: hero`: the hero is sticky (curtain), so the cat lives *inside* it. It follows the
 *   pin, the CV slides over it, and it pauses while the hero carries `data-covered`.
 * - z-5: above the blocks, under the title (z-10) and the CTA, which stay readable and clickable.
 * - The empty strip only exists from `lg` up (it is `hidden` below), hence its own group.
 *   No `initial` there: the cat always starts on the lime pattern block.
 */
const CAT_Z_INDEX = 5
const LG_BREAKPOINT = 1024
const LIME_CELL = { textColorClass: "text-black" }
const BLACK_CELL = { textColorClass: "text-white" }

/**
 * Lines specific to each block: the cat mixes them with its generic ones when it arrives, rests or
 * is hovered there. Keep them ASCII (pixel font) and short.
 */
const PATTERN_LINES = ["So many stickers!", "I'm basically a sticker too."]
const COPY_LINES = ["The journey so far...", "Psst. The CV button is right here."]
const PANEL_LINES = ["He is looking for an internship.", "Hire him. I vouch for him."]
const STRIP_LINES = ["Nothing to see here.", "Perfect nap spot."]

const titleId = useId()
const heroRef = useTemplateRef<HTMLElement>("hero")
const copyRef = useTemplateRef<HTMLElement>("copy")
const stripRef = useTemplateRef<HTMLElement>("strip")
const panelRef = useTemplateRef<HTMLElement>("panel")
const patternRef = useTemplateRef<PatternHandle>("pattern")
const patternHostRef = useTemplateRef<HTMLElement>("patternHost")
const patternScale = ref(1)

useCatZone({
	cells: {
		host: heroRef,
		initial: patternHostRef,
		zIndex: CAT_Z_INDEX,
		zones: [
			{ zone: patternHostRef, ...LIME_CELL, phrases: PATTERN_LINES },
			{ zone: copyRef, ...LIME_CELL, phrases: COPY_LINES },
			{ zone: panelRef, ...BLACK_CELL, phrases: PANEL_LINES },
		],
	},
	strip: {
		minWidth: LG_BREAKPOINT,
		host: heroRef,
		zIndex: CAT_Z_INDEX,
		zones: [{ zone: stripRef, ...LIME_CELL, phrases: STRIP_LINES }],
	},
})

// true once the 3D character is visible: the sticker is its poster.
const { heroReady } = useResumeCharacterState()

let unsubscribeResize: (() => void) | null = null
let lastWidth = 0
let lastHeight = 0

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function resolvePatternScale() {
	const width = window.innerWidth
	return PATTERN_SCALES.find((step) => width >= step.minWidth)?.scale ?? 1
}

/** Replays the pop when the block size or the scale really changed (a pinch-zoom alone won't). */
async function onViewportResize() {
	const host = patternHostRef.value
	if (!host) return

	const width = host.clientWidth
	const height = host.clientHeight
	const scale = resolvePatternScale()
	const sameSize = Math.abs(width - lastWidth) < 2 && Math.abs(height - lastHeight) < 2
	if (sameSize && scale === patternScale.value) return

	lastWidth = width
	lastHeight = height
	patternScale.value = scale
	await nextTick()
	void patternRef.value?.pop()
}

onMounted(async () => {
	const host = patternHostRef.value
	if (!host) return

	patternScale.value = resolvePatternScale()
	await nextTick()

	// The lime block height depends on the title, so wait for the fonts before measuring.
	await Promise.race([document.fonts?.ready, wait(1000)])
	if (!host.isConnected) return

	lastWidth = host.clientWidth
	lastHeight = host.clientHeight
	void patternRef.value?.pop()

	unsubscribeResize = useViewportResize(onViewportResize)
})

onBeforeUnmount(() => {
	unsubscribeResize?.()
	unsubscribeResize = null
})
</script>

<template>
	<section
		ref="hero"
		:aria-labelledby="titleId"
		data-character-section="hero"
		class="bg-lime-dark sticky top-(--hero-pin-top,0px) isolate z-0 flex min-h-svh flex-col text-black lg:grid lg:grid-cols-[2fr_1fr]"
	>
		<!-- Left column: lime block (pattern) over lime-dark block (copy) -->
		<div class="flex flex-1 flex-col">
			<div ref="patternHost" class="bg-lime relative min-h-[34svh] flex-1">
				<UiStickerPattern
					wait-for-ready
					ref="pattern"
					:srcs="PATTERN_STICKERS"
					:opacity="0.5"
					:scale="patternScale"
				/>
			</div>

			<div ref="copy" class="p-edge relative">
				<!-- -mt pulls the first line up so the lime / lime-dark edge runs through it -->
				<h1
					v-text-reveal="{ singlePhrase: true, immediate: true }"
					:id="titleId"
					class="font-lineal-black relative z-10 mt-[-0.85em] ml-[-0.04em] w-fit text-[clamp(2.5rem,11.5vw,6.5rem)] leading-none tracking-[-0.01em] uppercase lg:text-[clamp(3.5rem,7.4vw,9rem)]"
				>
					<span class="block">The journey</span>
					<span class="block">so far.</span>
				</h1>

				<p
					v-text-reveal="{ immediate: true }"
					class="font-lineal-regular leading-fit relative z-10 mt-5 w-fit max-w-[36ch] text-[clamp(1rem,2.2vw,1.375rem)] text-balance lg:mt-[1.8vw] lg:text-[clamp(1rem,1.55vw,1.75rem)]"
				>
					{{ SUBTITLE }}
				</p>

				<!--
					Desktop: anchored bottom-right of the column, the bubble spills onto the black panel.
					Below lg: right-aligned, in the smaller button format.
					z-10 / lg:z-20: the CTA stays above the cat (z-5) and clickable.
				-->
				<div
					class="lg:p-edge relative z-10 mt-6 flex justify-end lg:absolute lg:right-0 lg:bottom-0 lg:z-20 lg:mt-0 lg:translate-x-[11vw]"
				>
					<div class="lg:hidden">
						<UiAnimatedButton
							:to="CV_URL"
							label="Download CV"
							size="small"
							pill="white"
							bubble="lime"
							text="black"
							icon="black"
							external
							download
						/>
					</div>

					<div class="hidden lg:block">
						<UiAnimatedButton
							:to="CV_URL"
							label="Download CV"
							size="large"
							pill="white"
							bubble="lime"
							text="black"
							icon="black"
							external
							download
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Right column: empty lime-dark strip (desktop) over black panel -->
		<div class="flex flex-col">
			<div ref="strip" aria-hidden="true" class="hidden lg:block lg:flex-27" />

			<div
				ref="panel"
				class="bg-grid-black relative flex flex-col bg-black text-white lg:flex-73"
			>
				<UiGridBeams theme="black" />
				<div
					class="p-edge relative flex flex-1 flex-col items-stretch justify-between gap-6"
				>
					<!--
						Status: top-left of the black block at every size. `text-fit` trims the text to its
						cap height, so the pinging dot (pushed down by half of the cap height minus its own
						size) sits exactly on the middle of the first line.
					-->
					<div
						class="font-lineal-regular flex max-w-[20ch] items-start gap-3 self-start text-[clamp(0.875rem,2vw,1.125rem)] lg:max-w-[30ch] lg:text-[clamp(0.875rem,1.15vw,1.35rem)]"
					>
						<span
							aria-hidden="true"
							class="relative mt-[calc((1cap-0.65em)/2)] inline-flex size-[0.65em] shrink-0"
						>
							<span
								class="bg-lime absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
							/>
							<span class="bg-lime relative size-full rounded-full" />
						</span>

						<p v-text-reveal="{ immediate: true }" class="text-fit">{{ STATUS }}</p>
					</div>

					<!--
						Slot of the 3D character: same box as the former <img>. The sticker stays as the
						poster until the WebGL scene is visible, and as the fallback if WebGL is
						unavailable. The whole section is sticky (curtain): the CV slides over it and
						covers the character. The character is <ResumeHeroCharacter>, rendered client-side
						only (not a .client.vue file, see its header) and which only needs this slot as its
						parent.
					-->
					<div
						data-character-slot="hero"
						class="relative block self-end"
						:class="CHARACTER_SLOT_CLASSES"
					>
						<img
							:src="MASCOT"
							alt=""
							width="160"
							height="340"
							decoding="async"
							class="block size-full object-contain transition-opacity duration-300 motion-reduce:transition-none"
							:class="heroReady ? 'opacity-0' : 'opacity-100'"
						/>

						<ClientOnly>
							<ResumeHeroCharacter />
						</ClientOnly>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style>
/* Hero fully covered by the CV: freeze its CSS animations (ping, etc.). */
[data-character-section="hero"][data-covered] *,
[data-character-section="hero"][data-covered] *::before,
[data-character-section="hero"][data-covered] *::after {
	animation-play-state: paused !important;
}
</style>
