<script setup lang="ts">
type FooterLink = {
	to: string
	label: string
}

type SocialLink = {
	href: string
	label: string
}

const { interactive = false, triggerEl = null } = defineProps<{
	interactive?: boolean
	triggerEl?: HTMLElement | null
}>()

const { gsap } = useGsap()

const tabIndex = computed(() => (interactive ? undefined : -1))
const prefetch = computed(() => (interactive ? undefined : false))

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

const socialLinks: SocialLink[] = [
	{ href: "https://www.linkedin.com/in/remy-canal", label: "LinkedIn" },
	{ href: "https://www.pinterest.com/remycanal", label: "Pinterest" },
	{ href: "https://github.com/remycnl", label: "GitHub" },
	{ href: "https://www.awwwards.com/remy.cnl", label: "Awwwards" },
]

const year = new Date().getFullYear()

const bubbleEl = ref<HTMLSpanElement | null>(null)
let bubbleTween: gsap.core.Tween | gsap.core.Timeline | null = null

const isDesktop = import.meta.client && window.matchMedia("(min-width: 1024px)").matches
const prefersReducedMotion =
	import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function showBubble() {
	if (!bubbleEl.value || !isDesktop) return

	bubbleTween?.kill()
	bubbleEl.value.style.willChange = "transform, opacity"

	if (prefersReducedMotion) {
		gsap.set(bubbleEl.value, { opacity: 1 })
		return
	}

	bubbleTween = gsap.fromTo(
		bubbleEl.value,
		{ opacity: 0, scale: 0.82, rotate: -14, y: 5 },
		{
			opacity: 1,
			scale: 1,
			rotate: 6,
			y: 0,
			duration: 0.45,
			ease: "back.out(1.9)",
		}
	)
}

function hideBubble() {
	if (!bubbleEl.value || !isDesktop) return

	bubbleTween?.kill()

	if (prefersReducedMotion) {
		gsap.set(bubbleEl.value, { opacity: 0 })
		return
	}

	bubbleTween = gsap.to(bubbleEl.value, {
		opacity: 0,
		scale: 0.82,
		rotate: 14,
		y: 5,
		duration: 0.3,
		ease: "power2.inOut",
		onComplete: () => {
			if (bubbleEl.value) bubbleEl.value.style.willChange = "auto"
		},
	})
}

function pulseBubble() {
	if (!bubbleEl.value || !isDesktop) return

	bubbleTween?.kill()
	bubbleTween = gsap
		.timeline()
		.to(bubbleEl.value, { scale: 0.92, duration: 0.12, ease: "power2.out" })
		.to(bubbleEl.value, { scale: 1, duration: 0.3, ease: "power2.out" })
}

onUnmounted(() => {
	bubbleTween?.kill()
})
</script>

<template>
	<footer
		class="p-edge bg-grid-white from-violet to-violet relative isolate flex flex-col overflow-x-hidden bg-white via-white text-black shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.28)] lg:bg-linear-to-r lg:text-white"
	>
		<UiGridBeams theme="violet" />

		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden 2xl:-mt-10"
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
				<div class="flex flex-col gap-3 sm:gap-6">
					<p
						class="font-vg5000 pointer-events-auto text-[0.65rem] tracking-[0.35em] text-black/50 uppercase sm:text-xs lg:text-white/50"
					>
						Available for work
					</p>

					<div class="pointer-events-auto relative w-fit">
						<a
							href="mailto:hello@remycanal.me"
							:tabindex="tabIndex"
							v-roll-hover
							class="font-vg5000 hover:text-violet block text-2xl leading-[0.95] tracking-tight break-all whitespace-nowrap transition-colors duration-300 sm:text-3xl lg:text-4xl lg:hover:text-[#ffffff]"
							@mouseenter="showBubble"
							@mouseleave="hideBubble"
							@focus="showBubble"
							@blur="hideBubble"
							@click="pulseBubble"
						>
							hello@remycanal.me
						</a>

						<span
							ref="bubbleEl"
							aria-hidden="true"
							class="font-lineal-bold text-violet pointer-events-none absolute -top-12 -right-2 hidden origin-bottom-left translate-x-8 -translate-y-full rotate-6 rounded-2xl bg-white px-4 py-2 text-xs whitespace-nowrap opacity-0 shadow-[0_3px_12px_-6px_rgba(0,0,0,0.18)] after:absolute after:-bottom-1 after:left-4 after:h-3 after:w-3 after:rotate-45 after:bg-white lg:block"
						>
							Let's talk ✦
						</span>
					</div>

					<nav
						aria-label="Social links"
						class="pointer-events-auto flex flex-wrap gap-x-6 gap-y-2"
					>
						<a
							v-for="social in socialLinks"
							:key="social.href"
							:href="social.href"
							target="_blank"
							rel="noopener noreferrer"
							:tabindex="tabIndex"
							v-roll-hover
							class="font-lineal-bold hover:text-violet text-[0.7rem] tracking-[0.15em] uppercase transition-colors duration-200 sm:text-xs lg:hover:text-[#ffffff]"
						>
							{{ social.label }}
						</a>
					</nav>
				</div>

				<nav
					aria-label="Footer navigation"
					class="flex flex-col gap-3 sm:items-end lg:col-start-3"
				>
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						:tabindex="tabIndex"
						:prefetch="prefetch"
						v-roll-hover
						class="font-lineal-bold hover:text-violet pointer-events-auto w-fit text-[0.7rem] tracking-[0.15em] uppercase transition-colors duration-200 sm:text-xs lg:hover:text-[#ffffff]"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>
			</div>

			<div class="min-h-24 sm:min-h-32 lg:min-h-50" aria-hidden="true" />

			<div
				class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
			>
				<p
					class="font-vg5000 pointer-events-auto text-[0.65rem] tracking-[0.15em] text-black/60 lg:text-white/60"
				>
					© {{ year }} Rémy Canal — All rights reserved
				</p>

				<ul
					class="font-vg5000 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.65rem] tracking-[0.15em] uppercase"
				>
					<li v-for="legal in legalLinks" :key="legal.to">
						<NuxtLink
							:to="legal.to"
							:tabindex="tabIndex"
							:prefetch="prefetch"
							v-roll-hover
							class="hover:text-violet pointer-events-auto transition-colors duration-200 lg:hover:text-[#ffffff]"
						>
							{{ legal.label }}
						</NuxtLink>
					</li>
				</ul>
			</div>
		</div>
	</footer>
</template>
