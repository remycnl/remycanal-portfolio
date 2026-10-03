<script lang="ts" setup>
import { formatPostDate } from "@/utils/content"

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
		<div class="section-p-xy mt-edge mx-auto max-w-3xl">
			<time class="font-vg5000 text-xs tracking-widest text-black/40 uppercase">
				{{ formatPostDate(post.date) }} · {{ post.author }}
			</time>
			<h1 class="font-lineal-bold mt-4 text-4xl text-black lg:text-5xl">
				{{ post.title }}
			</h1>
			<img
				:src="post.image"
				:alt="post.title"
				class="mt-10 aspect-video w-full rounded-xs object-cover"
			/>
			<ContentRenderer :value="post" class="article-content mt-10 text-black/80" />
		</div>
	</article>
</template>

<style scoped>
.article-content :deep(h2) {
	margin-top: 3rem;
	font-family: var(--font-lineal);
	font-size: 1.5rem;
	font-weight: var(--lineal-weight-bold);
	line-height: 1.1;
	color: var(--color-black);
}

.article-content :deep(p) {
	margin-top: 1.25rem;
	font-size: 1rem;
	line-height: 1.75;
}

.article-content :deep(h2 + p) {
	margin-top: 1rem;
}

@media (min-width: 1024px) {
	.article-content :deep(p) {
		font-size: 1.125rem;
	}
}
</style>
