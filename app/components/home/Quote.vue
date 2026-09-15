<script setup lang="ts">
const sectionRef = ref<HTMLElement | null>(null)
const quoteWrapRef = ref<HTMLElement | null>(null)
const authorRef = ref<HTMLElement | null>(null)
const portraitRef = ref<HTMLElement | null>(null)

const { useGsapContext } = useGsap()
const { refreshImmediate } = useScrollRefresh()

const SEGMENT_1 = '"Simplicity'
const SEGMENT_2 = "is the ultimate"
const SEGMENT_3 = 'sophistication."'

const WAVE_FREQUENCY = 0.95
const MAX_AMPLITUDE_RATIO = 0.14
const MAX_WAVINESS = 0.85
const MAX_VELOCITY = 2600
const DECAY = 0.9
const SMOOTH = 0.05
const SCROLL_DISTANCE_RATIO = 4.4
const EDGE_BUFFER_RATIO = 0.08
const TEXT_ROTATION_FACTOR = 1
const IMAGE_ROTATION_FACTOR = 0.85

// Below these container widths, the wave's amplitude/waviness are scaled
// down so the motion stays legible and doesn't overwhelm the smaller text.
const TABLET_BREAKPOINT = 1024
const MOBILE_BREAKPOINT = 640
const TABLET_AMPLITUDE_SCALE = 0.75
const TABLET_WAVINESS_SCALE = 0.8
const MOBILE_AMPLITUDE_SCALE = 0.5
const MOBILE_WAVINESS_SCALE = 0.55

const VELOCITY_DECAY_RATE = -Math.log(DECAY) * 60
const WAVINESS_SMOOTH_RATE = -Math.log(1 - SMOOTH) * 60

function expSmoothingFactor(rate: number, delta: number): number {
	return 1 - Math.exp(-rate * delta)
}

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

interface FlowItem {
	el: HTMLElement
	offsetPx: number
	width: number
	rotationFactor: number
	setX: Setter
	setY: Setter
	setRotation: Setter
}

useHoverPop(authorRef, portraitRef, {
	rotate: -6,
	y: 15,
	duration: 0.6,
})

const crossRotated = ref(false)
const hasHover = ref(true)

function toggleCrossRotation() {
	if (hasHover.value) return
	crossRotated.value = !crossRotated.value
}

onMounted(() => {
	hasHover.value = window.matchMedia("(hover: hover)").matches
})

useGsapContext(({ gsap, ScrollTrigger, SplitText }) => {
	const section = sectionRef.value
	const wrap = quoteWrapRef.value
	if (!section || !wrap) return

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

	function buildFlowItem(el: HTMLElement, rotationFactor: number): FlowItem {
		return {
			el,
			offsetPx: el.offsetLeft,
			width: el.offsetWidth,
			rotationFactor,
			setX: gsap.quickSetter(el, "x", "px") as Setter,
			setY: gsap.quickSetter(el, "y", "px") as Setter,
			setRotation: gsap.quickSetter(el, "rotation", "deg") as Setter,
		}
	}

	function computeBounds() {
		const buffer = containerW * EDGE_BUFFER_RATIO
		startX = containerW + buffer
		endX = -(textWidth + buffer)
	}

	function measureContainer() {
		const rect = section!.getBoundingClientRect()
		containerW = rect.width
		containerH = rect.height

		const scale = getResponsiveScale(containerW)
		amplitudeScale = scale.amplitude
		wavinessScale = scale.waviness
	}

	function setupLayout(): boolean {
		const measuredWidth = wrap!.scrollWidth
		if (!measuredWidth) return false

		const imageEls = Array.from(wrap!.querySelectorAll<HTMLElement>(".path-word-img"))
		const charItems = split.chars.map((c) =>
			buildFlowItem(c as HTMLElement, TEXT_ROTATION_FACTOR)
		)
		const imageItems = imageEls.map((el) => buildFlowItem(el, IMAGE_ROTATION_FACTOR))
		items = [...charItems, ...imageItems]

		textWidth = measuredWidth
		measureContainer()
		computeBounds()

		gsap.set(
			items.map((item) => item.el),
			{
				position: "absolute",
				top: 0,
				left: 0,
				yPercent: -50,
				willChange: "transform",
			}
		)

		return true
	}

	function remeasure() {
		if (!items.length) return

		const els = items.map((item) => item.el)
		gsap.set(els, { clearProps: "position,top,left,x,y,rotation,yPercent" })

		const measuredWidth = wrap!.scrollWidth
		textWidth = measuredWidth || textWidth
		measureContainer()
		for (const item of items) {
			item.offsetPx = item.el.offsetLeft
			item.width = item.el.offsetWidth
		}
		computeBounds()

		gsap.set(els, {
			position: "absolute",
			top: 0,
			left: 0,
			yPercent: -50,
			willChange: "transform",
		})

		render(currentProgress, currentWaviness)
	}

	function render(progress: number, waviness: number) {
		if (!items.length || !containerW) return

		const origin = gsap.utils.interpolate(startX, endX, progress)
		const amplitude = containerH * MAX_AMPLITUDE_RATIO * amplitudeScale * waviness
		const baseline = containerH / 2
		const eps = 0.5

		for (const item of items) {
			const screenX = origin + item.offsetPx
			const centerX = screenX + item.width / 2
			const phase = (centerX / containerW) * WAVE_FREQUENCY * Math.PI * 2
			const phaseNext = ((centerX + eps) / containerW) * WAVE_FREQUENCY * Math.PI * 2

			const y = baseline + amplitude * Math.sin(phase)
			const yNext = baseline + amplitude * Math.sin(phaseNext)
			const angle =
				amplitude === 0
					? 0
					: Math.atan2(yNext - y, eps) * (180 / Math.PI) * item.rotationFactor

			item.setX(screenX)
			item.setY(y)
			item.setRotation(angle)
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

		gsap.ticker.add(tick)

		trigger = ScrollTrigger.create({
			trigger: section,
			start: "top top",
			end: () => `+=${window.innerHeight * SCROLL_DISTANCE_RATIO}`,
			pin: true,
			scrub: 1,
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
	}

	const fontsReady = useFontsReady()
	let stopFontsWatch: (() => void) | undefined

	if (fontsReady.value) {
		init()
	} else {
		stopFontsWatch = watch(fontsReady, (ready) => {
			if (!ready) return
			init()
			stopFontsWatch?.()
		})
	}

	return () => {
		stopFontsWatch?.()
		if (rafId !== null) cancelAnimationFrame(rafId)
		gsap.ticker.remove(tick)
		trigger?.kill()
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
						class="table-cell w-full text-center align-middle text-[clamp(2.5rem,11vw,14rem)] leading-none whitespace-nowrap [word-spacing:0.2em] [&_.path-char]:inline-block"
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
					</div>
				</div>
			</div>

			<span
				ref="authorRef"
				class="right-edge bottom-edge absolute group cursor-default text-base"
				aria-hidden="true"
				@click="toggleCrossRotation"
			>
				<div v-text-reveal class="flex items-center gap-4">
					<UiShapeCross
						:class="[
							'text-lime -mt-0.5 h-4 w-4 transition-transform duration-400 md:h-5 md:w-5',
							crossRotated ? '-rotate-180' : 'group-hover:-rotate-180',
						]"
					/>
					<span class="font-vg5000 inline-block w-max whitespace-nowrap">
						Leonardo da Vinci
					</span>
				</div>
				<span
					ref="portraitRef"
					class="pointer-events-none absolute bottom-0 -left-20 -mb-1 lg:-mb-2.5 w-[clamp(4rem,8vw,6rem)] lg:-left-30"
				>
					<NuxtImg
						src="/quote/leonardo-da-vinci.png"
						alt="Portrait de Leonardo da Vinci"
						class="h-auto w-full object-contain grayscale"
						loading="lazy"
						decoding="async"
					/>
				</span>
			</span>
		</div>
	</section>
</template>