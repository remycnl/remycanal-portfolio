<script lang="ts" setup>
import type { MetaItem } from "@/components/layout/OverlayMeta.vue"
import { workToneText } from "@/utils/work.ts"

definePageMeta({
	footerTheme: "lime",
	overlay: { theme: "black", parent: "/work" },
})

const route = useRoute()

const { data: item, error } = await useAsyncData(`work-${route.path}`, () =>
	queryCollection("work").path(route.path).first()
)

if (error.value || !item.value) throw notFound()

const next = await useNextEntry("work")

const meta: MetaItem[] = [
	{
		label: "Date",
		value: new Intl.DateTimeFormat("en", {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		}).format(new Date(item.value.date)),
		datetime: item.value.date,
	},
]

if (item.value.client) meta.push({ label: "Client", value: item.value.client })
if (item.value.role) meta.push({ label: "Role", value: item.value.role })
if (item.value.url) {
	meta.push({
		label: "Link",
		value: new URL(item.value.url).hostname.replace(/^www\./, ""),
		href: item.value.url,
	})
}

// The page takes the color of the project; the reveal flashes through the opposite one.
const tone = workToneText(item.value.tone)

useEntrySeo(item.value)
</script>

<template>
	<LayoutOverlayArticle
		v-if="item"
		:title="item.title"
		:meta="meta"
		:tags="item.tags"
		:image="item.image"
		:video="item.video"
		ratio="16 / 10"
		:doc="item"
		:next="next"
		:background="item.tone"
		:tone="tone"
		:reveal="tone === 'white' ? 'black' : 'white'"
		accent="currentColor"
	/>
</template>
