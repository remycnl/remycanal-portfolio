<script setup lang="ts">
import type { CardTint } from "@/composables/useCardGrid"

interface Props {
	/** Color of the band that replaces the page background behind the heading. */
	tint?: CardTint
	/** Sticker URLs, popped under the cursor on desktop only. */
	stickers?: string[]
}

const { tint = "lime", stickers = [] } = defineProps<Props>()

const tones: Record<
	CardTint,
	{
		circle: string
		band: string
		title: string
		text: string
		arrow: string
		arrowBg: string
		reveal: CardTint
	}
> = {
	lime: {
		circle: "bg-black",
		band: "bg-black-light",
		title: "text-white",
		text: "text-white/60",
		arrow: "text-black",
		arrowBg: "bg-lime",
		reveal: "lime",
	},
	violet: {
		circle: "bg-white",
		band: "bg-gray-light",
		title: "text-black",
		text: "text-black/70",
		arrow: "text-white",
		arrowBg: "bg-violet",
		reveal: "violet",
	},
}

const ui = computed(() => tones[tint])

const revealOptions = computed(() => ({ theme: ui.value.reveal, immediate: true }))

const zoneEl = useTemplateRef<HTMLElement>("zoneEl")
const layerEl = useTemplateRef<HTMLElement>("layerEl")
const circleEl = useTemplateRef<HTMLElement>("circleEl")
const breatheEl = useTemplateRef<HTMLElement>("breatheEl")

// Stickers under the cursor: desktop pointer only, nothing on responsive / touch.
const isDesktop = useDesktopPointer()
useCursorStickers(zoneEl, layerEl, isDesktop, { sources: stickers })

/*
 * Circle: spring entrance + slow "breathing".
 * Both are Web Animations on `transform` only, so they run on the compositor thread and stay
 * smooth even while the main thread is busy (hydration, text split, fonts, scroll refresh).
 * The entrance is on the outer element, the breathing on the inner one: the two transforms
 * multiply, so they never fight each other.
 */
const ENTRANCE_DURATION = 1400
const BREATHE_DURATION = 3200

let entrance: Animation | undefined
let breathe: Animation | undefined
let disposed = false

onMounted(async () => {
	const outer = circleEl.value
	const inner = breatheEl.value
	if (!outer || !inner) return

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		outer.style.opacity = "1"
		return
	}

	await waitForAppReady()
	await waitForPageTransition()
	if (disposed) return

	// Start on a calm frame, after the layout work of the page has settled.
	await new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	)
	if (disposed) return

	entrance = outer.animate(
		[
			{ transform: "scale(0)", opacity: 1 },
			{ transform: "scale(1)", opacity: 1 },
		],
		{
			duration: ENTRANCE_DURATION,
			easing: springEasing({ damping: 0.5, duration: ENTRANCE_DURATION / 1000 }),
			fill: "both",
		}
	)

	breathe = inner.animate(
		[{ transform: "scale(1)" }, { transform: "scale(1.03)" }],
		{
			duration: BREATHE_DURATION,
			easing: "ease-in-out",
			direction: "alternate",
			iterations: Infinity,
		}
	)
})

onBeforeUnmount(() => {
	disposed = true
	entrance?.cancel()
	breathe?.cancel()
})

/** Scrolls so that the top of the content that follows the header (the loop) hits the top of the screen. */
const { $lenis } = useNuxtApp()

function scrollToContent() {
	const header = zoneEl.value
	if (!header) return

	const top = header.offsetHeight

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		$lenis.scrollTo(top, { immediate: true })
		return
	}

	$lenis.scrollTo(top, { duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
}
</script>

<template>
	<div
		ref="zoneEl"
		:class="[
			ui.band,
			'sticky top-0 z-0 flex w-full flex-col justify-end overflow-hidden',
			'min-h-[calc(100svh-var(--loop-height,0px))]',
		]"
	>
		<!-- Circle -->
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 flex items-center justify-center"
		>
			<div
				ref="circleEl"
				class="aspect-square opacity-0 will-change-transform w-[min(65vw,41svh)] md:w-[min(50vw,50svh)] lg:w-[min(45vw,54svh)]"
			>
				<div
					ref="breatheEl"
					:class="[ui.circle, 'size-full rounded-full will-change-transform']"
				/>
			</div>
		</div>

		<!--
			Responsive : le bloc remplit le header, titre en haut à gauche, description en bas à droite
			(au-dessus de la flèche grâce au padding bas). Dès md : textes en bas, comme avant.
		-->
		<div
			class="px-edge pb-edge relative isolate z-10 flex flex-col justify-end max-md:flex-1 max-md:pb-[calc(var(--spacing-edge)+4rem)]"
		>
			<div
				class="flex h-fit flex-col gap-3 pt-25 max-md:flex-1 max-md:justify-between md:flex-row md:items-end md:justify-between lg:pt-0"
			>
				<h2
					v-text-reveal="revealOptions"
					:class="[ui.title, 'font-lineal-bold text-3xl max-md:self-start lg:text-4xl']"
				>
					<slot name="title" />
				</h2>

				<h3
					v-text-reveal="revealOptions"
					:class="[ui.text, 'text-right text-sm max-md:self-end']"
				>
					<slot name="description" />
				</h3>
			</div>
		</div>

		<!-- Flèche : hors du flux, ne décale rien -->
		<button
			type="button"
			aria-label="Scroll to content"
			:class="[
				ui.arrow,
				ui.arrowBg,
				'font-vg5000 absolute bottom-edge left-1/2 z-10 flex size-12 -translate-x-1/2 cursor-pointer items-center justify-center rounded-xl text-xl',
				'transition-transform duration-200 ease-out',
				'[-webkit-tap-highlight-color:transparent]',
				'hover:scale-110 active:scale-95',
			]"
			@click="scrollToContent"
		>
			<span class="inline-block box-fit rotate-90 text-3xl">→</span>
		</button>

		<!-- Stickers sous la souris (desktop uniquement) -->
		<div
			ref="layerEl"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-1 select-none overflow-hidden"
		/>
	</div>
</template>