<script lang="ts" setup>
const route = useRoute()

const { data: template, error } = await useAsyncData(`template-${route.path}`, () =>
	queryCollection("templates").path(route.path).first()
)

if (error.value || !template.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "Template not found",
		fatal: true,
	})
}

useSeoMeta({
	title: template.value.title,
	description: template.value.description,
	ogTitle: template.value.title,
	ogDescription: template.value.description,
	ogImage: template.value.image,
	ogImageWidth: 1200,
	ogImageHeight: 630,
})
</script>

<template>
	<article v-if="template" class="relative flow-root min-h-svh w-full bg-black">
		<div class="section-p-xy mt-edge mx-auto max-w-3xl">
			<LazyUiViewfinder theme="lime" background="black" />
			<div
				class="font-vg5000 flex flex-wrap items-center gap-3 text-xs tracking-widest text-white/40 uppercase"
			>
				<span>{{ template.price }}</span>
				<span aria-hidden="true">·</span>
				<span>by {{ template.author }}</span>
			</div>
			<h1 class="font-lineal-bold mt-4 text-4xl text-white lg:text-5xl">
				{{ template.title }}
			</h1>
			<div class="mt-10">
				<div class="relative aspect-video overflow-hidden rounded-xs">
					<img
						ref="media"
						:src="template.image"
						:alt="template.title"
						:class="[
							'absolute inset-x-0 top-[-15%] h-[130%] w-full object-cover will-change-transform',
							template.teaser ? 'scale-110 blur-xl grayscale' : '',
						]"
					/>
					<div
						v-if="template.teaser"
						class="bg-lime/45 absolute inset-0 z-10 flex items-center justify-center text-center mix-blend-normal backdrop-blur-sm transition-[backdrop-filter,background-color] duration-500"
					>
						<span
							class="border-lime/70 font-vg5000 text-lime rounded-xs border bg-black/35 px-4 py-2 text-sm tracking-[0.2em] uppercase shadow-[0_0_24px_rgba(205,255,0,0.18)] sm:px-5 sm:py-2.5 sm:text-base"
						>
							COMING SOON
						</span>
					</div>
				</div>
			</div>
			<p
				v-if="template.teaser"
				class="mt-10 max-w-2xl text-lg leading-relaxed text-white/70"
			>
				{{ template.description }}
			</p>
			<ContentRenderer
				v-else
				:value="template"
				class="template-content mt-10 text-white/80"
			/>
			<div class="mt-8 flex flex-wrap gap-2">
				<span
					v-for="tag in template.tags"
					:key="tag"
					class="font-vg5000 rounded-xs border border-white/40 px-2 py-1 text-[0.6rem] tracking-wider text-white/60 uppercase"
				>
					{{ tag }}
				</span>
			</div>
		</div>
	</article>
</template>

<style scoped>
.template-content :deep(h2) {
	margin-top: 3rem;
	font-family: var(--font-lineal);
	font-size: 1.5rem;
	font-weight: var(--lineal-weight-bold);
	line-height: 1.1;
	color: var(--color-white);
}

.template-content :deep(p) {
	margin-top: 1.25rem;
	font-size: 1rem;
	line-height: 1.75;
}

.template-content :deep(h2 + p) {
	margin-top: 1rem;
}

@media (min-width: 1024px) {
	.template-content :deep(p) {
		font-size: 1.125rem;
	}
}
</style>
