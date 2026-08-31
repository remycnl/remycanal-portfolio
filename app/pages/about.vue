<template>
	<div class="min-h-svh bg-violet">
		<div class="bg-lime">
			<HomeHero />
			<HomeAbout />
		</div>
		<HomeFeaturedProjects />
		<HomeResume />
		<HomeBlog />
		<UiInfiniteHorizontalLoop
			class="mt-section"
			item-class="uppercase font-lineal-heavy text-[10vw] lg:text-[5vw] text-white pr-[5vw] pt-1.5 lg:pt-2 [word-spacing:0.15em]"
			text="Creative Developer"
			bg="var(--color-violet)"
			outline
			:outline-width="{ mobile: '3px', tablet: '5px', desktop: '7px' }"
			:outline-offset="{ mobile: '5px', tablet: '8px', desktop: '9px' }"
			outline-color="var(--color-white)"
		/>
	</div>
</template>

<script lang="ts" setup>
definePageMeta({
	transitionBase: 'var(--color-black)',
	transitionAccent: 'var(--color-lime)',
	transitionDirection: { desktop: 'right', mobile: 'bottom' },
})
</script>

<style></style>
