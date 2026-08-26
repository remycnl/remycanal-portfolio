<template>
	<div ref="wrapRef" class="relative w-full" :style="{ clipPath: wrapClipPath }">
		<!-- Spacer : invisible, en flux normal, définit la hauteur réelle -->
		<div inert aria-hidden="true" class="invisible">
			<LayoutFooterContent />
		</div>

		<!-- Copie visible, superposée, sans hauteur imposée -->
		<div class="fixed inset-x-0 bottom-0 w-full">
			<div ref="footerContentRef">
				<LayoutFooterContent interactive />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const wrapRef = useTemplateRef<HTMLElement>("wrapRef")
const footerContentRef = useTemplateRef<HTMLElement>("footerContentRef")

const wrapClipPath = "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)"

const { useGsapContext, ScrollTrigger } = useGsap()
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

// --- Animation d'entrée scrubée, réactive à prefers-reduced-motion ---
useGsapContext(({ gsap }) => {
	if (!footerContentRef.value || !wrapRef.value) return

	const linkEls = gsap.utils.toArray<HTMLElement>(".footer-link", footerContentRef.value)
	const fadeEls = gsap.utils.toArray<HTMLElement>(".footer-fade", footerContentRef.value)

	const mm = gsap.matchMedia()

	mm.add(
		{
			reduce: "(prefers-reduced-motion: reduce)",
			noPreference: "(prefers-reduced-motion: no-preference)",
		},
		(context) => {
			const { reduce } = context.conditions as { reduce: boolean }
			if (reduce) return

			gsap.set(linkEls, { yPercent: 100, force3D: true })
			gsap.set(fadeEls, { autoAlpha: 0, y: 16 })

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: wrapRef.value,
					start: "top bottom",
					end: "bottom bottom",
					scrub: 0.6,
				},
			})

			tl.to(linkEls, {
				yPercent: 0,
				stagger: 0.06,
				ease: "power3.out",
				force3D: true,
			}).to(fadeEls, { autoAlpha: 1, y: 0, stagger: 0.05, ease: "power3.out" }, "<0.1")

			return () => {
				tl.scrollTrigger?.kill()
				tl.kill()
			}
		}
	)

	return () => mm.revert()
}, wrapRef)
</script>
