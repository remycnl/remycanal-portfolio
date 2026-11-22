<script lang="ts" setup>
import type { MetaItem } from "@/components/layout/OverlayMeta.vue"

definePageMeta({
	footerTheme: "lime",
	overlay: { theme: "black", parent: "/playground" },
})

const route = useRoute()

const { data: item, error } = await useAsyncData(`playground-${route.path}`, () =>
	queryCollection("playground").path(route.path).first()
)

if (error.value || !item.value) throw notFound()

const next = await useNextEntry("playground")

const date = new Date(item.value.date)

const meta: MetaItem[] = [
	{
		label: "Date",
		// UTC: the same text on the server and in the browser, whatever the time zone.
		value: new Intl.DateTimeFormat("en", {
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		}).format(date),
		datetime: date.toISOString(),
	},
]

useEntrySeo(item.value)
</script>

<template>
	<LayoutOverlayArticle
		v-if="item"
		:title="item.title"
		:meta="meta"
		:tags="item.tags"
		:image="item.image"
		:image-width="item.width"
		:image-height="item.height"
		:video="item.video"
		:doc="item"
		:next="next"
		background="var(--color-black)"
		tone="white"
	/>
</template>
