<script setup lang="ts">
import type { ViewfinderBackground, ViewfinderTheme } from "@/composables/useViewfinder"

interface Props {
	title: string
	image: string
	href?: string
	date?: string
	price?: string
	tags?: string[]
	teaser?: boolean
	teaserTint?: ViewfinderTheme
	/** Parallax intensity between -1 and 1. The sign sets the direction, the magnitude sets the travel distance. */
	depth?: number
	/** Fond sur lequel la carte est posée : "black" passe les textes en blanc. */
	theme?: ViewfinderBackground
	/** Affiche uniquement titre + date, avec des textes plus petits. */
	compact?: boolean
	/** Libellés du viewfinder pour l'action de la carte. */
	viewfinderLabel?: string
	viewfinderLoadingLabel?: string
}

const {
	title,
	image,
	href = "#",
	date,
	price,
	tags = [],
	teaser = false,
	teaserTint = "lime",
	depth = 0,
	theme = "white",
	compact = false,
	viewfinderLabel = "Open",
	viewfinderLoadingLabel = "Opening...",
} = defineProps<Props>()

const tones: Record<ViewfinderBackground, { title: string; text: string; date: string }> =
	{
		white: { title: "text-black", text: "text-black/60", date: "text-black/40" },
		black: { title: "text-white", text: "text-white/60", date: "text-white/40" },
	}

// Voile de la couleur du thème + badge en contraste inversé pour rester lisible dessus.
const openingOverlay: Record<ViewfinderTheme, { tint: string; badge: string }> = {
	lime: { tint: "bg-lime/60", badge: "bg-black text-lime" },
	violet: { tint: "bg-violet/60", badge: "bg-white text-violet" },
}

const ui = computed(() => tones[theme])

const { lock, release } = useViewfinder()
const isOpening = ref(false)

const root = useTemplateRef<{ $el: HTMLElement }>("root")
const content = useTemplateRef<HTMLElement>("content")
const media = useTemplateRef<HTMLElement>("media")

useScrollParallax(() => root.value?.$el, content, media, { depth: () => depth })

let el: HTMLElement | null = null

function onEnter(e: Event) {
	el = e.currentTarget as HTMLElement
	lock(
		el,
		isOpening.value ? viewfinderLoadingLabel : viewfinderLabel,
		content.value ?? undefined
	)
}

function onLeave() {
	if (isOpening.value) return
	if (el) release(el)
}

function onClick() {
	isOpening.value = true
	if (el) lock(el, viewfinderLoadingLabel, content.value ?? undefined)
}

onBeforeUnmount(onLeave)
</script>

<template>
	<NuxtLink
		ref="root"
		:to="href"
		:class="[
			'block self-start',
			compact
				? 'rounded-lg bg-black p-1.5 transition-transform duration-200 ease-out will-change-transform active:scale-[0.98] lg:p-2'
				: '@container transition-transform duration-200 ease-out pointer-coarse:active:scale-[0.98]',
		]"
		:aria-busy="isOpening"
		@pointerenter="onEnter"
		@pointerleave="onLeave"
		@focus="onEnter"
		@blur="onLeave"
		@click="onClick"
	>
		<div ref="content" class="will-change-transform">
			<div class="relative aspect-video overflow-hidden rounded-xs">
				<!--
					Le parallax s'applique à ce wrapper (un vrai élément DOM), pas au composant NuxtImg.
				-->
				<div
					ref="media"
					class="absolute inset-x-0 top-[-15%] h-[130%] w-full will-change-transform"
				>
					<NuxtImg
						:src="image"
						:alt="title"
						width="1280"
						height="720"
						format="webp"
						:quality="80"
						sizes="100vw lg:40vw"
						loading="lazy"
						decoding="async"
						:class="[
							'size-full object-cover',
							teaser ? 'scale-110 blur-xl grayscale' : '',
						]"
					/>
				</div>

				<div
					v-if="teaser"
					:class="[
						'absolute inset-0 z-10 flex items-center justify-center text-center mix-blend-normal backdrop-blur-sm transition-[backdrop-filter,background-color] duration-500',
						teaserTint === 'lime'
							? 'bg-lime/45 mix-blend-color'
							: 'bg-violet/45 mix-blend-color',
					]"
				>
					<span
						:class="[
							'font-vg5000 rounded-xs px-4 py-2 text-sm tracking-[0.2em] uppercase transition-opacity duration-200 sm:px-5 sm:py-2.5 sm:text-base',
							theme === 'black'
								? 'border-lime/70 text-lime border bg-black/35 shadow-[0_0_24px_rgba(205,255,0,0.18)]'
								: 'border border-black/30 bg-white/45 text-black',
							isOpening && !compact ? 'opacity-0' : '',
						]"
					>
						COMING SOON
					</span>
				</div>

				<!--
					État de clic pour mobile et tablette : le viewfinder n'existe que sur
					desktop (hover + pointeur précis), donc ce voile y est masqué.
				-->
				<Transition
					enter-active-class="transition-opacity duration-200 ease-out"
					enter-from-class="opacity-0"
					leave-active-class="transition-opacity duration-150 ease-in"
					leave-to-class="opacity-0"
				>
					<div
						v-if="isOpening && !compact"
						aria-live="polite"
						:class="[
							openingOverlay[teaserTint].tint,
							'absolute inset-0 z-20 flex items-center justify-center backdrop-grayscale [@media(hover:hover)_and_(pointer:fine)]:hidden',
						]"
					>
						<span
							:class="[
								openingOverlay[teaserTint].badge,
								'font-vg5000 flex items-center gap-2 rounded-xs px-3 py-1.5 text-[0.65rem] tracking-widest uppercase',
							]"
						>
							<span class="size-1.5 animate-pulse rounded-full bg-current" />
							{{ viewfinderLoadingLabel }}
						</span>
					</div>
				</Transition>
			</div>

			<div
				:class="[
					compact
						? 'mt-2 flex items-start justify-between gap-2'
						: 'mt-4 flex flex-col gap-3 @xs:mt-6 @sm:flex-row @sm:items-start @sm:justify-between @sm:gap-10',
				]"
			>
				<div :class="['max-w-md', compact ? 'p-1 sm:p-2' : '']">
					<h3
						:class="[
							ui.title,
							compact
								? 'font-lineal text-sm sm:text-base'
								: 'font-lineal-medium text-base @xs:text-lg @md:text-xl',
							'leading-tight',
						]"
					>
						{{ title }}
					</h3>
					<p
						v-if="!compact"
						:class="[ui.text, 'mt-2 text-xs leading-relaxed @sm:mt-3 @sm:text-sm']"
					>
						<slot />
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
						:class="[
							ui.title,
							'font-vg5000 text-xs tracking-wider uppercase @sm:text-sm',
						]"
					>
						{{ price }}
					</span>
				</div>
			</div>

			<div v-if="tags.length" class="mt-3 flex flex-wrap gap-2 @sm:mt-4">
				<span
					v-for="tag in tags"
					:key="tag"
					:class="[
						ui.text,
						'font-vg5000 rounded-xs border border-current px-2 py-1 text-[0.6rem] tracking-wider uppercase',
					]"
				>
					{{ tag }}
				</span>
			</div>
		</div>
	</NuxtLink>
</template>
