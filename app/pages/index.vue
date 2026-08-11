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
	<div>
		<section
			class="section-p-x bg-grid-white bg-grid relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white text-black"
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
				class="font-vg5000 section-p-x-reset text-shadow-lime relative z-10 flex w-full flex-row-reverse justify-between text-3xl whitespace-nowrap text-shadow-sm"
			>
				<div class="flex items-end gap-5">
					<UiShapeCross class="text-lime mb-2 h-6 w-6" />
					<div class="flex flex-col items-end">
						<span>Rémy Canal </span>
						<span>Awwwards. Young Jury </span>
					</div>
				</div>
				<div class="flex items-end gap-5">
					<div class="flex flex-col">
						<span>Full-Stack Developer </span>
						<span>UI/UX Designer</span>
					</div>
					<UiShapeStripes class="text-lime mb-2 h-6 w-6" />
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
		<section
			class="section-p-xy bg-lime relative flex h-screen w-full flex-col items-center justify-center text-lg text-black"
		>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
			incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
			exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
			irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
			pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
			deserunt mollit anim id est laborum.
		</section>
		<section
			class="section-p-xy bg-lime relative flex h-screen w-full flex-col items-center justify-center text-lg text-black"
		>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
			incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
			exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
			irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
			pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
			deserunt mollit anim id est laborum.
		</section>
		<section
			class="section-p-xy bg-lime relative flex h-screen w-full flex-col items-center justify-center text-lg text-black"
		>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
			incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
			exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
			irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
			pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
			deserunt mollit anim id est laborum.
		</section>
	</div>
</template>
