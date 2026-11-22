<script lang="ts" setup>
// Two text blocks side by side (stacked on mobile), always left-aligned.
//
// ::split{variant="aside"}
// #first
// ### Context
// A short block.
//
// #second
// The main text.
// ::
//
// `even`  : two equal halves.
// `aside` : a narrow block, then the main text on the reading axis.
withDefaults(defineProps<{ variant?: "even" | "aside" }>(), { variant: "even" })
</script>

<template>
	<!-- Layout lives in overlay-content.css, next to the grid it depends on. -->
	<div data-split :data-variant="variant">
		<div><slot name="first" /></div>
		<div><slot name="second" /></div>
	</div>
</template>
