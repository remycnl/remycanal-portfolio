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
}

const props = withDefaults(defineProps<Props>(), {
	rotate: 0,
	grayscale: false,
	delay: 0,
	duration: 0.6,
	imgClass: "",
	draggable: false,
})

const imgRef = useTemplateRef<HTMLImageElement>("imgRef")

useElementPop(imgRef, {
	rotateTo: props.rotate,
	delay: props.delay,
	duration: props.duration,
})

if (props.draggable) {
	useDraggableSticker(imgRef, {
		baseRotation: props.rotate,
	})
}
</script>

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
