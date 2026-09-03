<template>
	<span
		class="inline-block"
		:class="fontClass"
		:style="active ? '' : 'filter: url(#nav-text-outline)'"
	>
		{{ text }}
	</span>
</template>

<script setup lang="ts">
defineProps<{
	text: string
	active: boolean
	fontClass?: string
}>()
</script>
