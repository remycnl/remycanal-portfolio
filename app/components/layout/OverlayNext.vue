<script lang="ts">
/**
 * Le ressenti du geste, réglé par un seul chiffre : `push`, l'effort de référence qu'il faut
 * pour aller au bout. Le reste en découle (voir DISTANCE).
 *
 * `push` ne dépend pas de l'écran : c'est TRAVEL qui convertit les pixels réellement parcourus
 * (molette ou doigt) en effort, selon la hauteur de la fenêtre.
 *
 * Plus la jauge est pleine, plus chaque pixel avance peu : le coût d'un pixel est
 * proportionnel à 1 + hardness × p². La jauge affichée suit l'effort via un ressort amorti,
 * de plus en plus mou vers la fin, et retombe quand on lâche.
 */
const FEEL = {
	push: 1500, // effort de référence pour atteindre l'aimant (≈ 15 crans de molette sur un écran moyen)
	hardness: 6, // la fin coûte 7× plus d'effort par pixel que le début
	maxStep: 100, // plafond par événement, en px bruts : un coup de molette ne saute pas l'effort
	keyStep: 60, // effort par événement clavier (↓, PageDown, End, Espace), répétition comprise
	stiffness: 190, // raideur du ressort d'affichage
	softening: 0.5, // le ressort s'assouplit de 50 % près de la fin
	damping: 0.92, // ratio d'amortissement (1 = critique, pas de rebond)
	idleDelay: 380, // ms sans geste avant que la jauge ne retombe
	touchIdleDelay: 650, // ms : au tactile, on laisse le temps de reposer le doigt entre deux glissés
	drainBase: 0.1, // retour par seconde, jauge presque vide
	drainGain: 1.6, // + ce qui s'ajoute avec le carré de la tension
	commit: 0.95, // au-delà, l'aimant prend et termine la course
	commitStiffness: 320, // raideur pendant la fin de course
	commitWatchdog: 1200, // ms : si la fin de course n'a pas abouti, on part quand même
	preload: 0.2, // à partir de là, on précharge la page suivante
	leaveFade: 260, // ms de fondu du contenu avant de changer de page
} as const

/**
 * Course pour aller au bout, selon l'entrée : une fraction de la hauteur d'écran, bornée.
 * Molette / trackpad : px de défilement. Tactile : px parcourus par le doigt.
 * Exemples tactile : petit téléphone ≈ 240 px, iPhone ≈ 290 px, tablette ≈ 400 px.
 */
const TRAVEL = {
	wheel: { ratio: 1.6, min: 900, max: 1800 },
	touch: { ratio: 0.42, min: 240, max: 400 },
} as const

/** Retour haptique discret : des crans réguliers pendant le geste, un cran plus ferme à l'aimant. */
const HAPTIC = {
	detents: 12, // crans entre 0 et l'aimant (ils s'espacent vers la fin, avec la dureté de la jauge)
	tick: 6, // ms de vibration par cran (Android)
	commit: 16, // ms de vibration à l'aimant (Android)
	minGap: 30, // ms minimum entre deux crans
	doubleGap: 50, // ms entre les deux tics de l'aimant (iOS ne module pas l'intensité)
} as const

type Haptics = { tick: () => void; commit: () => void }
let haptics: Haptics | null | undefined

/**
 * Créé à la demande, une seule fois, et seulement sur écran tactile.
 * Android : Vibration API, durées très courtes.
 * iOS Safari n'a pas de vibrate : un interrupteur natif (`<input switch>`) caché, activé par son
 * label, déclenche le retour haptique système (iOS 17.4+). Intensité fixe, légère.
 */
function getHaptics(): Haptics | null {
	if (haptics !== undefined) return haptics
	haptics = null
	if (!matchMedia("(pointer: coarse)").matches) return haptics

	let last = 0
	const allowed = () => {
		const now = performance.now()
		if (now - last < HAPTIC.minGap) return false
		last = now
		return true
	}

	if (typeof navigator.vibrate === "function") {
		haptics = {
			tick() {
				if (allowed()) navigator.vibrate(HAPTIC.tick)
			},
			commit() {
				last = performance.now()
				navigator.vibrate(HAPTIC.commit)
			},
		}
		return haptics
	}

	const label = document.createElement("label")
	label.setAttribute("aria-hidden", "true")
	label.style.cssText =
		"position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none"
	const input = document.createElement("input")
	input.type = "checkbox"
	input.setAttribute("switch", "")
	input.tabIndex = -1
	label.append(input)
	document.body.append(label)

	const fire = () => label.click()
	haptics = {
		tick() {
			if (allowed()) fire()
		},
		commit() {
			last = performance.now()
			fire()
			setTimeout(fire, HAPTIC.doubleGap)
		},
	}
	return haptics
}

/** Numéro de cran d'une position de jauge : de 0 à `detents`, atteint à l'aimant. */
const detentOf = (p: number) =>
	Math.min(HAPTIC.detents, Math.floor((p / FEEL.commit) * HAPTIC.detents))

/** Arrivée sur la page suivante : on la garantit en haut, quoi qu'il arrive. */
const PIN = {
	waitMax: 2000, // ms d'attente max que l'ancienne page disparaisse
	hold: 700, // ms pendant lesquelles on recale la page en haut
	wheelGrace: 450, // ms avant qu'une molette compte comme un geste volontaire (inertie)
} as const

/** Distance de base, déduite pour que atteindre `commit` coûte exactement `push` d'effort. */
const DISTANCE = FEEL.push / (FEEL.commit + (FEEL.hardness * FEEL.commit ** 3) / 3)

/** Tolérance en px pour considérer le bas de page atteint. */
const REACHED = 1.5

/** La physique de la jauge, sans DOM : un effort entre, une position lissée sort. */
class Gauge {
	goal = 0 // ce que le geste demande, de 0 à 1
	shown = 0 // position du ressort, ce qu'on affiche
	committed = false
	held = false // doigt posé : la jauge ne retombe pas
	private vel = 0
	private lastInput = 0
	private idle: number = FEEL.idleDelay
	private onCommit: () => void

	constructor(onCommit: () => void) {
		this.onCommit = onCommit
	}

	push(amount: number, now: number, idle: number = FEEL.idleDelay) {
		this.goal = Math.min(1, this.goal + amount / (DISTANCE * (1 + FEEL.hardness * this.goal ** 2)))
		this.lastInput = now
		this.idle = idle
	}

	/** Remonter relâche la jauge, sans résistance. */
	pull(amount: number, now: number) {
		this.goal = Math.max(0, this.goal - amount / DISTANCE)
		this.lastInput = now
	}

	/** Le doigt se lève : le délai avant retombée repart de zéro. */
	release(now: number) {
		this.held = false
		this.lastInput = now
	}

	commit() {
		if (this.committed) return
		this.committed = true
		this.onCommit()
	}

	reset() {
		this.committed = false
		this.goal = 0
	}

	step(now: number, dt: number, reduced: boolean) {
		if (!this.committed && this.goal >= FEEL.commit) this.commit()

		if (this.committed) {
			this.goal = 1
		} else if (!this.held && this.goal > 0 && now - this.lastInput > this.idle) {
			// Le rappel se tend avec la jauge : doux au début, vif près de la fin.
			this.goal = Math.max(0, this.goal - (FEEL.drainBase + FEEL.drainGain * this.goal ** 2) * dt)
		}

		if (reduced) {
			this.shown = this.goal
			this.vel = 0
			return
		}

		const k = this.committed
			? FEEL.commitStiffness
			: FEEL.stiffness * (1 - FEEL.softening * this.shown)
		const c = 2 * FEEL.damping * Math.sqrt(k)
		this.vel += (k * (this.goal - this.shown) - c * this.vel) * dt
		this.shown += this.vel * dt
		if (this.shown < 0 || this.shown > 1) {
			this.shown = this.shown < 0 ? 0 : 1
			this.vel = 0
		}
	}

	get complete() {
		return this.goal >= 1 && this.shown > 0.985
	}

	get settled() {
		return !this.committed && this.goal === 0 && this.shown < 0.001 && Math.abs(this.vel) < 0.01
	}

	/** Pose la jauge exactement à 0 ou 1, sans reste d'inertie. */
	land(value: 0 | 1) {
		this.shown = value
		this.vel = 0
	}
}

/**
 * Garantit l'arrivée tout en haut de la page suivante.
 *
 * 1. On attend que l'ancienne page ait disparu : scroller avant, c'est montrer son haut un
 *    instant. Une attente maximale évite de rester bloqué.
 * 2. On recale ensuite la fenêtre ET la feuille, à chaque frame, pendant `PIN.hold` ms. Cela
 *    absorbe l'inertie du geste, la restauration de scroll du navigateur, l'ancrage de scroll et
 *    les décalages de mise en page (polices, images).
 * 3. Le premier geste volontaire rend la main. La molette n'en est un qu'après `wheelGrace` :
 *    avant, c'est la fin de l'inertie du geste qui vient de déclencher le changement.
 *
 * `behavior: "instant"` : un `scroll-behavior: smooth` du site ne doit jamais ralentir ça.
 */
function pinToTop(oldGone: () => boolean, scroller: () => HTMLElement | null | undefined) {
	return new Promise<void>((resolve) => {
		const waitingSince = performance.now()
		let pinnedSince = 0
		const abort = new AbortController()

		const toTop = () => {
			const sheet = scroller()
			if (sheet && sheet.scrollTop > 0) {
				sheet.scrollTo({ top: 0, left: 0, behavior: "instant" })
			}
			if (window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: "instant" })
		}

		const finish = () => {
			abort.abort()
			resolve()
		}

		const frame = (now: number) => {
			if (!pinnedSince) {
				if (!oldGone() && now - waitingSince < PIN.waitMax) {
					requestAnimationFrame(frame)
					return
				}
				pinnedSince = now
				const options = { passive: true, signal: abort.signal } as const
				window.addEventListener("pointerdown", finish, options)
				window.addEventListener("touchstart", finish, options)
				window.addEventListener("keydown", (event) => !event.repeat && finish(), options)
				window.addEventListener(
					"wheel",
					() => performance.now() - pinnedSince > PIN.wheelGrace && finish(),
					options
				)
			}

			toTop()
			if (now - pinnedSince > PIN.hold) finish()
			else requestAnimationFrame(frame)
		}

		requestAnimationFrame(frame)
	})
}
</script>

<script lang="ts" setup>
import type { NextEntry } from "@/composables/useNextEntry"

const props = defineProps<{ next: NextEntry }>()

const { overlay } = useOverlay()
const inSheet = inject(OVERLAY_SHEET_KEY, false)
const arrival = useOverlayArrival()
const isDesktopPointer = useDesktopPointer()
const rootEl = useTemplateRef<HTMLElement>("rootEl")

/** Une seule source de vérité : le fondu CSS et l'attente du script durent exactement pareil. */
const fadeStyle = { "--leave-fade": `${FEEL.leaveFade}ms` }

const leavingNow = ref(false)
let leaving = false
let preloaded = false
let teardown: (() => void) | undefined
let fillGauge: (() => void) | undefined
let restoreGauge: ((hard: boolean) => void) | undefined

const pad = (value: number) => String(value).padStart(2, "0")
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches

/** Le contenu s'efface, la page suivante s'ouvre sous la même couleur, et on y arrive en haut. */
async function leave() {
	if (leaving) return
	leaving = true
	leavingNow.value = true

	const el = rootEl.value
	const target = props.next.path

	if (el) arrival.announce(getComputedStyle(el).backgroundColor)
	if (!prefersReducedMotion()) await sleep(FEEL.leaveFade)

	try {
		// `replace` garde l'historique propre : « fermer » revient à la page d'origine.
		const result = await navigateTo(target, { replace: inSheet })
		// Une navigation avortée ne lève pas d'erreur : elle renvoie un objet Error.
		if (result instanceof Error) throw result
	} catch {
		arrival.cancel()
		restoreGauge?.(false)
		leavingNow.value = false
		leaving = false
		return
	}

	// La page suivante est en place : on y arrive tout en haut. Si ce composant a été conservé
	// (même instance, nouvelles données), `props.next` a changé : l'ancienne page est « partie ».
	await pinToTop(
		() => !el || !el.isConnected || props.next.path !== target,
		() => overlay.scroller
	)

	restoreGauge?.(true)
	leavingNow.value = false
	leaving = false
}

function onClick(event: MouseEvent) {
	if (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return
	}
	event.preventDefault()
	// Le clic joue la fin de course de la jauge, puis `leave()` prend le relais.
	if (fillGauge) fillGauge()
	else void leave()
}

function preloadNext() {
	try {
		Promise.resolve(preloadRouteComponents(props.next.path)).catch(() => {})
	} catch {
		/* le préchargement reste facultatif */
	}
}

watch(
	() => props.next.path,
	() => {
		preloaded = false
	}
)

onMounted(() => {
	if (!rootEl.value) return
	const root: HTMLElement = rootEl.value
	const part = (name: string) =>
		root.querySelector<HTMLElement>(`[data-part="${name}"]`) as HTMLElement

	const stage = part("stage")
	const wrap = part("wrap")
	const inner = part("inner")
	const hint = part("hint")
	const cornerL = part("corner-l")
	const cornerR = part("corner-r")

	const reduced = prefersReducedMotion()
	let watchdog = 0

	const gauge = new Gauge(() => {
		// Garde-fou : si la fin de course n'aboutit pas (onglet figé, frame perdue), on part quand même.
		watchdog = window.setTimeout(() => {
			if (leaving) return
			gauge.land(1)
			paint(true)
			void leave()
		}, FEEL.commitWatchdog)
	})

	let previous = 0
	let frame = 0
	let span = 0 // largeur du titre, en px
	let touchY: number | null = null
	let lastP = -1
	let listeners: AbortController | undefined

	// Mesure du titre, hors du chemin chaud.
	const measure = () => {
		span = wrap.offsetWidth
	}
	measure()
	const resizeObserver = new ResizeObserver(measure)
	resizeObserver.observe(wrap)

	/**
	 * Gains pixels → effort, par type d'entrée. La course dépend de la hauteur d'écran, bornée.
	 * Recalculés au changement de largeur seulement (useViewportResize ignore les changements de
	 * hauteur seuls : la barre d'URL mobile qui apparaît ou disparaît ne déclenche rien).
	 */
	let wheelGain = 1
	let touchGain = 1
	const computeGains = () => {
		const h = window.innerHeight
		const travel = (kind: keyof typeof TRAVEL) =>
			Math.min(TRAVEL[kind].max, Math.max(TRAVEL[kind].min, h * TRAVEL[kind].ratio))
		wheelGain = FEEL.push / travel("wheel")
		touchGain = FEEL.push / travel("touch")
	}
	computeGains()
	const stopViewportResize = useViewportResize(computeGains)

	/** Pixels restants avant le bas de page. La feuille défile dans l'overlay, la fenêtre sinon. */
	function room() {
		const sheet = overlay.scroller
		const left = sheet
			? sheet.scrollHeight - sheet.clientHeight - sheet.scrollTop
			: document.documentElement.scrollHeight - window.innerHeight - window.scrollY
		return Math.max(0, left - REACHED)
	}

	/** Rendu : uniquement transform et opacity, écrits directement sur les éléments. */
	function paint(force = false) {
		const p = gauge.shown
		if (!force && Math.abs(p - lastP) < 0.0002) return
		lastP = p

		// Décalages entiers : le texte reste net en mouvement, et le bord de la révélation
		// tombe toujours sur un pixel franc.
		stage.style.transform = `translate3d(0,${Math.round(-p * 18)}px,0)`

		// Révélation du titre : le calque et son contenu glissent en sens inverse.
		// Sans mesure valide, on garde l'état initial (replié) plutôt que de tout révéler.
		if (!span) measure()
		if (span) {
			const d = Math.round((1 - p) * span)
			wrap.style.transform = `translate3d(${-d}px,0,0)`
			inner.style.transform = `translate3d(${d}px,0,0)`
		}

		hint.style.opacity = Math.max(0, 1 - p * 3.5).toFixed(3)

		// Les coins se redressent par mise à l'échelle, sans animer border-radius.
		const corner = `scale(${(1 - p).toFixed(4)})`
		cornerL.style.transform = corner
		cornerR.style.transform = corner
	}

	function run() {
		if (frame) return
		previous = performance.now()
		frame = requestAnimationFrame(tick)
	}

	function tick(now: number) {
		const dt = Math.min(0.033, (now - previous) / 1000)
		previous = now

		gauge.step(now, dt, reduced)

		if (!preloaded && gauge.shown > FEEL.preload) {
			preloaded = true
			preloadNext()
		}

		paint()

		if (gauge.complete) {
			frame = 0
			clearTimeout(watchdog)
			gauge.land(1)
			paint(true)
			void leave()
			return
		}

		if (gauge.settled) {
			frame = 0
			gauge.land(0)
			paint(true)
			return
		}

		frame = requestAnimationFrame(tick)
	}

	fillGauge = () => {
		if (leaving) return
		if (!gauge.committed) getHaptics()?.commit()
		gauge.commit()
		run()
	}

	restoreGauge = (hard) => {
		clearTimeout(watchdog)
		gauge.reset()
		if (hard) {
			gauge.land(0)
			paint(true)
		} else {
			run() // retombée en douceur
		}
	}

	/**
	 * `delta` positif : on descend. Le scroll natif consomme d'abord ce qu'il reste de page ;
	 * seul le surplus alimente la jauge. L'élan du scroll se prolonge donc dans le geste,
	 * sans seuil ni temps mort.
	 *
	 * `gain` convertit les pixels de l'entrée en effort (voir TRAVEL), `idle` fixe le délai avant
	 * que la jauge ne retombe. Le plafond `maxStep` s'applique au delta brut.
	 */
	function nudge(delta: number, gain = 1, idle?: number) {
		if (leaving || gauge.committed || delta === 0) return

		if (delta < 0) {
			if (gauge.goal <= 0) return
			gauge.pull(-delta * gain, performance.now())
			run()
			return
		}

		const overflow = delta - room()
		if (overflow <= 0) return
		gauge.push(Math.min(overflow, FEEL.maxStep) * gain, performance.now(), idle)
		run()
	}

	/**
	 * Haptique du geste tactile : un cran à chaque seuil franchi, dans les deux sens, et un cran
	 * plus ferme quand l'aimant prend. Seul le doigt en déclenche : la retombée de la jauge,
	 * une fois le doigt levé, reste silencieuse.
	 */
	function feel(from: number, to: number) {
		if (detentOf(from) === detentOf(to)) return
		const h = getHaptics()
		if (!h) return
		if (from < FEEL.commit && to >= FEEL.commit) h.commit()
		else h.tick()
	}

	// Entrées : écoutées seulement quand le panneau approche, toutes passives.
	const onWheel = (event: WheelEvent) => {
		if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
		const unit =
			event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
		nudge(event.deltaY * unit, wheelGain)
	}

	const onTouchStart = (event: TouchEvent) => {
		touchY = event.touches[0]?.clientY ?? null
		gauge.held = true
	}

	const onTouchMove = (event: TouchEvent) => {
		const y = event.touches[0]?.clientY
		if (y === undefined) return
		// Si l'écoute démarre en plein geste, le premier point sert de repère.
		if (touchY !== null) {
			const before = gauge.goal
			nudge(touchY - y, touchGain, FEEL.touchIdleDelay)
			feel(before, gauge.goal)
		}
		touchY = y
	}

	const onTouchEnd = () => {
		touchY = null
		gauge.release(performance.now())
	}

	const onKeydown = (event: KeyboardEvent) => {
		if (leaving || gauge.committed) return
		if (!["ArrowDown", "PageDown", "End", " "].includes(event.key)) return
		if (
			(event.target as HTMLElement | null)?.closest(
				"input, textarea, select, [contenteditable]"
			)
		) {
			return
		}
		// Au clavier, le défilement natif se charge de la page ; on ne compte qu'au bas.
		if (room() > 0) return
		gauge.push(FEEL.keyStep, performance.now())
		run()
	}

	function listen(on: boolean) {
		if (on === Boolean(listeners)) return
		if (!on) {
			listeners?.abort()
			listeners = undefined
			touchY = null
			gauge.release(performance.now())
			return
		}
		listeners = new AbortController()
		const options = { passive: true, signal: listeners.signal } as const
		window.addEventListener("wheel", onWheel, options)
		window.addEventListener("touchstart", onTouchStart, options)
		window.addEventListener("touchmove", onTouchMove, options)
		window.addEventListener("touchend", onTouchEnd, options)
		window.addEventListener("touchcancel", onTouchEnd, options)
		window.addEventListener("keydown", onKeydown, { signal: listeners.signal })
	}

	// Le panneau n'écoute le geste, et ne promeut ses calques, que lorsqu'il approche.
	const intersectionObserver = new IntersectionObserver(
		([entry]) => {
			if (!entry) return
			root.toggleAttribute("data-near", entry.isIntersecting)
			listen(entry.isIntersecting)
		},
		{ rootMargin: "20% 0px" }
	)
	intersectionObserver.observe(root)

	teardown = () => {
		cancelAnimationFrame(frame)
		clearTimeout(watchdog)
		listen(false)
		stopViewportResize()
		resizeObserver.disconnect()
		intersectionObserver.disconnect()
		fillGauge = undefined
		restoreGauge = undefined
	}
})

// Page conservée par un <KeepAlive> puis réaffichée : on repart d'un état propre.
onActivated(() => {
	leaving = false
	leavingNow.value = false
	restoreGauge?.(true)
})

onBeforeUnmount(() => teardown?.())
</script>

<template>
	<!--
		Le dernier écran de la page : un panneau à la couleur du texte, le texte à la couleur de la
		page. Un seul geste, une seule jauge : le titre se remplit de gauche à droite, bord net.
		Le script n'écrit que transform et opacity, sur les éléments marqués data-part.
	-->
	<section
		ref="rootEl"
		aria-label="Next"
		:data-leaving="leavingNow || undefined"
		:style="fadeStyle"
		class="next-panel group relative isolate mt-20 grid min-h-svh place-items-center bg-(--overlay-content-color) text-(--overlay-surface) lg:mt-32"
	>
		<span data-part="corner-l" class="corner corner-l" aria-hidden="true" />
		<span data-part="corner-r" class="corner corner-r" aria-hidden="true" />

		<NuxtLink
			:to="next.path"
			class="px-edge py-[clamp(4rem,10vw,8rem)] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset"
			@click="onClick"
		>
			<span data-part="stage" class="grid justify-items-center gap-10 text-center">
				<span class="font-vg5000 flex gap-8 text-xs tracking-widest uppercase opacity-55">
					<span>Next</span>
					<span>{{ pad(next.index) }} / {{ pad(next.total) }}</span>
				</span>

				<!-- Le titre est la jauge : une seconde copie, en pleine couleur, est révélée de gauche à droite. -->
				<span
					class="font-lineal-bold relative block w-fit max-w-[14em] text-[clamp(2.5rem,1.3rem+4.8vw,6.5rem)] leading-none tracking-[-0.03em] text-balance"
				>
					<span
						class="block opacity-25 transition-opacity duration-300 ease-out group-hover:opacity-40"
					>
						{{ next.title }}
					</span>
					<span data-part="wrap" aria-hidden="true" class="wrap">
						<span data-part="inner" class="inner block">{{ next.title }}</span>
					</span>
				</span>

				<span
					data-part="hint"
					class="font-vg5000 grid justify-items-center gap-4 text-xs tracking-widest uppercase"
					aria-hidden="true"
				>
					<span class="cue" />
					<span class="opacity-55 transition-opacity duration-300 group-hover:opacity-100">
						{{ isDesktopPointer ? "Keep scrolling" : "Keep swiping" }}
					</span>
				</span>
			</span>
		</NuxtLink>
	</section>
</template>

<style scoped>
/*
 * Règle de ce fichier : on n'anime que transform et opacity (compositor), jamais un layout
 * ni un paint. Les états initiaux ci-dessous sont ceux du rendu serveur, et du script avant
 * le premier geste.
 */
.next-panel {
	--radius: 2rem;
}

/* Les calques ne sont promus que lorsque le panneau approche de l'écran. */
[data-near] [data-part="stage"],
[data-near] .wrap,
[data-near] .inner,
[data-near] .corner {
	will-change: transform;
}

/* Départ : le contenu s'efface sur la durée exacte que le script attend (--leave-fade),
   et le lien ne reçoit plus de clic. */
[data-part="stage"] {
	transition: opacity var(--leave-fade, 260ms) ease-out;
}

[data-leaving] [data-part="stage"] {
	opacity: 0;
}

[data-leaving] a {
	pointer-events: none;
}

/* Coins : le négatif de l'arrondi, à la couleur de la page. Mis à l'échelle de 1 à 0, ils
   redressent le panneau sans jamais toucher à border-radius. */
.corner {
	position: absolute;
	top: 0;
	z-index: 10;
	width: var(--radius);
	height: var(--radius);
	pointer-events: none;
}

.corner-l {
	left: 0;
	transform-origin: 0 0;
	background: radial-gradient(
		circle at 100% 100%,
		transparent calc(var(--radius) - 0.5px),
		var(--overlay-surface) calc(var(--radius) + 0.5px)
	);
}

.corner-r {
	right: 0;
	transform-origin: 100% 0;
	background: radial-gradient(
		circle at 0 100%,
		transparent calc(var(--radius) - 0.5px),
		var(--overlay-surface) calc(var(--radius) + 0.5px)
	);
}

/* Révélation à bord net : le calque, aussi large que le titre, glisse vers la droite ; son
   contenu glisse en sens inverse, donc le texte ne bouge pas. État initial : tout est replié
   hors du titre. */
.wrap {
	position: absolute;
	inset: -0.2em 0;
	overflow: hidden;
	transform: translate3d(-100%, 0, 0);
}

.inner {
	padding-block: 0.2em;
	transform: translate3d(100%, 0, 0);
}

/* Invitation : un trait qui s'écoule, le seul mouvement spontané. */
.cue {
	display: block;
	width: 1px;
	height: 2rem;
	background: currentColor;
	animation: cue 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

@keyframes cue {
	0% {
		transform: scaleY(0);
		transform-origin: top;
	}
	45% {
		transform: scaleY(1);
		transform-origin: top;
	}
	55% {
		transform: scaleY(1);
		transform-origin: bottom;
	}
	100% {
		transform: scaleY(0);
		transform-origin: bottom;
	}
}

@media (prefers-reduced-motion: reduce) {
	[data-part="stage"] {
		transition: none;
	}

	.cue {
		animation: none;
		transform: scaleY(0.5);
	}
}
</style>