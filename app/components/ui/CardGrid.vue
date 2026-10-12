<script setup lang="ts" generic="T extends { path: string }">
import type { CardTheme, CardTint } from "@/composables/useCardGrid"

interface Props {
	items: readonly T[]
	/** Background the grid sits on. */
	theme?: CardTheme
	/** Accent color of the cursor badge and of the teaser overlay of the cards. */
	tint?: CardTint
	/** Cursor badge label while a card is hovered. */
	label?: string
	/** Cursor badge label while a card is pressed. Defaults to `label`, so only the pill scale animates. */
	pressLabel?: string
	/** Cursor badge label once a card has been clicked and navigation is pending. */
	loadingLabel?: string
	/** Reveals the first row as soon as the page is ready, even if it exceeds the screen. The next rows reveal one at a time, as they are scrolled into view. Rows are read from the real layout, so they follow the breakpoints. */
	error?: boolean
	errorTitle?: string
	emptyText?: string
}

const {
	items,
	theme = "white",
	tint = "lime",
	label = "Open",
	pressLabel,
	loadingLabel = "Opening...",
	error = false,
	errorTitle = "The content could not be loaded.",
	emptyText = "Nothing published yet.",
} = defineProps<Props>()

defineSlots<{
	default(props: { item: T; cellClass: string }): unknown
}>()

const textTones: Record<CardTheme, string> = {
	white: "text-black/60",
	black: "text-white/60",
}

const cells = computed(() => buildCardCells(items))

const badge = provideCardGrid({
	theme,
	tint,
	label,
	pressLabel,
	loadingLabel,
})
</script>

<template>
	<div class="section-p-xy relative isolate">
		<UiBadgeCursor v-bind="badge" />

		<div v-if="error" :class="[textTones[theme], 'max-w-lg']">
			<p class="font-lineal-medium text-xl">{{ errorTitle }}</p>
			<p class="mt-3 text-sm">Please try again in a moment.</p>
		</div>

		<div
			v-else-if="cells.length"
			class="grid grid-cols-24 items-start gap-x-0 gap-y-14 md:gap-x-4 md:gap-y-20 lg:gap-x-6 lg:gap-y-24"
		>
			<template v-for="cell in cells" :key="cell.item.path">
				<slot :item="cell.item" :cell-class="cell.class" />
			</template>
		</div>

		<p v-else :class="textTones[theme]">{{ emptyText }}</p>
	</div>
</template>
