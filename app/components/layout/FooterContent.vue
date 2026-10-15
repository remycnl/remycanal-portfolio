<script setup lang="ts">
import type { BadgeState } from "@/components/ui/Badge.vue"

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

const EMAIL = "hello@remycanal.me"

const BADGE_LABELS = {
	idle: "Copy email",
	press: "Copy email",
	drag: "Copy email",
	view: "Say hello",
}

const BADGE_OFFSET = { x: 84, y: 64 }

const themeClasses = computed(() =>
	theme === "lime"
		? {
				surface: "bg-lime",
				background: "bg-black text-white bg-grid-black",
				muted: "text-white/50",
				hover: "hover:text-lime",
				legalMuted: "text-white/60",
				tag: "bg-black-light text-white",
				badgeBg: "var(--color-violet)",
				badgeText: "var(--color-white)",
			}
		: {
				surface: "bg-violet",
				background: "bg-white text-black bg-grid-white",
				muted: "text-black/50",
				hover: "hover:text-violet",
				legalMuted: "text-black/60",
				tag: "bg-gray-light text-black",
				badgeBg: "var(--color-lime)",
				badgeText: "var(--color-black)",
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

const isDesktopPointer = useDesktopPointer()
const { copied, copy } = useCopyToClipboard()

const isHoveringEmail = shallowRef(false)
const badgeState = computed<BadgeState | undefined>(() =>
	copied.value ? "view" : undefined
)
const tagLabel = computed(() =>
	isDesktopPointer.value ? "Copied, see you soon!" : "Email copied"
)

async function copyEmail() {
	const success = await copy(EMAIL)

	if (!success) {
		window.location.href = `mailto:${EMAIL}`
		return
	}

	if (!isDesktopPointer.value) navigator.vibrate?.(12)
}
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

			<UiBadgeCursor
				:active="isHoveringEmail"
				:state="badgeState"
				:labels="BADGE_LABELS"
				:offset="BADGE_OFFSET"
				:bg-color="themeClasses.badgeBg"
				:text-color="themeClasses.badgeText"
			/>

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

					<div
						class="pointer-events-none relative mx-[-0.25em] my-[-0.5em] flex w-fit overflow-clip px-[0.25em] py-[0.5em] text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl"
					>
						<button
							type="button"
							v-roll-hover
							:aria-label="`Copy ${EMAIL} to clipboard`"
							class="font-vg5000 text-fit-x pointer-events-auto cursor-pointer touch-manipulation tracking-tight break-all whitespace-nowrap transition-[color,translate] duration-500 ease-[cubic-bezier(.34,1.3,.64,1)] select-none [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none"
							:class="[
								themeClasses.hover,
								copied ? '-translate-y-[calc(100%+1em)]' : 'translate-y-0',
							]"
							@mouseenter="isHoveringEmail = true"
							@mouseleave="isHoveringEmail = false"
							@click="copyEmail"
						>
							{{ EMAIL }}
						</button>

						<span class="sr-only" role="status" aria-live="polite">
							{{ copied ? "Email copied to clipboard" : "" }}
						</span>

						<span
							aria-hidden="true"
							class="font-vg5000 pointer-events-none absolute inset-x-0 inset-y-[0.3em] flex items-center justify-center rounded-md transition-[translate] duration-500 ease-[cubic-bezier(.34,1.3,.64,1)] motion-reduce:transition-none"
							:class="[
								themeClasses.tag,
								copied ? 'translate-y-0' : 'translate-y-[calc(100%+0.5em)]',
							]"
						>
							<span
								class="text-fit text-[0.65rem] tracking-[0.14em] whitespace-nowrap uppercase lg:text-xs 2xl:text-lg"
							>
								{{ tagLabel }}
							</span>
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
