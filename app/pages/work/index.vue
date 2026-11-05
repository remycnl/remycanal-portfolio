<template>
	<div class="section-p-xy min-h-svh bg-black text-white">
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(18rem,24rem)_1fr] lg:gap-16">
			<aside
				class="flex mt-15 lg:mt-0 flex-col gap-6 transition duration-700 ease-out motion-reduce:transition-none lg:sticky lg:top-30 lg:self-start starting:translate-y-4 starting:opacity-0"
			>
				<h1
					v-text-reveal="{
						immediate: true,
					}"
					class="text-base/relaxed font-semibold text-pretty"
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
				<ul
					ref="grid"
					class="relative grid grid-cols-1 gap-4 transition-opacity duration-500 data-[ready=false]:opacity-0 motion-reduce:transition-none @2xl:grid-cols-6 @2xl:gap-6"
					:data-ready="ready ? 'true' : 'false'"
				>
					<li
						v-for="(item, index) in items"
						:key="item.path"
						:data-path="item.path"
						class="relative"
						:class="[span[item.size], ratio[item.size]]"
					>
						<NuxtLink
							:to="item.path"
							class="card-link group @container absolute inset-0 block [-webkit-tap-highlight-color:transparent] focus-visible:outline-none"
							:style="shapes[item.path]?.link"
							@pointerenter="onBadgeEnter"
							@pointerleave="onBadgeLeave"
							@pointerdown="onBadgePress"
							@pointerup="onBadgeRelease"
							@pointercancel="onBadgeRelease"
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
											'work-card-image aspect-16/10 overflow-hidden rounded-lg bg-black p-2',
											imageWidth[item.size],
										]"
									>
										<img
											v-if="item.image"
											:src="item.image"
											alt=""
											:loading="index < EAGER_COUNT ? 'eager' : 'lazy'"
											decoding="async"
											class="size-full rounded-xs object-cover"
										/>
									</div>
								</div>
							</span>

							<WorkTags
								:tags="item.tags"
								:max="2"
								plain
								:plain-color="workToneText(item.tone)"
								class="card-follow absolute top-(--tag-top,1rem) right-4 max-w-[calc(100%-2rem)] text-right text-[0.6rem] [--follow-x:-1] [--follow-y:1]"
							/>

							<span
								:class="[
									'card-follow absolute bottom-(--title-bottom,1rem) left-4 flex max-w-[calc(100%-2rem)] items-baseline gap-3 text-sm [--follow-x:1] [--follow-y:-1]',
									workToneText(item.tone) === 'white' ? 'text-white' : 'text-black',
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

		<UiBadgeCursor :badge="workBadge" />
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
}

interface Point {
	x: number
	y: number
}

interface Cell {
	path: string
	x: number
	y: number
	w: number
	h: number
}

interface Shape {
	/** Variables et `clip-path` de la forme finale, posés sur le lien. */
	link: Record<string, string>
	/** `clip-path` propre au calque image, qui se réduit au hover. */
	media: Record<string, string>
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
			.select("path", "title", "date", "tone", "image", "tags")
			.order("date", "DESC")
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

const LAYER = "absolute inset-x-0 top-(--bleed-top,0px) bottom-(--bleed-bottom,0px)"
const EAGER_COUNT = 3

const rhythm: RowSize[] = [1, 2, 1, 3, 2]

const span: Record<RowSize, string> = {
	1: "@2xl:col-span-6",
	2: "@2xl:col-span-3",
	3: "@2xl:col-span-2",
}
const ratio: Record<RowSize, string> = {
	1: "aspect-4/3 @2xl:aspect-16/9",
	2: "aspect-4/3 @2xl:aspect-square",
	3: "aspect-4/3 @2xl:aspect-3/4",
}

const imageWidth: Record<RowSize, string> = {
	1: "w-[64%]",
	2: "w-[72%]",
	3: "w-[78%]",
}

const items = computed<GridItem[]>(() => {
	const source = projects.value
	const list: GridItem[] = []
	let cursor = 0
	let row = 0

	while (cursor < source.length) {
		const size = Math.min(rhythm[row % rhythm.length]!, source.length - cursor) as RowSize

		for (const project of source.slice(cursor, cursor + size)) {
			list.push({ ...project, size, year: workYear(project.date) })
		}

		cursor += size
		row++
	}

	return list
})

const SLOPES = [-0.05, 0.045, -0.05, 0.04, -0.045, 0.05]
const RADIUS = 18
const INNER_RADIUS = RADIUS - 4
const LABEL_PAD = 16
const LABEL_MAX = 240
const MEDIA_OUTSET = 1
const OUTSET_DIRECTIONS: Point[] = [
	{ x: -1, y: -1 },
	{ x: 1, y: -1 },
	{ x: 1, y: 1 },
	{ x: -1, y: 1 },
]

const grid = useTemplateRef<HTMLUListElement>("grid")
const shapes = shallowRef<Record<string, Shape>>({})
const ready = ref(false)

const round = (n: number, digits = 2) => Number(n.toFixed(digits))

function direction(from: Point, to: Point): Point {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const length = Math.hypot(dx, dy)
	return { x: dx / length, y: dy / length }
}

function roundedPath(points: Point[], radius: number): string {
	const count = points.length

	const corners = points.map((curr, i) => {
		const prev = points[(i + count - 1) % count]!
		const next = points[(i + 1) % count]!
		const toPrev = direction(curr, prev)
		const toNext = direction(curr, next)
		const angle = Math.acos(toPrev.x * toNext.x + toPrev.y * toNext.y)

		const limit =
			Math.min(
				Math.hypot(prev.x - curr.x, prev.y - curr.y),
				Math.hypot(next.x - curr.x, next.y - curr.y)
			) / 2
		const cut = Math.min(radius / Math.tan(angle / 2), limit)
		const r = cut * Math.tan(angle / 2)

		const start = { x: curr.x + toPrev.x * cut, y: curr.y + toPrev.y * cut }
		const end = { x: curr.x + toNext.x * cut, y: curr.y + toNext.y * cut }

		return `${i === 0 ? "M" : "L"}${round(start.x)} ${round(start.y)}A${round(r)} ${round(r)} 0 0 1 ${round(end.x)} ${round(end.y)}`
	})

	return `${corners.join("")}Z`
}

function measure() {
	const el = grid.value
	if (!el) return

	const origin = el.getBoundingClientRect()
	if (origin.width < 1) return

	const cells: Cell[] = Array.from(el.querySelectorAll<HTMLElement>("[data-path]")).map(
		(node) => {
			const rect = node.getBoundingClientRect()
			return {
				path: node.dataset.path!,
				x: rect.left - origin.left,
				y: rect.top - origin.top,
				w: rect.width,
				h: rect.height,
			}
		}
	)

	const rows: Cell[][] = []
	for (const cell of cells) {
		const row = rows.at(-1)
		if (row && Math.abs(row[0]!.y - cell.y) < 1) row.push(cell)
		else rows.push([cell])
	}

	const tops = rows.map((row) => Math.min(...row.map((c) => c.y)))
	const bottoms = rows.map((row) => Math.max(...row.map((c) => c.y + c.h)))
	const last = rows.length - 1
	const centerX = origin.width / 2
	const slope = (i: number) => (i <= 0 || i > last ? 0 : SLOPES[(i - 1) % SLOPES.length]!)

	const topEdge = (k: number, x: number) => {
		if (k === 0) return tops[0]!
		const half = (tops[k]! - bottoms[k - 1]!) / 2
		return (bottoms[k - 1]! + tops[k]!) / 2 + slope(k) * (x - centerX) + half
	}

	const bottomEdge = (k: number, x: number) => {
		if (k === last) return bottoms[last]!
		const half = (tops[k + 1]! - bottoms[k]!) / 2
		return (bottoms[k]! + tops[k + 1]!) / 2 + slope(k + 1) * (x - centerX) - half
	}

	const next: Record<string, Shape> = {}

	rows.forEach((row, k) => {
		for (const cell of row) {
			const topAt = (dx: number) => topEdge(k, cell.x + dx) - cell.y
			const bottomAt = (dx: number) => bottomEdge(k, cell.x + dx) - cell.y

			const points: Point[] = [
				{ x: 0, y: topAt(0) },
				{ x: cell.w, y: topAt(cell.w) },
				{ x: cell.w, y: bottomAt(cell.w) },
				{ x: 0, y: bottomAt(0) },
			]

			const bleedTop = Math.max(0, -Math.min(points[0]!.y, points[1]!.y)) + 2
			const bleedBottom = Math.max(0, Math.max(points[2]!.y, points[3]!.y) - cell.h) + 2
			const mediaHeight = cell.h + bleedTop + bleedBottom

			const mediaPoints = points.map((point, i) => ({
				x: point.x + OUTSET_DIRECTIONS[i]!.x * MEDIA_OUTSET,
				y: point.y + OUTSET_DIRECTIONS[i]!.y * MEDIA_OUTSET + bleedTop,
			}))

			const labelSpan = Math.min(cell.w, LABEL_MAX)
			const tagDrop = Math.max(0, topAt(cell.w - labelSpan), topAt(cell.w))
			const titleRise = Math.max(0, cell.h - Math.min(bottomAt(0), bottomAt(labelSpan)))

			next[cell.path] = {
				link: {
					clipPath: `path('${roundedPath(points, RADIUS)}')`,
					"--card-ratio": String(round(cell.w / mediaHeight, 4)),
					"--bleed-top": `${-round(bleedTop)}px`,
					"--bleed-bottom": `${-round(bleedBottom)}px`,
					"--tag-top": `${round(LABEL_PAD + tagDrop)}px`,
					"--title-bottom": `${round(LABEL_PAD + titleRise)}px`,
				},
				media: {
					clipPath: `path('${roundedPath(mediaPoints, INNER_RADIUS + MEDIA_OUTSET)}')`,
					"--card-media-clip-hover": `path('${roundedPath(mediaPoints, RADIUS + MEDIA_OUTSET)}')`,
				},
			}
		}
	})

	shapes.value = next
	ready.value = true
}

function onClick(event: MouseEvent) {
	if (!arm(event)) return
	onBadgeOpen()
}

let observer: ResizeObserver | undefined

watch(items, measure, { flush: "post" })

onMounted(() => {
	observer = new ResizeObserver(measure)
	if (grid.value) observer.observe(grid.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.work-card-image {
	scale: 0.94;
	transform-origin: 50% 50%;
	transition: scale var(--card-duration) var(--card-spring);
	will-change: scale;
}

.card-link:hover .work-card-image,
.card-link:focus-visible .work-card-image {
	scale: 1;
}

.card-link .card-media {
	transition-property: scale, clip-path;
}

.card-link:hover .card-media,
.card-link:focus-visible .card-media {
	clip-path: var(--card-media-clip-hover);
}

@media (prefers-reduced-motion: reduce) {
	.work-card-image {
		transition: none;
	}

	.card-link .card-media {
		transition-property: none;
	}
}
</style>
