<script lang="ts" setup>
// Overrides the Markdown image: ![alt](/src.jpg "Caption")
// A .mp4 / .webm source becomes a video: ![](/demo.mp4 "Caption")
// Dimensions (avoid layout shift): ![alt](/src.jpg){width="1200" height="630"}
import Media from "./Media.vue"

defineProps<{
	src: string
	alt?: string
	title?: string
	width?: number | string
	height?: number | string
}>()
</script>

<template>
	<!-- Markdown wraps images in a <p>: the wrapper has to be a <span>. -->
	<Media
		as="span"
		:src="src"
		:alt="alt"
		:caption="title"
		:width="width"
		:height="height"
	/>
</template>
