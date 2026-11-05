<script setup lang="ts">
import type { BadgeProps } from "@/components/ui/Badge.vue"

interface Props {
	badge: BadgeProps
}

const { badge } = defineProps<Props>()

const isDesktopPointer = useDesktopPointer()
</script>

<template>
	<Teleport v-if="isDesktopPointer" to="body">
		<LazyUiBadge v-bind="badge" />
	</Teleport>
</template>
