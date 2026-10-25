<script lang="ts" setup>
type SheetTheme = "black" | "white"

const { overlay } = useOverlay()

const wrapperRef = useTemplateRef<HTMLElement>("wrapperRef")
const contentRef = useTemplateRef<HTMLElement>("contentRef")

// Same feel as the page scroll, independent from it.
useOverlayScroll(wrapperRef, contentRef)

// Tells the pages displayed in the sheet that they are in it (see LayoutOverlayClose).
provide(OVERLAY_SHEET_KEY, true)

const surfaces: Record<SheetTheme, string> = {
	black: "bg-black text-white",
	white: "bg-white text-black",
}

const surface = computed(() => surfaces[overlay.sheet?.meta.overlay?.theme ?? "black"])

let trigger: HTMLElement | null = null

// The page behind is frozen while the sheet is there (the lock itself, scroll and Lenis included,
// is owned by app.vue). The focus goes to the sheet when it opens and comes back to the card
// after. Synchronous so that the card is still the active element when it is read.
watch(
	() => overlay.locked,
	async (locked) => {
		if (locked) {
			trigger =
				document.activeElement instanceof HTMLElement ? document.activeElement : null
			return
		}

		// The page is inert until the next render: it can only take the focus back after it.
		await nextTick()
		if (trigger?.isConnected) trigger.focus({ preventScroll: true })
		trigger = null
	},
	{ flush: "sync" }
)

// The sheet takes the focus when it appears, and tells the scrollbar which element scrolls.
watch(
	wrapperRef,
	(element) => {
		overlay.scroller = element
		element?.focus({ preventScroll: true })
	},
	{ flush: "post" }
)

function onAfterLeave() {
	if (!overlay.sheet) overlay.locked = false
}
</script>

<template>
	<!-- Outside of the app root: above the footer, whatever the stacking contexts of the layout. -->
	<Teleport to="#teleports">
		<Transition name="sheet" :css="overlay.slides" @after-leave="onAfterLeave">
			<div
				v-if="overlay.sheet"
				ref="wrapperRef"
				data-lenis-prevent
				role="dialog"
				aria-labelledby="overlay-title"
				tabindex="-1"
				:class="[
					'no-scrollbar fixed inset-0 z-70 overflow-y-auto overscroll-contain outline-none',
					surface,
				]"
			>
				<div ref="contentRef">
					<NuxtPage :route="overlay.sheet" :transition="false" />
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
