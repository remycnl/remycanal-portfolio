<script lang="ts" setup>
interface TemplateCard {
	path: string
	title: string
	price: string
	tags: string[]
	teaser: boolean
	image: string
}

const { data: templates, error } = await useAsyncData<TemplateCard[]>(
	"templates",
	async () => {
		const entries = await queryCollection("templates")
			.select("path", "title", "price", "tags", "teaser", "image")
			.order("title", "ASC")
			.all()
		return entries as unknown as TemplateCard[]
	},
	{ default: () => [] }
)

const { loopRef, loopStyle } = useLoopHeight()

useSeoMeta({
	title: "Templates",
	description: "A collection of ready-made creative templates.",
})
</script>

<template>
	<div
		class="relative flex min-h-svh w-full flex-col border-b-2 border-black-light bg-black text-white"
		:style="loopStyle"
	>
		<UiPageHeader tint="lime" :stickers="['/stickers/sticker-computer.png', '/stickers/sticker-raven.png', '/stickers/sticker-robot.png']">
			<template #title>Not just templates...<br />Make it yours.</template>
			<template #description>
				A collection of ready-made creative starting points.
			</template>
		</UiPageHeader>

		<div class="relative z-10 flex flex-1 flex-col bg-black">
			<!-- Banderole -->
			<UiInfiniteHorizontalLoop
				:ref="loopRef"
				text="Templates"
				class="text-black-light relative z-10 pt-4 [word-spacing:1em]"
			/>
			<UiCardGrid
				v-slot="{ item, cellClass }"
				:items="templates"
				:error="Boolean(error)"
				theme="black"
				tint="lime"
				label="See template"
				press-label="Open template"
				error-title="The templates could not be loaded."
				empty-text="No templates published yet."
				reveal-first-row
			>
				<UiCard
					:title="item.title"
					:image="item.image"
					:price="item.price"
					:tags="item.tags"
					:teaser="item.teaser"
					:href="item.path"
					:class="cellClass"
				/>
			</UiCardGrid>
		</div>
	</div>
</template>
