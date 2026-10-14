import type { Directive } from "vue"

export interface RollHoverOptions {
	/** Durée en secondes. Par défaut 0.55. */
	duration?: number
	/** Easing GSAP (ex. `"back.out(1.2)"`, `"power3.out"`) ou CSS (`"cubic-bezier(...)"`, `"ease-out"`). Par défaut `"back.out(1.2)"`. */
	ease?: string
}

const DEFAULT_OVERSHOOT = 1.2
const EASE_POINTS = 48

/** Formule exacte de `back.out(s)` de GSAP. */
const backOut = (s: number) => (t: number) => {
	const p = t - 1
	return p * p * ((s + 1) * p + s) + 1
}

/**
 * Échantillonne une fonction d'easing en `linear()` CSS : même courbe que GSAP (overshoot compris),
 * mais jouée par le navigateur sur le compositeur.
 */
function toLinear(fn: (t: number) => number): string {
	const pts: string[] = []
	for (let i = 0; i <= EASE_POINTS; i++) {
		pts.push(String(Math.round(fn(i / EASE_POINTS) * 10000) / 10000))
	}
	return `linear(${pts.join(",")})`
}

const SUPPORTS_LINEAR =
	typeof CSS !== "undefined" && CSS.supports("animation-timing-function", "linear(0,1)")
const CSS_EASE = /^(ease|cubic-bezier|steps|linear)/
const easeCache = new Map<string, string>()

/** Convertit l'option `ease` (GSAP ou CSS) en valeur CSS, ou `null` pour garder celle par défaut. */
function resolveEase(
	ease: string,
	gsap: { parseEase: (e: string) => ((t: number) => number) | undefined }
) {
	const value = ease.trim()
	if (CSS_EASE.test(value)) return value
	if (!SUPPORTS_LINEAR) return null

	const cached = easeCache.get(value)
	if (cached) return cached

	const fn = gsap.parseEase(value)
	if (typeof fn !== "function") return null

	const css = toLinear(fn)
	easeCache.set(value, css)
	return css
}

/**
 * Tout le style statique et l'animation sont en CSS :
 * - `transform` est animé par le compositeur (thread GPU), donc fluide même si le thread principal est chargé ;
 * - aucun `will-change` : le navigateur promeut déjà le calque pendant une animation de transform,
 *   et un `will-change` permanent coûterait un calque par lien ;
 * - la sélection est gérée par les mêmes sélecteurs : une seule ligne sélectionnable à la fois.
 */
const ROLL_CSS = `
[data-roll-hover]{
	--roll-bleed:.4em;
	--roll-duration:.55s;
	--roll-ease:cubic-bezier(.34,1.3,.64,1);
	position:relative;
	display:inline-grid;
	vertical-align:top;
	white-space:nowrap;
	clip-path:inset(calc(-1 * var(--roll-bleed)) -.05em);
}
[data-roll-row]{
	display:block;
	grid-area:1/1;
	padding-block:var(--roll-bleed);
	margin-block:calc(-1 * var(--roll-bleed));
	text-box:inherit;
}
[data-roll-row="duplicate"]{
	transform:translateY(-100%);
	-webkit-user-select:none;
	user-select:none;
}
[data-roll-active]>[data-roll-row="original"]{
	animation:roll-out var(--roll-duration) var(--roll-ease) forwards;
	-webkit-user-select:none;
	user-select:none;
}
[data-roll-active]>[data-roll-row="duplicate"]{
	animation:roll-in var(--roll-duration) var(--roll-ease) forwards;
	-webkit-user-select:text;
	user-select:text;
}
@keyframes roll-out{to{transform:translateY(100%)}}
@keyframes roll-in{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@supports (animation-timing-function:linear(0,1)){
	[data-roll-hover]{--roll-ease:${toLinear(backOut(DEFAULT_OVERSHOOT))}}
}
@media (prefers-reduced-motion:reduce){[data-roll-hover]{--roll-duration:0s}}
`

const ACTIVE_ATTR = "data-roll-active"

const cleanups = new WeakMap<HTMLElement, () => void>()

function createRow(text: string, kind: "original" | "duplicate") {
	const row = document.createElement("span")
	row.textContent = text
	row.dataset.rollRow = kind
	if (kind === "duplicate") row.setAttribute("aria-hidden", "true")
	return row
}

export default defineNuxtPlugin({
	name: "roll-hover",
	setup(nuxtApp) {
		useHead({ style: [{ key: "roll-hover", textContent: ROLL_CSS }] })

		const rollHover: Directive<HTMLElement, RollHoverOptions | undefined> = {
			getSSRProps: () => ({}),

			mounted(el, binding) {
				if (!import.meta.client || cleanups.has(el)) return
				if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return

				const text = el.textContent?.trim() ?? ""
				if (!text) return

				// Variables CSS posées une seule fois. En reduced-motion, la feuille de style impose 0s.
				if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
					const { duration, ease } = binding.value ?? {}
					if (duration !== undefined)
						el.style.setProperty("--roll-duration", `${duration}s`)
					if (ease) {
						const css = resolveEase(
							ease,
							nuxtApp.$gsap as Parameters<typeof resolveEase>[1]
						)
						if (css) el.style.setProperty("--roll-ease", css)
					}
				}

				const duplicate = createRow(text, "duplicate")
				const original = createRow(text, "original")

				el.dataset.rollHover = ""
				el.replaceChildren(duplicate, original)

				let hovering = false
				let finished = false

				const deactivate = () => {
					finished = false
					el.removeAttribute(ACTIVE_ATTR)
				}

				const onEnter = () => {
					hovering = true
					if (!el.hasAttribute(ACTIVE_ATTR)) el.setAttribute(ACTIVE_ATTR, "")
				}

				// Sortie : si le roll est terminé on revient au repos tout de suite,
				// sinon on le laisse finir (le retour se fait alors dans onEnd).
				const onLeave = () => {
					hovering = false
					if (finished || !el.hasAttribute(ACTIVE_ATTR)) deactivate()
				}

				const onEnd = (e: AnimationEvent) => {
					if (e.target !== original) return
					finished = true
					if (!hovering) deactivate()
				}

				const onCancel = (e: AnimationEvent) => {
					if (e.target !== original) return
					deactivate()
				}

				el.addEventListener("mouseenter", onEnter)
				el.addEventListener("mouseleave", onLeave)
				el.addEventListener("animationend", onEnd)
				el.addEventListener("animationcancel", onCancel)

				cleanups.set(el, () => {
					el.removeEventListener("mouseenter", onEnter)
					el.removeEventListener("mouseleave", onLeave)
					el.removeEventListener("animationend", onEnd)
					el.removeEventListener("animationcancel", onCancel)
				})
			},

			unmounted(el) {
				if (!import.meta.client) return
				cleanups.get(el)?.()
				cleanups.delete(el)
			},
		}

		nuxtApp.vueApp.directive("roll-hover", rollHover)
	},
})
