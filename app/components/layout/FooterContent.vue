<script setup lang="ts">
type FooterLink = {
	to: string
	label: string
}

type SocialLink = {
	href: string
	label: string
}

type FooterTheme = "lime" | "violet"

const { triggerEl = null, theme = "violet" } = defineProps<{
	triggerEl?: HTMLElement | null
	theme?: FooterTheme
}>()

const { gsap } = useGsap()

const EMAIL = "hello@remycanal.me"

const themeClasses = computed(() =>
	theme === "lime"
		? {
				surface: "bg-lime",
				background: "bg-black text-white bg-grid-black",
				muted: "text-white/50",
				hover: "hover:text-lime",
				legalMuted: "text-white/60",
				bubble: "bg-white text-black after:bg-white",
			}
		: {
				surface: "bg-violet",
				background: "bg-white text-black bg-grid-white",
				muted: "text-black/50",
				hover: "hover:text-violet",
				legalMuted: "text-black/60",
				bubble: "bg-black text-white after:bg-black",
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
	{ to: "/", label: "Credits" },
	{ to: "/", label: "Legal notice" },
	{ to: "/", label: "Privacy policy" },
	{ to: "/", label: "Terms" },
]

const socialLinks: SocialLink[] = [
	{ href: "https://www.awwwards.com/remy.cnl", label: "Awwwards" },
	{ href: "https://dribbble.com/remycanal", label: "Dribbble" },
	{ href: "https://www.behance.net/remycanal", label: "Behance" },
	{ href: "https://github.com/remycnl", label: "GitHub" },
	{ href: "https://www.linkedin.com/in/remy-canal", label: "LinkedIn" },
]

const year = new Date().getFullYear()

const bubbleEl = ref<HTMLSpanElement | null>(null)
let bubbleTween: gsap.core.Tween | gsap.core.Timeline | null = null

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches
const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches

function showBubble() {
	if (!bubbleEl.value || !isDesktop()) return

	bubbleTween?.kill()
	bubbleEl.value.style.willChange = "transform, opacity"

	if (prefersReducedMotion()) {
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
	if (!bubbleEl.value || !isDesktop()) return

	bubbleTween?.kill()

	if (prefersReducedMotion()) {
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
	if (!bubbleEl.value || !isDesktop()) return

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
	<footer class="h-full w-full p-2 lg:p-4" :class="themeClasses.surface">
		<div
			class="p-edge relative isolate flex h-full flex-col overflow-hidden rounded-lg"
			:class="themeClasses.background"
		>
			<UiGridBeams :theme="theme" />

			<div
				class="pointer-events-none absolute inset-0 z-0 mt-10 flex items-center justify-center overflow-hidden 2xl:mt-0"
			>
				<HomeLogoScene
					v-if="triggerEl"
					:key="theme"
					class="pointer-events-auto"
					skip-intro
					scroll-reveal
					:body-color="theme === 'lime' ? 'var(--color-lime)' : 'var(--color-violet)'"
					:face-color="theme === 'lime' ? 'var(--color-lime)' : 'var(--color-violet)'"
					:trigger-el="triggerEl"
					style="--logo-scene-width: min(80vw, 62svh, 40rem)"
				/>
			</div>

			<div
				class="pointer-events-none relative z-10 grid flex-1 grid-cols-2 grid-rows-[auto_auto_minmax(2.5rem,1fr)_auto_auto] gap-x-10 gap-y-6 [grid-template-areas:'intro_intro'_'nav_social'_'spacer_spacer'_'copy_copy'_'legal_legal'] sm:grid-cols-[1fr_auto] sm:grid-rows-[auto_auto_minmax(2.5rem,1fr)_auto] sm:[grid-template-areas:'intro_nav'_'social_nav'_'spacer_spacer'_'copy_legal'] lg:grid-cols-3 lg:grid-rows-[auto_minmax(2.5rem,1fr)_auto] lg:[grid-template-areas:'intro_intro_nav'_'spacer_spacer_spacer'_'social_copy_legal']"
			>
				<div class="flex flex-col gap-5 [grid-area:intro] sm:gap-8">
					<p
						class="font-vg5000 text-fit pointer-events-auto text-[0.65rem] tracking-[0.35em] uppercase sm:text-xs"
						:class="themeClasses.muted"
					>
						Available for work
					</p>

					<div class="pointer-events-auto relative flex w-fit">
						<a
							:href="`mailto:${EMAIL}`"
							v-roll-hover
							class="font-vg5000 text-fit-x text-2xl tracking-tight break-all whitespace-nowrap transition-colors duration-300 sm:text-3xl xl:text-4xl 2xl:text-5xl"
							:class="themeClasses.hover"
							@mouseenter="showBubble"
							@mouseleave="hideBubble"
							@focus="showBubble"
							@blur="hideBubble"
							@click="pulseBubble"
						>
							{{ EMAIL }}
						</a>

						<span
							ref="bubbleEl"
							aria-hidden="true"
							class="font-lineal-bold box-fit pointer-events-none absolute -top-12 -right-2 hidden origin-bottom-left translate-x-8 -translate-y-full rotate-6 rounded-2xl text-xs whitespace-nowrap opacity-0 shadow-[0_3px_12px_-6px_rgba(0,0,0,0.18)] [--fit-x:1.333em] [--fit-y:0.667em] after:absolute after:-bottom-1 after:left-4 after:h-3 after:w-3 after:rotate-45 lg:block"
							:class="themeClasses.bubble"
						>
							Let's talk ✦
						</span>
					</div>
				</div>

				<nav
					aria-label="Footer navigation"
					class="flex flex-col gap-4 self-start [grid-area:nav] sm:items-end sm:gap-5 sm:justify-self-end"
				>
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						v-roll-hover
						class="font-lineal-bold text-fit pointer-events-auto w-fit text-[0.7rem] tracking-[0.15em] uppercase transition-colors duration-200 sm:text-xs"
						:class="themeClasses.hover"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>

				<nav
					aria-label="Social links"
					class="pointer-events-auto flex flex-col items-end gap-4 self-start justify-self-end [grid-area:social] sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-3 sm:justify-self-start lg:self-end"
				>
					<a
						v-for="social in socialLinks"
						:key="social.href"
						:href="social.href"
						target="_blank"
						rel="noopener noreferrer"
						v-roll-hover
						class="font-lineal-bold text-fit pointer-events-auto w-fit shrink-0 text-[0.7rem] tracking-[0.15em] uppercase transition-colors duration-200 sm:text-xs"
						:class="themeClasses.hover"
					>
						{{ social.label }}
					</a>
				</nav>

				<p
					class="font-vg5000 text-fit pointer-events-auto self-end text-[0.65rem] tracking-[0.15em] [grid-area:copy] lg:justify-self-center"
					:class="themeClasses.legalMuted"
				>
					© {{ year }} Rémy Canal — All rights reserved
				</p>

				<ul
					v-if="legalLinks.length"
					class="font-vg5000 flex flex-wrap items-center gap-x-6 gap-y-3 self-end text-[10px] tracking-[0.08em] uppercase [grid-area:legal] sm:justify-self-end sm:text-[0.65rem] sm:tracking-[0.15em]"
				>
					<li v-for="legal in legalLinks" :key="legal.label" class="flex">
						<NuxtLink
							:to="legal.to"
							v-roll-hover
							class="text-fit pointer-events-auto transition-colors duration-200"
							:class="themeClasses.hover"
						>
							{{ legal.label }}
						</NuxtLink>
					</li>
				</ul>
			</div>
		</div>
	</footer>
</template>
