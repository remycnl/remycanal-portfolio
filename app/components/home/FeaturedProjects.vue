<script setup lang="ts">
import type { WorkCollectionItem } from "@nuxt/content"

type FeaturedProject = Pick<WorkCollectionItem, "path" | "title" | "date" | "image">

interface Corner {
	id: string
	classes: string
}

interface Stack {
	id: string
	side: string
	classes: string
	label: (project: FeaturedProject) => string
}

const { data: projects } = await useAsyncData(
	"featured-projects",
	() =>
		queryCollection("work")
			.where("featured", "=", true)
			.select("path", "title", "date", "image")
			.order("date", "DESC")
			.all(),
	{ default: (): FeaturedProject[] => [] }
)

const CORNER_BASE =
	"border-lime absolute h-8 w-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-active:duration-500 group-data-active:ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"

const CORNERS: Corner[] = [
	{
		id: "tl",
		classes:
			"top-0 left-0 border-t-2 border-l-2 group-data-active:translate-x-[var(--corner-pull)] group-data-active:translate-y-[var(--corner-pull)]",
	},
	{
		id: "tr",
		classes:
			"top-0 right-0 border-t-2 border-r-2 group-data-active:-translate-x-[var(--corner-pull)] group-data-active:translate-y-[var(--corner-pull)]",
	},
	{
		id: "bl",
		classes:
			"bottom-0 left-0 border-b-2 border-l-2 group-data-active:translate-x-[var(--corner-pull)] group-data-active:-translate-y-[var(--corner-pull)]",
	},
	{
		id: "br",
		classes:
			"right-0 bottom-0 border-r-2 border-b-2 group-data-active:-translate-x-[var(--corner-pull)] group-data-active:-translate-y-[var(--corner-pull)]",
	},
]

const STACKS: Stack[] = [
	{
		id: "year",
		side: "lg:left-edge",
		classes: "font-vg5000",
		label: (project) => workYear(project.date),
	},
	{
		id: "title",
		side: "lg:right-edge",
		classes:
			"font-lineal text-left [font-weight:var(--lineal-weight-medium)] lg:text-right",
		label: (project) => project.title,
	},
]

const STACK_WINDOW =
	"box-fit text-black-light inline-grid overflow-hidden rounded-full text-sm transition-colors duration-300 [--stack-gap:calc(2_*_var(--fit-y,0.5em)_+_1em)]"

const STACK_ITEM =
	"text-fit col-start-1 row-start-1 block whitespace-nowrap will-change-[translate] translate-y-[calc((var(--idx)_-_var(--stack-pos,0))_*_(100%_+_var(--stack-gap)))]"

const BADGE_LABELS = {
	view: "View project",
	press: "Open project",
	loading: "Opening...",
}

const sectionRef = useTemplateRef<HTMLElement>("section")
const viewportRef = useTemplateRef<HTMLElement>("viewport")
const surfaceRef = useTemplateRef<HTMLElement>("surface")
const trackRef = useTemplateRef<HTMLElement>("track")
const stageRef = useTemplateRef<HTMLElement>("stage")

const {
	activeIndex,
	isActiveHovered,
	isBadgeActive,
	badgeState,
	setCardRef,
	onCardEnter,
	onCardMove,
	onCardLeave,
	onCardPress,
	onCardRelease,
} = useFeaturedCarousel({
	section: sectionRef,
	viewport: viewportRef,
	surface: surfaceRef,
	track: trackRef,
})

useStackRoll({ scope: stageRef, index: activeIndex })

const { arm, overlay } = useOverlay()

const isBadgeVisible = computed(() => toValue(isBadgeActive) && !overlay.locked)
const badge = useBadgePresentation({
	active: isBadgeVisible,
	state: badgeState,
	labels: BADGE_LABELS,
})

function onProjectClick(event: MouseEvent) {
	arm(event)
}

const pad = (n: number) => String(n).padStart(2, "0")
</script>

<template>
	<div v-if="projects.length" class="section-p-y relative bg-white">
		<section ref="section" class="relative w-full">
			<div ref="viewport" class="section-p-xy sticky top-0 h-svh w-full">
				<div
					ref="stage"
					class="@container absolute inset-0 z-0 [--card-half-h:calc(var(--card-w)*0.3125+0.5rem)] [--card-offset-y:3rem] [--card-w:min(calc(100cqw-2*var(--spacing-edge)-1rem-2*var(--frame-gap)),83svh)] [--corner-pull:calc(var(--frame-gap)/2)] [--frame-gap:1rem] [--frame-h:calc(var(--card-w)*0.625+1rem+2*var(--frame-gap))] [--frame-w:calc(var(--card-w)+1rem+2*var(--frame-gap))] lg:[--card-offset-y:0rem] lg:[--card-w:32vw] lg:[--frame-gap:2.75rem]"
				>
					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
						:style="{
							top: 'calc(var(--spacing-section) * -1)',
							bottom: 'calc(var(--spacing-section) * -8)',
						}"
						:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
					></div>

					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-0 z-0 overflow-hidden"
					>
						<div
							class="absolute top-[calc(50%+var(--card-offset-y))] right-0 left-0 h-px -translate-y-1/2 bg-[repeating-linear-gradient(to_right,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
							:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
						></div>
					</div>

					<div
						aria-hidden="true"
						class="group pointer-events-none absolute top-[calc(50%+var(--card-offset-y))] left-1/2 z-6 h-(--frame-h) w-(--frame-w) -translate-x-1/2 -translate-y-1/2"
						:data-active="isActiveHovered || undefined"
					>
						<span
							v-for="corner in CORNERS"
							:key="corner.id"
							:class="[CORNER_BASE, corner.classes]"
						></span>
					</div>

					<div
						aria-hidden="true"
						class="absolute bottom-[calc(50%-var(--card-offset-y)+var(--card-half-h)+2.5rem)] left-0 z-10 flex w-(--card-w) flex-col items-start gap-2 lg:contents"
					>
						<div
							v-for="stack in STACKS"
							:key="stack.id"
							:class="[
								'z-10 flex lg:absolute lg:top-1/2 lg:-translate-y-1/2',
								stack.side,
							]"
						>
							<div
								data-stack
								:class="[
									STACK_WINDOW,
									stack.classes,
									isActiveHovered ? 'lg:bg-gray-dark lg:text-white' : 'lg:bg-gray-light',
								]"
							>
								<span
									v-for="(p, i) in projects"
									:key="p.path"
									:style="{ '--idx': i }"
									:class="STACK_ITEM"
								>
									{{ stack.label(p) }}
								</span>
							</div>
						</div>
					</div>

					<div
						aria-hidden="true"
						class="bottom-edge bg-gray-light font-vg5000 text-gray-dark box-fit absolute left-1/2 z-10 inline-flex -translate-x-1/2 items-center rounded-full text-xs whitespace-nowrap"
					>
						<span
							data-stack
							class="text-black-light font-lineal-bold inline-grid overflow-hidden [--stack-gap:1.2em]"
						>
							<span
								v-for="(p, i) in projects"
								:key="p.path"
								:style="{ '--idx': i }"
								:class="STACK_ITEM"
							>
								{{ pad(i + 1) }}
							</span>
						</span>
						<span class="text-fit text-gray-dark/50 mx-1 block">/</span>
						<span class="text-fit block">{{ pad(projects.length) }}</span>
					</div>

					<div
						ref="surface"
						class="absolute inset-0 z-5 flex touch-pan-y touch-pinch-zoom items-center justify-start overflow-hidden select-none lg:touch-auto lg:items-stretch lg:justify-center"
					>
						<div
							ref="track"
							class="flex translate-y-(--card-offset-y) flex-row items-center gap-10 will-change-transform lg:flex-col lg:gap-14"
						>
							<NuxtLink
								v-for="(p, i) in projects"
								:key="p.path"
								:ref="(el) => setCardRef(el, i)"
								:to="p.path"
								:aria-label="`${p.title}, ${workYear(p.date)}`"
								draggable="false"
								class="block shrink-0 cursor-pointer rounded-lg bg-black p-2 will-change-transform [-webkit-tap-highlight-color:transparent]"
								@pointerenter="onCardEnter(i, $event)"
								@pointermove="onCardMove"
								@pointerleave="onCardLeave(i)"
								@pointerdown="onCardPress(i)"
								@pointerup="onCardRelease(i)"
								@pointercancel="onCardRelease(i)"
								@click="onProjectClick"
							>
								<div
									class="bg-black-light isolate aspect-16/10 w-(--card-w) overflow-hidden rounded-xs"
								>
									<img
										v-if="p.image"
										:src="p.image"
										:alt="p.title"
										draggable="false"
										decoding="async"
										:loading="i === 0 ? 'eager' : 'lazy'"
										class="h-full w-full object-cover will-change-transform"
									/>
								</div>
							</NuxtLink>
						</div>
					</div>
				</div>

				<div class="inset-x-edge top-section absolute z-20 pt-15 lg:pt-6">
					<h2
						v-text-reveal
						class="text-fit font-lineal-bold text-shadow-lime text-3xl text-black text-shadow-sm lg:text-4xl"
					>
						Some projects...
					</h2>
				</div>

				<div
					class="lg:right-edge lg:bottom-edge absolute right-1/2 bottom-20 z-20 translate-x-1/2 md:bottom-50 lg:translate-x-0"
				>
					<UiAnimatedButton
						label="All projects"
						to="/work"
						pill="gray-light"
						bubble="lime"
						size="normal"
					/>
				</div>

				<UiBadgeCursor :badge="badge" />
			</div>
		</section>
	</div>
</template>
