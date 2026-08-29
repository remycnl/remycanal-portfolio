<template>
	<footer
		class="p-edge bg-grid-white from-violet to-violet relative isolate flex flex-col overflow-x-hidden bg-white via-white text-black shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.28)] lg:bg-linear-to-r lg:text-white"
	>
		<UiGridBeams theme="white" />
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden lg:-mt-10"
		>
			<HomeLogoScene
				v-if="interactive && triggerEl"
				class="pointer-events-auto"
				skip-intro
				scroll-reveal
				body-color="var(--color-violet)"
				face-color="var(--color-violet)"
				:trigger-el="triggerEl"
				style="--logo-scene-width: min(80vw, 62svh, 40rem)"
			/>
		</div>

		<div class="pointer-events-none relative z-10 flex flex-col">
			<div class="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:items-start lg:grid-cols-3">
				<div class="flex flex-col gap-5 sm:gap-6">
					<p
						class="font-vg5000 text-[0.65rem] tracking-[0.35em] text-white/50 uppercase sm:text-xs"
					>
						Available for work
					</p>

					<a
						href="mailto:hello@remycanal.me"
						:tabindex="interactive ? undefined : -1"
						class="font-vg5000 hover:text-lime pointer-events-auto w-fit text-2xl leading-[0.95] tracking-tight break-all whitespace-nowrap transition-colors duration-300 sm:text-3xl lg:text-4xl"
					>
						hello@remycanal.me
					</a>

					<NuxtLink
						to="/contact"
						:tabindex="interactive ? undefined : -1"
						:prefetch="interactive ? undefined : false"
						class="font-vg5000 hover:text-violet hover:border-violet pointer-events-auto mt-2 inline-flex w-fit items-center gap-2 border border-white px-6 py-2.5 text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:bg-white sm:text-xs"
					>
						Start a project
					</NuxtLink>
				</div>

				<nav
					aria-label="Footer navigation"
					class="flex flex-col gap-3 sm:items-end lg:col-start-3"
				>
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						:tabindex="interactive ? undefined : -1"
						:prefetch="interactive ? undefined : false"
						class="font-lineal-bold hover:text-lime pointer-events-auto w-fit text-[0.7rem] tracking-[0.15em] uppercase transition-colors duration-200 sm:text-xs"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>
			</div>

			<div class="min-h-24 sm:min-h-32 lg:min-h-50" aria-hidden="true" />

			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p class="font-vg5000 text-[0.65rem] tracking-[0.15em] text-white/60">
					© {{ year }} Rémy Canal — All rights reserved
				</p>

				<ul
					class="font-vg5000 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.65rem] tracking-[0.15em] uppercase"
				>
					<li v-for="legal in legalLinks" :key="legal.to">
						<NuxtLink
							:to="legal.to"
							:tabindex="interactive ? undefined : -1"
							:prefetch="interactive ? undefined : false"
							class="hover:text-lime pointer-events-auto transition-colors duration-200"
						>
							{{ legal.label }}
						</NuxtLink>
					</li>
				</ul>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
interface FooterLink {
	to: string
	label: string
}

withDefaults(
	defineProps<{
		interactive?: boolean
		triggerEl?: HTMLElement | null
	}>(),
	{
		interactive: false,
		triggerEl: null,
	}
)

const links: FooterLink[] = [
	{ to: "/", label: "Home" },
	{ to: "/about", label: "About" },
	{ to: "/work", label: "Work" },
	{ to: "/resume", label: "Resume" },
	{ to: "/blog", label: "Blog" },
	{ to: "/templates", label: "Templates" },
	{ to: "/contact", label: "Contact" },
]

const legalLinks: FooterLink[] = [
	{ to: "/", label: "Legal notice" },
	{ to: "/", label: "Privacy policy" },
	{ to: "/", label: "Terms" },
]

const year = new Date().getFullYear()
</script>
