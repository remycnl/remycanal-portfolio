import type { Directive } from "vue"

interface TypewriterOptions {
	/** Vitesse de frappe en caractères/seconde. Plus haut = plus rapide. */
	speed?: number
	/** Variation aléatoire du timing entre chaque caractère (0 = régulier, 1 = très irrégulier). Simule une frappe humaine. */
	jitter?: number
	/**
	 * Point de déclenchement ScrollTrigger. Si omis, calculé automatiquement selon la
	 * taille d'écran au moment du montage (voir getResponsiveTrigger). Ne le fixe que
	 * si tu veux forcer un comportement précis indépendant de l'appareil.
	 */
	start?: string
	/** Point de fin ScrollTrigger. Même logique que `start` : calculé automatiquement si omis. */
	end?: string
	/** Si true, l'animation ne joue qu'une fois (au premier passage). Si false, rejoue à chaque entrée/sortie du viewport. */
	once?: boolean
	/** Thème de couleur du curseur clignotant. Doit correspondre à un token défini dans CURSOR_THEME_COLORS. */
	theme?: "lime" | "violet" | "white" | "black"
	/** Couleur custom du curseur, prioritaire sur `theme` si fournie. */
	cursorColor?: string
	/** Largeur du curseur en pixels. */
	cursorWidth?: number
	/** Délai en secondes entre le démarrage de chaque bloc de texte quand il y en a plusieurs (effet de cascade). */
	childStagger?: number
	/** Si true, traite tout l'élément comme un seul bloc de texte au lieu de découper par enfants. */
	singlePhrase?: boolean
}

const CURSOR_THEME_COLORS: Record<"lime" | "violet" | "white" | "black", string> = {
	lime: "var(--color-lime, #c6ff33)",
	violet: "var(--color-violet, #6840ff)",
	white: "var(--color-white, #f4f4f4)",
	black: "var(--color-black, #201e1e)",
}

const RESPONSIVE_TRIGGERS = {
	mobile: { start: "top 88%", end: "bottom 15%" },
	tablet: { start: "top 84%", end: "bottom 18%" },
	desktop: { start: "top 80%", end: "bottom 20%" },
} as const

function getResponsiveTrigger(): { start: string; end: string } {
	const width = window.innerWidth
	if (width < 640) return RESPONSIVE_TRIGGERS.mobile
	if (width < 1024) return RESPONSIVE_TRIGGERS.tablet
	return RESPONSIVE_TRIGGERS.desktop
}

interface RevealState {
	ctx?: any
	stForward?: any
	stBackward?: any
	cursors: HTMLElement[]
	timelines: (any | undefined)[]
	responsive: boolean
}

const STATE = new WeakMap<HTMLElement, RevealState>()
const RESPONSIVE_STATES = new Set<RevealState>()

let responsiveResizeSubscribed = false

function ensureResponsiveResizeSubscription(ScrollTrigger: any) {
	if (responsiveResizeSubscribed) return
	responsiveResizeSubscribed = true

	useViewportResize(() => {
		const next = getResponsiveTrigger()
		let changed = false

		RESPONSIVE_STATES.forEach((state) => {
			if (state.stForward?.vars && state.stForward.vars.start !== next.start) {
				state.stForward.vars.start = next.start
				changed = true
			}
			if (state.stBackward?.vars && state.stBackward.vars.end !== next.end) {
				state.stBackward.vars.end = next.end
				changed = true
			}
		})

		if (changed) ScrollTrigger.refresh()
	})
}

export default defineNuxtPlugin({
	name: "text-reveal",
	setup(nuxtApp) {
		const textReveal: Directive<HTMLElement, TypewriterOptions> = {
			getSSRProps() {
				return { style: { opacity: 0 } }
			},

			...(import.meta.client
				? {
						mounted(el, binding) {
							if (STATE.has(el)) return
							initTypewriter(el, binding.value ?? {})
						},

						unmounted(el) {
							const state = STATE.get(el)
							state?.stForward?.kill()
							state?.stBackward?.kill()
							state?.ctx?.revert()
							state?.cursors?.forEach((c) => c.remove())
							if (state) RESPONSIVE_STATES.delete(state)
							STATE.delete(el)
						},
					}
				: {}),
		}

		async function initTypewriter(el: HTMLElement, options: TypewriterOptions) {
			const responsive = !options.start && !options.end
			const state: RevealState = { cursors: [], timelines: [], responsive }
			STATE.set(el, state)

			el.style.opacity = "0"

			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				el.style.opacity = "1"
				return
			}

			if (document.fonts?.ready) await document.fonts.ready

			const {
				$gsap: gsap,
				$ScrollTrigger: ScrollTrigger,
				$SplitText: SplitText,
			} = useNuxtApp()

			const responsiveTrigger = getResponsiveTrigger()

			const {
				speed = 38,
				jitter = 0.55,
				start = responsiveTrigger.start,
				end = responsiveTrigger.end,
				once = true,
				theme = "lime",
				cursorColor,
				cursorWidth = 8,
				childStagger = 0.08,
				singlePhrase = false,
			} = options

			const resolvedCursorColor = cursorColor ?? CURSOR_THEME_COLORS[theme]
			const blocks = singlePhrase ? [el] : getTextBlocks(el)

			const ctx = gsap.context(() => {
				const readyBlocks = new Set<number>()

				blocks.forEach((block, i) => {
					if (getComputedStyle(block).position === "static") {
						block.style.position = "relative"
					}

					SplitText.create(block, {
						type: "chars",
						charsClass: "text-reveal-char",
						autoSplit: true,

						onSplit(self: any) {
							state.cursors[i]?.remove()
							const cursor = createCursor(block, resolvedCursorColor, cursorWidth)
							state.cursors[i] = cursor

							const childTl = buildTypingTimeline(gsap, self.chars, cursor, {
								speed,
								jitter,
								delay: i * childStagger,
							})

							state.timelines[i] = childTl
							readyBlocks.add(i)

							if (readyBlocks.size === blocks.length && !state.stForward) {
								el.style.opacity = "1"

								const playAll = () => state.timelines.forEach((tl) => tl?.play(0))
								const resetAll = () => state.timelines.forEach((tl) => tl?.pause(0))

								state.stForward = ScrollTrigger.create({
									trigger: el,
									start,
									end: "bottom top",
									once,
									onEnter: playAll,
									onLeave: once ? undefined : resetAll,
								})

								if (!once) {
									state.stBackward = ScrollTrigger.create({
										trigger: el,
										start: "top bottom",
										end,
										onEnterBack: playAll,
										onLeaveBack: resetAll,
									})
								}

								if (state.responsive) {
									RESPONSIVE_STATES.add(state)
									ensureResponsiveResizeSubscription(ScrollTrigger)
								}
							}

							return childTl
						},
					})
				})
			}, el)

			state.ctx = ctx
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

function createCursor(el: HTMLElement, color: string, width: number) {
	const cursor = document.createElement("span")
	cursor.className = "text-reveal-cursor"
	cursor.setAttribute("aria-hidden", "true")

	Object.assign(cursor.style, {
		position: "absolute",
		top: "0",
		left: "0",
		width: `${width}px`,
		display: "block",
		background: color,
		opacity: "0",
		pointerEvents: "none",
		willChange: "transform, opacity",
		borderRadius: "1px",
	})

	el.appendChild(cursor)
	return cursor
}

function buildTypingTimeline(
	gsap: any,
	chars: HTMLElement[],
	cursor: HTMLElement,
	options: { speed: number; jitter: number; delay: number }
) {
	const { speed, jitter, delay } = options
	const baseDuration = 1 / speed

	const positions = chars.map((char) => ({
		x: char.offsetLeft,
		y: char.offsetTop,
		width: char.offsetWidth,
		height: char.offsetHeight,
	}))

	gsap.set(chars, { autoAlpha: 0 })
	gsap.set(cursor, { autoAlpha: 0 })

	const tl = gsap.timeline({
		paused: true,
		delay,
		onComplete() {
			cursor.style.willChange = "auto"
		},
	})

	tl.set(cursor, { autoAlpha: 1 }, 0)

	let cursorTime = 0
	const lastPosition = positions[positions.length - 1]

	chars.forEach((char, i) => {
		const pos = positions[i]
		if (!pos) return

		const randomFactor = 1 + (Math.random() * 2 - 1) * jitter
		let charTime = Math.max(baseDuration * randomFactor, 0.008)
		if (char.textContent === " ") charTime += baseDuration * 1.4

		tl.set(cursor, { x: pos.x, y: pos.y, height: pos.height }, cursorTime)

		const revealDuration = Math.min(0.02, charTime * 0.3)
		const revealStart =
			cursorTime + Math.max(charTime - revealDuration - 0.002, charTime * 0.55)

		tl.to(char, { autoAlpha: 1, duration: revealDuration, ease: "none" }, revealStart)

		cursorTime += charTime
	})

	if (lastPosition) {
		tl.set(
			cursor,
			{ x: lastPosition.x + lastPosition.width, y: lastPosition.y },
			cursorTime
		)
	}

	tl.to(cursor, { autoAlpha: 0, duration: 0.25 }, cursorTime + 0.15)

	return tl
}
