import type { Directive } from "vue"
import { OVERLAY_MOTION } from "@/utils/overlayMotion"

/**
 * v-image-reveal : révèle une image (ou une vidéo) quand elle entre à l'écran.
 *
 * L'élément qui porte la directive est la fenêtre ; son premier enfant est la couche qui reçoit la
 * transformation inverse, et le premier <img> ou <video> qu'il contient est le média attendu avant
 * de révéler :
 *
 *   <div class="aspect-video" v-image-reveal>
 *     <img src="…" class="size-full object-cover" />
 *   </div>
 *
 * La fenêtre grandit en pivotant. Le contenu reste fixe dedans (transformation inverse), puis se
 * pose avec un léger zoom arrière, un peu après elle. Tout est joué avec l'API Web Animations, sur
 * `transform` et `opacity` seulement : le mouvement tourne sur le compositeur, sans recalcul de
 * style ni repaint, et ne dépend pas du thread principal.
 *
 * Les images qui deviennent prêtes en même temps forment une vague : elles apparaissent l'une
 * après l'autre (ligne par ligne, de gauche à droite), en pivotant tour à tour dans un sens puis
 * dans l'autre. Le style de repos est dans assets/css/image-reveal.css.
 */
interface ImageRevealOptions {
	/** Échelle de départ de la fenêtre. Par défaut 0.6. */
	scale?: number
	/** Rotation de départ, en degrés. Par défaut -6. */
	rotate?: number
	/** Durée en secondes. Par défaut 1.4. */
	duration?: number
	/** Délai en secondes, une fois le média prêt. Par défaut 0. */
	delay?: number
	/** Le sens de la rotation alterne d'une image à l'autre d'une même vague. Par défaut true. */
	alternate?: boolean
	/** Révèle dès que le média est prêt, sans attendre qu'il entre à l'écran. */
	immediate?: boolean
	/** Marge d'observation (IntersectionObserver). Par défaut le bas de l'écran moins 10 %. */
	margin?: string
	/** Désactive l'effet : le média s'affiche normalement. */
	disabled?: boolean
}

const { stagger, window: batchWindow, maxSlots, rowTolerance } = OVERLAY_MOTION.reveal
const READY_TIMEOUT = 2000

/** Duration of the fade-in, in ms. It does not depend on the duration of the movement. */
const FADE = 240
/** The content starts slightly zoomed in, then settles while the window grows. 0 turns it off. */
const SETTLE_ZOOM = 0.1
/** The content settles a bit after the window: its duration, relative to the one of the window. */
const SETTLE_LENGTH = 1.3
/** Keyframes sampled per animation: enough for the linear interpolation between them to be invisible. */
const SAMPLES = 48

const cleanups = new WeakMap<HTMLElement, () => void>()

// ── Motion ──────────────────────────────────────────────────
// The window and its content must stay exactly the inverse of each other (scale s and rotation a
// outside, rotation -a and scale 1/s inside), which a plain two-keyframe animation cannot do: 1/s
// is not linear in s. Both curves are therefore sampled, and the animations run on the compositor.

/** Cubic Bézier easing, same contract as CSS `cubic-bezier(x1, y1, x2, y2)`. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
	const axis = (a: number, b: number, s: number) =>
		3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * b + s ** 3

	return (x: number) => {
		// The curve is monotonic in x, so the bisection cannot fail. The result is only sampled.
		let low = 0
		let high = 1
		for (let step = 0; step < 24; step++) {
			const mid = (low + high) / 2
			if (axis(x1, x2, mid) < x) low = mid
			else high = mid
		}
		return axis(y1, y2, (low + high) / 2)
	}
}

const windowEase = cubicBezier(0.16, 1, 0.3, 1)
const settleEase = cubicBezier(0.22, 1, 0.36, 1)

const round = (value: number) => Number(value.toFixed(4))

/** Ease-out fade over the first `FADE` ms. */
function fade(elapsed: number) {
	const progress = Math.min(1, elapsed / FADE)
	return 1 - (1 - progress) ** 2
}

/** Keyframes of the window and of its content. `duration` is the one of the window, in ms. */
function motion(from: number, angle: number, duration: number) {
	const frame: Keyframe[] = []
	const content: Keyframe[] = []

	for (let sample = 0; sample <= SAMPLES; sample++) {
		const time = sample / SAMPLES

		const own = windowEase(time)
		frame.push({
			transform: `scale(${round(from + (1 - from) * own)}) rotate(${round(angle * (1 - own))}deg)`,
			opacity: round(fade(time * duration)),
		})

		// Same instant, seen from the content: the window state, inverted, plus the settle zoom.
		const progress = windowEase(Math.min(1, time * SETTLE_LENGTH))
		const scale = from + (1 - from) * progress
		const zoom = 1 + SETTLE_ZOOM * (1 - settleEase(time))
		content.push({
			transform: `rotate(${round(-angle * (1 - progress))}deg) scale(${round(zoom / scale)})`,
		})
	}

	return { frame, content }
}

// ── Readiness ───────────────────────────────────────────────

/** Resolves once the media is decoded (image) or has its first frame (video). */
function whenReady(el: HTMLElement): Promise<void> {
	// The media can sit deeper than the first child (window > layer > media).
	const media = el.querySelector("img, video")
	const timeout = new Promise<void>((resolve) => setTimeout(resolve, READY_TIMEOUT))

	let ready: Promise<unknown> = Promise.resolve()

	if (media instanceof HTMLImageElement) {
		ready = media.decode().catch(() => {})
	} else if (media instanceof HTMLVideoElement && media.readyState < 2) {
		ready = new Promise((resolve) => {
			media.addEventListener("loadeddata", resolve, { once: true })
			media.addEventListener("error", resolve, { once: true })
		})
	}

	return Promise.race([ready, timeout]).then(() => {})
}

// ── Observation ─────────────────────────────────────────────
// One observer per margin, shared by every image, instead of one observer per image.

const observers = new Map<string, IntersectionObserver>()
const onEnter = new WeakMap<Element, () => void>()

function observerFor(margin: string) {
	const existing = observers.get(margin)
	if (existing) return existing

	const created = new IntersectionObserver(
		(entries, self) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue
				self.unobserve(entry.target)
				onEnter.get(entry.target)?.()
			}
		},
		{ rootMargin: margin, threshold: 0.01 }
	)
	observers.set(margin, created)
	return created
}

function observe(el: HTMLElement, margin: string, enter: () => void) {
	const observer = observerFor(margin)
	onEnter.set(el, enter)
	observer.observe(el)

	return () => {
		observer.unobserve(el)
		onEnter.delete(el)
	}
}

// ── Waves ───────────────────────────────────────────────────
// Images that become ready within the same short window form a wave: they appear one after the
// other, in reading order, instead of all at once.

interface Pending {
	el: HTMLElement
	play: (slot: number) => void
}

let pending: Pending[] = []
let flushTimer: ReturnType<typeof setTimeout> | undefined

function center(el: HTMLElement) {
	// A pending window has not started yet, so it carries no transformation: this is its layout box.
	const rect = el.getBoundingClientRect()
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function flush() {
	flushTimer = undefined

	// Measure everything first, then start: no layout read between two writes.
	const wave = pending
		.filter(({ el }) => el.isConnected)
		.map((item) => ({ ...item, ...center(item.el) }))
	pending = []

	wave.sort((a, b) => (Math.abs(a.y - b.y) > rowTolerance ? a.y - b.y : a.x - b.x))
	wave.forEach(({ play }, slot) => play(slot))
}

function enqueue(el: HTMLElement, play: Pending["play"]) {
	pending.push({ el, play })
	flushTimer ??= setTimeout(flush, batchWindow)
}

// ── Directive ───────────────────────────────────────────────

const imageReveal: Directive<HTMLElement, ImageRevealOptions | undefined> = {
	getSSRProps(binding) {
		return binding.value?.disabled ? {} : { "data-image-reveal": "" }
	},

	beforeMount(el, binding) {
		if (!binding.value?.disabled) el.setAttribute("data-image-reveal", "")
	},

	mounted(el, binding) {
		const options = binding.value ?? {}
		if (options.disabled || cleanups.has(el)) return

		// People who reduced motion get the media at once.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.setAttribute("data-revealed", "")
			return
		}

		const {
			scale = 0.6,
			rotate = -6,
			duration = 1.4,
			delay = 0,
			alternate = true,
			immediate = false,
			margin = "0px 0px -10% 0px",
		} = options

		const layer = el.firstElementChild
		const running: Animation[] = []
		let cancelled = false
		let stopObserving: (() => void) | undefined

		const play = (slot: number) => {
			if (cancelled) return

			const length = duration * 1000
			const angle = alternate && slot % 2 ? -rotate : rotate
			const { frame, content } = motion(scale, angle, length)
			// `backwards` holds the first keyframe (invisible) during the delay of the wave.
			const timing: KeyframeAnimationOptions = {
				delay: (delay + Math.min(slot, maxSlots) * stagger) * 1000,
				fill: "backwards",
			}

			running.push(el.animate(frame, { ...timing, duration: length }))
			if (layer) {
				running.push(layer.animate(content, { ...timing, duration: length * SETTLE_LENGTH }))
			}

			// Resting state once the animations are over: visible, with no transformation left.
			el.setAttribute("data-revealed", "")
		}

		const reveal = async () => {
			await whenReady(el)
			if (!cancelled) enqueue(el, play)
		}

		if (immediate) {
			void reveal()
		} else {
			stopObserving = observe(el, margin, () => void reveal())
		}

		cleanups.set(el, () => {
			cancelled = true
			stopObserving?.()
			for (const animation of running) animation.cancel()
		})
	},

	unmounted(el) {
		cleanups.get(el)?.()
		cleanups.delete(el)
	},
}

export default defineNuxtPlugin({
	name: "image-reveal",
	setup(nuxtApp) {
		nuxtApp.vueApp.directive("image-reveal", imageReveal)
	},
})