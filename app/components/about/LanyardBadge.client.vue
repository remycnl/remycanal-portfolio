<script setup lang="ts">
import type { BadgeData } from "@/types/badge"
import { defaultBadgeData } from "@/types/badge"

export interface EventLanyardProps {
	data?: BadgeData
}

const props = defineProps<EventLanyardProps>()
const badgeData = computed(() => props.data ?? defaultBadgeData)

const container = useTemplateRef<HTMLElement>("container")
const canvas = useTemplateRef<HTMLCanvasElement>("canvas")

useLanyardBadge({ container, canvas, data: badgeData })
</script>

<template>
	<div ref="container" class="relative h-svh w-full select-none">
		<!--
			Pas de classe de curseur ni de pointer-events ici : le composable gère les deux lui-même
			(voir supportsTouch / setBadgeInteractive dans useLanyardBadge.ts), en JS plutôt qu'en CSS,
			pour détecter fiablement les appareils tactiles (y compris hybrides souris + tactile) et
			éviter que le canvas ne capture toute la page en permanence sur un poste à la souris.
		-->
		<canvas ref="canvas" class="absolute inset-0 h-full w-full" />
	</div>
</template>
