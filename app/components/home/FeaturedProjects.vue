<script setup lang="ts">
interface Project {
	id: string
	year: string
	name: string
	image: string
}

const projects: Project[] = [
	{
		id: "01",
		year: "2024",
		name: "Rémy Canal — Portfolio",
		image: "https://www.remycanal.me/img/metaImg.png",
	},
	{
		id: "02",
		year: "2022",
		name: "Pascale Canal — Galery",
		image: "https://www.remycanal.me/img/mockup-pascale-canal-galery.webp",
	},
	{
		id: "03",
		year: "2021",
		name: "Vikl — Marketing Website",
		image: "https://www.remycanal.me/img/mockup-vikl.webp",
	},
]

const sectionRef = useTemplateRef<HTMLElement>("sectionRef")
const viewportRef = useTemplateRef<HTMLElement>("viewportRef")
const trackRef = useTemplateRef<HTMLElement>("trackRef")
const cardsRef = ref<HTMLElement[]>([])
const yearRefs = ref<HTMLElement[]>([])
const nameRefs = ref<HTMLElement[]>([])

const cornerTL = useTemplateRef<HTMLElement>("cornerTL")
const cornerTR = useTemplateRef<HTMLElement>("cornerTR")
const cornerBL = useTemplateRef<HTMLElement>("cornerBL")
const cornerBR = useTemplateRef<HTMLElement>("cornerBR")

const activeIndex = ref(0)
const hoveredIndex = ref<number | null>(null)
const pressedIndex = ref<number | null>(null)
const scrollDirection = ref(1)
const cardBaseScale = ref<number[]>(projects.map(() => 0.82))

const isActiveHovered = computed(
	() => hoveredIndex.value !== null && hoveredIndex.value === activeIndex.value
)

function pad(n: number) {
	return String(n).padStart(2, "0")
}

const { useGsapContext, gsap } = useGsap()
const lenis = useLenis()

const MOBILE_TABLET_MAX_WIDTH = 1023
const MOBILE_TABLET_MEDIA_QUERY = `(max-width: ${MOBILE_TABLET_MAX_WIDTH}px)`

const isMobileLayout = ref(false)

if (import.meta.client) {
	const mql = window.matchMedia(MOBILE_TABLET_MEDIA_QUERY)
	isMobileLayout.value = mql.matches
	mql.addEventListener("change", (e) => {
		isMobileLayout.value = e.matches
	})
}

function handleCardLeave(i: number) {
	hoveredIndex.value = null
	onCardRelease(i)
}

function applyCardScale(i: number, animate = false) {
	const card = cardsRef.value[i]
	if (!card) return

	const base = cardBaseScale.value[i] ?? 0.82
	const pressed = pressedIndex.value === i
	const target = pressed ? base * 0.94 : base

	if (animate) {
		gsap.to(card, {
			scale: target,
			duration: pressed ? 0.25 : 0.5,
			ease: pressed ? "power3.out" : "back.out(1.7)",
			overwrite: "auto",
		})
	} else {
		gsap.set(card, { scale: target })
	}
}

function onCardPress(i: number) {
	pressedIndex.value = i
	applyCardScale(i, true)
}

function onCardRelease(i: number) {
	if (pressedIndex.value !== i) return
	pressedIndex.value = null
	applyCardScale(i, true)
}

function getScrollY(): number {
	return lenis?.scroll ?? window.scrollY
}

function driveScroll(
	target: number,
	options: { immediate?: boolean; duration?: number; easing?: (t: number) => number } = {}
) {
	if (lenis) {
		lenis.scrollTo(target, options)
		return
	}
	// Fallback sans Lenis : pas d'inertie propre possible, scroll direct.
	window.scrollTo({ top: target, behavior: options.immediate ? "auto" : "smooth" })
}

const corners = [
	{ el: cornerTL, edges: { top: true, left: true } },
	{ el: cornerTR, edges: { top: true, right: true } },
	{ el: cornerBL, edges: { bottom: true, left: true } },
	{ el: cornerBR, edges: { bottom: true, right: true } },
] as const

function animateCorners(active: boolean) {
	const offset = active ? "-1.5rem" : "-2.5rem"

	corners.forEach(({ el, edges }) => {
		const target = el.value
		if (!target) return

		const props: Partial<Record<"top" | "bottom" | "left" | "right", string>> = {}

		if ("top" in edges) props.top = offset
		if ("bottom" in edges) props.bottom = offset
		if ("left" in edges) props.left = offset
		if ("right" in edges) props.right = offset
		gsap.killTweensOf(target)
		gsap.to(target, {
			...props,
			duration: active ? 0.32 : 0.62,
			ease: active ? "back.out(2.3)" : "power3.out",
			overwrite: "auto",
		})
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
			duration: 0.32,
			ease: "power3.inOut",
			overwrite: "auto",
		})
	}
	if (newEl) {
		gsap.fromTo(
			newEl,
			{ yPercent: forward ? 100 : -100 },
			{
				yPercent: 0,
				duration: 0.32,
				ease: "power3.inOut",
				overwrite: "auto",
			}
		)
	}
}

watch(activeIndex, (newVal, oldVal) => {
	const forward = scrollDirection.value === 1
	swapTextStack(yearRefs.value, oldVal, newVal, forward)
	swapTextStack(nameRefs.value, oldVal, newVal, forward)
})

useGsapContext(({ gsap, ScrollTrigger, Draggable }) => {
	const sectionEl = sectionRef.value
	const viewportEl = viewportRef.value
	const trackEl = trackRef.value
	if (!sectionEl || !viewportEl || !trackEl) return
	const trackElement = trackEl

	const isMobileMediaQuery = isMobileLayout.value
	const axisProp = isMobileMediaQuery ? "x" : "y"

	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches
	const cards = cardsRef.value

	const firstYear = yearRefs.value[0]
	const firstName = nameRefs.value[0]

	gsap.set(yearRefs.value, { yPercent: 100 })
	if (firstYear) gsap.set(firstYear, { yPercent: 0 })
	gsap.set(nameRefs.value, { yPercent: 100 })
	if (firstName) gsap.set(firstName, { yPercent: 0 })

	function setTrackPadding() {
		const first = cards[0]
		if (!first) return

		if (isMobileMediaQuery) {
			const cardWidth = first.getBoundingClientRect().width
			const value = Math.max((window.innerWidth - cardWidth) / 2, 0)
			gsap.set(trackElement, { paddingLeft: value, paddingRight: value })
		} else {
			const cardHeight = first.getBoundingClientRect().height
			const value = Math.max((window.innerHeight - cardHeight) / 2, 0)
			gsap.set(trackElement, { paddingTop: value, paddingBottom: value })
		}
	}

	function setSectionHeight() {
		const value = Math.max(window.innerHeight + getDistance(), window.innerHeight)
		gsap.set(sectionEl, { height: value })
	}

	let snapPoints: number[] = []
	let distance = 0

	function getDistance() {
		return distance
	}

	function computeSnapPoints() {
		if (cards.length === 0) {
			distance = 0
			snapPoints = [0]
			return
		}

		const styles = window.getComputedStyle(trackElement)

		if (isMobileMediaQuery) {
			const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0
			const paddingLeft = parseFloat(styles.paddingLeft || "0") || 0

			let cumulative = paddingLeft
			const centers = cards.map((card, i) => {
				const width = card.offsetWidth
				const center = cumulative + width / 2
				if (i < cards.length - 1) cumulative += width + gap
				return center - window.innerWidth / 2
			})

			distance = Math.max(centers[centers.length - 1] ?? 0, 0)
			snapPoints =
				distance > 0
					? centers.map((c) => gsap.utils.clamp(0, 1, c / distance))
					: centers.map(() => 0)
		} else {
			const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0
			const paddingTop = parseFloat(styles.paddingTop || "0") || 0

			let cumulative = paddingTop
			const centers = cards.map((card, i) => {
				const height = card.offsetHeight
				const center = cumulative + height / 2
				if (i < cards.length - 1) cumulative += height + gap
				return center - window.innerHeight / 2
			})

			distance = Math.max(centers[centers.length - 1] ?? 0, 0)
			snapPoints =
				distance > 0
					? centers.map((c) => gsap.utils.clamp(0, 1, c / distance))
					: centers.map(() => 0)
		}
	}

	function updateActiveIndex() {
		const viewportExtent = isMobileMediaQuery ? window.innerWidth : window.innerHeight
		const center = viewportExtent / 2
		let closest = 0
		let closestDist = Infinity

		cards.forEach((card, i) => {
			const rect = card.getBoundingClientRect()
			const cardCenter = isMobileMediaQuery
				? rect.left + rect.width / 2
				: rect.top + rect.height / 2
			const dist = Math.abs(cardCenter - center)

			const norm = gsap.utils.clamp(0, 1, dist / (viewportExtent * 0.55))
			const eased = gsap.parseEase("power2.out")(1 - norm)
			cardBaseScale.value[i] = gsap.utils.interpolate(0.82, 1, eased)
			applyCardScale(i)

			if (dist < closestDist) {
				closestDist = dist
				closest = i
			}
		})

		if (closest !== activeIndex.value) activeIndex.value = closest
	}

	setTrackPadding()
	computeSnapPoints()
	setSectionHeight()

	if (prefersReducedMotion) {
		updateActiveIndex()
		return
	}

	const tween = gsap.to(trackEl, {
		[axisProp]: () => -getDistance(),
		ease: "none",
		scrollTrigger: {
			trigger: sectionEl,
			start: "top top",
			end: () => `+=${getDistance()}`,
			scrub: 0.3,
			invalidateOnRefresh: true,
			onUpdate: (self) => {
				scrollDirection.value = self.direction
				updateActiveIndex()
			},
			snap: {
				snapTo: (progress: number) => {
					if (!snapPoints.length) return progress
					return snapPoints.reduce((closest, p) =>
						Math.abs(p - progress) < Math.abs(closest - progress) ? p : closest
					)
				},
				inertia: false,
				duration: { min: 0.18, max: 0.34 },
				delay: 0,
			},
		},
	})

	let cardDraggable: ReturnType<typeof Draggable.create>[number] | undefined

	if (isMobileMediaQuery) {
		const proxy = document.createElement("div")
		let lastProxyX = 0

		function relayToScroll(this: Draggable) {
			const stepX = this.x - lastProxyX
			lastProxyX = this.x
			driveScroll(getScrollY() - stepX, { immediate: true })
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
				if (pressedIndex.value !== null) onCardRelease(pressedIndex.value)
				hoveredIndex.value = null
			},
			onDrag: relayToScroll,
			onThrowUpdate: relayToScroll,
		})

		cardDraggable = instance
	}

	ScrollTrigger.addEventListener("refreshInit", () => {
		setTrackPadding()
		computeSnapPoints()
		setSectionHeight()
	})

	return () => {
		gsap.set(sectionEl, { clearProps: "height" })
		tween.scrollTrigger?.kill()
		tween.kill()
		cardDraggable?.kill()
	}
}, sectionRef)
</script>

<template>
	<div class="section-p-y relative bg-white">
		<section ref="sectionRef" class="relative w-full">
			<div ref="viewportRef" class="section-p-xy sticky top-0 h-svh w-full lg:h-screen">
				<div
					class="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500"
					:style="{
						top: 'calc(var(--spacing-section) * -1)',
						bottom: 'calc(var(--spacing-section) * -2)',
					}"
					:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
				/>

				<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
					<div
						class="absolute right-0 left-0 h-px -translate-y-1/2 bg-[repeating-linear-gradient(to_right,var(--color-gray-dark)_0_4px,transparent_4px_9px)] transition-opacity duration-500 max-lg:top-[calc(50%+3rem)] lg:top-1/2"
						:class="isActiveHovered ? 'opacity-100' : 'opacity-50'"
					/>
				</div>

				<div
					class="pointer-events-none absolute left-1/2 z-6 -translate-x-1/2 -translate-y-1/2 max-lg:top-[calc(50%+3rem)] lg:top-1/2"
				>
					<div class="relative w-[70vw] rounded-3xl p-2 md:w-[38vw] lg:w-[32vw]">
						<div class="aspect-16/10 w-full rounded-2xl" />
						<span
							ref="cornerTL"
							class="border-lime absolute -top-10 -left-10 h-8 w-8 border-t-2 border-l-2"
						/>
						<span
							ref="cornerTR"
							class="border-lime absolute -top-10 -right-10 h-8 w-8 border-t-2 border-r-2"
						/>
						<span
							ref="cornerBL"
							class="border-lime absolute -bottom-10 -left-10 h-8 w-8 border-b-2 border-l-2"
						/>
						<span
							ref="cornerBR"
							class="border-lime absolute -right-10 -bottom-10 h-8 w-8 border-r-2 border-b-2"
						/>
					</div>
				</div>

				<!-- Header : titre seul en haut -->
				<div class="inset-x-edge top-section absolute z-20 pt-15 lg:pt-6">
					<h2
						v-text-reveal
						class="font-lineal-bold text-shadow-lime text-3xl text-black text-shadow-sm lg:text-4xl"
					>
						Featured projects
					</h2>
				</div>

				<!-- Bouton, en bas à droite -->
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

				<!--
					Année
				-->
				<div
					class="lg:left-edge absolute bottom-[calc(50%+21.875vw+1.2rem)] left-0 z-10 w-[70vw] md:bottom-[calc(50%+21.875vw-3.5rem)] lg:top-1/2 lg:bottom-auto lg:w-auto lg:-translate-y-1/2"
				>
					<div
						class="inline-flex items-center rounded-full px-4 py-2 transition-colors duration-300"
						:class="isActiveHovered ? 'lg:bg-gray-dark' : 'lg:bg-gray-light'"
					>
						<div class="inline-grid h-[1em] overflow-hidden leading-none">
							<span
								v-for="(p, i) in projects"
								:key="p.id"
								:ref="
									(el) => {
										if (el) yearRefs[i] = el as HTMLElement
									}
								"
								class="font-vg5000 text-black-light col-start-1 row-start-1 block text-sm leading-none whitespace-nowrap transition-colors duration-300"
								:class="isActiveHovered ? 'lg:text-white' : ''"
							>
								{{ p.year }}
							</span>
						</div>
					</div>
				</div>

				<!--
					Titre du projet
				-->
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
								v-for="(p, i) in projects"
								:key="p.id"
								:ref="
									(el) => {
										if (el) nameRefs[i] = el as HTMLElement
									}
								"
								class="font-lineal text-black-light col-start-1 row-start-1 block text-left text-sm leading-none [font-weight:var(--lineal-weight-medium)] whitespace-nowrap transition-colors duration-300 lg:text-right"
								:class="isActiveHovered ? 'lg:text-white' : ''"
							>
								{{ p.name }}
							</span>
						</div>
					</div>
				</div>

				<!-- Compteur -->
				<div
					class="bottom-edge bg-gray-light font-vg5000 text-gray-dark absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
				>
					<span class="text-black-light font-lineal-bold">{{
						pad(activeIndex + 1)
					}}</span>
					<span class="text-gray-dark/50 mx-1">/</span>
					<span>{{ pad(projects.length) }}</span>
				</div>

				<!--
					Track : défilement horizontal en mobile (flex-row), vertical à partir de md (flex-col, comportement d'origine).
				-->
				<div
					class="absolute inset-0 z-5 flex items-center justify-start overflow-hidden lg:items-stretch lg:justify-center"
				>
					<div
						ref="trackRef"
						class="flex flex-row items-center gap-10 will-change-transform max-lg:translate-y-12 lg:flex-col lg:gap-14"
					>
						<div
							v-for="(p, i) in projects"
							:key="p.id"
							:ref="
								(el) => {
									if (el) cardsRef[i] = el as HTMLElement
								}
							"
							class="shrink-0 cursor-pointer touch-pan-y rounded-3xl bg-black p-2"
							@pointerenter="hoveredIndex = i"
							@pointerleave="handleCardLeave(i)"
							@pointerdown="onCardPress(i)"
							@pointerup="onCardRelease(i)"
							@pointercancel="onCardRelease(i)"
						>
							<div
								class="bg-black-light aspect-16/10 w-[72vw] overflow-hidden rounded-2xl md:w-[38vw] lg:w-[32vw]"
							>
								<img
									:src="p.image"
									:alt="p.name"
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
