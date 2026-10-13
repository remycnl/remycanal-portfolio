<script setup lang="ts">
import { APP_FONT_PRELOAD_LINKS } from "@/constants/fonts"

const { isRevealing, isRevealed } = useLoadingState()

// Le scroll reste bloqué jusqu'à ce que le rideau commence à se lever
const isScrollLocked = computed(() => !isRevealing.value)

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
	<LayoutAppLoader v-if="!isRevealed" />

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
