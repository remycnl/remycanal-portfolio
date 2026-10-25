<script lang="ts" setup>
type CloseTheme = "black" | "white"

const route = useRoute()
const { overlay, close } = useOverlay()

/** True when the page is displayed in the overlay sheet, false when it is a regular page. */
const inSheet = inject(OVERLAY_SHEET_KEY, false)

const themes: Record<CloseTheme, string> = {
	black: "bg-black-light text-white hover:text-lime",
	white: "bg-gray-light text-black hover:text-violet",
}

const theme = computed(() => themes[route.meta.overlay?.theme ?? "black"])
const parent = computed(() => route.meta.overlay?.parent ?? "/")

// In the sheet, "close" goes back to the page behind; reached directly, to the section of the page.
const target = computed(() => (inSheet && overlay.background?.fullPath) || parent.value)

function onClick(event: MouseEvent) {
	// A regular page: the link navigates on its own, page transition included.
	if (!inSheet) return
	if (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return
	}

	event.preventDefault()
	close()
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") close()
}

onMounted(() => {
	if (inSheet) window.addEventListener("keydown", onKeydown)
})

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown))
</script>

<template>
	<!-- Sticks to the bottom of the screen while the page scrolls, and stops with the page. -->
	<div
		class="pointer-events-none sticky bottom-0 z-10 flex justify-end px-6 pb-4 lg:px-8 lg:pb-6"
	>
		<NuxtLink
			:to="target"
			aria-label="Close"
			:class="[
				'font-vg5000 pointer-events-auto rounded-xs px-3 py-2 text-xs tracking-widest uppercase transition-colors duration-200',
				theme,
			]"
			@click="onClick"
		>
			Close
		</NuxtLink>
	</div>
</template>
