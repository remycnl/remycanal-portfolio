<script lang="ts" setup>
interface TemplateCard {
	path: string
	title: string
	description: string
	price: string
	tags: string[]
	teaser: boolean
	image: string
}

const { data: templates, error } = await useAsyncData<TemplateCard[]>(
	"templates",
	async () => {
		const entries = await queryCollection("templates").order("title", "ASC").all()
		return entries as unknown as TemplateCard[]
	},
	{ default: () => [] }
)

const rows = computed(() => buildCardRows(templates.value ?? [], "templates"))

useSeoMeta({
	title: "Templates",
	description: "A collection of ready-made creative templates.",
})
</script>

<template>
	<div class="relative flow-root min-h-svh w-full bg-black text-white">
		<div class="section-p-xy mt-edge relative isolate">
			<LazyUiViewfinder theme="lime" background="black" />

			<div class="flex flex-col md:flex-row h-fit md:items-end justify-between gap-3 pt-14 lg:pt-0">
				<h2 v-text-reveal class="font-lineal-bold text-3xl text-white lg:text-4xl">
					Not just templates...<br />Make it yours.
				</h2>

				<h3
					v-text-reveal
					class="md:text-right text-sm text-white/60"
				>
					A collection of ready-made creative starting points.
				</h3>
			</div>

			<div v-if="error" class="mt-32 max-w-lg text-white/60 lg:mt-48">
				<p class="font-lineal-medium text-xl">The templates could not be loaded.</p>
				<p class="mt-3 text-sm">Please try again in a moment.</p>
			</div>

			<div
				v-else-if="rows.length"
				class="mt-32 flex flex-col gap-y-32 lg:mt-48 lg:gap-y-64"
			>
				<div
					v-for="row in rows"
					:key="row[0]!.item.path"
					class="grid grid-cols-12 gap-y-32 lg:gap-y-0"
				>
					<UiCard
						v-for="cell in row"
						:key="cell.item.path"
						:title="cell.item.title"
						:image="cell.item.image"
						:price="cell.item.price"
						:tags="cell.item.tags"
						:teaser="cell.item.teaser"
						teaser-tint="lime"
						:depth="cell.depth"
						:href="cell.item.path"
						theme="black"
						viewfinder-label="Open template"
						viewfinder-loading-label="Opening..."
						:reveal="true"
						:class="cell.class"
					>
						{{ cell.item.description }}
					</UiCard>
				</div>
			</div>

			<p v-else class="mt-32 text-white/60 lg:mt-48">No templates published yet.</p>
		</div>
		<div class="bg-lime h-px w-full" />
	</div>
</template>