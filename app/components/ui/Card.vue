<script setup lang="ts">
import type { CardTheme, CardTint } from "@/composables/useCardGrid"
import { decodeImage } from "@/utils/decodeImage"
import { createRevealTrigger } from "@/utils/revealTrigger"

interface Props {
	title: string
	image: string
	href?: string
	date?: string
	price?: string
	tags?: string[]
	teaser?: boolean
	/** Tint of the teaser overlay. Defaults to the tint of the surrounding card grid. */
	teaserTint?: CardTint
	/** Background the card sits on. `black` switches the texts to white. Defaults to the theme of the surrounding card grid. */
	theme?: CardTheme
	/** Shows only the title and the date, with smaller texts. Has no hover or press effect. */
	compact?: boolean
	/** Scroll-triggered reveal. Disabled by default in `compact` mode, enabled otherwise. Force with `:reveal="true"` or `:reveal="false"`. */
	reveal?: boolean
	/** Unveils the image in the same timeline as the texts. Only applies while the reveal is enabled. */
	revealImage?: boolean
}

const {
	title,
	image,
	href = "#",
	date,
	price,
	tags = [],
	teaser = false,
	teaserTint,
	theme,
	compact = false,
	// Explicit default: without it, Vue casts an absent boolean prop to `false` instead of `undefined`.
	reveal = undefined,
	revealImage = true,
} = defineProps<Props>()

const grid = useCardGridContext()
const isOpening = useOpening()

const tones: Record<CardTheme, { title: string; text: string; date: string }> = {
	white: { title: "text-black", text: "text-black/60", date: "text-black/40" },
	black: { title: "text-white", text: "text-white/60", date: "text-white/40" },
}

const frames: Record<CardTheme, string> = {
	white: "bg-gray-light",
	black: "bg-black-light",
}

/** Color of the curtain that covers the image until it is revealed: the color of the card frame. */
const curtains: Record<CardTheme, string> = {
	white: "[--card-curtain:var(--color-gray-light)]",
	black: "[--card-curtain:var(--color-black-light)]",
}

const teaserOverlays: Record<CardTint, string> = {
	lime: "bg-lime/45 mix-blend-color",
	violet: "bg-violet/45 mix-blend-color",
}

const teaserBadges: Record<CardTheme, string> = {
	white: "bg-gray-light text-black",
	black: "text-white bg-black-light",
}

const resolvedTheme = computed(() => theme ?? grid?.theme ?? "white")
const resolvedTint = computed(() => teaserTint ?? grid?.tint ?? "lime")

const ui = computed(() => tones[resolvedTheme.value])
const tagLine = computed(() => tags.join(" • "))

const revealEnabled = computed(() => reveal ?? !compact)
const hasImageReveal = computed(() => revealEnabled.value && revealImage)

/** The image is unveiled first, then the texts follow. */
const IMAGE_LEAD = 0.2

let stopStandalone: (() => void) | undefined
onBeforeUnmount(() => stopStandalone?.())

/** Outside a grid, the card opens on its own when it reaches the reveal point. */
function openAlone(card: HTMLElement) {
	return new Promise<void>((resolve) => {
		const { ScrollTrigger } = useGsap()
		stopStandalone = createRevealTrigger(ScrollTrigger, card, resolve)
	})
}

/**
 * The card plays when its row is open (or when it is visible, outside a grid), its own image is
 * loaded and decoded, and it is its turn in the row (cards of a row start one after the other).
 * Curtain, image settle and texts all hang on the same `playing` phase, so they start together.
 */
function sequence(el: HTMLElement) {
	const card = el.closest<HTMLElement>("[data-card]")
	if (!card) return { opened: Promise.resolve() }

	const img = card.querySelector("img")

	if (!grid) return { opened: openAlone(card).then(() => decodeImage(img)) }

	const slot = grid.slotFor(card)

	return { opened: slot.opened.then(() => decodeImage(img)).then(slot.turn) }
}

const revealOptions = computed(() => ({
	theme: resolvedTheme.value === "black" ? "lime" : "violet",
	disabled: !revealEnabled.value,
	delay: hasImageReveal.value ? IMAGE_LEAD : 0,
	sequence,
}))

function onPointerDown(event: PointerEvent) {
	if (event.button === 0) grid?.onPress()
}

function onClick(event: MouseEvent) {
	if (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return
	}
	isOpening.value = true
	grid?.onOpen()
}
</script>

<template>
	<NuxtLink
		:to="href"
		data-card
		:class="[
			'block self-start',
			hasImageReveal ? ['card-reveal', curtains[resolvedTheme]] : '',
			compact
				? 'rounded-lg bg-black p-1.5 transition-transform duration-200 ease-out active:scale-[0.98] lg:p-2'
				: 'card-link @container [-webkit-tap-highlight-color:transparent]',
		]"
		:aria-busy="isOpening"
		@pointerenter="grid?.onEnter()"
		@pointerleave="grid?.onLeave()"
		@pointerdown="onPointerDown"
		@pointerup="grid?.onRelease()"
		@pointercancel="grid?.onRelease()"
		@click="onClick"
	>
		<div class="card-image relative aspect-video overflow-hidden rounded-xs">
			<div
				v-if="!compact"
				aria-hidden="true"
				:class="[
					'card-frame pointer-events-none absolute inset-0 rounded-xs',
					frames[resolvedTheme],
				]"
			/>

			<div
				:class="[
					'relative isolate size-full overflow-hidden rounded-xs',
					compact ? '' : 'card-media',
				]"
			>
				<NuxtImg
					:src="image"
					:alt="title"
					width="1280"
					height="720"
					format="webp"
					:quality="70"
					sizes="100vw md:60vw lg:50vw"
					loading="lazy"
					decoding="async"
					:class="['size-full object-cover', teaser ? 'scale-110 blur-xl grayscale' : '']"
				/>

				<div
					v-if="teaser"
					:class="[
						'absolute inset-0 z-10 flex items-center justify-center text-center mix-blend-normal',
						teaserOverlays[resolvedTint],
					]"
				>
					<span
						:class="[
							'font-lineal-heavy rounded-xs px-4 py-2 text-sm tracking-[0.2em] uppercase sm:px-5 sm:py-2.5 sm:text-base',
							teaserBadges[resolvedTheme],
						]"
					>
						COMING SOON
					</span>
				</div>
			</div>
		</div>

		<div v-text-reveal="revealOptions">
			<div
				:class="
					compact
						? 'mt-2 flex items-start justify-between gap-2'
						: 'mt-4 flex flex-col gap-3 @xs:mt-6 @sm:flex-row @sm:items-start @sm:justify-between @sm:gap-10'
				"
			>
				<div :class="['max-w-md', compact ? 'min-w-0 p-1 sm:p-2' : '']">
					<h3
						data-text-reveal-block
						:class="[
							ui.title,
							compact
								? 'font-lineal truncate text-sm sm:text-base'
								: 'font-lineal-medium text-base @xs:text-lg @md:text-xl',
							'leading-tight',
						]"
					>
						{{ title }}
					</h3>

					<p
						v-if="!compact && tagLine"
						data-text-reveal-block
						:class="[
							ui.text,
							'font-vg5000 mt-2 text-[0.6rem] leading-relaxed tracking-wider uppercase @sm:mt-3 @sm:text-xs',
						]"
					>
						{{ tagLine }}
					</p>
				</div>

				<div
					:class="[
						'flex shrink-0 flex-col gap-3',
						compact ? 'items-end pt-1' : 'items-start @sm:items-end @sm:pt-1',
					]"
				>
					<time
						v-if="date"
						data-text-reveal-block
						:class="[
							ui.date,
							compact
								? 'text-[0.6rem] tracking-wider'
								: 'text-[0.6rem] tracking-wider @sm:text-xs @sm:tracking-widest',
							'font-vg5000 uppercase',
						]"
					>
						{{ date }}
					</time>
					<span
						v-else-if="price"
						data-text-reveal-block
						:class="[
							ui.title,
							'font-vg5000 text-xs tracking-wider uppercase @sm:text-sm',
						]"
					>
						{{ price }}
					</span>
				</div>
			</div>
		</div>
	</NuxtLink>
</template>

<style scoped>
.card-media {
	--card-gap: 0px;
	--card-spring: cubic-bezier(0.22, 1, 0.36, 1);
	scale: calc(1 - tan(atan2(var(--card-gap) * 2, 100cqw)))
		calc(1 - tan(atan2(var(--card-gap) * 2, 56.25cqw)));
	transition: scale 900ms var(--card-spring);
}

@supports (transition-timing-function: linear(0, 1)) {
	.card-media {
		--card-spring: linear(
			0,
			0.046,
			0.164,
			0.323,
			0.497,
			0.668,
			0.821,
			0.947,
			1.044,
			1.11,
			1.148,
			1.162,
			1.159,
			1.142,
			1.118,
			1.089,
			1.061,
			1.035,
			1.013,
			0.996,
			0.984,
			0.977,
			0.974,
			0.974,
			0.976,
			0.98,
			0.984,
			0.989,
			0.993,
			0.997,
			1,
			1.002,
			1.003,
			1.004,
			1.004,
			1.004,
			1
		);
	}
}

.card-frame {
	opacity: 0;
	transition: opacity 600ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
	.card-link:hover .card-media {
		--card-gap: min(0.6rem, 3.2cqw);
	}

	.card-link:hover .card-frame {
		opacity: 1;
		transition-duration: 250ms;
	}
}

.card-link:focus-visible .card-media {
	--card-gap: min(0.6rem, 3.2cqw);
}

.card-link:focus-visible .card-frame {
	opacity: 1;
	transition-duration: 250ms;
}

.card-link:active .card-media,
.card-link[aria-busy="true"] .card-media {
	--card-gap: min(1rem, 6cqw);
	transition-duration: 220ms;
	transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.card-link:active .card-frame,
.card-link[aria-busy="true"] .card-frame {
	opacity: 1;
	transition-duration: 250ms;
}

@media (prefers-reduced-motion: reduce) {
	.card-media,
	.card-frame {
		transition: none;
	}
}

/*
 * Image reveal, driven by the phase of the text reveal of the same card. A curtain in the color of
 * the card frame covers the image while the text is idle, then lifts while the image settles.
 * Only `transform` is animated, so it stays on the compositor. Without motion, the image is
 * always shown.
 */
@media (prefers-reduced-motion: no-preference) {
	.card-reveal .card-image::after {
		content: "";
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: var(--card-curtain);
		transform-origin: 50% 100%;
	}

	.card-reveal:has([data-text-reveal="playing"], [data-text-reveal="done"])
		.card-image::after {
		transform: scaleY(0);
		animation: card-curtain-lift 900ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	.card-reveal:has([data-text-reveal="playing"], [data-text-reveal="done"])
		.card-image
		img {
		animation: card-image-settle 1300ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}
}

@keyframes card-curtain-lift {
	from {
		transform: scaleY(1);
	}
	to {
		transform: scaleY(0);
	}
}

@keyframes card-image-settle {
	from {
		transform: scale(1.18);
	}
	to {
		transform: scale(1);
	}
}
</style>
