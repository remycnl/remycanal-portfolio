<script lang="ts" setup>
// Opened from a card, it covers the page it comes from (see `overlay` on the cards). Reached
// directly (shared link, reload, search engine), it is a regular page.
definePageMeta({
	footerTheme: "lime",
	overlay: { theme: "black", parent: "/playground" },
})

const route = useRoute()

const { data: item, error } = await useAsyncData(`playground-${route.path}`, () =>
	queryCollection("playground").path(route.path).first()
)

if (error.value || !item.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Not found",
		fatal: true,
	})
}

const date = new Date(item.value.date)
const isoDate = date.toISOString()
const formattedDate = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "long",
	year: "numeric",
}).format(date)

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
	<article v-if="item" class="relative flow-root min-h-svh w-full bg-black text-white">
		<div class="section-p-xy mt-edge w-full">
			<time
				:datetime="isoDate"
				class="font-vg5000 text-xs tracking-widest text-white/40 uppercase"
			>
				{{ formattedDate }}
			</time>
			<h1 id="overlay-title" class="font-lineal-bold mt-4 text-4xl lg:text-5xl">
				{{ item.title }}
			</h1>

			<NuxtImg
				:src="item.image"
				:alt="item.title"
				:width="item.width"
				:height="item.height"
				format="webp"
				:quality="80"
				sizes="100vw lg:48rem"
				class="mt-10 h-auto w-full rounded-xs"
			/>

			<ContentRenderer
				v-if="item.body?.value?.length"
				:value="item"
				class="overlay-content mt-10 text-white/80"
			/>
		</div>

		<LayoutOverlayClose />
	</article>
</template>
