import type { Directive } from "vue"
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
	 * long texte). Au-delà de MAX_CHAR_UNITS caractères, le mot par mot est appliqué automatiquement.
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
	/** Si true, fige la largeur des éléments de flux du bloc pendant le split (évite les reflows). */
	lockLayout?: boolean
}

type Phase = "idle" | "playing" | "done"

const MAX_TOTAL = 1.8
const WORD_GAP = 0.35
const PUNCT_GAP = 4
const PUNCT_END = /[.,;:!?…]$/
const REVEAL_DURATION = 1.2
const APPEAR_PERCENT = 18
const MAX_CHAR_UNITS = 220
const REVERT_SPLIT_WHEN_DONE = true
const START_DELAY = 0.05
const WORD_LENGTH = 5
const IMMEDIATE_STAGGER = 0.12

const APPEAR_EASE = "cubic-bezier(.2,.8,.2,1)"
const COLOR_EASE = "cubic-bezier(.25,1,.5,1)"
const FOLLOW_EASE = "cubic-bezier(.34,1.56,.64,1)"
const FOLLOW_FADE_DURATION = 0.4
const FOLLOW_SCALE_DURATION = 0.6
const FOLLOW_FROM_SCALE = 0.6

const REVEAL_CSS = `
.text-reveal-char,.text-reveal-unit,.text-reveal-word{display:inline !important}
.text-reveal-char,.text-reveal-unit{opacity:0}
[data-text-reveal="done"] .text-reveal-char,[data-text-reveal="done"] .text-reveal-unit{
	opacity:1;
	animation:none;
}
[data-text-reveal="playing"] .text-reveal-char,[data-text-reveal="playing"] .text-reveal-unit{
	animation:text-reveal-in ${REVEAL_DURATION}s linear forwards;
}
@keyframes text-reveal-in{
	0%{opacity:0;color:var(--tr-accent);animation-timing-function:${APPEAR_EASE}}
	${APPEAR_PERCENT}%{opacity:1;color:var(--tr-accent);animation-timing-function:${COLOR_EASE}}
	100%{opacity:1}
}
@media (prefers-reduced-motion:no-preference){
	[data-reveal-follow]{
		transition:opacity ${FOLLOW_FADE_DURATION}s ${COLOR_EASE},scale ${FOLLOW_SCALE_DURATION}s ${FOLLOW_EASE};
	}
	:not(:has(>[data-text-reveal="playing"],>[data-text-reveal="done"]))>[data-reveal-follow]{
		opacity:0;
		scale:${FOLLOW_FROM_SCALE};
	}
}
`

interface ImmediateEntry {
	el: HTMLElement
	resolve: (slot: number) => void
}

let immediateQueue: ImmediateEntry[] = []
let immediateFrame = 0

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

function resolveAccent(theme = "lime"): string {
	const value = theme.trim()
	const token = /^[a-z][\w-]*$/i.test(value) ? `--color-${value}` : value
	return readThemeColor(token, "currentColor")
}

function hasFollower(el: HTMLElement) {
	return Array.from(el.parentElement?.children ?? []).some(
		(sibling) => sibling !== el && sibling.hasAttribute("data-reveal-follow")
	)
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
				speed = 90,
				jitter = 0.2,
				start,
				theme,
				childStagger = 0.08,
				singlePhrase = false,
				immediate = false,
				immediateStagger = IMMEDIATE_STAGGER,
				delay = 0,
				sequence,
				lockLayout = false,
			} = options

			await waitForAppReady()
			await waitForPageTransition()

			if (!STATE.has(el)) return

			await waitForFontsReady(fontsReady)

			if (!STATE.has(el)) return

			const sequenced = sequence?.(el)
			const isImmediate = immediate && !sequenced

			const slot = isImmediate ? await claimImmediateSlot(el) : 0

			if (!STATE.has(el)) return

			const baseDelay = START_DELAY + delay + slot * immediateStagger
			const { gsap, SplitText, ScrollTrigger } = useGsap()

			const forceWords = (el.textContent ?? "").length > MAX_CHAR_UNITS
			const revertWhenDone = REVERT_SPLIT_WHEN_DONE && !hasFollower(el)

			const splits: { revert: () => void }[] = []
			let finish: { time: number; char?: HTMLElement } = { time: 0 }

			// Opt-in : fige la largeur des éléments de flux avant le split
			// pour que le découpage ne déclenche pas de reflow pendant le reveal.
			const releaseLayout = lockLayout ? freezeLayout(el) : () => {}

			state.ctx = gsap.context(() => {
				const blocks = singlePhrase ? [el] : getTextBlocks(el)

				blocks.forEach((block, i) => {
					const byWords = forceWords || block.dataset.textRevealBlock === "words"
					const offset = baseDelay + i * childStagger

					const before = measureOriginal(block, byWords)

					const split = SplitText.create(
						block,
						byWords
							? {
									type: "words",
									wordsClass: "text-reveal-unit",
									reduceWhiteSpace: false,
								}
							: {
									type: "words, chars",
									wordsClass: "text-reveal-word",
									charsClass: "text-reveal-char",
									reduceWhiteSpace: false,
								}
					)
					splits.push(split)

					compensate((byWords ? split.words : split.chars) as HTMLElement[], before)

					const end = byWords
						? applyDelays(
								split.words as HTMLElement[],
								0,
								speed / WORD_LENGTH,
								jitter,
								offset
							)
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
				if (e.target !== finish.char || e.animationName !== "text-reveal-in") return

				setPhase("done")
				el.removeEventListener("animationend", onEnd)

				if (revertWhenDone) for (const split of splits) split.revert()
				releaseLayout()
			}
			el.addEventListener("animationend", onEnd)

			state.cleanup = () => {
				el.removeEventListener("animationend", onEnd)
				el.style.removeProperty("--tr-accent")
				delete el.dataset.textReveal
				releaseLayout()
			}

			if (!finish.char) {
				setPhase("done")
				el.style.opacity = "1"
				releaseLayout()
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

interface Point {
	x: number
	y: number
}

function measureOriginal(root: HTMLElement, wordsOnly: boolean): Point[] {
	const out: Point[] = []
	const range = document.createRange()
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	let atWordStart = true

	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node.textContent ?? ""
		let index = 0
		for (const ch of text) {
			if (/\s/.test(ch)) {
				atWordStart = true
			} else {
				if (!wordsOnly || atWordStart) {
					range.setStart(node, index)
					range.setEnd(node, index + ch.length)
					const r = range.getBoundingClientRect()
					out.push({ x: r.left, y: r.top })
				}
				atWordStart = false
			}
			index += ch.length
		}
	}
	return out
}

function compensate(units: HTMLElement[], before: Point[]) {
	if (units.length !== before.length) return

	const rects = units.map((u) => u.getBoundingClientRect())

	units.forEach((u, i) => {
		const from = before[i]
		const to = rects[i]
		if (!from || !to) return
		if (Math.abs(from.y - to.top) > 2) return
		const dx = from.x - to.left
		if (Math.abs(dx) < 0.01) return
		u.style.position = "relative"
		u.style.left = `${dx.toFixed(3)}px`
	})
}

/**
 * Fige la largeur (border-box) des descendants de flux du bloc
 * (ni inline, ni absolute/fixed) pour que le split ne déclenche pas de reflow.
 * Retourne une fonction qui restaure les styles d'origine (idempotente).
 */
function freezeLayout(root: HTMLElement): () => void {
	const nodes = Array.from(root.querySelectorAll<HTMLElement>("*")).filter((n) => {
		const s = getComputedStyle(n)
		return s.display !== "inline" && s.position !== "absolute" && s.position !== "fixed"
	})

	// Lectures d'abord, écritures ensuite
	const widths = nodes.map((n) => n.getBoundingClientRect().width)
	const previous = nodes.map((n) => ({
		width: n.style.width,
		boxSizing: n.style.boxSizing,
		flex: n.style.flex,
	}))

	nodes.forEach((n, i) => {
		n.style.boxSizing = "border-box"
		n.style.width = `${widths[i]}px`
		n.style.flex = "none"
	})

	let released = false
	return () => {
		if (released) return
		released = true
		nodes.forEach((n, i) => {
			const p = previous[i]
			if (!p) return
			n.style.width = p.width
			n.style.boxSizing = p.boxSizing
			n.style.flex = p.flex
		})
	}
}

function applyDelays(
	chars: HTMLElement[],
	wordCount: number,
	speed: number,
	jitter: number,
	offset: number
): { time: number; char?: HTMLElement } {
	if (!chars.length) return { time: offset }

	const wordMode = wordCount === 0

	let pauses = 0
	for (const char of chars) if (PUNCT_END.test(char.textContent ?? "")) pauses++

	const step = Math.min(
		1 / speed,
		MAX_TOTAL / (chars.length + wordCount * WORD_GAP + pauses * PUNCT_GAP)
	)

	let t = offset
	let noise = 0
	let lastStart = offset

	for (let i = 0; i < chars.length; i++) {
		const char = chars[i]
		if (!char) break

		lastStart = t
		char.style.animationDelay = `${t.toFixed(3)}s`

		noise = noise * 0.65 + (Math.random() * 2 - 1) * 0.35
		t += step * Math.max(0.25, 1 + noise * jitter * 2)

		const next = chars[i + 1]
		if (!next) break

		if (wordMode || next.parentElement !== char.parentElement) {
			if (!wordMode) t += step * WORD_GAP
			if (PUNCT_END.test(char.textContent ?? "")) t += step * PUNCT_GAP
		}
	}

	return { time: lastStart, char: chars[chars.length - 1] }
}