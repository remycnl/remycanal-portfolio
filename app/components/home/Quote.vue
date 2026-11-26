<script setup lang="ts">
interface StickerSpec {
	src: string
	/** Position along the quote, from 0 (start) to 1 (end of the text). Past ~0.7 the sticker stays above the line: the author sits under the end of the quote. */
	x: number
	/** Vertical offset from the quote line, in em of the quote size: negative above, positive below. */
	y: number
	/** Width, in em of the quote size. */
	size: number
	/** Resting tilt (deg). */
	tilt: number
	/** Share of the wave it follows: the outer ones swing less, so they stay on screen. */
	amplitude: number
}

const STICKERS: readonly StickerSpec[] = [
	{
		src: "/stickers/flower_violet.svg",
		x: 0.05,
		y: -1.1,
		size: 1.1,
		tilt: -12,
		amplitude: 0.7,
	},
	{
		src: "/stickers/dog_violet.svg",
		x: 0.17,
		y: 1.15,
		size: 1.5,
		tilt: 8,
		amplitude: 0.8,
	},
	{
		src: "/stickers/character_violet.svg",
		x: 0.29,
		y: -0.95,
		size: 1.3,
		tilt: 10,
		amplitude: 0.85,
	},
	{
		src: "/stickers/cursor_violet.svg",
		x: 0.41,
		y: 1.1,
		size: 1.1,
		tilt: -8,
		amplitude: 0.9,
	},
	{
		src: "/stickers/computer_lime.svg",
		x: 0.55,
		y: -1.1,
		size: 1.4,
		tilt: 7,
		amplitude: 0.9,
	},
	{
		src: "/stickers/characterFull_lime.svg",
		x: 0.68,
		y: 1.05,
		size: 1.0,
		tilt: -10,
		amplitude: 0.85,
	},
	{ src: "/stickers/dog_lime.svg", x: 0.79, y: -1.2, size: 1.5, tilt: 9, amplitude: 0.8 },
	{
		src: "/stickers/flower_lime.svg",
		x: 0.91,
		y: -1.05,
		size: 1.2,
		tilt: 12,
		amplitude: 0.7,
	},
]

const sectionRef = useTemplateRef<HTMLElement>("sectionRef")
const quoteWrapRef = useTemplateRef<HTMLElement>("quoteWrapRef")
const stickerLayerRef = useTemplateRef<HTMLElement>("stickerLayerRef")

const fontsReady = useFontsReady()

const { useGsapContext } = useGsap()
const { refreshImmediate } = useScrollRefresh()

const SEGMENT_1 = '"Simplicity'
const SEGMENT_2 = "is the ultimate"
const SEGMENT_3 = 'sophistication."'
const AUTHOR = "by Leonardo Da Vinci"

const QUOTE_SIZE = "text-[clamp(2.5rem,11vw,14rem)]"
const STICKER_SIZE = "text-[clamp(2.5rem,calc(9vw_+_1.6rem),min(14rem,18svh))]"

const WAVE_FREQUENCY = 0.95
const MAX_AMPLITUDE_RATIO = 0.2
const MAX_WAVINESS = 0.85
const MAX_VELOCITY = 2600
const DECAY = 0.9
const SMOOTH = 0.05
const SCROLL_DISTANCE_RATIO = 4.4
const EDGE_BUFFER_RATIO = 0.08
const TEXT_ROTATION_FACTOR = 1
const IMAGE_ROTATION_FACTOR = 0.85
const STICKER_ROTATION_FACTOR = 0.6

const POP_ENTER_RATIO = 0.92
const POP_SCALE_FROM = 0.25
const POP_Y_FROM = 40
const POP_ROTATE_FROM = -35
const POP_DURATION = 0.85

const TABLET_BREAKPOINT = 1024
const MOBILE_BREAKPOINT = 640
const TABLET_AMPLITUDE_SCALE = 0.75
const TABLET_WAVINESS_SCALE = 0.8
const MOBILE_AMPLITUDE_SCALE = 0.5
const MOBILE_WAVINESS_SCALE = 0.55

const VELOCITY_DECAY_RATE = -Math.log(DECAY) * 60
const WAVINESS_SMOOTH_RATE = -Math.log(1 - SMOOTH) * 60

const ITEM_STYLE = {
	position: "absolute",
	top: 0,
	left: 0,
	yPercent: -50,
	willChange: "transform",
} as const
const ITEM_STYLE_PROPS = "position,top,left,x,y,rotation,yPercent"

function getResponsiveScale(containerW: number) {
	if (containerW < MOBILE_BREAKPOINT) {
		return { amplitude: MOBILE_AMPLITUDE_SCALE, waviness: MOBILE_WAVINESS_SCALE }
	}
	if (containerW < TABLET_BREAKPOINT) {
		return { amplitude: TABLET_AMPLITUDE_SCALE, waviness: TABLET_WAVINESS_SCALE }
	}
	return { amplitude: 1, waviness: 1 }
}

type Setter = (v: number) => void

interface PopState {
	/** The image inside the sticker: the flow moves the sticker, the pop only animates the image. */
	img: HTMLElement
	tilt: number
	shown: boolean
}

interface FlowItem {
	el: HTMLElement
	rotationFactor: number
	/** Share of the wave the item follows, 1 for the quote. */
	amplitude: number
	/** The author line sits under the quote, it keeps its vertical gap while following the wave. */
	isAuthor: boolean
	/** Stickers only: where it sits around the quote, and its pop. */
	anchor?: StickerSpec
	pop?: PopState
	/** Position and size in the flow, measured before the item leaves the layout. */
	offsetX: number
	offsetY: number
	width: number
	setX: Setter
	setY: Setter
	setRotation: Setter
}

useGsapContext(({ gsap, ScrollTrigger, SplitText }) => {
	const section = sectionRef.value
	const wrap = quoteWrapRef.value
	const stickerLayer = stickerLayerRef.value
	if (!section || !wrap || !stickerLayer) return

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	const split = new SplitText(wrap, {
		type: "chars",
		charsClass: "path-char",
	})

	if (reduceMotion) {
		gsap.set(wrap, { opacity: 1 })
		return () => split.revert()
	}

	let items: FlowItem[] = []
	let textWidth = 0
	let containerW = 0
	let containerH = 0
	let startX = 0
	let endX = 0
	let currentProgress = 0
	let velocityTarget = 0
	let currentWaviness = 0
	let amplitudeScale = 1
	let wavinessScale = 1

	const itemEls = () => items.map((item) => item.el)
	const centerY = (el: HTMLElement) => el.offsetTop + el.offsetHeight / 2

	function buildFlowItem(
		el: HTMLElement,
		rotationFactor: number,
		extra: Partial<FlowItem> = {}
	): FlowItem {
		return {
			el,
			rotationFactor,
			amplitude: 1,
			isAuthor: el.closest(".path-author") !== null,
			offsetX: 0,
			offsetY: 0,
			width: 0,
			setX: gsap.quickSetter(el, "x", "px") as Setter,
			setY: gsap.quickSetter(el, "y", "px") as Setter,
			setRotation: gsap.quickSetter(el, "rotation", "deg") as Setter,
			...extra,
		}
	}

	function buildStickerItems(): FlowItem[] {
		const els = Array.from(stickerLayer!.querySelectorAll<HTMLElement>("[data-sticker]"))

		return els.flatMap((el) => {
			const spec = STICKERS[Number(el.dataset.index)]
			const img = el.querySelector("img")
			if (!spec || !img) return []

			return [
				buildFlowItem(el, STICKER_ROTATION_FACTOR, {
					amplitude: spec.amplitude,
					anchor: spec,
					pop: { img, tilt: spec.tilt, shown: false },
				}),
			]
		})
	}

	function measureContainer() {
		const rect = section!.getBoundingClientRect()
		containerW = rect.width
		containerH = rect.height

		const scale = getResponsiveScale(containerW)
		amplitudeScale = scale.amplitude
		wavinessScale = scale.waviness
	}

	function computeBounds() {
		const buffer = containerW * EDGE_BUFFER_RATIO
		startX = containerW + buffer
		endX = -(textWidth + buffer)
	}

	function measure() {
		textWidth = wrap!.scrollWidth || textWidth
		measureContainer()
		computeBounds()

		const quoteY = centerY(split.chars[0] as HTMLElement)
		const quoteSize = parseFloat(getComputedStyle(stickerLayer!).fontSize)

		for (const item of items) {
			item.width = item.el.offsetWidth

			if (item.anchor) {
				item.offsetX = item.anchor.x * textWidth - item.width / 2
				item.offsetY = item.anchor.y * quoteSize
				continue
			}

			item.offsetX = item.el.offsetLeft
			item.offsetY = item.isAuthor ? centerY(item.el) - quoteY : 0
		}
	}

	function setupLayout(): boolean {
		if (!wrap!.scrollWidth) return false

		const imageEls = Array.from(wrap!.querySelectorAll<HTMLElement>(".path-word-img"))
		items = [
			...split.chars.map((c) => buildFlowItem(c as HTMLElement, TEXT_ROTATION_FACTOR)),
			...imageEls.map((el) => buildFlowItem(el, IMAGE_ROTATION_FACTOR)),
			...buildStickerItems(),
		]

		for (const { pop } of items) {
			if (pop) hideSticker(pop)
		}

		measure()
		gsap.set(itemEls(), ITEM_STYLE)

		return true
	}

	function remeasure() {
		if (!items.length) return

		gsap.set(itemEls(), { clearProps: ITEM_STYLE_PROPS })
		measure()
		gsap.set(itemEls(), ITEM_STYLE)

		render(currentProgress, currentWaviness)
	}

	function hideSticker({ img, tilt }: PopState) {
		gsap.killTweensOf(img)
		gsap.set(img, {
			opacity: 0,
			scale: POP_SCALE_FROM,
			rotation: tilt + POP_ROTATE_FROM,
			y: POP_Y_FROM,
			transformOrigin: "50% 50%",
			force3D: true,
		})
	}

	function popSticker({ img, tilt }: PopState) {
		gsap.killTweensOf(img)
		gsap
			.timeline()
			.to(img, { opacity: 1, duration: POP_DURATION * 0.35, ease: "power1.out" }, 0)
			.to(
				img,
				{ scale: 1, y: 0, duration: POP_DURATION, ease: "elastic.out(1, 0.55)" },
				0
			)
			.to(
				img,
				{ rotation: tilt, duration: POP_DURATION, ease: "elastic.out(1, 0.65)" },
				0
			)
	}

	function syncPop(item: FlowItem, centerX: number) {
		const pop = item.pop
		if (!pop) return

		if (!pop.shown && centerX < containerW * POP_ENTER_RATIO) {
			pop.shown = true
			popSticker(pop)
		} else if (pop.shown && centerX > containerW + item.width) {
			pop.shown = false
			hideSticker(pop)
		}
	}

	function render(progress: number, waviness: number) {
		if (!items.length || !containerW) return

		const origin = gsap.utils.interpolate(startX, endX, progress)
		const amplitude = containerH * MAX_AMPLITUDE_RATIO * amplitudeScale * waviness
		const baseline = containerH / 2
		const eps = 0.5

		for (const item of items) {
			const screenX = origin + item.offsetX
			const centerX = screenX + item.width / 2
			const phase = (centerX / containerW) * WAVE_FREQUENCY * Math.PI * 2
			const phaseNext = ((centerX + eps) / containerW) * WAVE_FREQUENCY * Math.PI * 2

			const swing = amplitude * item.amplitude
			const y = baseline + swing * Math.sin(phase)
			const yNext = baseline + swing * Math.sin(phaseNext)
			const angle =
				swing === 0
					? 0
					: Math.atan2(yNext - y, eps) * (180 / Math.PI) * item.rotationFactor

			item.setX(screenX)
			item.setY(y + item.offsetY)
			item.setRotation(angle)

			syncPop(item, centerX)
		}
	}

	let trigger: ReturnType<typeof ScrollTrigger.create> | undefined
	let rafId: number | null = null

	function tick(_time: number, deltaMs: number) {
		const delta = deltaMs / 1000
		velocityTarget *= Math.exp(-VELOCITY_DECAY_RATE * delta)
		currentWaviness +=
			(velocityTarget - currentWaviness) * expSmoothingFactor(WAVINESS_SMOOTH_RATE, delta)
		render(currentProgress, currentWaviness)
	}

	function init() {
		if (!setupLayout()) {
			rafId = requestAnimationFrame(init)
			return
		}

		render(0, 0)
		gsap.set(wrap, { opacity: 1 })
		gsap.set(stickerLayer, { autoAlpha: 1 })

		gsap.ticker.add(tick)

		trigger = ScrollTrigger.create({
			trigger: section,
			start: "top top",
			end: () => `+=${window.innerHeight * SCROLL_DISTANCE_RATIO}`,
			pin: true,
			scrub: true,
			invalidateOnRefresh: true,
			refreshPriority: 1,
			onRefresh: remeasure,
			onUpdate: (self) => {
				currentProgress = self.progress
				const v = Math.min(Math.abs(self.getVelocity()) / MAX_VELOCITY, 1)
				velocityTarget = Math.max(velocityTarget, v * MAX_WAVINESS * wavinessScale)
			},
		})

		requestAnimationFrame(() => requestAnimationFrame(() => refreshImmediate()))
		setTimeout(() => refreshImmediate(), 250)
	}

	let cancelled = false

	if (fontsReady.value) {
		init()
	} else {
		waitForFontsReady(fontsReady).then(() => {
			if (!cancelled) init()
		})
	}

	return () => {
		cancelled = true
		if (rafId !== null) cancelAnimationFrame(rafId)
		gsap.ticker.remove(tick)
		trigger?.kill()
		for (const { pop } of items) {
			if (pop) gsap.killTweensOf(pop.img)
		}
		split.revert()
	}
}, sectionRef)
</script>

<template>
	<section ref="sectionRef" class="relative">
		<p class="sr-only">Simplicity is the ultimate sophistication — Leonardo da Vinci</p>

		<div class="relative h-svh">
			<div class="absolute inset-0 overflow-hidden">
				<div
					ref="quoteWrapRef"
					class="font-lineal-heavy pointer-events-none absolute inset-0 table h-full w-full opacity-0"
					aria-hidden="true"
				>
					<div
						:class="QUOTE_SIZE"
						class="table-cell w-full text-center align-middle leading-none whitespace-nowrap [word-spacing:0.2em] [&_.path-char]:inline-block"
					>
						<span>{{ SEGMENT_1 }}</span
						><span class="path-word-img inline-block px-[0.4em] align-middle">
							<NuxtImg
								src="/quote/simplicity-logo-violet.png"
								alt=""
								class="border-violet block aspect-3/2 h-auto w-[clamp(6rem,18vw,15rem)] rounded-xl border-2 object-cover lg:rounded-4xl"
								loading="eager"
								decoding="async" /></span
						><span>{{ SEGMENT_2 }}</span
						><span class="path-word-img inline-block px-[0.4em] align-middle">
							<NuxtImg
								src="/quote/simplicity-logo-lime.png"
								alt=""
								class="border-lime block aspect-3/2 h-auto w-[clamp(6rem,18vw,15rem)] rounded-xl border-2 object-cover lg:rounded-4xl"
								loading="eager"
								decoding="async" /></span
						><span>{{ SEGMENT_3 }}</span>

						<span
							class="path-author mt-[0.6em] mr-[-3em] block text-right text-[0.3em] [word-spacing:0.2em]"
						>
							{{ AUTHOR }}
						</span>
					</div>
				</div>

				<div
					ref="stickerLayerRef"
					:class="STICKER_SIZE"
					class="pointer-events-none invisible absolute inset-0 z-10"
					aria-hidden="true"
				>
					<span
						v-for="(sticker, index) in STICKERS"
						:key="index"
						:data-index="index"
						:style="{ width: `${sticker.size}em` }"
						class="absolute top-0 left-0 block"
						data-sticker
					>
						<img
							:src="sticker.src"
							alt=""
							draggable="false"
							decoding="async"
							class="block h-auto w-full select-none"
						/>
					</span>
				</div>
			</div>
		</div>
	</section>
</template>
