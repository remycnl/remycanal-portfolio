<template>
	<div ref="wrapRef" class="relative z-50 w-full" :style="{ clipPath: wrapClipPath }">
		<!-- Spacer : invisible, en flux normal, définit la hauteur réelle -->
		<div inert aria-hidden="true" class="invisible">
			<LayoutFooterContent :theme="footerTheme" />
		</div>

		<!-- Copie visible, superposée, sans hauteur imposée -->
		<div class="fixed inset-x-0 bottom-0 z-40 w-full">
			<LayoutFooterContent interactive :trigger-el="wrapRef" :theme="footerTheme" />
		</div>
	</div>
</template>

<script setup lang="ts">
const route = useRoute()
const wrapRef = useTemplateRef<HTMLElement>("wrapRef")

type FooterTheme = "lime" | "violet"

function getFooterTheme(path: string): FooterTheme {
	return path === "/contact" || path === "/templates" || path.startsWith("/templates/")
		? "lime"
		: "violet"
}

const footerTheme = ref<FooterTheme>(getFooterTheme(route.path))

watch(
	() => route.path,
	async (path) => {
		await nextTick()
		await waitForPageTransition()

		footerTheme.value = getFooterTheme(path)
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
})
</script>
