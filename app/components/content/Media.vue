<script lang="ts" setup>
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i

interface Props {
	src: string
	alt?: string
	caption?: string
	width?: number | string
	height?: number | string
	/** CSS ratio such as "16 / 9". Wins over width/height. */
	ratio?: string
	/** `span` inside Markdown paragraphs, where a <figure> would be invalid HTML. */
	as?: "figure" | "span"
	/** Video only: custom controls, no autoplay. */
	controls?: boolean
	poster?: string
	/** Above the fold: loads right away. */
	eager?: boolean
	/** Reveals the media with the window effect when it enters the screen. */
	reveal?: boolean
	/** Seconds to wait once the media is ready. */
	revealDelay?: number
	/** Reveals as soon as the media is ready, without waiting for it to scroll into view. */
	immediate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	alt: "",
	as: "figure",
	reveal: true,
})

// The file is served as is: no image pipeline between the Markdown and the browser.
// Only the app base URL is applied, for sites that are not served from the domain root.
const baseURL = useRuntimeConfig().app.baseURL

function resolve(path?: string) {
	if (!path || !path.startsWith("/") || path.startsWith("//")) return path
	return baseURL && baseURL !== "/" ? baseURL.replace(/\/$/, "") + path : path
}

const mediaSrc = computed(() => resolve(props.src))
const posterSrc = computed(() => resolve(props.poster))

const isVideo = computed(() => VIDEO.test(props.src))

const boxRatio = computed(() => {
	if (props.ratio) return props.ratio
	if (props.width && props.height) return `${props.width} / ${props.height}`
	return isVideo.value ? "16 / 9" : undefined
})

// With a ratio the box has a definite size and the media fills it; without one, the image
// takes its natural height. The media overshoots the box by 1px on every side (the box clips it):
// a box with a fractional height and a media snapped to the pixel would otherwise leave a hairline
// of the background along the bottom edge.
const fit = computed(() =>
	boxRatio.value
		? "absolute -inset-px size-[calc(100%+2px)] max-w-none object-cover"
		: "block h-auto w-full"
)

// A video without controls plays only while visible, muted and looping,
// and never moves for people who asked for reduced motion.
const videoEl = useTemplateRef<HTMLVideoElement>("videoEl")
const windowEl = useTemplateRef<HTMLElement>("windowEl")
const reducedMotion = ref(false)
const showControls = computed(() => props.controls || reducedMotion.value)
let observer: IntersectionObserver | undefined

onMounted(() => {
	const el = videoEl.value
	if (!el || props.controls) return

	if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
		reducedMotion.value = true
		return
	}

	observer = new IntersectionObserver(
		([entry]) => {
			if (entry?.isIntersecting) el.play().catch(() => {})
			else el.pause()
		},
		{ threshold: 0.25 }
	)
	observer.observe(el)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
	<component :is="as" data-media class="block">
		<span
			ref="windowEl"
			v-image-reveal="{ disabled: !reveal, delay: revealDelay, immediate }"
			class="relative block overflow-hidden rounded-xs bg-current/8 [&:fullscreen]:rounded-none [&:fullscreen]:bg-black [&:fullscreen_video]:object-contain"
			:style="{ aspectRatio: boxRatio }"
		>
			<!-- Layer of the reveal: it carries the inverse transformation (see v-image-reveal), so the controls are unveiled with the media. -->
			<span :class="['relative block', boxRatio ? 'size-full' : '']">
				<video
					v-if="isVideo"
					ref="videoEl"
					:src="mediaSrc"
					:poster="posterSrc"
					:aria-label="alt || undefined"
					muted
					loop
					playsinline
					preload="metadata"
					:class="fit"
				/>
				<img
					v-else
					:src="mediaSrc"
					:alt="alt"
					:width="width"
					:height="height"
					:loading="eager ? 'eager' : 'lazy'"
					:fetchpriority="eager ? 'high' : undefined"
					decoding="async"
					:class="fit"
				/>

				<UiMediaControls v-if="isVideo && showControls" :video="videoEl" :container="windowEl" />
			</span>
		</span>
		<component :is="as === 'figure' ? 'figcaption' : 'span'" v-if="caption" data-caption>
			{{ caption }}
		</component>
	</component>
</template>