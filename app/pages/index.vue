<script setup lang="ts">
useSeoMeta({
	title: "Home",
	description:
		"Rémy Canal is a Full-Stack Developer and UI/UX Designer crafting distinctive digital experiences through thoughtful design, creative development, and refined interactions. Awwwards Young Jury Member.",
	ogTitle: "Rémy Canal — Creative Developer & Designer",
	ogDescription:
		"Full-Stack Developer and UI/UX Designer, Awwwards Young Jury Member. Take a look at my portfolio ! :)",
	ogImage: "https://www.remycanal.me/og-image.png",
	ogType: "website",
	twitterCard: "summary_large_image",
	twitterTitle: "Rémy Canal — Creative Developer & Designer",
	twitterDescription:
		"Full-Stack Developer and UI/UX Designer, Awwwards Young Jury Member.",
	twitterImage: "https://www.remycanal.me/og-image.png",
})

useHead({
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Person",
				name: "Rémy Canal",
				jobTitle: ["Full-Stack Developer", "UI/UX Designer", "creative Developer"],
				url: "https://www.remycanal.me",
				image: "https://www.remycanal.me/og-image.png",
				sameAs: [
					"https://www.linkedin.com/in/remy-canal",
					"https://github.com/remycnl",
					"https://www.awwwards.com/remy.cnl",
				],
				award: "Awwwards Young Jury Member",
			}),
		},
	],
})
</script>

<template>
	<div class="bg-lime h-screen">
		<!-- <HomeHero />
		<HomeAbout /> -->
	</div>
	<!-- <HomeFeaturedProjects /> -->
	<!-- <HomeResume /> -->
	<HomeBlog />
	<UiInfiniteHorizontalLoop
		item-class="uppercase font-lineal-heavy text-[10vw] lg:text-[5vw] text-white pr-[5vw] pt-1.5 lg:pt-2 [word-spacing:0.15em]"
		text="Creative Developer"
		bg="var(--color-violet)"
		outline
		:outline-width="{mobile: '3px', tablet: '5px', desktop: '7px'}"
		:outline-offset="{mobile: '5px', tablet: '8px', desktop: '9px'}"
		outline-color="var(--color-white)"
	/>
</template>
