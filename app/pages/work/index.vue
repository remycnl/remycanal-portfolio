<template>
	<div class="section-p-xy min-h-svh bg-black text-white">
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(18rem,24rem)_1fr] lg:gap-16">
			<aside
				class="mt-15 flex flex-col gap-6 transition duration-700 ease-out motion-reduce:transition-none lg:sticky lg:top-30 lg:mt-0 lg:self-start starting:translate-y-4 starting:opacity-0"
			>
				<h1
					v-text-reveal="{
						immediate: true,
					}"
					class="text-base/relaxed text-pretty"
				>
					Here's what "crafting" looks like in practice.
				</h1>

				<div
					v-text-reveal="{
						singlePhrase: true,
						immediate: true,
					}"
					class="text-gray-dark flex max-w-[44ch] flex-col gap-4 text-base/relaxed text-pretty"
				>
					<p>
						A selection of client builds, web platforms, and full-stack projects designed
						and engineered for production.
					</p>
					<p>Scroll down and click on whatever catches your eye.</p>
					<p>
						For raw visual ideas, UI explorations, and smaller side projects, jump over to
						the
						<NuxtLink
							to="/playground"
							class="decoration-gray-dark text-white underline underline-offset-4 transition-colors hover:decoration-current"
							>Playground</NuxtLink
						>.
					</p>
					<p>
						Every project starts somehow.
						<NuxtLink
							to="/contact"
							class="decoration-gray-dark text-white underline underline-offset-4 transition-colors hover:decoration-current"
							>Let's connect</NuxtLink
						>.
					</p>
				</div>

				<p
					v-text-reveal="{
						immediate: true,
					}"
					class="text-gray-dark text-sm"
				>
					{{ items.length }} projects for now, and counting.
				</p>
			</aside>

			<div class="@container min-w-0">
				<!-- `role="list"` : Tailwind retire le style de liste, ce qui fait perdre la sémantique à Safari/VoiceOver -->
				<ul
					ref="grid"
					role="list"
					class="relative grid grid-cols-1 gap-4 transition-opacity duration-500 data-[ready=false]:opacity-0 motion-reduce:transition-none @2xl:grid-cols-6 @2xl:gap-6"
					:data-ready="ready ? 'true' : 'false'"
				>
					<li
						v-for="(item, index) in items"
						:key="item.path"
						:data-path="item.path"
						class="relative"
						:class="[SPAN[item.size], RATIO[item.size]]"
					>
						<NuxtLink
							:to="item.path"
							class="card-link group @container absolute inset-0 block touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-none"
							:style="shapes[item.path]?.link"
							@pointerenter="onEnter"
							@pointerleave="onLeave"
							@pointerdown="onPress"
							@pointerup="onRelease"
							@pointercancel="onRelease"
							@click="onClick"
						>
							<span
								:class="[LAYER, 'card-frame bg-black-light pointer-events-none']"
							></span>

							<span
								:class="[LAYER, 'card-media']"
								:style="[shapes[item.path]?.media, { backgroundColor: item.tone }]"
							>
								<div class="flex size-full items-center justify-center p-4">
									<div
										:class="[
											'work-card-image relative box-border aspect-16/10 max-h-full overflow-hidden rounded-lg bg-black',
											IMAGE_WIDTH[item.size],
										]"
									>
										<img
											v-if="item.image"
											:src="item.image"
											alt=""
											:loading="index < EAGER_COUNT ? 'eager' : 'lazy'"
											:fetchpriority="index === 0 ? 'high' : 'auto'"
											decoding="async"
											class="absolute inset-2 block size-[calc(100%-1rem)] rounded-xs object-cover"
										/>
									</div>
								</div>
							</span>

							<WorkTags
								:tags="item.tags"
								:max="2"
								plain
								:plain-color="item.toneText"
								class="card-follow absolute top-(--tag-top,1rem) right-4 max-w-[calc(100%-2rem)] text-right text-[0.6rem] [--follow-x:-1] [--follow-y:1]"
							/>

							<span
								:class="[
									'card-follow absolute bottom-(--title-bottom,1rem) left-4 flex max-w-[calc(100%-2rem)] items-baseline gap-3 text-sm [--follow-x:1] [--follow-y:-1]',
									item.toneText === 'white' ? 'text-white' : 'text-black',
								]"
							>
								<span class="min-w-0 truncate font-medium">{{ item.title }}</span>
								<time :datetime="item.date" class="shrink-0 tabular-nums opacity-55">{{
									item.year
								}}</time>
							</span>
						</NuxtLink>
					</li>
				</ul>
			</div>
		</div>

		<UiBadgeCursor v-if="canHover" :badge="workBadge" />
	</div>
</template>

<script lang="ts" setup>
import type { WorkCollectionItem } from "@nuxt/content"
import { workToneText } from "@/utils/work.ts"

type Project = Pick<
	WorkCollectionItem,
	"path" | "title" | "date" | "tone" | "image" | "tags"
>
type RowSize = 1 | 2 | 3

interface GridItem extends Project {
	/** Nombre de cartes de la ligne à laquelle appartient le projet. */
	size: RowSize
	/** Année extraite de `date` (format `YYYY-MM`). */
	year: string
	/** Couleur de texte lisible sur `tone`. */
	toneText: ReturnType<typeof workToneText>
}

definePageMeta({
	footerTheme: "lime",
	transitionBase: "var(--color-black)",
	transitionAccent: "var(--color-lime)",
	transitionDirection: { desktop: "right", mobile: "bottom" },
})

const { data: projects } = await useAsyncData(
	"work-projects",
	() =>
		queryCollection("work")
			.order("date", "DESC")
			.select("path", "title", "date", "tone", "image", "tags")
			.all(),
	{ default: () => [] }
)

const { arm } = useOverlay()

const {
	badge: workBadge,
	onEnter: onBadgeEnter,
	onLeave: onBadgeLeave,
	onPress: onBadgePress,
	onRelease: onBadgeRelease,
	onOpen: onBadgeOpen,
} = useWork()

/* -------------------------------------------------------------------------- */
/* Grille                                                                      */
/* -------------------------------------------------------------------------- */

const EAGER_COUNT = 3
const LAYER = "absolute inset-x-0 top-(--bleed-top,0px) bottom-(--bleed-bottom,0px)"

/** Nombre de cartes par rangée, répété en boucle. */
const RHYTHM: readonly RowSize[] = [1, 2, 1, 3, 2]

// Classes écrites en toutes lettres pour que Tailwind les détecte.
const SPAN = {
	1: "@2xl:col-span-6",
	2: "@2xl:col-span-3",
	3: "@2xl:col-span-2",
} as const satisfies Record<RowSize, string>

const RATIO = {
	1: "aspect-4/3 @2xl:aspect-16/9",
	2: "aspect-4/3 @2xl:aspect-square",
	3: "aspect-4/3 @2xl:aspect-3/4",
} as const satisfies Record<RowSize, string>

const IMAGE_WIDTH = {
	1: "w-[64%]",
	2: "w-[72%]",
	3: "w-[78%]",
} as const satisfies Record<RowSize, string>

const items = computed<GridItem[]>(() => {
	const source = projects.value
	const list: GridItem[] = []
	let cursor = 0

	for (let row = 0; cursor < source.length; row++) {
		const size = Math.min(RHYTHM[row % RHYTHM.length]!, source.length - cursor) as RowSize

		for (const project of source.slice(cursor, cursor + size)) {
			list.push({
				...project,
				size,
				year: workYear(project.date),
				toneText: workToneText(project.tone),
			})
		}

		cursor += size
	}

	return list
})

/* -------------------------------------------------------------------------- */
/* Formes                                                                      */
/* -------------------------------------------------------------------------- */

const gridRef = useTemplateRef<HTMLUListElement>("grid")
const { shapes, ready } = useWorkShapes(gridRef, items)

/* -------------------------------------------------------------------------- */
/* Interactions                                                                */
/* -------------------------------------------------------------------------- */

/** Le badge curseur ne réagit qu'à la souris (pas au doigt ni au stylet). */
const mouseOnly =
	<E extends PointerEvent>(handler: (event: E) => void) =>
	(event: E) => {
		if (event.pointerType === "mouse") handler(event)
	}

const onEnter = mouseOnly(onBadgeEnter)
const onLeave = mouseOnly(onBadgeLeave)
const onPress = mouseOnly(onBadgePress)
const onRelease = mouseOnly(onBadgeRelease)

function onClick(event: MouseEvent) {
	if (!arm(event)) return
	onBadgeOpen()
}

/**
 * `true` si l'appareil a un vrai hover. Initialisé au montage (évite un mismatch
 * d'hydratation) et tenu à jour si l'entrée principale change (souris branchée, etc.).
 * Doit rester aligné sur la media query du CSS des cartes.
 */
const canHover = ref(false)
let hoverQuery: MediaQueryList | undefined

function syncCanHover() {
	canHover.value = hoverQuery?.matches ?? false
}

onMounted(() => {
	hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
	syncCanHover()
	hoverQuery.addEventListener("change", syncCanHover)
})

onBeforeUnmount(() => hoverQuery?.removeEventListener("change", syncCanHover))
</script>

<style scoped>
/* L'état (`--card-image-scale`, `--card-duration`…) est piloté par le CSS global des cartes. */
.work-card-image {
	scale: var(--card-image-scale, 0.94);
	transition: scale var(--card-duration) var(--card-spring) var(--card-delay);
}

@media (prefers-reduced-motion: reduce) {
	.work-card-image {
		transition: none;
	}
}
</style>
