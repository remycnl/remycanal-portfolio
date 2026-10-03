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

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

const CURVATURE_FACTOR = 1.2
const SMALL_DESKTOP_CURVATURE_FACTOR = 0.7
const TABLET_CURVATURE_FACTOR = 0.2
const MOBILE_CURVATURE_FACTOR = 0.1
const MIN_HALF_ARC_DEG = 18
const MAX_HALF_ARC_DEG = 72
const HARD_CUTOFF_ANGLE_DEG = 100

const TICK_SPACING_PX = 16
const TICK_LENGTH_PX = 12
const GUIDE_OFFSET_PX = 0
const GUIDE_BLEED_PX = 24

const AUTOPLAY_SPEED_DEG_PER_SEC = 2.5

const VELOCITY_SMOOTHING_RATE = 3
const DRAG_VELOCITY_TAU_S = 0.06
const FLING_STALE_MS = 90
const MAX_FLING_PX_PER_SEC = 2200
const MAX_FRAME_DT_S = 0.05
const DRAG_CLICK_THRESHOLD_PX = 4
const TOUCH_DRAG_SLOP_PX = 8
const TOUCH_AXIS_LOCK_RATIO = 1
const TOUCH_HIT_PADDING_PX = 40
const CLICK_REARM_MS = 120
const MOBILE_WHEEL_TOP_OFFSET_PX = 32
const TABLET_WHEEL_TOP_OFFSET_PX = 48
const DESKTOP_WHEEL_TOP_OFFSET_PX = 80
const FOLLOW_SCROLL_DIRECTION = true

const BUBBLE_OFFSET_PX = 18
const BUBBLE_HIDE_DELAY_S = 0.12

const RESIZE_DEBOUNCE_MS = 150

interface WheelCard {
	/** Card root element driven by the wheel. */
	el: HTMLElement
	/** Resting angle of the card on the wheel, in degrees. */
	baseAngle: number
	/** Whether the card is currently shown. */
	visible: boolean
	/** Last z-index written to the element. */
	z: number
	/** Last transform string written to the element. */
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

const sectionRef = useTemplateRef<HTMLElement>("sectionRef")
const trackRef = useTemplateRef<HTMLElement>("trackRef")
const bubbleRef = useTemplateRef<HTMLElement>("bubbleRef")
const bubbleMotionRef = useTemplateRef<HTMLElement>("bubbleMotionRef")

let cardEls: HTMLElement[] = []

const isDraggingRef = ref(false)
const isOverWheelRef = ref(false)
const bubbleLabel = ref("Drag")
const isOpeningRef = ref(false)
const guidePath = ref("")
const guideViewBox = ref("0 0 100 100")

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

useGsapContext(({ gsap, ScrollTrigger }) => {
	const trackEl = trackRef.value
	const sectionEl = sectionRef.value
	if (!trackEl || !sectionEl) return
	const track: HTMLElement = trackEl
	const section: HTMLElement = sectionEl

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	let rotation = 0
	let velocity = 0
	let scrollDir = 1
	let renderedRotation = Number.NaN

	let containerW = 0
	let trackH = 0
	let cardW = 0
	let cardH = 0
	let radius = 0
	let degreesPerPixel = 0
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

	let isPressed = false
	let isDragging = false
	let activePointerId = -1
	let didDrag = false
	let dragDistance = 0
	let startPointerX = 0
	let startPointerY = 0
	let lastPointerX = 0
	let lastPointerTime = 0

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

		if (!isPressed) {
			const target = reduceMotion ? 0 : AUTOPLAY_SPEED_DEG_PER_SEC * scrollDir
			velocity += (target - velocity) * expSmoothingFactor(VELOCITY_SMOOTHING_RATE, dt)
			if (target === 0 && Math.abs(velocity) < 0.001) velocity = 0
			rotation += velocity * dt
			if (Math.abs(rotation) > 3600) rotation %= 360
		}

		if (rotation !== renderedRotation) {
			renderedRotation = rotation
			render()
		}
	}

	function isOverWheel(px: number, py: number, padding = 0) {
		const dx = px - wheelX
		const dy = py - wheelY
		const distance = Math.hypot(dx, dy)
		const angle = Math.abs(Math.atan2(dx, -dy) * RAD2DEG)

		return angle <= visibleHalfArc && Math.abs(distance - radius) <= cardH / 2 + padding
	}

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

	function capturePointer(pointerId: number) {
		if (track.hasPointerCapture(pointerId)) return
		try {
			track.setPointerCapture(pointerId)
		} catch {
			return
		}
	}

	function engageDrag(e: PointerEvent, immediateClickGuard: boolean) {
		isDragging = true
		isDraggingRef.value = true
		lastPointerX = e.clientX
		lastPointerTime = e.timeStamp
		if (immediateClickGuard) {
			didDrag = true
			capturePointer(e.pointerId)
		}
	}

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
		if (isPressed) return
		const isMouse = e.pointerType === "mouse"
		if (isMouse && e.button !== 0) return

		const rect = track.getBoundingClientRect()
		const padding = isMouse ? 0 : TOUCH_HIT_PADDING_PX
		if (!isOverWheel(e.clientX - rect.left, e.clientY - rect.top, padding)) return

		isPressed = true
		activePointerId = e.pointerId
		didDrag = false
		dragDistance = 0
		startPointerX = e.clientX
		startPointerY = e.clientY
		lastPointerX = e.clientX
		lastPointerTime = e.timeStamp
		velocity = 0

		isOpeningRef.value = false
		bubbleLabel.value = "Drag"
		hideBubble(true)

		if (isMouse) engageDrag(e, false)
	}

	function onPointerMove(e: PointerEvent) {
		if (!isPressed) {
			updateHover(e)
			return
		}
		if (e.pointerId !== activePointerId) return

		if (!isDragging) {
			const totalX = e.clientX - startPointerX
			const totalY = e.clientY - startPointerY
			if (Math.hypot(totalX, totalY) < TOUCH_DRAG_SLOP_PX) return

			if (Math.abs(totalX) <= Math.abs(totalY) * TOUCH_AXIS_LOCK_RATIO) {
				isPressed = false
				activePointerId = -1
				return
			}

			engageDrag(e, true)
			return
		}

		const deltaX = e.clientX - lastPointerX
		const dtSec = Math.max((e.timeStamp - lastPointerTime) / 1000, 0.001)
		dragDistance += Math.abs(deltaX)
		if (!didDrag && dragDistance > DRAG_CLICK_THRESHOLD_PX) {
			didDrag = true
			capturePointer(e.pointerId)
		}

		rotation += deltaX * degreesPerPixel

		const pxPerSec = clamp(deltaX / dtSec, -MAX_FLING_PX_PER_SEC, MAX_FLING_PX_PER_SEC)
		velocity +=
			(pxPerSec * degreesPerPixel - velocity) *
			expSmoothingFactor(1 / DRAG_VELOCITY_TAU_S, dtSec)

		lastPointerX = e.clientX
		lastPointerTime = e.timeStamp
	}

	function endDrag(e: PointerEvent) {
		if (!isPressed || e.pointerId !== activePointerId) return

		isPressed = false
		isDragging = false
		isDraggingRef.value = false
		activePointerId = -1

		if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)

		if (e.type === "pointercancel" || e.timeStamp - lastPointerTime > FLING_STALE_MS) {
			velocity = 0
		}

		setTimeout(() => {
			didDrag = false
		}, CLICK_REARM_MS)

		updateHover(e)
	}

	function onPointerLeave() {
		if (isPressed) return
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

	function onDragStart(e: DragEvent) {
		e.preventDefault()
	}

	function onContextMenu(e: Event) {
		if (isPressed) e.preventDefault()
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
	track.addEventListener("contextmenu", onContextMenu)

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

		const arcSpacingPx = cardW + cardH * 0.5
		const idealAnglePerSlot = (arcSpacingPx / radius) * RAD2DEG
		const idealSlotCount = Math.max(6, Math.round(360 / idealAnglePerSlot))
		if (idealSlotCount !== slotCount.value) {
			slotCount.value = idealSlotCount
			return
		}

		wheelX = containerW / 2
		wheelY = topPadding + radius + cardH / 2
		visibleHalfArc = halfArcDeg

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
		track.removeEventListener("contextmenu", onContextMenu)
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

			<div
				ref="trackRef"
				class="relative min-h-0 flex-1 touch-pan-y overflow-visible contain-[layout] select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
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
