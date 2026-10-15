<template>
	<div
		ref="wrapRef"
		class="relative z-50 h-svh w-full"
		:style="[loopStyle, { clipPath: wrapClipPath }]"
	>
		<UiInfiniteHorizontalLoop
			:ref="loopRef"
			class="z-50"
			text="Creative Developer"
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
const route = useRoute()
const wrapRef = useTemplateRef<HTMLElement>("wrapRef")
const { loopRef, loopStyle } = useLoopHeight()

type FooterTheme = "lime" | "violet"

const THEME_SWITCH_DELAY_MS = 1000

const LOOP_ITEM_BASE =
	"uppercase font-lineal-heavy text-[16vw] pr-[3vw] [word-spacing:0.1em]"

const LOOP_THEMES: Record<FooterTheme, { item: string; bg: string }> = {
	lime: { item: `${LOOP_ITEM_BASE} text-lime-dark`, bg: "var(--color-lime)" },
	violet: { item: `${LOOP_ITEM_BASE} text-violet-dark`, bg: "var(--color-violet)" },
}

function getFooterTheme(path: string): FooterTheme {
	return path === "/contact" || path === "/templates" || path.startsWith("/templates/")
		? "lime"
		: "violet"
}

const footerTheme = ref<FooterTheme>(getFooterTheme(route.path))
const loopTheme = computed(() => LOOP_THEMES[footerTheme.value])

useHead({
	htmlAttrs: { "data-theme": footerTheme },
})

let themeTimeout: ReturnType<typeof setTimeout> | undefined

watch(
	() => route.path,
	(path) => {
		clearTimeout(themeTimeout)
		themeTimeout = setTimeout(() => {
			footerTheme.value = getFooterTheme(path)
		}, THEME_SWITCH_DELAY_MS)
	}
)

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