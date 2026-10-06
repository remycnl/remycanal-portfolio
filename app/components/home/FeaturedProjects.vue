<script setup lang="ts">
interface Project {
	id: string
	year: string
	name: string
	image: string
	to: string
}

interface Corner {
	id: string
	classes: string
}

const projects: Project[] = [
	{
		id: "01",
		year: "2024",
		name: "Rémy Canal — Portfolio",
		to: "/work/remy-canal-portfolio",
		image: "https://www.remycanal.me/img/metaImg.png",
	},
	{
		id: "02",
		year: "2022",
		name: "Pascale Canal — Galery",
		to: "/work/pascale-canal-galery",
		image: "https://www.remycanal.me/img/mockup-pascale-canal-galery.webp",
	},
	{
		id: "03",
		year: "2021",
		name: "Vikl — Marketing Website",
		to: "/work/vikl",
		image: "https://www.remycanal.me/img/mockup-vikl.webp",
	},
	{
		id: "04",
		year: "2020",
		name: "Animaux d'à côté — Web App",
		to: "/work/animaux-dacote",
		image: "https://animauxdacote.fr/img/carrousel-home-1.png",
	},
]

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

const STACK_ITEM =
	"col-start-1 row-start-1 block leading-none whitespace-nowrap translate-y-[calc((var(--i)_-_var(--active))_*_100%)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"

const BADGE_LABELS = {
	view: "View project",
	press: "View project",
	loading: "Opening...",
}

const sectionRef = useTemplateRef<HTMLElement>("section")
const viewportRef = useTemplateRef<HTMLElement>("viewport")
const surfaceRef = useTemplateRef<HTMLElement>("surface")
const trackRef = useTemplateRef<HTMLElement>("track")

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
	onCardClick,
} = useFeaturedCarousel({
	section: sectionRef,
	viewport: viewportRef,
	surface: surfaceRef,
	track: trackRef,
})

const pad = (n: number) => String(n).padStart(2, "0")
</script>

<template>
	<div class="section-p-y relative bg-white">
		<section ref="section" class="relative w-full">
			<div ref="viewport" class="section-p-xy sticky top-0 h-svh w-full">
				<div
					class="absolute inset-0 z-0 @container [--card-half-h:calc(var(--card-w)_*_0.3125_+_0.5rem)] [--card-offset-y:3rem] [--card-w:min(calc(100cqw_-_2_*_var(--spacing-edge)_-_1rem_-_2_*_var(--frame-gap)),83svh)] [--corner-pull:calc(var(--frame-gap)_/_2)] [--frame-gap:1rem] [--frame-h:calc(var(--card-w)_*_0.625_+_1rem_+_2_*_var(--frame-gap))] [--frame-w:calc(var(--card-w)_+_1rem_+_2_*_var(--frame-gap))] lg:[--card-offset-y:0rem] lg:[--card-w:32vw] lg:[--frame-gap:2.75rem]"
				>
					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
						:style="{
							top: 'calc(var(--spacing-section) * -1)',
							bottom: 'calc(var(--spacing-section) * -2)',
						}"
						:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
					></div>

					<div
						aria-hidden="true"
						class="pointer-events-none absolute inset-0 z-0 overflow-hidden"
					>
						<div
							class="absolute top-[calc(50%_+_var(--card-offset-y))] right-0 left-0 h-px -translate-y-1/2 bg-[repeating-linear-gradient(to_right,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
							:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
						></div>
					</div>

					<div
						aria-hidden="true"
						class="group pointer-events-none absolute top-[calc(50%_+_var(--card-offset-y))] left-1/2 z-6 h-(--frame-h) w-(--frame-w) -translate-x-1/2 -translate-y-1/2"
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
						class="lg:left-edge absolute bottom-[calc(50%_-_var(--card-offset-y)_+_var(--card-half-h)_+_3.7rem)] left-0 z-10 w-(--card-w) lg:top-1/2 lg:bottom-auto lg:w-auto lg:-translate-y-1/2"
					>
						<div
							class="text-black-light inline-flex items-center rounded-full px-4 py-2 transition-colors duration-300"
							:class="isActiveHovered ? 'lg:bg-gray-dark lg:text-white' : 'lg:bg-gray-light'"
						>
							<div
								class="font-vg5000 inline-grid h-[1em] overflow-hidden text-sm leading-none"
								:style="{ '--active': activeIndex }"
							>
								<span
									v-for="(p, i) in projects"
									:key="p.id"
									:style="{ '--i': i }"
									:class="STACK_ITEM"
								>
									{{ p.year }}
								</span>
							</div>
						</div>
					</div>

					<div
						aria-hidden="true"
						class="lg:right-edge absolute bottom-[calc(50%_-_var(--card-offset-y)_+_var(--card-half-h)_+_2.5rem)] left-0 z-10 w-(--card-w) lg:top-1/2 lg:bottom-auto lg:left-auto lg:w-auto lg:-translate-y-1/2"
					>
						<div
							class="text-black-light inline-flex items-center justify-start rounded-full px-4 py-2 transition-colors duration-300 lg:justify-end"
							:class="isActiveHovered ? 'lg:bg-gray-dark lg:text-white' : 'lg:bg-gray-light'"
						>
							<div
								class="font-lineal inline-grid h-[1em] overflow-hidden text-left text-sm leading-none [font-weight:var(--lineal-weight-medium)] lg:text-right"
								:style="{ '--active': activeIndex }"
							>
								<span
									v-for="(p, i) in projects"
									:key="p.id"
									:style="{ '--i': i }"
									:class="STACK_ITEM"
								>
									{{ p.name }}
								</span>
							</div>
						</div>
					</div>

					<div
						aria-hidden="true"
						class="bottom-edge bg-gray-light font-vg5000 text-gray-dark absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
					>
						<span class="text-black-light font-lineal-bold">
							{{ pad(activeIndex + 1) }}
						</span>
						<span class="text-gray-dark/50 mx-1">/</span>
						<span>{{ pad(projects.length) }}</span>
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
								:key="p.id"
								:ref="(el) => setCardRef(el, i)"
								:to="p.to"
								:aria-label="`${p.name}, ${p.year}`"
								draggable="false"
								class="block shrink-0 cursor-pointer rounded-lg bg-black p-2 [-webkit-tap-highlight-color:transparent] will-change-transform"
								@pointerenter="onCardEnter(i, $event)"
								@pointermove="onCardMove"
								@pointerleave="onCardLeave(i)"
								@pointerdown="onCardPress(i)"
								@pointerup="onCardRelease(i)"
								@pointercancel="onCardRelease(i)"
								@click="onCardClick"
							>
								<div
									class="bg-black-light isolate aspect-16/10 w-(--card-w) overflow-hidden rounded-xs"
								>
									<img
										:src="p.image"
										:alt="p.name"
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
						class="font-lineal-bold text-shadow-lime text-3xl text-black text-shadow-sm lg:text-4xl"
					>
						Featured projects
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

				<UiBadgeCursor
					:active="isBadgeActive"
					:state="badgeState"
					:labels="BADGE_LABELS"
				/>
			</div>
		</section>
	</div>
</template>