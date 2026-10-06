<template>
	<nav aria-label="Sections du CV" class="bg-white border-black sticky top-0 z-10 border-y">
		<ul
			ref="list"
			class="flex gap-6 overflow-x-auto [scrollbar-width:none] md:gap-10"
		>
			<li v-for="(item, index) in items" :key="item.id" class="shrink-0">
				<a
					:href="`#${item.id}`"
					:aria-current="item.id === activeId ? 'true' : undefined"
					class="font-vg5000 text-black relative flex h-14 items-center gap-2 text-xs uppercase after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-black after:transition-transform after:duration-300 motion-reduce:after:transition-none"
					:class="
						item.id === activeId
							? 'after:scale-x-100'
							: 'after:scale-x-0 hover:after:scale-x-100'
					"
				>
					<span class="text-black-light tabular-nums">{{ String(index + 1).padStart(2, "0") }}</span>
					{{ item.label }}
				</a>
			</li>
		</ul>
	</nav>
</template>

<script lang="ts" setup>
interface ResumeNavItem {
	/** Anchor id of the target section */
	id: string
	/** Visible link label */
	label: string
}

interface ResumeNavProps {
	/** Ordered navigation entries */
	items: readonly ResumeNavItem[]
	/** Id of the section currently in view */
	activeId: string | null
}

const props = defineProps<ResumeNavProps>()

const list = useTemplateRef<HTMLUListElement>("list")

watch(
	() => props.activeId,
	async () => {
		await nextTick()
		list.value
			?.querySelector('[aria-current="true"]')
			?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
	},
)
</script>