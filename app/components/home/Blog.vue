<script setup lang="ts">
import type { ComponentPublicInstance } from "vue"

const { data: posts } = await useAsyncData(
	"blog-posts",
	() =>
		queryCollection("blog")
			.select("path", "title", "description", "date", "image")
			.order("date", "DESC")
			.all(),
	{ default: () => [] }
)

/* -------------------------------------------------------------------------- */
/*  Tuning                                                                    */
/* -------------------------------------------------------------------------- */

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

// Wheel shape
const CURVATURE_FACTOR = 1.2
const SMALL_DESKTOP_CURVATURE_FACTOR = 0.7
const TABLET_CURVATURE_FACTOR = 0.2
const MOBILE_CURVATURE_FACTOR = 0.1
const MIN_HALF_ARC_DEG = 18
const MAX_HALF_ARC_DEG = 72
// Cards are never drawn past this angle (they'd wrap around to the back of the wheel).
const HARD_CUTOFF_ANGLE_DEG = 100

// Guide line (graduations)
// Distance between two ticks, measured along the arc.
const TICK_SPACING_PX = 16
const TICK_LENGTH_PX = 12
// Décalage de la ligne par rapport au centre des cartes.
// 0 = centrée derrière les cartes, > 0 = plus bas (vers l'intérieur de la roue).
const GUIDE_OFFSET_PX = 0
// Longueur dont la ligne dépasse de chaque côté de l'écran.
const GUIDE_BLEED_PX = 24

/** Idle rotation speed of the wheel, in degrees per second. */
const AUTOPLAY_SPEED_DEG_PER_SEC = 2.5

// Motion feel
// Rate (1/s) at which the wheel speed eases toward the idle speed after a flick or
// a scroll-direction change. Lower = longer, softer glide.
const VELOCITY_SMOOTHING_RATE = 3
// Time window (s) used to smooth the pointer speed measured while dragging.
const DRAG_VELOCITY_TAU_S = 0.06
// If the pointer stayed still this long before being released, there's no fling.
const FLING_STALE_MS = 90
const MAX_FLING_PX_PER_SEC = 2200
// Caps the time step after a stall / tab switch so the wheel never jumps.
const MAX_FRAME_DT_S = 0.05
// Movement (px) after which a press counts as a drag and the click is swallowed.
const DRAG_CLICK_THRESHOLD_PX = 4
// Extra breathing room below the heading; the button remains close to the wheel.
const MOBILE_WHEEL_TOP_OFFSET_PX = 32
const TABLET_WHEEL_TOP_OFFSET_PX = 48
const DESKTOP_WHEEL_TOP_OFFSET_PX = 80
// When true, scrolling up reverses the idle direction (eased, never abrupt).
const FOLLOW_SCROLL_DIRECTION = true

// "Drag" bubble
const BUBBLE_OFFSET_PX = 18
const BUBBLE_HIDE_DELAY_S = 0.12

const RESIZE_DEBOUNCE_MS = 150

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface WheelCard {
	el: HTMLElement
	baseAngle: number
	visible: boolean
	z: number
	transform: string
}

function expSmoothingFactor(rate: number, delta: number) {
	return 1 - Math.exp(-rate * delta)
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function normalizeAngle(deg: number) {
	let a = deg % 360
	if (a > 180) a -= 360
	if (a < -180) a += 360
	return a
}

function resolveCurvatureFactor(containerW: number) {
	if (containerW >= 1280) return CURVATURE_FACTOR
	if (containerW >= 1024) return SMALL_DESKTOP_CURVATURE_FACTOR
	if (containerW >= 640) return TABLET_CURVATURE_FACTOR
	return MOBILE_CURVATURE_FACTOR
}

/**
 * Graduations along an arc: one short segment per step, perpendicular to the
 * curve (i.e. pointing toward the centre of the circle). The tick count is even
 * so one tick sits exactly at the centre (angle 0).
 */
function buildGuideTicks(cx: number, cy: number, r: number, halfArcDeg: number) {
	const arcLength = 2 * halfArcDeg * DEG2RAD * r
	const count = Math.max(2, Math.floor(arcLength / TICK_SPACING_PX) & ~1)
	const innerR = Math.max(r - TICK_LENGTH_PX / 2, 0)
	const outerR = r + TICK_LENGTH_PX / 2
	const segments: string[] = []

	for (let i = 0; i <= count; i++) {
		const angle = -halfArcDeg + (i / count) * (halfArcDeg * 2)
		const rad = angle * DEG2RAD
		const sin = Math.sin(rad)
		const cos = Math.cos(rad)
		const x1 = cx + innerR * sin
		const y1 = cy - innerR * cos
		const x2 = cx + outerR * sin
		const y2 = cy - outerR * cos
		segments.push(
			`M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`
		)
	}

	return segments.join(" ")
}

/* -------------------------------------------------------------------------- */
/*  Template state                                                            */
/* -------------------------------------------------------------------------- */

const sectionRef = useTemplateRef<HTMLElement>("sectionRef")
const trackRef = useTemplateRef<HTMLElement>("trackRef")
const bubbleRef = useTemplateRef<HTMLElement>("bubbleRef")
const bubbleMotionRef = useTemplateRef<HTMLElement>("bubbleMotionRef")

// Plain array on purpose: it's only read at init time, it never needs reactivity.
let cardEls: HTMLElement[] = []

const isDraggingRef = ref(false)
const isOverWheelRef = ref(false)
const bubbleLabel = ref("Drag")
const isOpeningRef = ref(false)
const guidePath = ref("")
const guideViewBox = ref("0 0 100 100")

// The angle between two cards is always 360 / slotCount, so the circle closes
// perfectly (no wider/narrower gap as it rotates). initCards() snaps this value.
const slotCount = ref(16)

const slots = computed(() => {
	const list = posts.value ?? []
	if (!list.length) return []
	return Array.from({ length: slotCount.value }, (_, i) => ({
		post: list[i % list.length]!,
	}))
})

function setCardRef(el: Element | ComponentPublicInstance | null, index: number) {
	if (!el) return
	const domEl =
		"$el" in (el as ComponentPublicInstance) ? (el as ComponentPublicInstance).$el : el
	if (domEl instanceof HTMLElement) cardEls[index] = domEl
}

onBeforeUpdate(() => {
	cardEls = []
})

const { useGsapContext } = useGsap()

/* -------------------------------------------------------------------------- */
/*  Wheel                                                                     */
/* -------------------------------------------------------------------------- */

useGsapContext(({ gsap, ScrollTrigger }) => {
	const trackEl = trackRef.value
	const sectionEl = sectionRef.value
	if (!trackEl || !sectionEl) return
	const track: HTMLElement = trackEl
	const section: HTMLElement = sectionEl

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	// ---- Motion state -------------------------------------------------------
	// `velocity` is the single source of truth for the wheel speed: a fling, the
	// glide after it and the idle drift are all the same value easing toward its
	// target, so there's never a jump between "inertia" and "autoplay".
	let rotation = 0 // deg
	let velocity = 0 // deg/s
	let scrollDir = 1
	let renderedRotation = Number.NaN

	// ---- Geometry (recomputed in initCards) ---------------------------------
	let containerW = 0
	let trackH = 0
	let cardW = 0
	let cardH = 0
	let radius = 0
	let degreesPerPixel = 0
	// Centre of the circle the *centres* of the cards travel on.
	let wheelX = 0
	let wheelY = 0
	let visibleHalfArc = MIN_HALF_ARC_DEG
	let cullAngle = HARD_CUTOFF_ANGLE_DEG

	let cards: WheelCard[] = []
	let ticker: (() => void) | null = null
	let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
	let intersectionObserver: IntersectionObserver | null = null
	let lastObservedW = 0
	let lastObservedH = 0

	// ---- Drag state ---------------------------------------------------------
	let isDragging = false
	let activePointerId = -1
	let didDrag = false
	let dragDistance = 0
	let lastPointerX = 0
	let lastPointerTime = 0

	// ---- Rendering ----------------------------------------------------------
	// One `transform` write per card per frame, no layout reads.
	function render() {
		for (let i = 0; i < cards.length; i++) {
			const card = cards[i]!
			const angle = normalizeAngle(card.baseAngle + rotation)
			const absAngle = Math.abs(angle)

			if (absAngle > cullAngle) {
				if (card.visible) {
					card.visible = false
					card.el.style.visibility = "hidden"
				}
				continue
			}

			const rad = angle * DEG2RAD
			const sin = Math.sin(rad)
			const cos = Math.cos(rad)
			const depthT = clamp(absAngle / visibleHalfArc, 0, 1)
			const cx = wheelX + radius * sin
			const cy = wheelY - radius * cos

			const transform =
				`translate3d(${Math.round((cx - cardW / 2) * 100) / 100}px, ${Math.round((cy - cardH / 2) * 100) / 100}px, 0) ` +
				`rotate(${Math.round(angle * 1000) / 1000}deg)`
			if (transform !== card.transform) {
				card.transform = transform
				card.el.style.transform = transform
			}

			if (!card.visible) {
				card.visible = true
				card.el.style.visibility = "visible"
			}

			const z = Math.round((1 - depthT) * 100)
			if (z !== card.z) {
				card.z = z
				card.el.style.zIndex = String(z)
			}
		}
	}

	function tick() {
		const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, MAX_FRAME_DT_S)

		if (!isDragging) {
			const target = reduceMotion ? 0 : AUTOPLAY_SPEED_DEG_PER_SEC * scrollDir
			velocity += (target - velocity) * expSmoothingFactor(VELOCITY_SMOOTHING_RATE, dt)
			if (target === 0 && Math.abs(velocity) < 0.001) velocity = 0
			rotation += velocity * dt
			if (Math.abs(rotation) > 3600) rotation %= 360
		}

		// Nothing moved (reduced motion, idle) → nothing to redraw.
		if (rotation !== renderedRotation) {
			renderedRotation = rotation
			render()
		}
	}

	// ---- Hit-testing --------------------------------------------------------
	// A point belongs to the wheel if it lies inside the full curved band swept by
	// the cards, including the spaces between cards.
	function isOverWheel(px: number, py: number) {
		const dx = px - wheelX
		const dy = py - wheelY
		const distance = Math.hypot(dx, dy)
		const angle = Math.abs(Math.atan2(dx, -dy) * RAD2DEG)

		return angle <= visibleHalfArc && Math.abs(distance - radius) <= cardH / 2
	}

	// ---- "Drag" bubble ------------------------------------------------------
	const bubble = bubbleRef.value
	const bubbleMotion = bubbleMotionRef.value
	let bubbleVisible = false
	let bubbleTween: ReturnType<typeof gsap.to> | null = null

	if (bubble && bubbleMotion) {
		gsap.set(bubbleMotion, {
			opacity: 0,
			scale: 0.35,
			rotation: -8,
			transformOrigin: "center center",
		})
	}

	function setBubblePosition(x: number, y: number) {
		if (!bubble) return
		bubble.style.left = `${x}px`
		bubble.style.top = `${y}px`
	}

	function showBubble() {
		if (!bubbleMotion || bubbleVisible) return
		bubbleVisible = true
		bubbleTween?.kill()
		gsap.set(bubbleMotion, { opacity: 0, scale: 0.35, rotation: -8 })
		bubbleTween = gsap.to(bubbleMotion, {
			opacity: 1,
			scale: 1,
			rotation: 0,
			duration: 0.65,
			ease: "elastic.out(1, 0.55)",
		})
	}

	function hideBubble(immediate = false) {
		if (!bubbleMotion || !bubbleVisible || isOpeningRef.value) return
		bubbleVisible = false
		bubbleTween?.kill()
		bubbleTween = gsap.to(bubbleMotion, {
			opacity: 0,
			scale: 0.25,
			rotation: 8,
			duration: 0.32,
			ease: "power2.in",
			delay: immediate ? 0 : BUBBLE_HIDE_DELAY_S,
		})
	}

	// ---- Pointer handling ---------------------------------------------------
	function updateHover(e: PointerEvent) {
		if (e.pointerType !== "mouse") return
		const rect = track.getBoundingClientRect()
		const px = e.clientX - rect.left
		const py = e.clientY - rect.top
		const over = isOverWheel(px, py)
		setBubblePosition(px + BUBBLE_OFFSET_PX, py + BUBBLE_OFFSET_PX)

		if (over) {
			isOverWheelRef.value = true
			if (!bubbleVisible) {
				showBubble()
			}
		} else {
			isOverWheelRef.value = false
			hideBubble()
		}
	}

	function onPointerDown(e: PointerEvent) {
		if (isDragging) return
		if (e.pointerType === "mouse" && e.button !== 0) return

		const rect = track.getBoundingClientRect()
		if (!isOverWheel(e.clientX - rect.left, e.clientY - rect.top)) return

		isDragging = true
		isDraggingRef.value = true
		activePointerId = e.pointerId
		didDrag = false
		dragDistance = 0
		lastPointerX = e.clientX
		lastPointerTime = e.timeStamp
		velocity = 0 // grabbing the wheel stops it

		isOpeningRef.value = false
		bubbleLabel.value = "Drag"
		hideBubble(true)
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) {
			updateHover(e)
			return
		}
		if (e.pointerId !== activePointerId) return

		const deltaX = e.clientX - lastPointerX
		const dtSec = Math.max((e.timeStamp - lastPointerTime) / 1000, 0.001)
		dragDistance += Math.abs(deltaX)
		if (dragDistance > DRAG_CLICK_THRESHOLD_PX) {
			didDrag = true
			if (!track.hasPointerCapture(e.pointerId)) {
				try {
					track.setPointerCapture(e.pointerId)
				} catch {
					// The pointer is already gone; the drag will end on its own.
				}
			}
		}

		// 1:1 with the pointer; the ticker draws it on the next frame.
		rotation += deltaX * degreesPerPixel

		// Smoothed pointer speed, so the fling on release is stable rather than
		// dictated by the very last (often tiny/noisy) event.
		const pxPerSec = clamp(deltaX / dtSec, -MAX_FLING_PX_PER_SEC, MAX_FLING_PX_PER_SEC)
		velocity +=
			(pxPerSec * degreesPerPixel - velocity) *
			expSmoothingFactor(1 / DRAG_VELOCITY_TAU_S, dtSec)

		lastPointerX = e.clientX
		lastPointerTime = e.timeStamp
	}

	function endDrag(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return

		isDragging = false
		isDraggingRef.value = false
		activePointerId = -1

		if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)

		// Held still before letting go → no fling, just ease back to the idle drift.
		if (e.timeStamp - lastPointerTime > FLING_STALE_MS) velocity = 0

		// Let the click that follows pointerup be swallowed, then re-arm.
		setTimeout(() => {
			didDrag = false
		}, 0)

		updateHover(e)
	}

	function onPointerLeave() {
		if (isDragging) return
		isOverWheelRef.value = false
		hideBubble(true)
	}

	function onClickCapture(e: MouseEvent) {
		if (didDrag) {
			e.preventDefault()
			e.stopPropagation()
			return
		}

		const target = e.target
		if (target instanceof Element && target.closest("[data-blog-card] a")) {
			isOpeningRef.value = true
			bubbleLabel.value = "Opening article..."
			showBubble()
		}
	}

	// Native drag & drop (links / images inside the cards) would cancel the
	// pointer stream mid-drag and make the wheel stall.
	function onDragStart(e: DragEvent) {
		e.preventDefault()
	}

	const passivePointerOptions: AddEventListenerOptions = { passive: true }
	track.addEventListener("pointerdown", onPointerDown, passivePointerOptions)
	track.addEventListener("pointermove", onPointerMove, passivePointerOptions)
	track.addEventListener("pointerup", endDrag, passivePointerOptions)
	track.addEventListener("pointercancel", endDrag, passivePointerOptions)
	track.addEventListener("lostpointercapture", endDrag, passivePointerOptions)
	track.addEventListener("pointerleave", onPointerLeave, passivePointerOptions)
	track.addEventListener("click", onClickCapture, true)
	track.addEventListener("dragstart", onDragStart)

	// ---- Setup / teardown ---------------------------------------------------
	function teardownCards() {
		if (ticker) {
			gsap.ticker.remove(ticker)
			ticker = null
		}
		scrollTrigger?.kill()
		scrollTrigger = null
		intersectionObserver?.disconnect()
		intersectionObserver = null
		cards = []
	}

	function initCards() {
		const els = cardEls.filter((el): el is HTMLElement => el instanceof HTMLElement)
		if (!els.length) return

		const rect = track.getBoundingClientRect()
		const width = rect.width
		const height = rect.height
		const measuredCardW = els[0]!.offsetWidth
		const measuredCardH = els[0]!.offsetHeight
		if (!width || !height || !measuredCardW || !measuredCardH) return

		containerW = width
		trackH = height
		cardW = measuredCardW
		cardH = measuredCardH
		const responsiveTopOffset =
			containerW >= 1024
				? DESKTOP_WHEEL_TOP_OFFSET_PX
				: containerW >= 640
					? TABLET_WHEEL_TOP_OFFSET_PX
					: MOBILE_WHEEL_TOP_OFFSET_PX
		const topPadding = Math.max(16, trackH * 0.05) + responsiveTopOffset
		const bottomPadding = containerW >= 1280 ? 24 : containerW >= 1024 ? 32 : 8
		const availableWidth = containerW / 2
		const rawAvailableHeight = trackH - topPadding - bottomPadding - cardH
		const responsiveCurvature = resolveCurvatureFactor(containerW)
		const availableHeight =
			Math.max(rawAvailableHeight, cardH * 0.1) * responsiveCurvature

		const halfArcDeg = clamp(
			2 * Math.atan(availableHeight / availableWidth) * RAD2DEG,
			MIN_HALF_ARC_DEG,
			MAX_HALF_ARC_DEG
		)
		radius = availableWidth / Math.sin(halfArcDeg * DEG2RAD)
		degreesPerPixel = RAD2DEG / radius

		// Snap the slot count so that (count * angle) is exactly 360°.
		const arcSpacingPx = cardW + cardH * 0.5
		const idealAnglePerSlot = (arcSpacingPx / radius) * RAD2DEG
		const idealSlotCount = Math.max(6, Math.round(360 / idealAnglePerSlot))
		if (idealSlotCount !== slotCount.value) {
			// Changing the count re-renders the cards; the watcher below re-inits.
			slotCount.value = idealSlotCount
			return
		}

		// Circle on which the cards' centres travel. The top card's upper edge sits
		// at `topPadding`.
		wheelX = containerW / 2
		wheelY = topPadding + radius + cardH / 2
		visibleHalfArc = halfArcDeg

		// Smallest angle past which a card's rotated bounding box is entirely
		// outside the container: cards are only hidden once they can't be seen,
		// so nothing ever pops in or out on screen.
		cullAngle = HARD_CUTOFF_ANGLE_DEG
		for (let a = visibleHalfArc; a <= HARD_CUTOFF_ANGLE_DEG; a += 0.5) {
			const rad = a * DEG2RAD
			const halfBoxW =
				(cardW * Math.abs(Math.cos(rad)) + cardH * Math.abs(Math.sin(rad))) / 2
			if (radius * Math.sin(rad) - halfBoxW > containerW / 2 + 2) {
				cullAngle = Math.min(HARD_CUTOFF_ANGLE_DEG, a + 1)
				break
			}
		}

		guideViewBox.value = `0 0 ${containerW} ${trackH}`

		// Même centre que la roue ; l'arc est calculé pour sortir de l'écran des deux côtés.
		const guideRadius = Math.max(radius - GUIDE_OFFSET_PX, 1)
		const guideHalfArc =
			Math.asin(Math.min(1, (containerW / 2 + GUIDE_BLEED_PX) / guideRadius)) * RAD2DEG

		guidePath.value = buildGuideTicks(wheelX, wheelY, guideRadius, guideHalfArc)

		const anglePerSlot = 360 / els.length
		cards = els.map((el, i) => {
			el.style.visibility = "hidden"
			el.style.zIndex = ""
			return {
				el,
				baseAngle: i * anglePerSlot,
				visible: false,
				z: -1,
				transform: "",
			}
		})

		lastObservedW = containerW
		lastObservedH = trackH

		render()
		renderedRotation = rotation

		// Only run the frame loop while the section is on screen.
		intersectionObserver = new IntersectionObserver(
			([entry]) => {
				if (!entry) return
				if (entry.isIntersecting) {
					if (!ticker) {
						ticker = tick
						gsap.ticker.add(ticker)
					}
				} else if (ticker) {
					gsap.ticker.remove(ticker)
					ticker = null
				}
			},
			{ threshold: 0 }
		)
		intersectionObserver.observe(section)

		if (FOLLOW_SCROLL_DIRECTION) {
			scrollTrigger = ScrollTrigger.create({
				trigger: section,
				start: "top bottom",
				end: "bottom top",
				invalidateOnRefresh: true,
				onUpdate(self) {
					scrollDir = self.direction || scrollDir
				},
			})
		}
	}

	const stopSlotCountWatch = watch(slotCount, () => {
		teardownCards()
		nextTick(initCards)
	})

	let resizeTimeout: ReturnType<typeof setTimeout> | undefined
	const resizeObserver = new ResizeObserver(([entry]) => {
		if (!entry) return
		const { width, height } = entry.contentRect
		// The first callback fires right after observe(); skip it when nothing changed.
		if (Math.abs(width - lastObservedW) < 0.5 && Math.abs(height - lastObservedH) < 0.5) {
			return
		}
		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(() => {
			teardownCards()
			nextTick(initCards)
		}, RESIZE_DEBOUNCE_MS)
	})
	resizeObserver.observe(track)

	initCards()

	return () => {
		stopSlotCountWatch()
		clearTimeout(resizeTimeout)
		resizeObserver.disconnect()
		teardownCards()
		bubbleTween?.kill()
		track.removeEventListener("pointerdown", onPointerDown)
		track.removeEventListener("pointermove", onPointerMove)
		track.removeEventListener("pointerup", endDrag)
		track.removeEventListener("pointercancel", endDrag)
		track.removeEventListener("lostpointercapture", endDrag)
		track.removeEventListener("pointerleave", onPointerLeave)
		track.removeEventListener("click", onClickCapture, true)
		track.removeEventListener("dragstart", onDragStart)
	}
}, sectionRef)
</script>

<template>
	<section
		ref="sectionRef"
		class="relative left-1/2 w-screen -translate-x-1/2 overflow-visible"
	>
		<div class="relative flex h-svh flex-col">
			<div
				class="section-p-xy grid shrink-0 grid-cols-1 items-end pb-6 text-center lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6 lg:pb-10"
			>
				<div
					class="mb-3 hidden shrink-0 justify-self-start rounded-xs bg-black px-2.5 py-1 lg:block"
				>
					<span
						v-text-reveal="{ singlePhrase: true }"
						class="font-vg5000 text-xs tracking-[0.15em] text-white uppercase"
					>
						<span class="text-lime text-shadow-lime">(</span>blog<span
							class="text-lime text-shadow-lime"
						>
							)
						</span>
					</span>
				</div>
				<div class="flex max-w-3xl flex-col items-center text-black">
					<h2
						class="font-lineal-bold text-shadow-lime text-3xl text-black text-shadow-sm lg:text-4xl"
					>
						I also have thoughts...
					</h2>
					<h3
						class="font-lineal-bold text-shadow-lime text-3xl text-black text-shadow-sm lg:text-4xl"
					>
						Occasionally, I write them down.
					</h3>
				</div>
			</div>

			<!--
				touch-pan-y: vertical swipes keep scrolling the page, horizontal ones drive the wheel.
				The grab cursor only shows over the wheel band, never around it.
			-->
			<div
				ref="trackRef"
				class="relative min-h-0 flex-1 touch-pan-y overflow-visible contain-[layout] select-none"
				:class="isDraggingRef ? 'cursor-grabbing' : isOverWheelRef ? 'cursor-grab' : ''"
			>
				<svg
					class="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
					:viewBox="guideViewBox"
					preserveAspectRatio="none"
				>
					<path
						:d="guidePath"
						fill="none"
						stroke-width="1.5"
						stroke-linecap="round"
						:class="[
							'stroke-gray-dark transition-opacity duration-300 ease-out',
							isDraggingRef ? 'opacity-100' : 'opacity-50',
						]"
					/>
				</svg>

				<!-- Card height is natural (image + title/date), measured in initCards(). -->
				<div
					v-for="(item, i) in slots"
					:key="`slot-${i}`"
					:ref="(el) => setCardRef(el, i)"
					data-blog-card
					class="invisible absolute top-0 left-0 w-[min(62vw,14rem)] will-change-transform sm:w-[min(44vw,17rem)] lg:w-[clamp(20rem,28vw,26rem)]"
				>
					<UiCard
						:title="item.post.title"
						:image="item.post.image"
						:href="item.post.path"
						theme="black"
						viewfinder-label="Open article"
						viewfinder-loading-label="Opening article..."
						compact
					/>
				</div>

				<div
					ref="bubbleRef"
					class="pointer-events-none absolute top-0 left-0 z-500 hidden lg:block"
				>
					<span
						ref="bubbleMotionRef"
						class="font-vg5000 bg-lime block rounded-xs px-3 py-1.5 text-[0.65rem] tracking-widest text-black uppercase"
					>
						{{ bubbleLabel }}
					</span>
				</div>

				<div
					class="mt-80 flex flex-col items-center gap-4 text-center md:mt-120 lg:mt-125 2xl:mt-150"
				>
					<UiAnimatedButton
						to="/blog"
						label="Read the blog"
						size="medium"
						pill="black"
						bubble="lime"
					/>
				</div>
			</div>
		</div>
	</section>
</template>
