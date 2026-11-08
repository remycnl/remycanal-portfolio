<script setup lang="ts">
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

const titleId = useId()
const patternRef = useTemplateRef<PatternHandle>("pattern")
const patternHostRef = useTemplateRef<HTMLElement>("patternHost")
const patternScale = ref(1)

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
		:aria-labelledby="titleId"
		class="bg-lime-dark relative isolate flex min-h-svh flex-col text-black lg:grid lg:grid-cols-[2fr_1fr]"
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

			<div class="p-edge relative">
				<!-- -mt pulls the first line up so the lime / lime-dark edge runs through it -->
				<h1
					v-text-reveal="{ singlePhrase: true, immediate: true }"
					:id="titleId"
					class="font-lineal-black relative z-10 mt-[-0.85em] ml-[-0.04em] text-[clamp(2.5rem,11.5vw,6.5rem)] leading-none tracking-[-0.01em] uppercase lg:text-[clamp(3.5rem,7.4vw,9rem)]"
				>
					<span class="block">The journey</span>
					<span class="block">so far.</span>
				</h1>

				<p
					v-text-reveal="{ immediate: true }"
					class="font-lineal-regular leading-fit mt-5 max-w-[36ch] text-[clamp(1rem,2.2vw,1.375rem)] text-balance lg:mt-[1.8vw] lg:text-[clamp(1rem,1.55vw,1.75rem)]"
				>
					{{ SUBTITLE }}
				</p>

				<!-- Desktop: anchored bottom-right of the column, the bubble spills onto the black panel -->
				<div
					class="lg:p-edge mt-6 lg:absolute lg:right-0 lg:bottom-0 lg:z-20 lg:mt-0 lg:translate-x-[11vw]"
				>
					<UiAnimatedButton
						:to="CV_URL"
						label="Download CV"
						size="large"
						pill="white"
						bubble="lime"
						external
						download
					/>
				</div>
			</div>
		</div>

		<!-- Right column: empty lime-dark strip (desktop) over black panel -->
		<div class="flex flex-col">
			<div aria-hidden="true" class="hidden lg:block lg:flex-27" />

			<div class="bg-grid-black relative flex flex-col bg-black text-white lg:flex-73">
				<UiGridBeams theme="black" />
				<div
					class="p-edge relative grid flex-1 grid-cols-[1fr_auto] items-end gap-6 lg:flex lg:flex-col lg:items-stretch lg:justify-between"
				>
					<p
						v-text-reveal="{ immediate: true }"
						class="font-lineal-regular leading-fit flex max-w-[30ch] items-start gap-3 self-center text-[clamp(0.875rem,2vw,1.125rem)] lg:self-start lg:text-[clamp(0.875rem,1.15vw,1.35rem)]"
					>
						<span
							aria-hidden="true"
							class="relative mt-[0.35em] inline-flex size-[0.65em] shrink-0"
						>
							<span
								class="bg-lime absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
							/>
							<span class="bg-lime relative size-full rounded-full" />
						</span>
						{{ STATUS }}
					</p>

					<img
						:src="MASCOT"
						alt=""
						width="160"
						height="340"
						decoding="async"
						class="block h-auto w-[18vw] max-w-28 min-w-20 object-contain lg:w-[10.5vw] lg:max-w-none lg:self-end"
					/>
				</div>
			</div>
		</div>
	</section>
</template>
