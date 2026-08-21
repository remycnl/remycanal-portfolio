<template>
	<img
		ref="imgRef"
		:src="src"
		:alt="alt"
		draggable="false"
		loading="lazy"
		decoding="async"
		:class="[imgClass, grayscale ? 'grayscale' : '', draggable ? 'select-none' : '']"
	/>
</template>

<script setup lang="ts">
interface Props {
	src: string
	alt: string
	rotate?: number
	grayscale?: boolean
	delay?: number
	duration?: number
	imgClass?: string
	draggable?: boolean
	animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	rotate: 0,
	grayscale: true,
	delay: 0,
	duration: 0.6,
	imgClass: "",
	draggable: false,
	animate: true,
})

const imgRef = useTemplateRef<HTMLImageElement>("imgRef")

/*
 * Animation scroll classique.
 *
 * Pour les stickers du header :
 *
 *   :animate="false"
 *
 * donc ce composable n'est pas lancé.
 */
if (props.animate) {
	useElementPop(imgRef, {
		rotateTo: props.rotate,
		delay: props.delay,
		duration: props.duration,
	})
}

/*
 * Drag.
 *
 * Le composable cherche automatiquement un ancêtre
 * [data-drag-bounds].
 *
 * Dans le header, cet ancêtre est le layer fixed inset-0,
 * donc le sticker peut être déplacé dans tout le viewport.
 */
if (props.draggable) {
	useDraggableSticker(imgRef, {
		baseRotation: props.rotate,
	})
}
</script>
