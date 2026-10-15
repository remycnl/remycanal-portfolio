<script setup lang="ts">
import type { CardTint } from "@/composables/useCardGrid"

type HeaderShape = "triangles" | "ovals"

interface Props {
	/** Color of the band that replaces the page background behind the heading. */
	tint?: CardTint
	/** Sticker URLs, popped under the cursor on desktop only. */
	stickers?: string[]
	/** Shape drawn behind the heading: a row of rounded triangles, or a row of tall ovals. */
	shape?: HeaderShape
}

const { tint = "lime", stickers = [], shape = "triangles" } = defineProps<Props>()

const tones: Record<
	CardTint,
	{
		shape: string
		band: string
		title: string
		text: string
		arrow: string
		arrowBg: string
		reveal: CardTint
	}
> = {
	lime: {
		shape: "text-black",
		band: "bg-black-light",
		title: "text-white",
		text: "text-white/60",
		arrow: "text-black",
		arrowBg: "bg-lime",
		reveal: "lime",
	},
	violet: {
		shape: "text-white",
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

/*
 * Every item is a real HTML element (a <div>, or a <div> holding a tiny <svg>), never an SVG child:
 * transform animations on HTML elements run on the compositor thread, SVG children do not.
 * Sizes are percentages of the shape container, so the whole thing scales with its width.
 *
 * Triangles: right triangles in a row, each with its own corner radius and a rotation in 90° steps.
 * Neither sequence is linear on purpose: it gives a rhythm instead of a pattern.
 * The radius comes from a round `stroke-linejoin` on a triangle inset by that radius, so the
 * silhouette always fills its cell exactly.
 */
const TRIANGLE_CELL = 100
const TRIANGLE_GAP = 8
const TRIANGLES = [
	{ rotate: 0, radius: 8 },
	{ rotate: 90, radius: 26 },
	{ rotate: 270, radius: 14 },
	{ rotate: 180, radius: 32 },
	{ rotate: 90, radius: 18 },
]

/*
 * Below `md` there is less room: one triangle fewer (the last one), and one oval fewer on each side.
 * The layout is rebuilt for the new count (aspect ratio, widths, oval heights), so the shape keeps
 * its proportions instead of just being cropped.
 */
const COMPACT_QUERY = "(max-width: 767px)"
const TRIANGLES_COMPACT_COUNT = TRIANGLES.length - 1

function buildTriangles(count: number) {
	const width = count * TRIANGLE_CELL + (count - 1) * TRIANGLE_GAP
	return {
		width,
		height: TRIANGLE_CELL,
		gridStyle: {
			gridTemplateColumns: `repeat(${count}, ${(TRIANGLE_CELL / width) * 100}%)`,
			columnGap: `${(TRIANGLE_GAP / width) * 100}%`,
		},
		items: TRIANGLES.slice(0, count).map((t) => ({
			d: `M${t.radius} ${t.radius}H${TRIANGLE_CELL - t.radius}L${t.radius} ${TRIANGLE_CELL - t.radius}Z`,
			rotation: `rotate(${t.rotate} ${TRIANGLE_CELL / 2} ${TRIANGLE_CELL / 2})`,
			strokeWidth: t.radius * 2,
		})),
	}
}

/*
 * Ovals: tall ellipses side by side, all the same width and color. They touch with a slight
 * overlap (step a bit under their width) so each one stays readable while still being "stuck" to
 * its neighbours. Their height falls off with a cosine from the center to the edges.
 * Each one is a real ellipse (`border-radius: 50%`), never a pill: no flat sides.
 */
const OVAL_COUNT = 7
const OVALS_COMPACT_COUNT = OVAL_COUNT - 2
const OVAL_RX = 64
/** Distance between centers: just under 2 * OVAL_RX, so neighbours overlap by a few pixels only. */
const OVAL_STEP = 100
const OVAL_RY_MAX = 170
/** Height of the outermost ovals, as a share of the tallest one. */
const OVAL_EDGE_RATIO = 0.5

function buildOvals(count: number) {
	const width = OVAL_RX * 2 + (count - 1) * OVAL_STEP
	const height = OVAL_RY_MAX * 2
	const mid = (count - 1) / 2
	const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(3)}%`

	return {
		width,
		height,
		items: Array.from({ length: count }, (_, i) => {
			const distance = Math.abs(i - mid) / mid
			const ratio =
				OVAL_EDGE_RATIO + (1 - OVAL_EDGE_RATIO) * Math.cos((distance * Math.PI) / 2)
			const ry = OVAL_RY_MAX * ratio
			return {
				style: {
					left: pct(i * OVAL_STEP, width),
					top: pct(OVAL_RY_MAX - ry, height),
					width: pct(OVAL_RX * 2, width),
					height: pct(ry * 2, height),
				},
			}
		}),
	}
}

// Server and first client render use the full layout (same markup, no hydration mismatch);
// the compact one is applied on mount, while the shape is still invisible.
const isCompact = ref(false)

const triangleLayout = computed(() =>
	buildTriangles(isCompact.value ? TRIANGLES_COMPACT_COUNT : TRIANGLES.length)
)
const ovalLayout = computed(() =>
	buildOvals(isCompact.value ? OVALS_COMPACT_COUNT : OVAL_COUNT)
)

const shapeSpec = computed(() =>
	shape === "ovals"
		? {
				width: ovalLayout.value.width,
				height: ovalLayout.value.height,
				size: "w-[min(88vw,100%,100svh)] md:w-[min(72vw,100%,105svh)] lg:w-[min(60vw,100%,110svh)]",
			}
		: {
				width: triangleLayout.value.width,
				height: triangleLayout.value.height,
				size: "w-[min(94vw,100%,170svh)] md:w-[min(84vw,100%,180svh)] lg:w-[min(76vw,100%,190svh)]",
			}
)

const zoneEl = useTemplateRef<HTMLElement>("zoneEl")
const layerEl = useTemplateRef<HTMLElement>("layerEl")
const shapeEl = useTemplateRef<HTMLElement>("shapeEl")

// Stickers under the cursor: desktop pointer only, nothing on responsive / touch.
const isDesktop = useDesktopPointer()
useCursorStickers(zoneEl, layerEl, isDesktop, { sources: stickers })

/*
 * Entrance: every item pops on its own (spring scale).
 * - triangles: random order, with a little jitter on each delay;
 * - ovals: the middle one first, then the neighbours one by one, alternating left and right.
 *
 * Idle: once it has popped, every item breathes on its own, with its own amplitude, speed and
 * phase, so the shape never moves as one block.
 *
 * Two nested elements per item: the outer one pops, the inner one breathes. The two transforms
 * multiply, so they never fight each other. Both are Web Animations on `transform` only: they run
 * on the compositor thread and stay smooth while the main thread is busy.
 *
 * Nothing is cancelled when the component unmounts: during a page transition the old page is still
 * on screen, and cancelling would snap every item back to its resting state before the page
 * actually leaves. The animations stop with their elements once those are removed from the DOM.
 */
const ITEM_DURATION = 900
const TRIANGLE_STAGGER = 110
const TRIANGLE_JITTER = 40
const OVAL_STAGGER = 140
const BREATHE_SCALE: [number, number] = [1.035, 1.06]
const BREATHE_DURATION: [number, number] = [2600, 4400]
const BREATHE_START_SPREAD = 1500

let disposed = false
let introDone = false
let compactQuery: MediaQueryList | undefined

const random = (min: number, max: number) => min + Math.random() * (max - min)

/** Random order, never the natural left-to-right one. */
function shuffledOrder(count: number) {
	const order = Array.from({ length: count }, (_, i) => i)
	for (let i = count - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[order[i], order[j]] = [order[j]!, order[i]!]
	}
	if (count > 1 && order.every((value, i) => value === i)) {
		;[order[0], order[1]] = [order[1]!, order[0]!]
	}
	return order
}

/** Middle first, then outward, alternating left and right. */
function centerOutOrder(count: number) {
	const mid = Math.floor((count - 1) / 2)
	const order = [mid]
	for (let d = 1; order.length < count; d++) {
		if (mid - d >= 0) order.push(mid - d)
		if (mid + d < count) order.push(mid + d)
	}
	return order
}

/** Idle breathing: starts at scale(1), so there is no jump after the pop. Runs once per item. */
function startBreathing(item: HTMLElement, delay: number) {
	const target = item.querySelector<Element>("[data-shape-breathe]")
	if (!target || target.hasAttribute("data-breathing")) return
	target.setAttribute("data-breathing", "")

	target.animate(
		[
			{ transform: "scale(1)" },
			{ transform: `scale(${random(...BREATHE_SCALE).toFixed(3)})` },
		],
		{
			duration: random(...BREATHE_DURATION),
			delay,
			easing: "ease-in-out",
			direction: "alternate",
			iterations: Infinity,
		}
	)
}

function onCompactChange(event: MediaQueryListEvent) {
	isCompact.value = event.matches
}

// Crossing the breakpoint after the intro: items created by the new layout appear at rest and only
// get their own breathing; the ones that stay keep running untouched.
watch(isCompact, async () => {
	if (!introDone) return
	await nextTick()
	if (disposed) return

	const items = shapeEl.value?.querySelectorAll<HTMLElement>("[data-shape-item]") ?? []
	for (const item of items) startBreathing(item, random(0, BREATHE_START_SPREAD))
})

onMounted(async () => {
	const container = shapeEl.value
	if (!container) return

	compactQuery = window.matchMedia(COMPACT_QUERY)
	isCompact.value = compactQuery.matches
	compactQuery.addEventListener("change", onCompactChange)

	// Let Vue render the layout for this screen before reading the DOM.
	await nextTick()

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		container.style.opacity = "1"
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

	const items = Array.from(container.querySelectorAll<HTMLElement>("[data-shape-item]"))
	const isOvals = shape === "ovals"
	const order = isOvals ? centerOutOrder(items.length) : shuffledOrder(items.length)
	const easing = springEasing({ damping: 0.5, duration: ITEM_DURATION / 1000 })

	order.forEach((itemIndex, rank) => {
		const item = items[itemIndex]
		if (!item) return

		const delay = isOvals
			? rank * OVAL_STAGGER
			: rank * TRIANGLE_STAGGER + Math.random() * TRIANGLE_JITTER

		// `fill: both` keeps each item at scale(0) while it waits for its turn.
		item.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
			duration: ITEM_DURATION,
			delay,
			easing,
			fill: "both",
		})

		startBreathing(item, delay + ITEM_DURATION + random(0, BREATHE_START_SPREAD))
	})

	// Items are all at scale(0) at this point: showing the container cannot flash anything.
	container.style.opacity = "1"
	introDone = true
})

onBeforeUnmount(() => {
	disposed = true
	compactQuery?.removeEventListener("change", onCompactChange)
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
		<!-- Shape : le padding edge borne la largeur disponible, la forme ne touche jamais les bords. -->
		<div
			aria-hidden="true"
			class="px-edge pointer-events-none absolute inset-0 flex items-center justify-center"
		>
			<div
				ref="shapeEl"
				:class="[shapeSpec.size, ui.shape, 'opacity-0']"
				:style="{ aspectRatio: `${shapeSpec.width} / ${shapeSpec.height}` }"
			>
				<!-- Triangles : une cellule par triangle, la cellule pop, le svg respire. -->
				<div
					v-if="shape === 'triangles'"
					class="grid size-full content-center"
					:style="triangleLayout.gridStyle"
				>
					<div
						v-for="(t, i) in triangleLayout.items"
						:key="i"
						data-shape-item
						class="aspect-square"
					>
						<svg
							data-shape-breathe
							viewBox="0 0 100 100"
							class="block size-full"
							fill="currentColor"
						>
							<g :transform="t.rotation">
								<path
									:d="t.d"
									stroke="currentColor"
									stroke-linejoin="round"
									:stroke-width="t.strokeWidth"
								/>
							</g>
						</svg>
					</div>
				</div>

				<!-- Ovales : positionnés en pourcentages, l'élément extérieur pop, l'intérieur respire. -->
				<div v-else class="relative size-full">
					<div
						v-for="(oval, i) in ovalLayout.items"
						:key="i"
						data-shape-item
						class="absolute"
						:style="oval.style"
					>
						<div data-shape-breathe class="size-full rounded-[50%] bg-current" />
					</div>
				</div>
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
				'font-vg5000 bottom-edge absolute left-1/2 z-10 flex size-12 -translate-x-1/2 cursor-pointer items-center justify-center rounded-lg text-xl',
				'transition-transform duration-200 ease-out',
				'[-webkit-tap-highlight-color:transparent]',
				'hover:scale-110 active:scale-95',
			]"
			@click="scrollToContent"
		>
			<span class="box-fit inline-block rotate-90 text-3xl">→</span>
		</button>

		<!-- Stickers sous la souris (desktop uniquement) -->
		<div
			ref="layerEl"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-1 overflow-hidden select-none"
		/>
	</div>
</template>
