<script setup lang="ts">
import { APP_FONT_PRELOAD_LINKS } from "@/constants/fonts"

const isLoading = useState("app-loading", () => true)
const { isComplete } = useLoadingProgress()

const isScrollLocked = computed(() => isLoading.value)

const hideLoader = async () => {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	await new Promise<void>((resolve) => setTimeout(resolve, 200))
	isLoading.value = false
}

watch(isComplete, (complete) => {
	if (complete) hideLoader()
})

useHead({
	titleTemplate: (title) =>
		title ? `${title} · Rémy Canal` : "Rémy Canal — Creative Developer & Designer",
	htmlAttrs: {
		lang: "en",
	},
	bodyAttrs: {
		class: computed(() => (isScrollLocked.value ? "overflow-hidden" : "")),
	},
	link: [
		{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
		...APP_FONT_PRELOAD_LINKS,
	],
})

useSeoMeta({
	ogSiteName: "Rémy Canal",
	twitterCard: "summary_large_image",
	themeColor: "#201e1e",
	robots: "index, follow",
})

useAwayTitle()

const overlayRef = useTemplateRef("overlayRef")

const pageTransition = {
	name: "page",
	mode: "out-in" as const,
	css: false,
	onLeave(_el: Element, done: () => void) {
		overlayRef.value?.cover(done)
	},
	onEnter(_el: Element, done: () => void) {
		overlayRef.value?.reveal(done)
	},
}

const route = useRoute()
</script>

<template>
	<Transition
		enter-active-class="transition-opacity duration-400"
		leave-active-class="transition-opacity duration-400"
		enter-from-class="opacity-0"
		leave-to-class="opacity-0"
	>
		<LayoutAppLoader v-if="isLoading" />
	</Transition>

	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage :transition="pageTransition" />
	</NuxtLayout>
	<LayoutTransitionOverlay
		ref="overlayRef"
		:base-color="route.meta.transitionBase"
		:accent-color="route.meta.transitionAccent"
		:direction="route.meta.transitionDirection"
	/>
</template>
