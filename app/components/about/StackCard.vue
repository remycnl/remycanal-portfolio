<script setup lang="ts">
interface Props {
	bg: string
	text: string
	eyebrow: string
	title: string
	body: string
	index: number
	total: number
	stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), { stacked: true })

const cardRef = useTemplateRef<HTMLElement>("cardRef")

if (props.stacked) {
	useStackSection(cardRef, {
		scaleTo: 0.72,
		rotateTo: -4,
		roundedClass: "rounded-t-lg",
		zIndex: props.index + 1,
	})
}
</script>

<template>
	<section
		ref="cardRef"
		:class="[bg, text]"
		class="flex h-svh flex-col justify-between px-6 py-10 sm:px-12 sm:py-16"
	>
		<span class="font-mono text-xs tracking-widest uppercase opacity-60">
			{{ eyebrow }}
		</span>

		<div class="max-w-2xl">
			<h2 class="text-4xl leading-[1.05] font-medium whitespace-pre-line sm:text-6xl">
				{{ title }}
			</h2>
			<p class="mt-6 max-w-md text-base leading-relaxed opacity-80 sm:text-lg">
				{{ body }}
			</p>
		</div>

		<span class="font-mono text-xs opacity-40">
			{{ String(index + 1).padStart(2, "0") }} / {{ String(total).padStart(2, "0") }}
		</span>
	</section>
</template>
