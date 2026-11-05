<script lang="ts" setup>
import { formatPostDate } from "@/utils/content"

// Opened from a card, it covers the page it comes from (see `overlay` on the cards). Reached
// directly (shared link, reload, search engine), it is a regular page.
definePageMeta({ overlay: { theme: "white", parent: "/blog" } })

const route = useRoute()

const { data: post, error } = await useAsyncData(`blog-${route.path}`, () =>
	queryCollection("blog").path(route.path).first()
)

if (error.value || !post.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Article not found",
		fatal: true,
	})
}

useSeoMeta({
	title: post.value.title,
	description: post.value.description,
	ogTitle: post.value.title,
	ogDescription: post.value.description,
	ogImage: post.value.image,
	ogImageWidth: 1200,
	ogImageHeight: 630,
})
</script>

<template>
	<article v-if="post" class="relative flow-root min-h-svh w-full bg-white">
		<div class="section-p-xy mt-edge w-full">
			<time class="font-vg5000 text-xs tracking-widest text-black/40 uppercase">
				{{ formatPostDate(post.date) }} · {{ post.author }}
			</time>
			<h1
				id="overlay-title"
				class="font-lineal-bold mt-4 text-4xl text-black lg:text-5xl"
			>
				{{ post.title }}
			</h1>
			<img
				:src="post.image"
				:alt="post.title"
				class="mt-10 aspect-video w-full rounded-xs object-cover"
			/>
			<ContentRenderer :value="post" class="overlay-content mt-10 text-black/80" />
		</div>

		<LayoutOverlayClose />
	</article>
</template>
