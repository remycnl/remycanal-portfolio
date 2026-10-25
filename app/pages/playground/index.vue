<script lang="ts" setup>
interface PlaygroundCard {
	path: string
	title: string
	date: string
	image: string
	width?: number
	height?: number
}

definePageMeta({ footerTheme: "lime" })

/** Nuxt Content can hand numbers back as strings on the client. */
function toDimension(value: unknown): number | undefined {
	const number = Number(value)
	return Number.isFinite(number) && number > 0 ? number : undefined
}

const { data: items, error } = await useAsyncData<PlaygroundCard[]>(
	"playground",
	async () => {
		const entries = await queryCollection("playground")
			.select("path", "title", "date", "image", "width", "height")
			.order("date", "DESC")
			.all()

		return entries.map((entry) => ({
			path: entry.path,
			title: entry.title,
			date: String(entry.date),
			image: entry.image,
			width: toDimension(entry.width),
			height: toDimension(entry.height),
		}))
	},
	{ default: () => [] }
)

const { loopRef, loopStyle } = useLoopHeight()

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
const formatDate = (date: string) => dateFormatter.format(new Date(date))

function ratioOf(item: PlaygroundCard) {
	return item.width && item.height ? item.width / item.height : undefined
}

useSeoMeta({
	title: "Playground",
	description: "Experiments, sketches and everything I make along the way.",
})
</script>

<template>
	<div
		class="relative flex min-h-svh w-full flex-col bg-black text-white"
		:style="loopStyle"
	>
		<UiPageHeader
			tint="lime"
			shape="ovals"
			:stickers="[
				'/stickers/character_lime.svg',
				'/stickers/flower_lime.svg',
				'/stickers/dog_lime.svg',
				'/stickers/characterFull_lime.svg',
				'/stickers/cursor_lime.svg',
			]"
		>
			<template #title>Just things<br />I make.</template>
			<template #description>
				Experiments, sketches <br />and everything in between.
			</template>
		</UiPageHeader>

		<div class="relative z-10 flex flex-1 flex-col bg-black">
			<UiInfiniteHorizontalLoop
				:ref="loopRef"
				text="Playground"
				class="text-black-light relative z-10 pt-4 [word-spacing:1em]"
			/>
			<UiCardGrid
				v-slot="{ item, cellClass }"
				:items="items"
				:get-ratio="ratioOf"
				:error="Boolean(error)"
				theme="black"
				tint="lime"
				label="See more"
				press-label="Open"
				error-title="The playground could not be loaded."
				empty-text="Nothing here yet."
			>
				<UiCard
					:title="item.title"
					:image="item.image"
					:width="item.width"
					:height="item.height"
					:date="formatDate(item.date)"
					:href="item.path"
					overlay
					:class="cellClass"
				/>
			</UiCardGrid>
		</div>
	</div>
</template>
