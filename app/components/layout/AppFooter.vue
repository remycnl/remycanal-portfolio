<template>
	<!-- Hauteur = écran moins la loop, qui est juste au-dessus dans le layout :
	     en bas de page, loop + footer font exactement 100svh. -->
	<div
		ref="wrapRef"
		class="relative z-50 h-[calc(100svh-var(--loop-height))] w-full"
		:style="{ clipPath: wrapClipPath }"
	>
		<div class="fixed inset-x-0 bottom-0 z-40 h-[calc(100svh-var(--loop-height))] w-full">
			<LayoutFooterContent :trigger-el="wrapRef" :theme="siteTheme" />
		</div>
	</div>
</template>

<script setup lang="ts">
const wrapRef = useTemplateRef<HTMLElement>("wrapRef")

// Read-only here: the theme is kept in step with the page by `useSiteThemeSync()` in app.vue.
const siteTheme = useSiteTheme()

const wrapClipPath = "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)"

const { refresh } = useScrollRefresh()

let resizeObserver: ResizeObserver | undefined
let resizeTimeout: ReturnType<typeof setTimeout> | undefined
let isFirstObservation = true

function syncScrollEngines() {
	clearTimeout(resizeTimeout)
	resizeTimeout = setTimeout(() => {
		refresh(0)
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
})
</script>
