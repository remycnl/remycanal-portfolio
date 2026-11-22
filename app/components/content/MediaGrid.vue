<script lang="ts" setup>
// ::media-grid{cols="3"}
// ![](/a.jpg)
//
// ![](/b.jpg)
//
// ![](/c.jpg)
// ::
defineProps<{ cols?: number | string }>()
</script>

<template>
	<div data-media class="media-grid" :style="{ '--cols': cols ?? 2 }">
		<slot />
	</div>
</template>

<style scoped>
.media-grid {
	display: grid;
	gap: var(--spacing-edge);
	align-items: start;
}

/* Markdown wraps each image in a <p>: it disappears from the layout. */
.media-grid :deep(p) {
	display: contents;
}

@media (min-width: 640px) {
	.media-grid {
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
	}
}
</style>
