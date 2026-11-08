<script lang="ts" setup>
interface FaqItem {
	question: string
	answer: string
}

// TODO: remplace par tes vraies questions / réponses
const ITEMS: readonly FaqItem[] = [
	{
		question: "Do you take on freelance projects?",
		answer: "Your answer here.",
	},
	{
		question: "How long does a project usually take?",
		answer: "Your answer here.",
	},
]

const uid = useId()
const openIndex = ref<number | null>(null)

function toggle(index: number) {
	openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
	<section :aria-labelledby="`${uid}-title`">
		<h2 :id="`${uid}-title`" class="font-vg5000 text-base text-white">
			A few answers to questions you might have&nbsp;:
		</h2>

		<ul class="mt-3 flex flex-col">
			<li v-for="(item, index) in ITEMS" :key="item.question">
				<h3>
					<button
						:id="`${uid}-trigger-${index}`"
						type="button"
						:aria-expanded="openIndex === index"
						:aria-controls="`${uid}-panel-${index}`"
						class="font-vg5000 group flex w-full cursor-pointer items-center gap-4 rounded-md py-2 text-left text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
						@click="toggle(index)"
					>
						<span class="text-violet-light w-6 shrink-0 tabular-nums" aria-hidden="true">
							{{ String(index + 1).padStart(2, "0") }}
						</span>

						<span class="flex-1">{{ item.question }}</span>

						<span
							class="rounded-md bg-black px-3 py-1 text-xs text-white transition-colors group-hover:bg-lime group-hover:text-black motion-reduce:transition-none"
							aria-hidden="true"
						>
							{{ openIndex === index ? "Close" : "Open" }}
						</span>
					</button>
				</h3>

				<!-- 0fr → 1fr animates to the content's real height, no JS measuring -->
				<div
					:id="`${uid}-panel-${index}`"
					role="region"
					:aria-labelledby="`${uid}-trigger-${index}`"
					:inert="openIndex !== index || undefined"
					:class="openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
					class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
				>
					<div class="overflow-hidden">
						<p class="font-vg5000 pt-1 pb-3 pl-10 text-sm text-white">
							{{ item.answer }}
						</p>
					</div>
				</div>
			</li>
		</ul>
	</section>
</template>