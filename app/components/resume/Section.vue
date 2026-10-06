<template>
	<section
		:id="id"
		:aria-labelledby="`${id}-title`"
		class="border-black grid scroll-mt-14 gap-8 border-b py-16 md:grid-cols-12 md:gap-12 md:py-24"
	>
		<header class="md:col-span-3">
			<div class="font-vg5000 text-black flex items-baseline gap-3 uppercase md:sticky md:top-24">
				<h2 :id="`${id}-title`" class="text-sm">{{ title }}</h2>
				<span v-if="count" class="text-black-light text-xs tabular-nums">
					({{ String(count).padStart(2, "0") }})
				</span>
			</div>
		</header>
		<div class="md:col-span-9">
			<slot />
		</div>
	</section>
</template>

<script lang="ts" setup>
interface ResumeSectionProps {
	/** Anchor id, must match the corresponding navigation entry */
	id: string
	/** Visible section heading */
	title: string
	/** Optional item counter displayed next to the heading */
	count?: number
}

defineProps<ResumeSectionProps>()
</script>