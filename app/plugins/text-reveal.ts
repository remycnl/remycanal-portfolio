import type { Directive, Ref } from "vue"
import type { GsapInstance } from "@/composables/useGsap"
import { createRevealTrigger } from "@/utils/revealTrigger"
import { readThemeColor } from "@/utils/theme/readThemeColor"

/** Result of `sequence`. */
interface RevealSequence {
	/** Résolue quand le reveal peut jouer. Le texte reste masqué (phase `idle`) tant qu'elle ne l'est pas. */
	opened: Promise<void>
}

interface TextRevealOptions {
	/** Vitesse de propagation en caractères/seconde (plafonnée par MAX_TOTAL sur les longs textes). */
	speed?: number
	/** Irrégularité du rythme entre caractères (0 = régulier, 1 = très organique). */
	jitter?: number
	/** Point de déclenchement ScrollTrigger. Si omis, calculé selon la taille d'écran (voir createRevealTrigger). */
	start?: string
	/** Couleur d'accent : nom du token `--color-*` du @theme (`"lime"`, `"violet"`…), `--color-x`, `var(--color-x)` ou couleur CSS. Par défaut `"lime"`. */
	theme?: string
	/**
	 * Délai (s) entre le démarrage de chaque bloc enfant (effet cascade).
	 * Par défaut, les blocs sont les enfants directs de l'élément. On peut les désigner avec
	 * `data-text-reveal-block` : la valeur `words` révèle le bloc mot par mot (bien plus léger pour un
	 * long texte).
	 */
	childStagger?: number
	/** Si true, traite tout l'élément comme un seul bloc au lieu de découper par enfants. */
	singlePhrase?: boolean
	/** Si true, la directive ne fait rien : le texte reste affiché normalement (SSR inclus). */
	disabled?: boolean
	/** Si true, ignore `start` et joue le reveal dès que tous les waits sont terminés, sans attendre le scroll. */
	immediate?: boolean
	/** Décalage (s) entre éléments `immediate` démarrant dans la même vague, dans l'ordre du DOM. Par défaut 0.12. */
	immediateStagger?: number
	/** Décalage fixe (s) ajouté avant le démarrage du reveal. Par défaut 0. */
	delay?: number
	/**
	 * Délègue le déclenchement à l'appelant (ex. une grille qui révèle ligne par ligne). Évaluée une fois
	 * la mise en page stable, avant le découpage du texte. Quand elle est fournie, ni le ScrollTrigger
	 * de la directive ni `immediate` ne sont utilisés : le reveal joue quand `opened` se résout.
	 */
	sequence?: (el: HTMLElement) => RevealSequence
}

type Phase = "idle" | "playing" | "done"

const MAX_TOTAL = 1.5
const WORD_GAP = 0.8
const COLOR_DURATION = 0.55
const SLIDE_DURATION = 0.5
const RISE = 10
const START_DELAY = 0.05
const FONTS_TIMEOUT = 3000
/** Nombre moyen de caractères par mot : ramène la vitesse (car/s) d'un bloc `words` en mots/s. */
const WORD_LENGTH = 5
const IMMEDIATE_STAGGER = 0.12

const SLIDE_EASE = "cubic-bezier(.16,1,.3,1)"
const COLOR_EASE = "cubic-bezier(.33,1,.68,1)"

const REVEAL_CSS = `
.text-reveal-word{display:inline-block}
.text-reveal-char,.text-reveal-unit{opacity:0}
[data-text-reveal="done"] .text-reveal-char,[data-text-reveal="done"] .text-reveal-unit{opacity:1}
[data-text-reveal="playing"] .text-reveal-word{
	animation:text-reveal-slide ${SLIDE_DURATION}s ${SLIDE_EASE};
}
[data-text-reveal="playing"] .text-reveal-char,[data-text-reveal="playing"] .text-reveal-unit{
	animation:text-reveal-char ${COLOR_DURATION}s ${COLOR_EASE} forwards;
}
@keyframes text-reveal-slide{from{transform:translate3d(0,${RISE}%,0)}to{transform:translate3d(0,0,0)}}
@keyframes text-reveal-char{from{opacity:1;color:var(--tr-accent)}to{opacity:1}}
`

interface ImmediateEntry {
	el: HTMLElement
	resolve: (slot: number) => void
}

let immediateQueue: ImmediateEntry[] = []
let immediateFrame = 0

/**
 * Regroupe les reveals `immediate` qui deviennent prêts sur le même frame et leur attribue
 * un rang selon l'ordre du DOM. Le rang sert à calculer le décalage de chaque élément.
 */
function claimImmediateSlot(el: HTMLElement): Promise<number> {
	return new Promise((resolve) => {
		immediateQueue.push({ el, resolve })
		if (immediateFrame) return

		immediateFrame = requestAnimationFrame(() => {
			immediateFrame = 0
			const queue = immediateQueue
			immediateQueue = []

			const live = queue.filter((entry) => entry.el.isConnected)
			live.sort((a, b) =>
				a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
			)

			live.forEach((entry, slot) => entry.resolve(slot))
			for (const entry of queue) if (!entry.el.isConnected) entry.resolve(0)
		})
	})
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

interface RevealState {
	ctx?: ReturnType<GsapInstance["context"]>
	killTrigger?: () => void
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
							state?.killTrigger?.()
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

			const {
				speed = 70,
				jitter = 0.25,
				start,
				theme,
				childStagger = 0.08,
				singlePhrase = false,
				immediate = false,
				immediateStagger = IMMEDIATE_STAGGER,
				delay = 0,
				sequence,
			} = options

			await waitForAppReady()
			await waitForPageTransition()

			if (!STATE.has(el)) return

			await waitForFonts(fontsReady)

			if (!STATE.has(el)) return

			// Évalué après tous les waits : la mise en page (fonts comprises) est alors stable.
			const sequenced = sequence?.(el)
			const isImmediate = immediate && !sequenced

			// Rang dans la vague de reveals immédiats.
			const slot = isImmediate ? await claimImmediateSlot(el) : 0

			if (!STATE.has(el)) return

			const baseDelay = START_DELAY + delay + slot * immediateStagger
			const { gsap, ScrollTrigger, SplitText } = useGsap()

			let finish: { time: number; char?: HTMLElement } = { time: 0 }

			state.ctx = gsap.context(() => {
				const blocks = singlePhrase ? [el] : getTextBlocks(el)

				blocks.forEach((block, i) => {
					const byWords = block.dataset.textRevealBlock === "words"
					const offset = baseDelay + i * childStagger
					const split = SplitText.create(
						block,
						byWords
							? { type: "words", wordsClass: "text-reveal-unit" }
							: {
									type: "words, chars",
									wordsClass: "text-reveal-word",
									charsClass: "text-reveal-char",
								}
					)
					const end = byWords
						? applyDelays(split.words as HTMLElement[], 0, speed / WORD_LENGTH, jitter, offset)
						: applyDelays(
								split.chars as HTMLElement[],
								split.words.length,
								speed,
								jitter,
								offset
							)
					if (end.time >= finish.time) finish = end
				})
			}, el)

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

			if (sequenced) {
				void sequenced.opened.then(() => {
					if (STATE.has(el)) play()
				})
				return
			}

			if (isImmediate) {
				play()
				return
			}

			state.killTrigger = createRevealTrigger(ScrollTrigger, el, play, start)
		}

		nuxtApp.vueApp.directive("text-reveal", textReveal)
	},
})

function getTextBlocks(el: HTMLElement): HTMLElement[] {
	const marked = Array.from(el.querySelectorAll<HTMLElement>("[data-text-reveal-block]"))
	if (marked.length) return marked

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
			if (word?.classList.contains("text-reveal-word"))
				word.style.animationDelay = `${t.toFixed(3)}s`
		}

		lastStart = t
		char.style.animationDelay = `${t.toFixed(3)}s`

		noise = noise * 0.65 + (Math.random() * 2 - 1) * 0.35
		t += step * Math.max(0.25, 1 + noise * jitter * 2)
	}

	return { time: lastStart, char: chars[chars.length - 1] }
}