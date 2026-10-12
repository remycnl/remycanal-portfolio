<template>
	<ul class="flex flex-wrap gap-2">
		<li
			v-for="tag in tags"
			:key="tag"
			class="rounded-full border border-black px-3 py-1 text-sm text-black"
		>
			{{ tag }}
		</li>
	</ul>
</template>

<script lang="ts" setup>
interface ResumeTagListProps {
	/** Labels rendered as outlined pills */
	tags: readonly string[]
}

defineProps<ResumeTagListProps>()
</script>
