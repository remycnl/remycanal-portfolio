<script lang="ts" setup>
import { formatPostDate } from "@/utils/content"

const { data: posts, error } = await useAsyncData(
	"blog-posts",
	() =>
		queryCollection("blog")
			.select("path", "title", "date", "image")
			.order("date", "DESC")
			.all(),
	{ default: () => [] }
)

const { loopRef, loopStyle } = useLoopHeight()

useSeoMeta({
	title: "Blog",
	description: "I also have thoughts. Occasionally, I write them down.",
})
</script>

<template>
	<div class="relative flex min-h-svh w-full flex-col bg-white" :style="loopStyle">
		<UiPageHeader
			tint="violet"
			:stickers="[
				'/stickers/character_violet.svg',
				'/stickers/flower_violet.svg',
				'/stickers/dog_violet.svg',
				'/stickers/characterFull_violet.svg',
				'/stickers/cursor_violet.svg',
			]"
		>
			<template #title>Welcome to my blog.<br />Side quests included.</template>
			<template #description>
				I also have thoughts...<br />Occasionally, I write them down.
			</template>
		</UiPageHeader>

		<div class="relative z-10 flex flex-1 flex-col bg-white">
			<UiInfiniteHorizontalLoop
				:ref="loopRef"
				text="Blog"
				class="text-gray-light relative z-10 pt-4 [word-spacing:1em]"
			/>
			<UiCardGrid
				v-slot="{ item, cellClass }"
				:items="posts"
				:error="Boolean(error)"
				theme="white"
				tint="violet"
				label="Read article"
				press-label="Open article"
				error-title="The articles could not be loaded."
				empty-text="No articles published yet."
				reveal-first-row
			>
				<UiCard
					:title="item.title"
					:image="item.image"
					:date="formatPostDate(item.date)"
					:href="item.path"
					overlay
					:class="cellClass"
				/>
			</UiCardGrid>
		</div>
	</div>
</template>
