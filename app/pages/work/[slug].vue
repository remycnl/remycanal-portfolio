<script lang="ts" setup>
import { workToneText } from "@/utils/work.ts"

definePageMeta({
	footerTheme: "lime",
	overlay: { theme: "black", parent: "/work" },
})

const route = useRoute()

const { data: item, error } = await useAsyncData(`work-${route.path}`, () =>
	queryCollection("work").path(route.path).first()
)

if (error.value || !item.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Not found",
		fatal: true,
	})
}

const formattedDate = new Intl.DateTimeFormat("en", {
	month: "long",
	year: "numeric",
	timeZone: "UTC",
}).format(new Date(item.value.date))

useSeoMeta({
	title: item.value.title,
	description: item.value.description,
	ogTitle: item.value.title,
	ogDescription: item.value.description,
	ogImage: item.value.image,
	ogImageWidth: 1200,
	ogImageHeight: 630,
})
</script>

<template>
	<article
		v-if="item"
		:class="[
			'relative flow-root min-h-svh w-full',
			workToneText(item.tone) === 'white' ? 'text-white' : 'text-black',
		]"
		:style="{
			backgroundColor: item.tone,
			'--overlay-content-color':
				workToneText(item.tone) === 'white' ? 'var(--color-white)' : 'var(--color-black)',
		}"
	>
		<div class="section-p-xy mt-edge w-full">
			<time
				:datetime="item.date"
				class="font-vg5000 text-xs tracking-widest opacity-55 uppercase"
			>
				{{ formattedDate }}
			</time>
			<h1 id="overlay-title" class="font-lineal-bold mt-4 text-4xl lg:text-5xl">
				{{ item.title }}
			</h1>

			<WorkTags
				:tags="item.tags"
				plain
				:plain-color="workToneText(item.tone)"
				class="mt-6 text-xs"
			/>

			<img
				v-if="item.image"
				:src="item.image"
				:alt="item.title"
				decoding="async"
				class="mt-10 aspect-16/10 w-full rounded-xs object-cover"
			/>

			<ContentRenderer
				v-if="item.body?.value?.length"
				:value="item"
				class="overlay-content mt-10 opacity-80"
			/>
		</div>

		<LayoutOverlayClose />
	</article>
</template>
