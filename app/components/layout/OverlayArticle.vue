<script lang="ts" setup>
import Media from "@/components/content/Media.vue"
import type { MetaItem } from "@/components/layout/OverlayMeta.vue"
import type { NextEntry } from "@/composables/useNextEntry"
import { OVERLAY_REVEAL_THEME } from "@/composables/useOverlayReveal"
import { OVERLAY_MOTION } from "@/utils/overlayMotion"

interface Props {
	title: string
	meta?: readonly MetaItem[]
	tags?: readonly string[]
	image?: string
	imageWidth?: number
	imageHeight?: number
	/** Hero video (muted loop, plays while visible). `image` then serves as its poster. */
	video?: string
	/** Hero ratio, e.g. "16 / 9". Without it, the natural ratio is used when width and height are known. */
	ratio?: string
	/** Any CSS color. */
	background: string
	/** Color of the text laid on the background. */
	tone?: "white" | "black"
	/** CSS color for link hover and bullets. Defaults to lime on dark, violet on light. */
	accent?: string
	/** Color the text reveal flashes through: a `--color-*` token name (`"lime"`) or a CSS color. Defaults to lime on dark, violet on light. */
	reveal?: string
	/** Document returned by queryCollection(). */
	doc?: Record<string, any>
	/** Entry the bottom of the page leads to (see useNextEntry). */
	next?: NextEntry | null
}

const props = withDefaults(defineProps<Props>(), {
	meta: () => [],
	tags: () => [],
	tone: "black",
})

const { overlay } = useOverlay()

// ── Colors ──────────────────────────────────────────────────
const isLight = computed(() => props.tone === "black")

const accentColor = computed(
	() => props.accent ?? (isLight.value ? "var(--color-violet)" : "var(--color-lime)")
)

const revealTheme = computed(() => props.reveal ?? (isLight.value ? "violet" : "lime"))

// The Markdown headings and quotes reveal with the same color as the title.
provide(OVERLAY_REVEAL_THEME, revealTheme)

const style = computed(() => ({
	backgroundColor: props.background,
	"--overlay-content-color": isLight.value ? "var(--color-black)" : "var(--color-white)",
	"--overlay-surface": props.background,
	"--overlay-accent": accentColor.value,
}))

const heroSrc = computed(() => props.video ?? props.image)

// ── Arrival ─────────────────────────────────────────────────
// Coming from the "next" block, the color of that block covers the page, then wipes away. The
// title and the cover wait for it, so that they reveal on a page that can be seen.
const curtainColor = useOverlayArrival().consume()
const curtainOpen = ref(curtainColor !== null)

const { curtain } = OVERLAY_MOTION
const settle = curtainColor ? curtain.delay + curtain.duration * 0.7 : 0
const titleDelay = 0.35 + settle
const heroDelay = 0.2 + settle

// A new entry always opens at its top, whatever the scroll position the sheet had.
onMounted(() => overlay.scroller?.scrollTo({ top: 0, behavior: "instant" }))
</script>

<template>
	<article
		:class="[
			'relative flow-root min-h-full w-full',
			isLight ? 'text-black' : 'text-white',
		]"
		:style="style"
	>
		<div class="section-p-xy mt-edge w-full">
			<!-- The top padding keeps the title clear of the site header (a pill 74px from the top). -->
			<header class="pt-20">
				<h1
					id="overlay-title"
					v-text-reveal="{ immediate: true, delay: titleDelay, theme: revealTheme }"
					class="font-lineal-bold max-w-[18ch] text-[clamp(2.75rem,1.2rem+5.2vw,7.5rem)] leading-[0.96] tracking-[-0.03em] text-balance"
				>
					{{ title }}
				</h1>

				<LayoutOverlayMeta :items="meta" :tags="tags" class="mt-12 lg:mt-16" />
			</header>

			<div v-if="heroSrc" class="mt-12 lg:mt-16">
				<Media
					:src="heroSrc"
					:poster="video ? image : undefined"
					:width="imageWidth"
					:height="imageHeight"
					:ratio="ratio"
					:alt="title"
					:reveal-delay="heroDelay"
					eager
					immediate
				/>
			</div>

			<ContentRenderer
				v-if="doc?.body?.value?.length"
				:value="doc"
				class="overlay-content mt-20 lg:mt-32"
			/>
		</div>

		<!-- Outside the padded container: the panel fills the width of the page. -->
		<LayoutOverlayNext v-if="next" :next="next" />

		<LayoutOverlayClose :tone="tone" />

		<LayoutOverlayCurtain
			v-if="curtainColor && curtainOpen"
			:color="curtainColor"
			@done="curtainOpen = false"
		/>
	</article>
</template>
