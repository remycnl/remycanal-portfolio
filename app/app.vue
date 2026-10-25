<script setup lang="ts">
import { APP_FONT_PRELOAD_LINKS } from "@/constants/fonts"

const { isRevealed } = useLoadingState()
const lenis = useLenis()
const route = useRoute()
const { overlay } = useOverlay()

/** The loader is on screen: first load and reloads only, internal navigations never show it. */
const isLoading = computed(() => !isRevealed.value)

/** The page cannot scroll while the loader or an overlay covers it. */
const isScrollLocked = computed(() => isLoading.value || overlay.locked)

useHead({
	titleTemplate: (title) =>
		title ? `${title} · Rémy Canal` : "Rémy Canal — Creative Developer & Designer",
	htmlAttrs: {
		lang: "en",
		// Rendered by the server: the very first paint is already black and frozen.
		"data-loading": computed(() => (isLoading.value ? "" : undefined)),
		"data-scroll-locked": computed(() => (isScrollLocked.value ? "" : undefined)),
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

// On the client, the lock is applied in the same tick as the state change: not a single frame
// between the click that opens an overlay and the moment the page stops moving. The `useHead`
// above renders the same value a moment later, and covers the server.
if (import.meta.client) {
	watch(
		isScrollLocked,
		(locked) => {
			document.documentElement.toggleAttribute("data-scroll-locked", locked)
			if (locked) lenis?.stop()
			else lenis?.start()
		},
		{ immediate: true, flush: "sync" }
	)
}

const overlayRef = useTemplateRef("overlayRef")

/**
 * Called while the wipe covers the screen: the jump to the top is invisible, and the new page
 * mounts at the right place. Back/forward navigations keep the saved position, restored by Nuxt.
 */
function resetScrollWhileCovered() {
	if (route.meta.scrollToTop === false) return
	// Back/forward: vue-router keeps the position of the entry and Nuxt restores it.
	if (window.history.state?.scroll) return

	if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
	else window.scrollTo({ top: 0, left: 0, behavior: "instant" })
}

const pageTransition = {
	name: "page",
	mode: "out-in" as const,
	css: false,
	onLeave(_el: Element, done: () => void) {
		const finish = () => {
			resetScrollWhileCovered()
			done()
		}

		if (overlayRef.value) overlayRef.value.cover(finish)
		else finish()
	},
	onEnter(_el: Element, done: () => void) {
		overlayRef.value?.reveal(done)
	},
}
</script>

<template>
	<LayoutAppLoader v-if="isLoading" />

	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<!--
			Behind an overlay, the page it was opened from stays displayed with the same key: it is
			neither remounted nor transitioned. It is inert while frozen; the header stays usable.
		-->
		<NuxtPage
			:route="overlay.background ?? undefined"
			:transition="pageTransition"
			:inert="overlay.locked || undefined"
		/>
	</NuxtLayout>
	<LayoutOverlayHost />
	<LayoutScrollbar />
	<LayoutClickEffect />
	<LayoutTransitionOverlay
		ref="overlayRef"
		:base-color="route.meta.transitionBase"
		:accent-color="route.meta.transitionAccent"
		:direction="route.meta.transitionDirection"
	/>
	<AppOrientationGuard />
</template>
