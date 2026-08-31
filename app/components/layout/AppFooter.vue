<template>
	<div ref="wrapRef" class="z-5000 relative w-full" :style="{ clipPath: wrapClipPath }">
		<!-- Spacer : invisible, en flux normal, définit la hauteur réelle -->
		<div inert aria-hidden="true" class="invisible">
			<LayoutFooterContent />
		</div>

		<!-- Copie visible, superposée, sans hauteur imposée -->
		<div class="fixed inset-x-0 bottom-0 w-full">
			<LayoutFooterContent interactive :trigger-el="wrapRef" />
		</div>
	</div>
</template>

<script setup lang="ts">
const wrapRef = useTemplateRef<HTMLElement>("wrapRef")

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
})
</script>
