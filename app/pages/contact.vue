<script lang="ts" setup>
useSeoMeta({
	title: "Contact",
	description: "Got something in mind? Let’s see where it goes.",
})

const EMAIL = "hello@remycanal.me"

// TODO: remplace par les URLs de tes vrais profils
const SOCIALS = [
	{ label: "Awwwards", href: "https://www.awwwards.com" },
	{ label: "Dribbble", href: "https://dribbble.com" },
	{ label: "Behance", href: "https://www.behance.net" },
	{ label: "GitHub", href: "https://github.com" },
	{ label: "LinkedIn", href: "https://www.linkedin.com" },
] as const

const LINK_CLASS =
	"transition-colors hover:text-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime motion-reduce:transition-none"
</script>

<template>
	<section class="bg-violet relative min-h-svh overflow-hidden text-white">
		<!-- Decorative sticker, cropped by the bottom-right corner -->
		<img
			src="/stickers/character_violet.svg"
			alt=""
			aria-hidden="true"
			decoding="async"
			class="pointer-events-none scale-x-[-1] absolute right-0 bottom-0 w-[clamp(16rem,52vw,64rem)] translate-x-[12%] translate-y-[12%] select-none"
		/>

		<div
			class="section-p-xy relative z-10 grid min-h-svh grid-cols-1 content-start gap-x-6 gap-y-10 lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr]"
		>
			<header class="font-lineal text-lg leading-snug lg:col-span-8 lg:row-start-1">
				<h1 class="uppercase">Every project starts somehow.</h1>
				<p class="text-violet-light">Got something in mind? Let’s see where it goes.</p>
			</header>

			<ContactForm class="lg:col-span-8 lg:row-start-2" />

			<p
				class="font-vg5000 text-violet-light text-sm lg:col-span-5 lg:row-start-3 lg:self-end"
			>
				Or just email me at
				<a :href="`mailto:${EMAIL}`" :class="LINK_CLASS" class="text-white">{{ EMAIL }}</a>
			</p>

			<ContactFAQ class="lg:col-span-6 lg:col-start-7 lg:row-start-3 lg:self-end" />

			<!-- Last in the DOM (tab order), placed top-right on desktop -->
			<nav
				aria-label="Social links"
				class="lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:justify-self-end"
			>
				<ul class="font-vg5000 flex flex-col gap-2 text-base lg:items-end lg:text-right">
					<li v-for="social in SOCIALS" :key="social.label">
						<a
							:href="social.href"
							target="_blank"
							rel="noopener noreferrer"
							:class="LINK_CLASS"
						>
							{{ social.label }}
							<span class="sr-only">(opens in a new tab)</span>
						</a>
					</li>
				</ul>
			</nav>
		</div>
	</section>
</template>