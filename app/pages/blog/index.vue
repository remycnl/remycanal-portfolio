<script lang="ts" setup>
import { formatPostDate } from "@/utils/content"

const { data: posts, error } = await useAsyncData(
	"blog-posts",
	() =>
		queryCollection("blog")
			.select("path", "title", "description", "date", "image")
			.order("date", "DESC")
			.all(),
	{ default: () => [] }
)

const rows = computed(() => buildCardRows(posts.value ?? [], "blog"))

useSeoMeta({
	title: "Blog",
	description: "I also have thoughts. Occasionally, I write them down.",
})
</script>

<template>
	<div class="relative flow-root min-h-svh w-full bg-white">
		<div class="section-p-xy mt-edge relative isolate">
			<LazyUiViewfinder theme="violet" background="white" />

			<div class="flex flex-col md:flex-row h-fit md:items-end justify-between gap-3 pt-14 lg:pt-0">
				<h2
					v-text-reveal="{ theme: 'violet' }"
					class="font-lineal-bold text-3xl text-black lg:text-4xl"
				>
					Welcome to my blog.
				</h2>

				<h3
					v-text-reveal="{ theme: 'violet' }"
					class="md:text-right text-sm text-black/60"
				>
					I also have thoughts...<br />Occasionally, I write them down.
				</h3>
			</div>

			<div v-if="error" class="mt-32 max-w-lg text-black/60 lg:mt-48">
				<p class="font-lineal-medium text-xl">The articles could not be loaded.</p>
				<p class="mt-3 text-sm">Please try again in a moment.</p>
			</div>

			<div
				v-else-if="rows.length"
				class="mt-32 flex flex-col gap-y-32 lg:mt-48 lg:gap-y-64"
			>
				<div
					v-for="row in rows"
					:key="row[0]!.item.path"
					class="grid grid-cols-12 gap-y-32 lg:gap-y-0"
				>
					<UiCard
						v-for="cell in row"
						:key="cell.item.path"
						:title="cell.item.title"
						:image="cell.item.image"
						:date="formatPostDate(cell.item.date)"
						:depth="cell.depth"
						:href="cell.item.path"
						theme="white"
						viewfinder-label="Open article"
						viewfinder-loading-label="Opening..."
						teaser-tint="violet"
						:reveal="true"
						:class="cell.class"
					>
						{{ cell.item.description }}
					</UiCard>
				</div>
			</div>

			<p v-else class="mt-32 text-black/60 lg:mt-48">No articles published yet.</p>
		</div>
		<div class="bg-violet h-px w-full" />
	</div>
</template>