<script setup lang="ts">
import linealVF from "@/assets/fonts/LinealVF.woff2?url"

useHead({
	titleTemplate: (title) =>
		title ? `${title} · Rémy Canal` : "Rémy Canal — Creative Developer & Designer",
	htmlAttrs: {
		lang: "en",
	},
	link: [
		{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
		{
			rel: "preload",
			href: linealVF,
			as: "font",
			type: "font/woff2",
			crossorigin: "anonymous",
		},
	],
})
useSeoMeta({
	ogSiteName: "Rémy Canal",
	twitterCard: "summary_large_image",
	themeColor: "#000000",
	robots: "index, follow",
})

useAwayTitle()
</script>

<template>
	<div>
		<NuxtRouteAnnouncer />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
