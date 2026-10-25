<template>
	<div
		ref="wrapRef"
		class="relative z-50 h-svh w-full"
		:style="[loopStyle, { clipPath: wrapClipPath }]"
	>
		<UiInfiniteHorizontalLoop
			:ref="loopRef"
			class="z-50"
			text="REMY CANAL"
			default-direction="right"
			:item-class="loopTheme.item"
			:bg="loopTheme.bg"
			:repeat-count="4"
			:base-speed="1"
			fit
			fit-padding="0.2em"
		/>

		<div class="fixed inset-x-0 bottom-0 z-40 h-[calc(100svh-var(--loop-height))] w-full">
			<LayoutFooterContent :trigger-el="wrapRef" :theme="footerTheme" />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { SiteTheme } from "@/types/theme"

const wrapRef = useTemplateRef<HTMLElement>("wrapRef")
const { loopRef, loopStyle } = useLoopHeight()

const THEME_SWITCH_DELAY_MS = 1000

const LOOP_ITEM_BASE =
	"uppercase font-lineal-heavy text-[16vw] pr-[3vw] [word-spacing:0.1em]"

const LOOP_THEMES: Record<SiteTheme, { item: string; bg: string }> = {
	lime: { item: `${LOOP_ITEM_BASE} text-lime-dark`, bg: "var(--color-lime)" },
	violet: { item: `${LOOP_ITEM_BASE} text-violet-dark`, bg: "var(--color-violet)" },
}

// Each page picks its theme with `definePageMeta({ footerTheme: "lime" })`. An overlay keeps the
// theme of the page behind it, exactly as if the visitor had not left it.
const visibleRoute = useVisibleRoute()
const routeTheme = computed<SiteTheme>(
	() => visibleRoute.value.meta.footerTheme ?? DEFAULT_SITE_THEME
)

// Shared with everything that follows the theme: the background, the footer and the scrollbar.
const footerTheme = useSiteTheme()
const loopTheme = computed(() => LOOP_THEMES[footerTheme.value])

// `data-theme` on <html> drives the page background and every themed variable.
useHead({
	htmlAttrs: { "data-theme": footerTheme },
})

let themeTimeout: ReturnType<typeof setTimeout> | undefined

// Watches the theme, not the path: opening or closing an overlay changes nothing.
watch(routeTheme, (theme) => {
	clearTimeout(themeTimeout)
	themeTimeout = setTimeout(() => {
		footerTheme.value = theme
	}, THEME_SWITCH_DELAY_MS)
})

const wrapClipPath = "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)"

const { ScrollTrigger } = useGsap()
const lenis = useLenis()

let resizeObserver: ResizeObserver | undefined
let resizeTimeout: ReturnType<typeof setTimeout> | undefined
let isFirstObservation = true

function syncScrollEngines() {
	clearTimeout(resizeTimeout)
	resizeTimeout = setTimeout(() => {
		lenis?.resize()
		ScrollTrigger.refresh()
	}, 100)
}

onMounted(() => {
	if (!wrapRef.value) return

	resizeObserver = new ResizeObserver(() => {
		if (isFirstObservation) {
			isFirstObservation = false
			return
		}
		syncScrollEngines()
	})
	resizeObserver.observe(wrapRef.value)
})

onUnmounted(() => {
	resizeObserver?.disconnect()
	clearTimeout(resizeTimeout)
	clearTimeout(themeTimeout)
})
</script>
