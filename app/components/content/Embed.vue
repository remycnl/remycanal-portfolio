<script lang="ts" setup>
// ::embed{url="https://youtu.be/xxxx" title="Making of"}
// ::
interface Props {
	url: string
	/** Required: describes the frame for screen readers. */
	title: string
	ratio?: string
	caption?: string
}

const props = withDefaults(defineProps<Props>(), { ratio: "16 / 9" })

const src = computed(() => {
	try {
		const u = new URL(props.url)
		const host = u.hostname.replace(/^www\./, "")

		if (host === "youtu.be") {
			return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
		}
		if (host.endsWith("youtube.com")) {
			const id = u.searchParams.get("v")
			if (id) return `https://www.youtube-nocookie.com/embed/${id}`
		}
		if (host === "vimeo.com") {
			const id = u.pathname.split("/").filter(Boolean)[0]
			if (id) return `https://player.vimeo.com/video/${id}?dnt=1`
		}
	} catch {
		// Invalid URL: used as is.
	}
	return props.url
})
</script>

<template>
	<figure data-media class="block">
		<span
			v-image-reveal
			class="relative block overflow-hidden rounded-xs bg-current/8"
			:style="{ aspectRatio: ratio }"
		>
			<iframe
				:src="src"
				:title="title"
				loading="lazy"
				allowfullscreen
				referrerpolicy="strict-origin-when-cross-origin"
				allow="fullscreen; picture-in-picture; encrypted-media"
				class="absolute inset-0 size-full border-0"
			/>
		</span>
		<figcaption v-if="caption" data-caption>{{ caption }}</figcaption>
	</figure>
</template>
