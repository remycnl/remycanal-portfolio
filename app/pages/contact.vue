<script lang="ts" setup>
import type { BadgeState } from "@/components/ui/Badge.vue"

useSeoMeta({
	title: "Contact",
	description: "Got something in mind? Let's see where it goes.",
})

const EMAIL = "hello@remycanal.me"

const SOCIALS = [
	{ label: "Awwwards", href: "https://www.awwwards.com/remy.cnl" },
	{ label: "Dribbble", href: "https://dribbble.com/remycanal" },
	{ label: "Behance", href: "https://www.behance.net/remycanal" },
	{ label: "Instagram", href: "https://www.instagram.com/madebyremycanal" },
	{ label: "GitHub", href: "https://github.com/remycnl" },
	{ label: "LinkedIn", href: "https://www.linkedin.com/in/remy-canal" },
] as const

/**
 * Blanc par défaut, légèrement atténué au survol ;
 * le focus est en blanc.
 */
const LINK_CLASS =
	"text-white transition-colors hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"

const BUSINESS_CARD = {
	href: "/remy-canal-business-card.png",
	filename: "Rémy-Canal-Business-Card.png",
} as const

const BADGE_LABELS = {
	idle: "Copy email",
	press: "Copy email",
	drag: "Copy email",
	view: "Say bonjour",
}

const BADGE_OFFSET = { x: 84, y: 64 }

const isDesktopPointer = useDesktopPointer()
const { copied, copy } = useCopyToClipboard()

/** Badge qui suit le curseur sur l'e-mail (même logique que le footer). */
const isHoveringEmail = shallowRef(false)
const badgeState = computed<BadgeState | undefined>(() =>
	copied.value ? "view" : undefined
)
const TAG_LABEL = "Email copied!"
const badge = useBadgePresentation({
	active: isHoveringEmail,
	state: badgeState,
	labels: BADGE_LABELS,
	offset: BADGE_OFFSET,
	bgColor: computed(() => "var(--color-white)"),
	textColor: computed(() => "var(--color-violet)"),
})

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
	<section
		class="bg-violet pt-section relative min-h-svh overflow-hidden text-white lg:pt-0"
	>
		<img
			src="/stickers/character_violet.svg"
			alt=""
			aria-hidden="true"
			decoding="async"
			class="pointer-events-none absolute right-0 bottom-0 w-[clamp(16rem,52vw,64rem)] translate-x-[12%] scale-x-[-1] opacity-25 select-none"
		/>

		<div
			class="p-edge mt-section relative z-10 grid min-h-svh grid-cols-1 content-start gap-x-6 gap-y-12 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:gap-y-16"
		>
			<!-- Header -->
			<header
				class="relative [--indent:clamp(11rem,17vw,15rem)] [--title-size:clamp(2rem,6.4vw,6rem)] lg:col-span-12 lg:row-start-1"
			>
				<!-- Main title -->
				<h1
					v-text-reveal="{ immediate: true, theme: 'black-light' }"
					class="font-lineal-black text-(length:--title-size) leading-[0.95] tracking-[-0.03em] uppercase"
				>
					<span class="block">Every project</span>
					{{ " " }}
					<span class="block pl-[0.9em] lg:pl-(--indent)">starts somehow.</span>
				</h1>

				<!-- Download button: directly below the main title on mobile,
                     positioned on the right on desktop. -->
				<div
					class="mt-8 lg:absolute lg:top-[calc(var(--title-size)*0.475)] lg:right-0 lg:mt-0 lg:-translate-y-1/2"
				>
					<div class="lg:hidden">
						<UiAnimatedButton
							label="Get my business card"
							size="small"
							theme="white-violet"
							:to="BUSINESS_CARD.href"
							external
							:download="BUSINESS_CARD.filename"
						/>
					</div>

					<div class="hidden lg:block">
						<UiAnimatedButton
							label="Get my business card"
							theme="white-violet"
							:to="BUSINESS_CARD.href"
							external
							:download="BUSINESS_CARD.filename"
						/>
					</div>
				</div>

				<!-- Intro: below the download button on mobile,
                     positioned to the left of the title on desktop. -->
				<p
					v-text-reveal="{ immediate: true, theme: 'black-light' }"
					class="font-lineal mt-8 max-w-[26ch] text-lg leading-snug text-white/70 lg:absolute lg:top-[calc(var(--title-size)*1.08)] lg:left-0 lg:mt-0 lg:w-[calc(var(--indent)-2rem)]"
				>
					Got something in mind? Let's see where it goes.
				</p>
			</header>

			<!-- Contact form -->
			<ContactForm class="lg:col-span-6 lg:row-start-2" />

			<!-- FAQ -->
			<ContactFAQ class="lg:col-span-5 lg:col-start-8 lg:row-start-2" />

			<!-- Footer -->
			<div
				class="flex flex-col gap-6 border-t border-white/15 pt-6 lg:col-span-12 lg:row-start-3 lg:flex-row lg:items-end lg:justify-between"
			>
				<p
					class="font-vg5000 flex flex-wrap items-baseline gap-x-2 text-sm text-white/70"
				>
					<span v-text-reveal="{ immediate: true, theme: 'black-light' }">
						Or just email me at
					</span>

					<span
						class="pointer-events-none relative my-[-0.75em] flex w-fit overflow-clip py-[0.6em]"
					>
						<button
							type="button"
							v-roll-hover
							:aria-label="`Copy ${EMAIL} to clipboard`"
							class="text-fit-x pointer-events-auto cursor-pointer touch-manipulation tracking-tight whitespace-nowrap text-white transition-[color,translate] duration-500 ease-[cubic-bezier(.34,1.3,.64,1)] select-none [-webkit-tap-highlight-color:transparent] hover:text-white/70 motion-reduce:transition-none"
							:class="copied ? '-translate-y-[calc(100%+1.5em)]' : 'translate-y-0'"
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
							class="font-vg5000 text-violet pointer-events-none absolute inset-0 flex items-center justify-center rounded-xs bg-white transition-[translate] duration-500 ease-[cubic-bezier(.34,1.3,.64,1)] motion-reduce:transition-none lg:rounded-sm"
							:class="copied ? 'translate-y-0' : 'translate-y-[calc(100%+0.5em)]'"
						>
							<span
								class="text-fit text-[0.65rem] tracking-[0.16em] whitespace-nowrap uppercase lg:text-[0.7rem]"
							>
								{{ TAG_LABEL }}
							</span>
						</span>
					</span>
				</p>

				<nav aria-label="Social links">
					<ul
						class="font-vg5000 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm lg:justify-end"
					>
						<li v-for="social in SOCIALS" :key="social.label">
							<a
								v-roll-hover
								:href="social.href"
								target="_blank"
								rel="noopener noreferrer"
								:class="LINK_CLASS"
							>
								{{ social.label }}
							</a>
						</li>
					</ul>
				</nav>
			</div>
		</div>

		<!-- Cursor badge (même composant que le footer) -->
		<UiBadgeCursor :badge="badge" />
	</section>
</template>
