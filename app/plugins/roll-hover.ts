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
 * Le texte n'existe qu'une seule fois dans le DOM (SEO, lecteurs d'écran, copier-coller, textContent).
 * La seconde ligne du roll est un pseudo-élément `::before` qui affiche `data-roll-text` : du contenu
 * généré par CSS, qui n'est ni du texte du DOM ni sélectionnable, et dont l'alternative vide
 * (`/ ""`) le cache aussi aux lecteurs d'écran.
 *
 * Tout le style statique et l'animation sont en CSS :
 * - `transform` est animé par le compositeur (thread GPU), donc fluide même si le thread principal est chargé ;
 * - aucun `will-change` : le navigateur promeut déjà le calque pendant une animation de transform,
 *   et un `will-change` permanent coûterait un calque par lien.
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
[data-roll-hover]>[data-roll-row],
[data-roll-hover]::before{
	display:block;
	grid-area:1/1;
	padding-block:var(--roll-bleed);
	margin-block:calc(-1 * var(--roll-bleed));
	text-box:inherit;
}
[data-roll-hover]::before{
	content:attr(data-roll-text);
	content:attr(data-roll-text) / "";
	transform:translateY(-100%);
}
[data-roll-active]>[data-roll-row]{
	animation:roll-out var(--roll-duration) var(--roll-ease) forwards;
}
[data-roll-active]::before{
	animation:roll-in var(--roll-duration) var(--roll-ease) forwards;
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

const ROW_SELECTOR = ":scope > [data-roll-row]"

/**
 * Déplace (sans copier) le contenu existant dans une seule ligne : le texte et ses éventuels
 * enfants restent les mêmes nœuds, donc rien n'est dupliqué et rien n'est recréé.
 */
function wrapContent(el: HTMLElement) {
	const row = document.createElement("span")
	row.dataset.rollRow = ""
	row.append(...Array.from(el.childNodes))
	el.append(row)
	return row
}

/** Le pseudo-élément lit son texte dans cet attribut : il doit suivre le label. */
function syncText(el: HTMLElement, row: HTMLElement) {
	el.dataset.rollText = row.textContent?.trim() ?? ""
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

				const row = wrapContent(el)
				syncText(el, row)
				el.dataset.rollHover = ""

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

				// Seule l'animation de la ligne compte : celle du pseudo-élément a e.target === el.
				const isRow = (e: AnimationEvent) =>
					e.target instanceof HTMLElement && e.target.dataset.rollRow !== undefined

				const onEnd = (e: AnimationEvent) => {
					if (!isRow(e)) return
					finished = true
					if (!hovering) deactivate()
				}

				const onCancel = (e: AnimationEvent) => {
					if (!isRow(e)) return
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

			// Le label peut changer : on garde le pseudo-élément à jour (et on remet la ligne si Vue l'a écrasée).
			updated(el) {
				if (!import.meta.client || !el.hasAttribute("data-roll-hover")) return
				const row = el.querySelector<HTMLElement>(ROW_SELECTOR) ?? wrapContent(el)
				syncText(el, row)
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
