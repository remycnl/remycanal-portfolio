<script lang="ts" setup>
export interface MetaItem {
	label: string
	value: string
	href?: string
	/** ISO date: the value is then wrapped in a <time>. */
	datetime?: string
}

withDefaults(
	defineProps<{
		items?: readonly MetaItem[]
		tags?: readonly string[]
	}>(),
	{ items: () => [], tags: () => [] }
)
</script>

<template>
	<!-- One band: every piece of information sits on the same line when it fits. -->
	<dl
		v-if="items.length || tags.length"
		class="gap-x-edge flex flex-wrap gap-y-8 border-t border-current/20 pt-6"
	>
		<div v-for="item in items" :key="item.label" class="min-w-32 flex-[1_1_10rem]">
			<dt class="font-vg5000 text-xs tracking-widest uppercase opacity-55">
				{{ item.label }}
			</dt>
			<dd class="mt-3 text-sm">
				<a
					v-if="item.href"
					:href="item.href"
					target="_blank"
					rel="noopener"
					class="underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
				>
					{{ item.value }}
				</a>
				<time v-else-if="item.datetime" :datetime="item.datetime">{{ item.value }}</time>
				<template v-else>{{ item.value }}</template>
			</dd>
		</div>

		<div v-if="tags.length" class="min-w-48 flex-[2_1_16rem]">
			<dt class="font-vg5000 text-xs tracking-widest uppercase opacity-55">Tags</dt>
			<dd class="mt-3 text-sm">
				<ul>
					<li v-for="(tag, i) in tags" :key="tag" class="inline">
						<span v-if="i" aria-hidden="true" class="mx-[0.6em] opacity-40">/</span
						>{{ tag }}
					</li>
				</ul>
			</dd>
		</div>
	</dl>
</template>
