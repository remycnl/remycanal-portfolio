<template>
	<footer class="p-edge bg-lime bg-grid-lime flex flex-col overflow-x-hidden text-black">
    <UiGridBeams theme="lime" />
		<div class="relative z-20 flex flex-col gap-8 lg:gap-12">
			<div
				class="flex flex-col gap-12 pb-12 lg:flex-row lg:items-start lg:justify-between lg:gap-24"
			>
				<nav aria-label="Footer navigation" class="flex flex-col gap-3">
					<div v-for="link in links" :key="link.to" class="overflow-hidden">
						<NuxtLink
							:to="link.to"
							:tabindex="interactive ? undefined : -1"
							:prefetch="interactive ? undefined : false"
							class="footer-link font-lineal-medium hover:text-violet inline-block w-fit text-2xl leading-none tracking-tight uppercase transition-colors duration-200 sm:text-3xl"
						>
							{{ link.label }}
						</NuxtLink>
					</div>
				</nav>

				<div class="flex flex-col gap-6 lg:items-end lg:text-right">
					<p
						class="footer-fade font-vg5000 text-xs tracking-[0.2em] text-black/60 uppercase"
					>
						Available for work
					</p>
					<a
						href="mailto:hello@remycanal.me"
						:tabindex="interactive ? undefined : -1"
						class="footer-fade font-vg5000 hover:text-violet text-2xl leading-none tracking-tight transition-colors duration-200 sm:text-3xl"
					>
						hello@remycanal.me
					</a>
					<NuxtLink
						to="/contact"
						:tabindex="interactive ? undefined : -1"
						:prefetch="interactive ? undefined : false"
						class="footer-fade font-vg5000 hover:text-lime inline-flex w-fit items-center gap-2 border border-black px-5 py-2 text-xs tracking-[0.15em] uppercase transition-colors duration-200 hover:bg-black"
					>
						Start a project
					</NuxtLink>
				</div>
			</div>

			<div
				class="footer-fade flex flex-col-reverse gap-6 pt-2 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="font-vg5000 text-xs tracking-[0.15em] text-black/60">
					© {{ year }} Rémy Canal — All rights reserved
				</p>

				<ul
					class="font-vg5000 flex flex-wrap gap-x-6 gap-y-2 text-xs tracking-[0.15em] uppercase"
				>
					<li v-for="legal in legalLinks" :key="legal.to">
						<NuxtLink
							:to="legal.to"
							:tabindex="interactive ? undefined : -1"
							:prefetch="interactive ? undefined : false"
							class="hover:text-violet transition-colors duration-200"
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

withDefaults(defineProps<{ interactive?: boolean }>(), {
	interactive: false,
})

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
