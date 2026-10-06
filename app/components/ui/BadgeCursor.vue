<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const isDesktopPointer = useDesktopPointer()
</script>

<template>
	<Teleport v-if="isDesktopPointer" to="body">
		<LazyUiBadge v-bind="$attrs" />
	</Teleport>
</template>