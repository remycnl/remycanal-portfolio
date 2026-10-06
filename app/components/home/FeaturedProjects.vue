<script setup lang="ts">
import type { ComponentPublicInstance } from "vue"

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
	x: number
	y: number
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

const CORNERS: Corner[] = [
	{ id: "tl", classes: "-top-10 -left-10 border-t-2 border-l-2", x: 1, y: 1 },
	{ id: "tr", classes: "-top-10 -right-10 border-t-2 border-r-2", x: -1, y: 1 },
	{ id: "bl", classes: "-bottom-10 -left-10 border-b-2 border-l-2", x: 1, y: -1 },
	{ id: "br", classes: "-right-10 -bottom-10 border-r-2 border-b-2", x: -1, y: -1 },
]

const AXES = {
	horizontal: {
		prop: "x",
		percentProp: "xPercent",
		padStart: "paddingLeft",
		padEnd: "paddingRight",
		gap: "columnGap",
		size: "offsetWidth",
		extent: "clientWidth",
	},
	vertical: {
		prop: "y",
		percentProp: "yPercent",
		padStart: "paddingTop",
		padEnd: "paddingBottom",
		gap: "rowGap",
		size: "offsetHeight",
		extent: "clientHeight",
	},
} as const

const BADGE_LABELS = {
	view: "View project",
	press: "View project",
	loading: "Opening...",
}

const MOBILE_TABLET_MAX_WIDTH = 1023
const MOBILE_TABLET_MEDIA_QUERY = `(max-width: ${MOBILE_TABLET_MAX_WIDTH}px)`

const MIN_SCALE = 0.84
const PRESS_SCALE = 0.96
const SCALE_FALLOFF = 0.68
const IMAGE_SCALE = 1.15
const PARALLAX_PERCENT = 5
const CORNER_TRAVEL = 16

const TRACK_RATE = 16
const SCALE_RATE = 10
const PRESS_RATE = 24
const PARALLAX_RATE = 9

type Setter = (value: number) => void

const sectionRef = useTemplateRef<HTMLElement>("sectionRef")
const viewportRef = useTemplateRef<HTMLElement>("viewportRef")
const trackRef = useTemplateRef<HTMLElement>("trackRef")
const yearRefs = useTemplateRef<HTMLElement[]>("yearRefs")
const nameRefs = useTemplateRef<HTMLElement[]>("nameRefs")
const imageRefs = useTemplateRef<HTMLElement[]>("imageRefs")
const cornerRefs = useTemplateRef<HTMLElement[]>("cornerRefs")

const activeIndex = ref(0)
const hoveredIndex = ref<number | null>(null)
const pressedIndex = ref<number | null>(null)
const isOpeningRef = ref(false)

const cardEls: HTMLElement[] = []

const isActiveHovered = computed(
	() => hoveredIndex.value !== null && hoveredIndex.value === activeIndex.value
)

const isBadgeActive = computed(() => hoveredIndex.value !== null || isOpeningRef.value)

const badgeState = computed(() => {
	if (isOpeningRef.value) return "loading"
	const hovered = hoveredIndex.value
	return hovered !== null && pressedIndex.value === hovered ? "press" : "view"
})

function setCardRef(el: Element | ComponentPublicInstance | null, index: number) {
	if (!el) return
	const domEl = "$el" in el ? el.$el : el
	if (domEl instanceof HTMLElement) cardEls[index] = domEl
}

function pad(n: number) {
	return String(n).padStart(2, "0")
}

const { useGsapContext, gsap } = useGsap()
const lenis = useLenis()

const isMobileLayout = ref(false)

if (import.meta.client) {
	const mql = window.matchMedia(MOBILE_TABLET_MEDIA_QUERY)
	isMobileLayout.value = mql.matches
	mql.addEventListener("change", (e) => {
		isMobileLayout.value = e.matches
	})
}

function handleCardEnter(i: number) {
	isOpeningRef.value = false
	hoveredIndex.value = i
}

function handleCardClick(event: MouseEvent) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return
	}
	isOpeningRef.value = true
}

function handleCardLeave(i: number) {
	hoveredIndex.value = null
	onCardRelease(i)
}

function onCardPress(i: number) {
	pressedIndex.value = i
}

function onCardRelease(i: number) {
	if (pressedIndex.value !== i) return
	pressedIndex.value = null
}

function getScrollY(): number {
	return lenis?.scroll ?? window.scrollY
}

function driveScroll(
	target: number,
	options: {
		immediate?: boolean
		duration?: number
		easing?: (t: number) => number
	} = {}
) {
	if (lenis) {
		lenis.scrollTo(target, options)
		return
	}
	window.scrollTo({
		top: target,
		behavior: options.immediate ? "auto" : "smooth",
	})
}

function approach(current: number, target: number, factor: number) {
	const next = current + (target - current) * factor
	return Math.abs(target - next) < 0.0005 ? target : next
}

function animateCorners(active: boolean) {
	const targets = cornerRefs.value
	if (!targets) return

	gsap.to(targets, {
		x: (i: number) => (active ? (CORNERS[i]?.x ?? 0) * CORNER_TRAVEL : 0),
		y: (i: number) => (active ? (CORNERS[i]?.y ?? 0) * CORNER_TRAVEL : 0),
		duration: active ? 0.45 : 0.7,
		ease: active ? "back.out(2.3)" : "expo.out",
		stagger: active ? 0.03 : 0.015,
		overwrite: "auto",
	})
}

watch(isActiveHovered, (active) => animateCorners(active))

function swapTextStack(
	refs: HTMLElement[],
	oldIndex: number,
	newIndex: number,
	forward: boolean
) {
	if (oldIndex === newIndex) return

	gsap.killTweensOf(refs)

	refs.forEach((el, i) => {
		if (!el || i === newIndex || i === oldIndex) return
		gsap.set(el, { yPercent: forward ? 100 : -100 })
	})

	const oldEl = refs[oldIndex]
	const newEl = refs[newIndex]

	if (oldEl) {
		gsap.to(oldEl, {
			yPercent: forward ? -100 : 100,
			duration: 0.45,
			ease: "power3.out",
			overwrite: "auto",
		})
	}
	if (newEl) {
		gsap.fromTo(
			newEl,
			{ yPercent: forward ? 100 : -100 },
			{
				yPercent: 0,
				duration: 0.55,
				ease: "expo.out",
				overwrite: "auto",
			}
		)
	}
}

watch(activeIndex, (newVal, oldVal) => {
	const years = yearRefs.value
	const names = nameRefs.value
	if (!years || !names) return
	const forward = newVal > oldVal
	swapTextStack(years, oldVal, newVal, forward)
	swapTextStack(names, oldVal, newVal, forward)
})

useGsapContext(({ gsap, ScrollTrigger, Draggable }) => {
	const sectionEl = sectionRef.value
	const viewportEl = viewportRef.value
	const trackEl = trackRef.value
	if (!sectionEl || !viewportEl || !trackEl) return
	const trackElement = trackEl

	const isMobile = isMobileLayout.value
	const axis = isMobile ? AXES.horizontal : AXES.vertical

	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches
	const cards = cardEls
	const images = imageRefs.value ?? []
	const years = yearRefs.value ?? []
	const names = nameRefs.value ?? []
	const firstYear = years[0]
	const firstName = names[0]

	gsap.set(years, { yPercent: 100 })
	if (firstYear) gsap.set(firstYear, { yPercent: 0 })
	gsap.set(names, { yPercent: 100 })
	if (firstName) gsap.set(firstName, { yPercent: 0 })
	gsap.set(images, { scale: prefersReducedMotion ? 1 : IMAGE_SCALE })

	const easeSine = gsap.parseEase("sine.inOut")
	const clamp01 = gsap.utils.clamp(0, 1)
	const clampUnit = gsap.utils.clamp(-1, 1)

	const setTrack = gsap.quickSetter(trackElement, axis.prop, "px") as Setter
	const setScales = cards.map((card) => gsap.quickSetter(card, "scale") as Setter)
	const setShifts = images.map((img) => gsap.quickSetter(img, axis.percentProp) as Setter)
	const states = cards.map(() => ({ scale: MIN_SCALE, shift: 0 }))

	let centers: number[] = [0]
	let distance = 0
	let extent = 0
	let snapToClosest = gsap.utils.snap([0])
	let trackPos = 0
	let trackTarget = 0

	function measure() {
		const first = cards[0]
		if (!first) return

		extent = viewportEl![axis.extent]
		const padding = Math.max((extent - first[axis.size]) / 2, 0)
		gsap.set(trackElement, { [axis.padStart]: padding, [axis.padEnd]: padding })

		const gap = parseFloat(window.getComputedStyle(trackElement)[axis.gap]) || 0
		let cursor = padding

		centers = cards.map((card) => {
			const size = card[axis.size]
			const center = cursor + size / 2 - extent / 2
			cursor += size + gap
			return center
		})

		distance = Math.max(centers[centers.length - 1] ?? 0, 0)
		snapToClosest = gsap.utils.snap(
			distance > 0 ? centers.map((c) => clamp01(c / distance)) : [0]
		)
		gsap.set(sectionEl, { height: viewportEl!.clientHeight + distance })
	}

	function render(delta: number, instant: boolean) {
		const smooth = (rate: number) =>
			instant || prefersReducedMotion ? 1 : expSmoothingFactor(rate, delta)

		trackPos = approach(trackPos, trackTarget, smooth(TRACK_RATE))
		setTrack(-trackPos)

		let closest = 0
		let closestDist = Infinity

		for (let i = 0; i < cards.length; i++) {
			const offset = (centers[i] ?? 0) - trackPos
			const dist = Math.abs(offset)
			if (dist < closestDist) {
				closestDist = dist
				closest = i
			}

			const state = states[i]
			if (!state) continue

			const eased = easeSine(1 - clamp01(dist / (extent * SCALE_FALLOFF)))
			const base = MIN_SCALE + (1 - MIN_SCALE) * eased
			const pressed = pressedIndex.value === i
			const nextScale = approach(
				state.scale,
				pressed ? base * PRESS_SCALE : base,
				smooth(pressed ? PRESS_RATE : SCALE_RATE)
			)
			if (nextScale !== state.scale) {
				state.scale = nextScale
				setScales[i]?.(nextScale)
			}

			const targetShift = prefersReducedMotion
				? 0
				: -clampUnit(offset / extent) * PARALLAX_PERCENT
			const nextShift = approach(state.shift, targetShift, smooth(PARALLAX_RATE))
			if (nextShift !== state.shift) {
				state.shift = nextShift
				setShifts[i]?.(nextShift)
			}
		}

		if (closest !== activeIndex.value) activeIndex.value = closest
	}

	function tick(_time: number, deltaTime: number) {
		render(Math.min(deltaTime, 100) / 1000, false)
	}

	measure()

	const trigger = ScrollTrigger.create({
		trigger: sectionEl,
		start: "top top",
		end: () => `+=${distance}`,
		onUpdate: (self) => {
			trackTarget = self.progress * distance
		},
		onRefresh: (self) => {
			trackTarget = self.progress * distance
			trackPos = trackTarget
			render(0, true)
		},
		snap: {
			snapTo: (progress: number) => snapToClosest(progress),
			inertia: false,
			duration: { min: 0.25, max: 0.5 },
			ease: "power3.out",
			delay: 0,
		},
	})

	trackTarget = trigger.progress * distance
	trackPos = trackTarget
	render(0, true)
	gsap.ticker.add(tick)

	let cardDraggable: ReturnType<typeof Draggable.create>[number] | undefined

	if (isMobile) {
		const proxy = document.createElement("div")
		let lastProxyX = 0

		function relayToScroll(this: Draggable) {
			const stepX = this.x - lastProxyX
			lastProxyX = this.x
			driveScroll(getScrollY() - stepX, {
				immediate: true,
			})
		}

		const [instance] = Draggable.create(proxy, {
			type: "x",
			trigger: trackElement,
			allowNativeTouchScrolling: true,
			inertia: true,
			throwResistance: 3000,
			onPress() {
				lastProxyX = this.x
			},
			onDragStart() {
				lastProxyX = this.x
				if (pressedIndex.value !== null) {
					onCardRelease(pressedIndex.value)
				}
				hoveredIndex.value = null
			},
			onDrag: relayToScroll,
			onThrowUpdate: relayToScroll,
		})

		cardDraggable = instance
	}

	ScrollTrigger.addEventListener("refreshInit", measure)

	return () => {
		gsap.set(sectionEl, { clearProps: "height" })
		gsap.ticker.remove(tick)
		ScrollTrigger.removeEventListener("refreshInit", measure)
		trigger.kill()
		cardDraggable?.kill()
	}
}, sectionRef)
</script>

<template>
	<div class="section-p-y relative bg-white">
		<section ref="sectionRef" class="relative w-full">
			<div ref="viewportRef" class="section-p-xy sticky top-0 h-svh w-full">
				<div
					class="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
					:style="{
						top: 'calc(var(--spacing-section) * -1)',
						bottom: 'calc(var(--spacing-section) * -2)',
					}"
					:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
				></div>
				<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
					<div
						class="absolute right-0 left-0 h-px -translate-y-1/2 bg-[repeating-linear-gradient(to_right,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500 max-lg:top-[calc(50%+3rem)] lg:top-1/2"
						:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
					></div>
				</div>

				<div
					class="pointer-events-none absolute left-1/2 z-6 -translate-x-1/2 -translate-y-1/2 max-lg:top-[calc(50%+3rem)] lg:top-1/2"
				>
					<div
						class="relative box-content w-[72vw] rounded-3xl p-2 md:w-[38vw] lg:w-[32vw]"
					>
						<div class="aspect-16/10 w-full rounded-2xl">
							<span
								v-for="corner in CORNERS"
								:key="corner.id"
								ref="cornerRefs"
								class="border-lime absolute h-8 w-8 will-change-transform"
								:class="corner.classes"
							></span>
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

				<div
					class="lg:left-edge absolute bottom-[calc(50%+21.875vw+1.2rem)] left-0 z-10 w-[70vw] md:bottom-[calc(50%+21.875vw-3.5rem)] lg:top-1/2 lg:bottom-auto lg:w-auto lg:-translate-y-1/2"
				>
					<div
						class="inline-flex items-center rounded-full px-4 py-2 transition-colors duration-300"
						:class="isActiveHovered ? 'lg:bg-gray-dark' : 'lg:bg-gray-light'"
					>
						<div class="inline-grid h-[1em] overflow-hidden leading-none">
							<span
								v-for="p in projects"
								:key="p.id"
								ref="yearRefs"
								class="font-vg5000 text-black-light col-start-1 row-start-1 block text-sm leading-none whitespace-nowrap transition-colors duration-300"
								:class="isActiveHovered ? 'lg:text-white' : ''"
							>
								{{ p.year }}
							</span>
						</div>
					</div>
				</div>

				<div
					class="lg:right-edge absolute bottom-[calc(50%+21.875vw)] left-0 z-10 w-[70vw] md:bottom-[calc(50%+21.875vw-4.7rem)] lg:top-1/2 lg:bottom-auto lg:left-auto lg:w-auto lg:-translate-y-1/2"
				>
					<div
						class="inline-flex items-center justify-start rounded-full px-4 py-2 transition-colors duration-300 lg:justify-end"
						:class="isActiveHovered ? 'lg:bg-gray-dark' : 'lg:bg-gray-light'"
					>
						<div
							class="inline-grid h-[1em] overflow-hidden text-left leading-none lg:text-right"
						>
							<span
								v-for="p in projects"
								:key="p.id"
								ref="nameRefs"
								class="font-lineal text-black-light col-start-1 row-start-1 block text-left text-sm leading-none [font-weight:var(--lineal-weight-medium)] whitespace-nowrap transition-colors duration-300 lg:text-right"
								:class="isActiveHovered ? 'lg:text-white' : ''"
							>
								{{ p.name }}
							</span>
						</div>
					</div>
				</div>

				<div
					class="bottom-edge bg-gray-light font-vg5000 text-gray-dark absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
				>
					<span class="text-black-light font-lineal-bold">
						{{ pad(activeIndex + 1) }}
					</span>
					<span class="text-gray-dark/50 mx-1">/</span>
					<span>{{ pad(projects.length) }}</span>
				</div>

				<div
					class="absolute inset-0 z-5 flex items-center justify-start overflow-hidden lg:items-stretch lg:justify-center"
				>
					<div
						ref="trackRef"
						class="flex flex-row items-center gap-10 will-change-transform max-lg:translate-y-12 lg:flex-col lg:gap-14"
					>
						<NuxtLink
							v-for="(p, i) in projects"
							:key="p.id"
							:ref="(el) => setCardRef(el as Element | ComponentPublicInstance | null, i)"
							:to="p.to"
							draggable="false"
							class="block shrink-0 cursor-pointer touch-pan-y rounded-lg bg-black p-2 will-change-transform"
							@pointerenter="handleCardEnter(i)"
							@pointerleave="handleCardLeave(i)"
							@pointerdown="onCardPress(i)"
							@pointerup="onCardRelease(i)"
							@pointercancel="onCardRelease(i)"
							@click="handleCardClick"
						>
							<div
								class="bg-black-light aspect-16/10 w-[72vw] overflow-hidden rounded-xs md:w-[38vw] lg:w-[32vw]"
							>
								<img
									ref="imageRefs"
									:src="p.image"
									:alt="p.name"
									draggable="false"
									class="h-full w-full object-cover will-change-transform"
									loading="lazy"
								/>
							</div>
						</NuxtLink>
					</div>
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