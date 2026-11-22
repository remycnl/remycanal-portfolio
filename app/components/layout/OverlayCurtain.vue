<script lang="ts" setup>
import { OVERLAY_MOTION } from "@/utils/overlayMotion"

/** A color that covers the screen, then wipes away upward with a softly rounded edge. */
defineProps<{ color: string }>()
const emit = defineEmits<{ done: [] }>()

const { delay, duration, ease } = OVERLAY_MOTION.curtain
const el = useTemplateRef<HTMLElement>("el")

onMounted(() => {
	if (!el.value || matchMedia("(prefers-reduced-motion: reduce)").matches) {
		emit("done")
		return
	}

	el.value
		.animate(
			{
				clipPath: [
					"inset(0 0 0 0 round 0 0 0 0)",
					"inset(0 0 100% 0 round 0 0 3rem 3rem)",
				],
			},
			{ duration: duration * 1000, delay: delay * 1000, easing: ease, fill: "forwards" }
		)
		.finished.then(() => emit("done"))
		.catch(() => {})
})
</script>

<template>
	<div
		ref="el"
		aria-hidden="true"
		class="pointer-events-none fixed inset-0 z-40"
		:style="{ backgroundColor: color }"
	/>
</template>
