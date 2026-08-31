<script setup lang="ts">
const heroRef = useTemplateRef<HTMLElement>("heroRef")

useStackSection(heroRef, {
	scaleTo: 0.72,
	rotateTo: -4,
	roundedClass: "rounded-t-lg",
})
</script>

<template>
	<section
		ref="heroRef"
		class="section-p-x pb-section bg-grid-white relative flex h-svh w-full flex-col items-center justify-center overflow-hidden bg-white text-black shadow-xl"
	>
		<UiGridBeams theme="white" />
		<div
			class="pointer-events-none absolute bottom-0 left-0 z-10 select-none"
			aria-hidden="true"
		>
			<UiInfiniteHorizontalLoop
				text="Creative Developer"
				item-class="uppercase font-lineal-heavy text-[20vw] leading-none text-lime pr-[10vw] [word-spacing:0.15em]"
				:base-speed="1"
			/>
		</div>

		<h1 class="sr-only">
			Rémy Canal — Full-Stack Developer &amp; UI/UX Designer — Awwwards Young Jury Member
		</h1>

		<div
			aria-hidden="true"
			class="font-vg5000 section-p-x-reset text-shadow-lime relative z-10 flex h-full w-full flex-col justify-between pt-25 pb-15 text-xl whitespace-nowrap text-shadow-sm md:h-fit md:flex-row"
		>
			<div class="flex items-end gap-5 self-start md:self-auto">
				<div v-text-reveal="{singlePhrase: true}" class="flex flex-col">
					<span>Full-Stack Developer </span>
					<span>UI/UX Designer</span>
				</div>
				<UiShapeStripes class="text-lime mb-2 h-4 w-4 md:h-6 md:w-6" />
			</div>
			<div class="flex items-end gap-5 self-end md:self-auto">
				<UiShapeCross class="text-lime mb-2 h-4 w-4 md:h-6 md:w-6" />
				<div v-text-reveal="{singlePhrase: true}" class="flex flex-col items-end">
					<span>Rémy Canal </span>
					<span>Awwwards. Young Jury </span>
				</div>
			</div>
		</div>

		<div
			class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
		>
				<HomeLogoScene class="pointer-events-auto" />
		</div>
	</section>
</template>
