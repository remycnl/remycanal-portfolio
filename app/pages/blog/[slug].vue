<script lang="ts" setup>
import type { MetaItem } from "@/components/layout/OverlayMeta.vue"
import { formatPostDate } from "@/utils/content"

// Opened from a card, it covers the page it comes from. Reached directly (shared link, reload),
// it covers its parent in the same way: the overlay store decides it from the URL.
definePageMeta({ overlay: { theme: "white", parent: "/blog" } })

const route = useRoute()

const { data: post, error } = await useAsyncData(`blog-${route.path}`, () =>
	queryCollection("blog").path(route.path).first()
)

if (error.value || !post.value) throw notFound()

const next = await useNextEntry("blog")

const meta: MetaItem[] = [
	{
		label: "Date",
		value: formatPostDate(post.value.date),
		datetime: new Date(post.value.date).toISOString(),
	},
	{ label: "Author", value: post.value.author },
]

useEntrySeo(post.value)
</script>

<template>
	<LayoutOverlayArticle
		v-if="post"
		:title="post.title"
		:meta="meta"
		:tags="post.tags"
		:image="post.image"
		:video="post.video"
		ratio="16 / 9"
		:doc="post"
		:next="next"
		background="var(--color-white)"
		tone="black"
	/>
</template>
