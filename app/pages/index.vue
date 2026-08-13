<script setup lang="ts">
const heroRef = useTemplateRef<HTMLElement>("heroRef")

useStackSection(heroRef, {
	scaleTo: 0.82,
	rotateTo: -4,
	roundedClass: "rounded-3xl",
})

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
	<div class="bg-lime">
		<section
			ref="heroRef"
			class="section-p-x pb-section bg-grid-white relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white text-black"
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
				Rémy Canal — Full-Stack Developer &amp; UI/UX Designer — Awwwards Young Jury
				Member
			</h1>

			<div
				aria-hidden="true"
				class="font-vg5000 section-p-x-reset text-shadow-lime relative z-10 flex h-full w-full flex-col justify-between py-25 text-xl whitespace-nowrap text-shadow-sm md:h-fit md:flex-row"
			>
				<div class="flex items-end gap-5 self-start md:self-auto">
					<div class="flex flex-col">
						<span>Full-Stack Developer </span>
						<span>UI/UX Designer</span>
					</div>
					<UiShapeStripes class="text-lime mb-2 h-4 w-4 md:h-6 md:w-6" />
				</div>
				<div class="flex items-end gap-5 self-end md:self-auto">
					<UiShapeCross class="text-lime mb-2 h-4 w-4 md:h-6 md:w-6" />
					<div class="flex flex-col items-end">
						<span>Rémy Canal </span>
						<span>Awwwards. Young Jury </span>
					</div>
				</div>
			</div>

			<div
				class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
			>
				<ClientOnly>
					<HomeLogoScene class="pointer-events-auto" />
					<template #fallback>
						<div class="logo-scene-placeholder" />
					</template>
				</ClientOnly>
			</div>
		</section>
		<section>
			<div
				class="section-p-xy font-lineal-medium flex justify-center rounded-t-3xl bg-black bg-grid-black"
			>
			<UiGridBeams theme="black" />
				<div
					class="py-section text-gray-dark relative max-w-6xl text-center text-2xl lg:text-5xl"
				>
					<h2 class="py-section max-w-6xl">
						I craft
						<span class="text-white">distinctive digital experiences</span> through
						thoughtful <span class="text-white">design</span>, creative
						<span class="text-white">development</span>, and refined
						<span class="text-white">interactions</span>.
					</h2>
					<img
						src="/stickers/sticker-remy.png"
						alt="Sticker Rémy"
						class="absolute -top-5 -right-10 h-30 w-auto rotate-15 grayscale md:top-0 md:-right-20 md:h-50"
					/>
					<img
						src="/stickers/sticker-computer.png"
						alt="Sticker computer"
						class="absolute -bottom-5 -left-10 h-30 w-auto -rotate-15 grayscale md:bottom-0 md:-left-20 md:h-50"
					/>
				</div>
			</div>
			<div
				class="section-p-x font-vg5000 bg-violet flex justify-between py-10 text-center text-3xl text-white"
			>
				<h3 class="max-w-6xl">4 years of experience</h3>
				<h3 class="max-w-6xl">Based in France</h3>
			</div>
		</section>
		<section>
			<div class="section-p-xy font-lineal-medium flex justify-center bg-black">
				<div
					class="py-section text-gray-dark relative max-w-6xl text-center text-2xl lg:text-5xl"
				>
					<h2 class="py-section max-w-6xl">
						I craft
						<span class="text-white">distinctive digital experiences</span> through
						thoughtful <span class="text-white">design</span>, creative
						<span class="text-white">development</span>, and refined
						<span class="text-white">interactions</span>.
					</h2>
					<img
						src="/stickers/sticker-remy.png"
						alt="Sticker Rémy"
						class="absolute -top-5 -right-10 h-30 w-auto rotate-15 grayscale md:top-0 md:-right-20 md:h-50"
					/>
					<img
						src="/stickers/sticker-computer.png"
						alt="Sticker computer"
						class="absolute -bottom-5 -left-10 h-30 w-auto -rotate-15 grayscale md:bottom-0 md:-left-20 md:h-50"
					/>
				</div>
			</div>
			<div
				class="section-p-x font-vg5000 bg-violet flex justify-between py-10 text-center text-3xl text-white"
			>
				<h3 class="max-w-6xl">4 years of experience</h3>
				<h3 class="max-w-6xl">Based in France</h3>
			</div>
		</section>
	</div>
</template>
