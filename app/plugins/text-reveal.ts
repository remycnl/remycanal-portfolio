import type { Directive, Ref } from "vue"
import type { GsapInstance, ScrollTriggerInstance } from "@/composables/useGsap"
import { readThemeColor } from "@/utils/theme/readThemeColor"

interface TextRevealOptions {
	/** Vitesse de propagation en caractères/seconde (plafonnée par MAX_TOTAL sur les longs textes). */
	speed?: number
	/** Irrégularité du rythme entre caractères (0 = régulier, 1 = très organique). */
	jitter?: number
	/** Point de déclenchement ScrollTrigger. Si omis, calculé selon la taille d'écran (voir getStart). */
	start?: string
	/** Couleur d'accent : nom du token `--color-*` du @theme (`"lime"`, `"violet"`…), `--color-x`, `var(--color-x)` ou couleur CSS. Par défaut `"lime"`. */
	theme?: string
	/** Délai (s) entre le démarrage de chaque bloc enfant (effet cascade). */
	childStagger?: number
	/** Si true, traite tout l'élément comme un seul bloc au lieu de découper par enfants. */
	singlePhrase?: boolean
	/** Si true, la directive ne fait rien : le texte reste affiché normalement (SSR inclus). */
	disabled?: boolean
}

type Phase = "idle" | "playing" | "done"

const MAX_TOTAL = 1.5
const WORD_GAP = 0.8
const COLOR_DURATION = 0.55
const SLIDE_DURATION = 0.5
const RISE = 10
const START_DELAY = 0.05
const FAST_SCROLL = 900
const FAST_LEAD = 140
const FONTS_TIMEOUT = 3000

const SLIDE_EASE = "cubic-bezier(.16,1,.3,1)"
const COLOR_EASE = "cubic-bezier(.33,1,.68,1)"
const FRAME_SELECTOR = "[data-text-reveal-frame]"
const FRAME_DELAY = "var(--tr-frame-delay,0s)"

const REVEAL_CSS = `
.text-reveal-word{display:inline-block}
.text-reveal-char{opacity:0}
[data-text-reveal="done"] .text-reveal-char{opacity:1}
[data-text-reveal="playing"] .text-reveal-word{
	animation:text-reveal-slide ${SLIDE_DURATION}s ${SLIDE_EASE};
}
[data-text-reveal="playing"] .text-reveal-char{
	animation:text-reveal-char ${COLOR_DURATION}s ${COLOR_EASE} forwards;
}
[data-text-reveal="idle"] ${FRAME_SELECTOR}::before{opacity:0}
[data-text-reveal="playing"] ${FRAME_SELECTOR}::before{
	opacity:0;
	animation:text-reveal-slide ${SLIDE_DURATION}s ${SLIDE_EASE} ${FRAME_DELAY},text-reveal-frame-pop ${COLOR_DURATION}s linear ${FRAME_DELAY} forwards;
}
[data-text-reveal="playing"] ${FRAME_SELECTOR}::after{
	animation:text-reveal-slide ${SLIDE_DURATION}s ${SLIDE_EASE} ${FRAME_DELAY},text-reveal-frame-accent ${COLOR_DURATION}s ${COLOR_EASE} ${FRAME_DELAY} forwards;
}
@keyframes text-reveal-slide{from{transform:translate3d(0,${RISE}%,0)}to{transform:translate3d(0,0,0)}}
@keyframes text-reveal-char{from{opacity:1;color:var(--tr-accent)}to{opacity:1}}
@keyframes text-reveal-frame-pop{from{opacity:1}to{opacity:1}}
@keyframes text-reveal-frame-accent{from{opacity:1}to{opacity:0}}
`

function getStartOffset(): number {
	const { innerWidth: w, innerHeight: h } = window
	const ratio = w < 640 ? 0.12 : w < 1024 ? 0.16 : 0.2
	return Math.round(Math.min(Math.max(h * ratio, 100), 320))
}

function waitForFonts(ready: Ref<boolean>): Promise<void> {
	if (ready.value) return Promise.resolve()

	return new Promise((resolve) => {
		const timer = setTimeout(done, FONTS_TIMEOUT)
		const stop = watch(ready, (value) => {
			if (value) done()
		})

		function done() {
			clearTimeout(timer)
			stop()
			resolve()
		}
	})
}

function resolveAccent(theme = "lime"): string {
	const value = theme.trim()
	const token = /^[a-z][\w-]*$/i.test(value) ? `--color-${value}` : value
	return readThemeColor(token, "currentColor")
}

function syncFrames(el: HTMLElement) {
	for (const frame of el.querySelectorAll<HTMLElement>(FRAME_SELECTOR)) {
		const first = frame.querySelector<HTMLElement>(".text-reveal-char")
		if (first) frame.style.setProperty("--tr-frame-delay", first.style.animationDelay)
	}
}

function clearFrames(el: HTMLElement) {
	for (const frame of el.querySelectorAll<HTMLElement>(FRAME_SELECTOR))
		frame.style.removeProperty("--tr-frame-delay")
}

interface RevealState {
	ctx?: ReturnType<GsapInstance["context"]>
	trigger?: ReturnType<ScrollTriggerInstance["create"]>
	earlyTrigger?: ReturnType<ScrollTriggerInstance["create"]>
	cleanup?: () => void
}

const STATE = new WeakMap<HTMLElement, RevealState>()

export default defineNuxtPlugin({
	name: "text-reveal",
	setup(nuxtApp) {
		const fontsReady = useFontsReady()

		useHead({ style: [{ key: "text-reveal", textContent: REVEAL_CSS }] })

		const textReveal: Directive<HTMLElement, TextRevealOptions> = {
			getSSRProps(binding) {
				return binding.value?.disabled ? {} : { style: { opacity: 0 } }
			},

			...(import.meta.client
				? {
						beforeMount(el, binding) {
							if (binding.value?.disabled) return
							el.style.opacity = "0"
						},

						mounted(el, binding) {
							if (binding.value?.disabled || STATE.has(el)) return
							initReveal(el, binding.value ?? {})
						},

						unmounted(el) {
							const state = STATE.get(el)
							state?.trigger?.kill()
							state?.earlyTrigger?.kill()
							state?.cleanup?.()
							state?.ctx?.revert()
							STATE.delete(el)
						},
					}
				: {}),
		}

		async function initReveal(el: HTMLElement, options: TextRevealOptions) {
			const state: RevealState = {}
			STATE.set(el, state)

			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				el.style.opacity = "1"
				return
			}

			await waitForAppReady()
			await waitForPageTransition()

			if (!STATE.has(el)) return

			await waitForFonts(fontsReady)

			if (!STATE.has(el)) return

			const { gsap, ScrollTrigger, SplitText } = useGsap()

			const {
				speed = 70,
				jitter = 0.25,
				start,
				theme,
				childStagger = 0.08,
				singlePhrase = false,
			} = options

			let finish: { time: number; char?: HTMLElement } = { time: 0 }

			state.ctx = gsap.context(() => {
				const blocks = singlePhrase ? [el] : getTextBlocks(el)

				blocks.forEach((block, i) => {
					const split = SplitText.create(block, {
						type: "words, chars",
						wordsClass: "text-reveal-word",
						charsClass: "text-reveal-char",
					})

					const end = applyDelays(
						split.chars as HTMLElement[],
						split.words.length,
						speed,
						jitter,
						START_DELAY + i * childStagger
					)
					if (end.time >= finish.time) finish = end
				})
			}, el)

			syncFrames(el)

			const setPhase = (phase: Phase) => {
				el.dataset.textReveal = phase
			}

			el.style.setProperty("--tr-accent", resolveAccent(theme))
			setPhase("idle")

			const onEnd = (e: AnimationEvent) => {
				if (e.target === finish.char && e.animationName === "text-reveal-char")
					setPhase("done")
			}
			el.addEventListener("animationend", onEnd)

			state.cleanup = () => {
				el.removeEventListener("animationend", onEnd)
				el.style.removeProperty("--tr-accent")
				clearFrames(el)
				delete el.dataset.textReveal
			}

			if (!finish.char) {
				setPhase("done")
				el.style.opacity = "1"
				return
			}

			const play = () => {
				if (el.dataset.textReveal === "idle") setPhase("playing")
			}

			el.style.opacity = "1"

			state.trigger = ScrollTrigger.create({
				trigger: el,
				start: () => start ?? `top bottom-=${getStartOffset()}`,
				once: true,
				onEnter: play,
				onLeave: play,
			})

			if (!start) {
				state.earlyTrigger = ScrollTrigger.create({
					trigger: el,
					start: () => `top bottom-=${Math.max(getStartOffset() - FAST_LEAD, 40)}`,
					once: true,
					onEnter: (self) => {
						if (Math.abs(self.getVelocity()) > FAST_SCROLL) play()
					},
				})
			}
		}

		nuxtApp.vueApp.directive("text-reveal", textReveal)
	},
})

function getTextBlocks(el: HTMLElement): HTMLElement[] {
	const children = Array.from(el.children).filter(
		(c): c is HTMLElement =>
			c instanceof HTMLElement && (c.textContent ?? "").trim().length > 0
	)
	return children.length > 1 ? children : [el]
}

function applyDelays(
	chars: HTMLElement[],
	wordCount: number,
	speed: number,
	jitter: number,
	offset: number
): { time: number; char?: HTMLElement } {
	if (!chars.length) return { time: offset }

	const step = Math.min(1 / speed, MAX_TOTAL / (chars.length + wordCount * WORD_GAP))

	let t = offset
	let noise = 0
	let lastStart = offset
	let currentWord: HTMLElement | null = null

	for (const char of chars) {
		const word = char.parentElement
		if (word !== currentWord) {
			currentWord = word
			if (t > offset) t += step * WORD_GAP
			if (word) word.style.animationDelay = `${t.toFixed(3)}s`
		}

		lastStart = t
		char.style.animationDelay = `${t.toFixed(3)}s`

		noise = noise * 0.65 + (Math.random() * 2 - 1) * 0.35
		t += step * Math.max(0.25, 1 + noise * jitter * 2)
	}

	return { time: lastStart, char: chars[chars.length - 1] }
}
