/**
 * Compagnon félin animé, en singleton partagé par toute l'application.
 *
 * Spritesheet attendue : 19 frames, une seule ligne :
 *   [0..5]   idle    (6 frames)
 *   [6..9]   run A   (4 frames)
 *   [10..11] jump    (2 frames : montée, descente)
 *   [12..18] run B   (7 frames)
 *
 * La course est un cycle logique de 11 frames reconstitué à partir de run A + run B.
 * Toutes les variantes de couleur doivent partager exactement le même découpage.
 *
 * Fonctionnement
 * - `useCatZone` déclare les zones (blocs) sur lesquelles le chat peut vivre. Il garantit
 *   lui-même l'existence du singleton : n'importe quelle page peut l'appeler en premier.
 * - Une seule boucle de décision : le chat attend, puis soit va au bord de sa zone et saute vers une
 *   zone voisine (trajectoire balistique, anticipation et réception), soit fait un aller-retour
 *   dans sa zone. Les zones sont visitées à tour de rôle (les moins récentes d'abord).
 * - Bulles : chaque réplique naît au-dessus de la tête du chat et y RESTE (elle ne suit pas le chat),
 *   sans recouvrir le chat ni une autre bulle, et au-dessus de tout le reste. Répliques par situation (survol, caresse, clics,
 *   fuite, course, atterrissage, scroll rapide, retour d'onglet...) + répliques propres à chaque zone.
 * - Course : vitesse proportionnelle à la taille du chat, démarrage / freinage progressifs, et cadence
 *   des pattes calée sur la vitesse réelle (pas de glissement).
 * - Tout ce qui est temporisé passe par GSAP (tweens + delayedCall) : on peut donc tout mettre
 *   en pause d'un coup (onglet inactif, hero recouvert) et reprendre exactement où l'on en était.
 * - Zones « page » (host = body) : le chat suit le scroll en sautant de zone en zone.
 *   Zones « host » (hero sticky) : le chat vit dans le conteneur et suit son épinglage.
 */

import { effectScope, isRef, onMounted, onUnmounted, toValue, unref, watch } from "vue"
import type { EffectScope, MaybeRefOrGetter, Ref } from "vue"

/* -------------------------------------------------------------------------------------------------
 * Types publics
 * ---------------------------------------------------------------------------------------------- */

type ElementRef = Readonly<Ref<HTMLElement | null>>

export interface UseSpriteOptions {
	spriteSrc?: string
	totalFrames?: number
	frameWidth?: number
	frameHeight?: number
	/**
	 * Rendu pixel art : pas de lissage, taille calée sur une échelle entière du sprite (pixels tous
	 * identiques, jamais flous). Par défaut : détecté (frames de 128 px de haut ou moins, affichées
	 * au moins à leur taille native).
	 */
	pixelArt?: boolean
	/** Hauteur d'affichage en px. Par défaut : responsive (80 px dès 1024 px, 40 à 70 px en dessous). */
	displayHeight?: MaybeRefOrGetter<number>

	idleFps?: number

	/**
	 * Vitesse de croisière de la course, en hauteurs de chat par seconde : elle suit la taille du chat
	 * (même allure à 40 px qu'à 80 px). Chaque trajet varie de ±20 % (trot ↔ galop).
	 */
	runSpeed?: number
	/**
	 * Distance couverte par un cycle complet de l'animation de course, en hauteurs de chat. Règle la
	 * cadence des pattes pour une vitesse donnée : si les pattes semblent glisser vers l'avant, augmenter ;
	 * vers l'arrière, diminuer.
	 */
	runStride?: number
	pauseMin?: number
	pauseMax?: number
	/** Longueur d'un aller-retour, en fraction de la largeur parcourable de la zone. */
	legMin?: number
	legMax?: number
	/** Probabilité d'un bond au départ d'une course. */
	hopChance?: number
	/** Probabilité, à chaque décision, de sauter vers une zone voisine (si balade active). */
	jumpChance?: number
	/** Temps max (ms) passé sur une même zone : au-delà, le chat part forcément vers une autre. */
	maxStay?: number
	/** Gravité des sauts, en hauteurs de chat par seconde² (proportionnelle à la taille affichée). */
	jumpGravity?: number

	/** Part du viewport (haut/bas) à partir de laquelle le chat quitte le bord lors d'un scroll. */
	scrollTriggerRatio?: number

	/** Couleur du texte des bulles par défaut (surchargée par le `textColorClass` de la zone). */
	textColorClass?: MaybeRefOrGetter<string>
	/** Répliques par situation : remplace la liste par défaut de chaque situation fournie. */
	phrases?: Partial<CatPhrases>

	/** Balade autonome entre les zones (activée par défaut, surchargeable par zone). */
	wander?: MaybeRefOrGetter<boolean>
}

export interface RegisterZoneOptions {
	spriteSrc?: string
	order?: number
	textColorClass?: string
	minWidth?: number
	maxWidth?: number
	isInitial?: boolean
	/**
	 * Conteneur positionné (relative, sticky...) dans lequel le chat vit tant qu'il est sur cette zone.
	 * Pour un bloc épinglé (hero sticky, effet rideau) : le chat est monté dans le conteneur, il suit
	 * son épinglage et passe sous ce qui le recouvre. Par défaut : document.body (coordonnées de page).
	 * Si le host porte l'attribut `data-covered`, le chat se met en pause (pas de dessin, pas de balade).
	 */
	host?: HTMLElement | ElementRef | null
	/** z-index du chat dans son host (défaut 40). Les bulles restent à 41. */
	zIndex?: number
	/** Surcharge de la balade autonome pour cette zone (par défaut : option globale `wander`). */
	wander?: boolean
	/** Répliques propres à cette zone, mêlées aux répliques génériques (arrivée, survol, atterrissage, repos). */
	phrases?: readonly string[]
}

export interface CatZoneHandle {
	unregister: () => void
}

export interface ResponsiveZoneEntry {
	zone: ElementRef
	textColorClass?: string
	spriteSrc?: string
	/** Voir RegisterZoneOptions.phrases. */
	phrases?: readonly string[]
}

export interface ResponsiveZoneGroup {
	minWidth?: number
	maxWidth?: number
	/** Zone sur laquelle le chat apparaît en premier (sinon : la première zone active, par ordre). */
	initial?: ElementRef
	/** Voir RegisterZoneOptions.host. */
	host?: ElementRef
	/** Voir RegisterZoneOptions.zIndex. */
	zIndex?: number
	/** Voir RegisterZoneOptions.wander. */
	wander?: boolean
	/** Répliques par défaut des zones du groupe (une entrée peut avoir les siennes). */
	phrases?: readonly string[]
	zones: ResponsiveZoneEntry[]
}

export interface CatSprite {
	registerZone: (el: HTMLElement, options?: RegisterZoneOptions) => CatZoneHandle
	resync: () => void
	destroy: () => void
}

/* -------------------------------------------------------------------------------------------------
 * Types et constantes internes
 * ---------------------------------------------------------------------------------------------- */

interface ZoneProfile {
	order: number
	spriteSrc?: string
	textColorClass?: string
	minWidth?: number
	maxWidth?: number
	isInitial?: boolean
	host?: HTMLElement
	zIndex?: number
	wander?: boolean
	phrases?: readonly string[]
}

interface Zone {
	el: HTMLElement
	profiles: ZoneProfile[]
}

/** Géométrie d'une zone dans le repère du chat (page ou host), + origine de ce repère dans le viewport. */
interface ZoneRect {
	left: number
	top: number
	width: number
	height: number
	originX: number
	originY: number
}

interface Candidate {
	zone: Zone
	x: number
	y: number
	dist: number
	/** La zone touche la zone courante par un côté. */
	adjacent: boolean
}

interface CandidateQuery {
	/** Marge (px) à garder entre l'atterrissage et les bords du viewport (zones « page » ; ignorée dans un host). */
	margin: number
	/** Ne garde que les zones au-dessus / en dessous du chat. */
	direction?: "up" | "down"
	/** Décale aléatoirement le point d'atterrissage (trajectoires moins mécaniques). */
	jitter?: boolean
}

type AnimMode = "idle" | "run" | "jump"
type Phase = "idle" | "walk" | "hop" | "jump"
type SuspendReason = "background" | "covered"

const DEFAULT_SPRITE_SRC = "/sprites/cat-black-light.png"
const DEFAULT_Z_INDEX = 40
const BUBBLE_Z_INDEX = 41
const DESKTOP_MIN_WIDTH = 1024
/** Plafond du ratio de pixels : les téléphones (3x) doivent être rendus nativement, sinon le canvas est flou. */
const MAX_DPR = 3
/** Sprite considéré comme du pixel art (échelle entière, pas de lissage) si sa frame ne dépasse pas cette hauteur. */
const PIXEL_ART_MAX_FRAME_PX = 128
/** Écart de taille toléré (en proportion) pour caler le chat sur une échelle entière de son sprite. */
const PIXEL_SNAP_TOLERANCE = 0.15

const RESIZE_DEBOUNCE_MS = 150
const SOFT_RESIZE_HEIGHT_THRESHOLD = 140
const HOST_COVERED_ATTRIBUTE = "data-covered"

const MIN_LEG_PX = 24
const OFFSCREEN_RECHECK_S = 1.2
const FOLLOW_COOLDOWN_MS = 250
/** Marge d'atterrissage au scroll = scrollTriggerRatio + ceci (le chat n'est pas re-déclenché en atterrissant). */
const FOLLOW_MARGIN_EXTRA = 0.05
const WANDER_MARGIN_PX = 8
/** Dans un host : part de la hauteur du chat qui peut dépasser du viewport à l'atterrissage. */
const HOST_VISIBILITY_TOLERANCE = 0.3

/** Zones voisines : écart toléré (en hauteurs de chat) et recouvrement minimal (px) le long du côté commun. */
const ADJACENT_GAP_HEIGHTS = 0.75
const ADJACENT_MIN_OVERLAP_PX = 24
/** Poids de tirage d'une zone jamais visitée / visitée à l'instant ; la récupération prend VISIT_RECOVERY_S par unité. */
const NEVER_VISITED_WEIGHT = 3
const RECENT_VISIT_WEIGHT = 0.3
const VISIT_RECOVERY_S = 8

/** Course : montée en vitesse puis freinage, en secondes (indépendants de la longueur du trajet). */
const RUN_ACCEL_S = 0.16
const RUN_DECEL_S = 0.3
/** Variation de vitesse d'un trajet à l'autre, autour de runSpeed. */
const RUN_SPEED_MIN = 0.8
const RUN_SPEED_MAX = 1.2
/** Cadence des pattes à l'arrêt de la course, en fraction de la cadence de croisière (évite des pattes figées). */
const GAIT_RATE_FLOOR = 0.45
/** Distance de course minimale (en hauteurs de chat) pour qu'un bond de départ ait un sens. */
const MIN_HOP_LEG_HEIGHTS = 1.6
/** Avant un saut depuis l'arrêt : le chat court d'abord jusqu'au bord si celui-ci est plus loin que ça. */
const APPROACH_MIN_HEIGHTS = 0.8

/** Saut : hauteur de l'apex en hauteurs de chat, bornée, proportionnelle à la distance. */
const JUMP_RISE_MIN = 0.3
const JUMP_RISE_MAX = 1.8
const JUMP_RISE_RATIO = 0.25
const HOP_RISE_MIN = 0.2
const HOP_RISE_MAX = 0.35
/** Écrasement vertical (1 = aucun) : anticipation avant le saut, réception après un saut / un bond. */
const CROUCH_DEPTH = 0.88
const CROUCH_SECONDS = 0.1
const LANDING_SQUASH = 0.86
const HOP_SQUASH = 0.94
const LANDING_PAUSE_MIN_S = 0.15
const LANDING_PAUSE_MAX_S = 0.9

/** Bulles. */
const MAX_BUBBLES = 3
/** Espace entre une bulle et la tête du chat / entre deux bulles / avec le bord du viewport (px). */
const BUBBLE_GAP_PX = 10
const BUBBLE_PADDING_PX = 6
const BUBBLE_EDGE_PX = 6
const BUBBLE_HOLD_BASE_S = 1.3
const BUBBLE_HOLD_PER_CHAR_S = 0.05
const RECENT_PHRASES = 8

/** Répliques spontanées : délai minimum entre deux, et probabilité à chaque occasion. */
const SPONTANEOUS_COOLDOWN_MIN_S = 4
const SPONTANEOUS_COOLDOWN_MAX_S = 8
const IDLE_CHATTER_CHANCE = 0.16
const RUN_CHATTER_CHANCE = 0.1
const LANDING_CHATTER_CHANCE = 0.3
const ZONE_PHRASE_CHANCE = 0.4
const HELLO_DELAY_S = 0.7

/** Interactions. */
const PURR_DELAY_S = 1.4
/** Un chat caressé reste en place jusqu'à cette durée, puis reprend sa vie. */
const HOVER_HOLD_MS = 3500
const REPEAT_HOVER_WINDOW_MS = 20000
const CLICK_WINDOW_MS = 3500
const ANNOYED_CLICKS = 3
const FURIOUS_CLICKS = 6
const CLICK_SQUASH = 0.92
const FLEE_SPEED_FACTOR = 1.5
const BACK_MIN_HIDDEN_MS = 5000
const FAST_SCROLL_PX_S = 1500

/* -------------------------------------------------------------------------------------------------
 * Utilitaires
 * ---------------------------------------------------------------------------------------------- */

function range(start: number, count: number) {
	return Array.from({ length: count }, (_, i) => start + i)
}

function rand(min: number, max: number) {
	return min + Math.random() * (max - min)
}

function clamp(min: number, max: number, value: number) {
	return Math.min(Math.max(value, min), max)
}

function isRectUsable(rect: DOMRect) {
	return (
		rect.width > 0 &&
		rect.height > 0 &&
		Number.isFinite(rect.top) &&
		Number.isFinite(rect.left)
	)
}

function profileRangeWidth(profile: ZoneProfile) {
	const min = profile.minWidth ?? Number.NEGATIVE_INFINITY
	const max = profile.maxWidth ?? Number.POSITIVE_INFINITY
	return max - min
}

/* -------------------------------------------------------------------------------------------------
 * Bulles : répliques
 * ---------------------------------------------------------------------------------------------- */

export type PhraseKind =
	| "hello"
	| "hover"
	| "hoverAgain"
	| "chase"
	| "purr"
	| "poke"
	| "annoyed"
	| "furious"
	| "landing"
	| "run"
	| "idle"
	| "scroll"
	| "back"

export type CatPhrases = Record<PhraseKind, readonly string[]>

/**
 * Répliques par situation. ASCII uniquement : la police des bulles est une police pixel qui n'a pas
 * forcément les accents, les flèches ni les points de suspension typographiques.
 */
const DEFAULT_PHRASES: CatPhrases = {
	// Le chat apparaît (premier affichage, nouvelle page).
	hello: [
		"Hello!",
		"Peek-a-boo!",
		"Surprise!",
		"Oh, a visitor!",
		"Welcome in!",
		"Meow!",
		"Hi! I live here.",
		"Did you miss me?",
	],
	// Le curseur arrive sur le chat.
	hover: [
		"Meow!",
		"Mrrp?",
		"Hi there!",
		"Oh, hello!",
		"Psst... hi!",
		"You found me!",
		"Mew?",
		"Looking for me?",
		"Hey, human!",
		"Meeeow.",
		"Nice cursor.",
		"Yes? Can I help you?",
	],
	// Le curseur revient peu de temps après.
	hoverAgain: [
		"Back again?",
		"Missed me?",
		"Still here!",
		"You again!",
		"Again? Fine.",
		"You like me, huh?",
		"Fan club member?",
		"Told you I'd stay.",
	],
	// Le curseur arrive pendant que le chat court ou saute.
	chase: [
		"Catch me!",
		"Too slow!",
		"Zoom zoom!",
		"Can't stop now!",
		"Not now, running!",
		"Gotta go fast!",
		"Try and catch me!",
		"Wheee!",
		"Nope, busy!",
	],
	// Le curseur reste posé sur le chat : caresse.
	purr: [
		"Purrrr...",
		"Mmm, right there.",
		"More, please.",
		"Don't stop...",
		"Purr mode: on.",
		"Best day ever.",
		"Prrrrrr.",
		"You may continue.",
		"Ok, you're allowed.",
	],
	// Clic.
	poke: [
		"Grrr!",
		"Hey!",
		"Hsss!",
		"Rude!",
		"Paws off!",
		"Mrow!",
		"Boop!",
		"That tickles!",
		"Ouch!",
		"Excuse me?",
		"Meow!",
		"Personal space!",
	],
	// Plusieurs clics d'affilée.
	annoyed: [
		"Okay, stop!",
		"Enough!",
		"I'm warning you...",
		"Hsssss!",
		"Seriously?",
		"Quit poking!",
		"Not the ears!",
		"I have claws, you know.",
		"Last warning.",
		"What did I do?",
	],
	// Trop de clics : il s'enfuit.
	furious: [
		"That's it. I'm out!",
		"Mercy!",
		"I quit!",
		"Hsssss! Bye!",
		"Call my lawyer!",
		"*dramatic sigh*",
		"Done. Leaving.",
		"I'm telling the dog!",
	],
	// Après un saut.
	landing: [
		"Nailed it!",
		"Ta-da!",
		"Nine lives, baby.",
		"Stuck the landing!",
		"Wheee!",
		"Smooth.",
		"Perfect ten.",
		"Easy.",
		"Cat-like reflexes.",
		"Did you see that?",
	],
	// Départ en course.
	run: [
		"Zoom!",
		"Vroom!",
		"Brrrm!",
		"Chasing nothing.",
		"Gotta go fast!",
		"Zoomies!",
		"Running late!",
		"Cardio day.",
		"3 AM energy!",
	],
	// Moment calme.
	idle: [
		"zzz...",
		"*yawn*",
		"Nap time?",
		"Is it lunch yet?",
		"Watching pixels.",
		"*stretches*",
		"So many blocks...",
		"Any treats?",
		"Meow?",
		"I'm not lost. You are.",
		"Pixel life is good.",
		"*licks paw*",
		"Is that a bird?",
		"Staring at nothing.",
	],
	// Scroll rapide : le chat doit suivre.
	scroll: [
		"Whoa, slow down!",
		"Hold on tight!",
		"Easy on the scroll!",
		"Wheee!",
		"Follow me!",
		"Hey, wait for me!",
		"Where are we going?",
	],
	// L'onglet redevient actif.
	back: [
		"You're back!",
		"Missed you!",
		"Where did you go?",
		"Oh, hi again!",
		"Welcome back!",
		"I stayed right here.",
		"Took you long enough.",
	],
}

/** Situations où une réplique propre à la zone peut remplacer une réplique générique. */
const ZONE_PHRASE_KINDS: ReadonlySet<PhraseKind> = new Set<PhraseKind>([
	"hello",
	"hover",
	"hoverAgain",
	"landing",
	"idle",
])

function timeOfDayLine() {
	const hour = new Date().getHours()
	if (hour >= 5 && hour < 12) return "Good morning!"
	if (hour >= 12 && hour < 18) return "Good afternoon!"
	if (hour >= 18 && hour < 23) return "Good evening!"
	return "Still awake? Same."
}

interface Box {
	left: number
	top: number
	width: number
	height: number
}

function boxesOverlap(a: Box, b: Box, padding = 0) {
	return (
		a.left < b.left + b.width + padding &&
		a.left + a.width + padding > b.left &&
		a.top < b.top + b.height + padding &&
		a.top + a.height + padding > b.top
	)
}

function createBubble(text: string, colorClass: string) {
	const el = document.createElement("div")
	el.textContent = text
	el.setAttribute("aria-hidden", "true")
	el.className = `font-vg5000 pointer-events-none select-none text-center text-sm ${colorClass}`.trim()
	Object.assign(el.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: String(BUBBLE_Z_INDEX),
		width: "max-content",
		maxWidth: "min(16rem, 80vw)",
		textWrap: "balance",
		opacity: "0",
	})
	return el
}

/* -------------------------------------------------------------------------------------------------
 * Singleton
 * ---------------------------------------------------------------------------------------------- */

const NOOP_SPRITE: CatSprite = {
	registerZone: () => ({ unregister() {} }),
	resync() {},
	destroy() {},
}

let instance: CatSprite | null = null
let instanceScope: EffectScope | null = null

/**
 * Retourne le singleton (créé au premier appel, les options des appels suivants sont ignorées).
 * Les watchers internes vivent dans un scope détaché : ils survivent au démontage du composant
 * qui a déclenché la création.
 */
export function useSprite(options: UseSpriteOptions = {}): CatSprite {
	if (import.meta.server) return NOOP_SPRITE

	if (!instance) {
		instanceScope = effectScope(true)
		instance = instanceScope.run(() => createSprite(options)) ?? NOOP_SPRITE
	}

	return instance
}

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		instance?.destroy()
		instanceScope?.stop()
		instance = null
		instanceScope = null
	})
}

/* -------------------------------------------------------------------------------------------------
 * useCatZone
 * ---------------------------------------------------------------------------------------------- */

export function useCatZone(elRef: ElementRef, zoneOptions?: RegisterZoneOptions): void
export function useCatZone(groups: Record<string, ResponsiveZoneGroup>): void
export function useCatZone(
	arg1: ElementRef | Record<string, ResponsiveZoneGroup>,
	zoneOptions: RegisterZoneOptions = {}
) {
	if (import.meta.server) return

	// Garantit le singleton, quelle que soit la page (ou le composant) montée en premier.
	const sprite = useSprite()
	const handles: CatZoneHandle[] = []

	onMounted(() => {
		if (isRef(arg1)) {
			if (arg1.value) handles.push(sprite.registerZone(arg1.value, zoneOptions))
			return
		}

		let orderCursor = 0

		for (const group of Object.values(arg1)) {
			const groupOrderStart = orderCursor

			group.zones.forEach((entry, index) => {
				const el = entry.zone.value
				if (!el) return

				handles.push(
					sprite.registerZone(el, {
						order: groupOrderStart + index,
						textColorClass: entry.textColorClass,
						spriteSrc: entry.spriteSrc,
						minWidth: group.minWidth,
						maxWidth: group.maxWidth,
						isInitial: group.initial ? group.initial.value === el : false,
						host: group.host,
						zIndex: group.zIndex,
						wander: group.wander,
						phrases: entry.phrases ?? group.phrases,
					})
				)
			})

			orderCursor += group.zones.length
		}
	})

	onUnmounted(() => {
		for (const handle of handles) handle.unregister()
		handles.length = 0
	})
}

/* -------------------------------------------------------------------------------------------------
 * Implémentation
 * ---------------------------------------------------------------------------------------------- */

function createSprite(options: UseSpriteOptions): CatSprite {
	const { gsap } = useGsap()

	type Tween = ReturnType<typeof gsap.to>
	type Timeline = ReturnType<typeof gsap.timeline>
	type Bubble = {
		el: HTMLElement
		/** Conteneur où la bulle vit (le chat peut changer de host entre-temps). */
		parent: HTMLElement
		/** Emplacement dans le repère du chat ; la bulle n'en bouge plus. */
		box: Box
		anim: Tween | Timeline
		dismissing: boolean
	}

	const phrases: CatPhrases = { ...DEFAULT_PHRASES, ...options.phrases }

	const {
		spriteSrc = DEFAULT_SPRITE_SRC,
		totalFrames = 19,

		idleFps = 5,

		runSpeed = 3.4,
		runStride = 2.4,
		pauseMin = 600,
		pauseMax = 2600,
		legMin = 0.2,
		legMax = 0.8,
		hopChance = 0.25,
		jumpChance = 0.45,
		maxStay = 9000,
		jumpGravity = 35,

		scrollTriggerRatio = 0.15,
		textColorClass = "text-black",

		wander = true,
	} = options

	const FRAMES: Record<AnimMode, readonly number[]> = {
		idle: range(0, 6),
		run: [...range(6, 4), ...range(12, 7)],
		jump: range(10, 2),
	}

	/* ------------------------------------------------------------------ DOM */

	const canvas = document.createElement("canvas")
	canvas.setAttribute("aria-hidden", "true")
	Object.assign(canvas.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: String(DEFAULT_Z_INDEX),
		willChange: "transform, opacity",
		pointerEvents: "none",
		cursor: "pointer",
		opacity: "0",
		transition: "opacity 0.15s ease",
	})

	document.body.append(canvas)

	const ctx = canvas.getContext("2d")

	const applyCanvasX = gsap.quickSetter(canvas, "x", "px") as (value: number) => void
	const applyCanvasY = gsap.quickSetter(canvas, "y", "px") as (value: number) => void

	/**
	 * Cale une coordonnée sur un pixel physique de l'écran. Un canvas posé à une position fractionnaire
	 * est ré-échantillonné par le navigateur : c'est ce qui le rend flou, surtout sur mobile.
	 */
	function snap(value: number) {
		return Math.round(value * dpr) / dpr
	}

	function setCanvasX(x: number) {
		applyCanvasX(snap(x))
	}

	function setPosition(x: number, y: number) {
		applyCanvasX(snap(x))
		applyCanvasY(snap(y))
	}

	function getX() {
		return Number(gsap.getProperty(canvas, "x")) || 0
	}

	function getY() {
		return Number(gsap.getProperty(canvas, "y")) || 0
	}

	/* ---------------------------------------------------------------- métriques */

	const viewport = { width: window.innerWidth, height: window.innerHeight }

	function resolveDpr() {
		return Math.min(window.devicePixelRatio || 1, MAX_DPR)
	}

	function resolveDisplayHeight() {
		if (options.displayHeight !== undefined) return toValue(options.displayHeight)
		if (viewport.width >= DESKTOP_MIN_WIDTH) return 80
		return Math.round(clamp(40, 70, viewport.width * 0.12))
	}

	let dpr = resolveDpr()
	let frameW = 0
	let frameH = 0
	/** Hauteur demandée (px CSS), puis taille réellement affichée : calée sur des pixels physiques entiers. */
	let requestedH = resolveDisplayHeight()
	let displayW = 0
	let displayH = requestedH

	const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
	let motionReduced = reducedMotionQuery.matches

	/* --------------------------------------------------------------------- état */

	const state = {
		mode: "idle" as AnimMode,
		facing: -1 as 1 | -1,
		frame: 0,
	}
	/** Écrasement vertical à l'atterrissage, appliqué au dessin (le canvas n'a aucune transform CSS). */
	const squash = { y: 1 }

	const zones = new Map<HTMLElement, Zone>()
	let zoneOrderCounter = 0
	let currentZone: Zone | null = null
	/** Dernier passage du chat sur chaque zone : sert à les visiter à tour de rôle. */
	const lastVisitAt = new Map<Zone, number>()
	let zoneSince = performance.now()
	let jumpTarget: Zone | null = null
	/** Host de la zone courante (mis en cache par mountSprite), null = repère de page. */
	let currentHost: HTMLElement | null = null
	let parked = true

	let phase: Phase = "idle"
	let motion: Tween | undefined
	let squashTween: Tween | undefined
	let nextAction: Tween | undefined
	let purrCall: Tween | undefined

	let animationElapsed = 0
	/** Cadence de croisière des pattes (images/s) du trajet en cours, et facteur instantané (accélération / freinage). */
	let gaitFps = (FRAMES.run.length * runSpeed) / runStride
	let gaitRate = 1

	/* Bulles et interactions */
	const bubbles = new Set<Bubble>()
	const recentPhrases: string[] = []
	let bubbleColorClass = toValue(textColorClass)
	let nextSpontaneousAt = 0
	let hovering = false
	let hoverSince = 0
	let lastHoverAt = Number.NEGATIVE_INFINITY
	let hiddenAt = 0
	/** Réplique à dire à l'atterrissage du saut en cours (ex. scroll rapide). */
	let landingLine: PhraseKind | null = null
	const clickTimes: number[] = []

	const suspensions = new Set<SuspendReason>()

	function isSuspended() {
		return suspensions.size > 0
	}

	function isMoving() {
		return phase !== "idle"
	}

	/* --------------------------------------------------------------- sprites */

	const spriteCache = new Map<string, HTMLImageElement>()
	let activeImage: HTMLImageElement | null = null
	let activeSpriteSrc: string | null = null
	let imageLoaded = false

	function loadSprite(src: string): Promise<HTMLImageElement> {
		const cached = spriteCache.get(src)
		if (cached) return Promise.resolve(cached)

		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => {
				spriteCache.set(src, img)
				resolve(img)
			}
			img.onerror = reject
			img.src = src
		})
	}

	function setSpriteImage(img: HTMLImageElement, src: string) {
		activeImage = img
		activeSpriteSrc = src
		frameW = options.frameWidth ?? img.naturalWidth / totalFrames
		frameH = options.frameHeight ?? img.naturalHeight
		imageLoaded = true
		setupCanvas()
		settle()
		draw()
	}

	function applySpriteFor(zone: Zone) {
		const src = activeProfile(zone)?.spriteSrc ?? spriteSrc
		if (src === activeSpriteSrc) return

		loadSprite(src)
			.then((img) => {
				if (currentZone === zone) setSpriteImage(img, src)
			})
			.catch(() => console.warn(`[useSprite] Impossible de charger le sprite : ${src}`))
	}

	/* --------------------------------------------------------------- dessin */

	/**
	 * Dimensionne le canvas en pixels PHYSIQUES : un pixel du canvas = un pixel d'écran, sans aucun
	 * ré-échantillonnage par le navigateur. Pour du pixel art, la taille est calée sur une échelle entière
	 * du sprite (tous les pixels ont la même taille) quand cela reste proche de la taille demandée.
	 */
	function setupCanvas() {
		if (!ctx || !frameW || !frameH) return

		const wantedH = requestedH * dpr
		const ratio = wantedH / frameH
		const pixelArt = options.pixelArt ?? (frameH <= PIXEL_ART_MAX_FRAME_PX && ratio >= 1)

		let backingH = Math.max(1, Math.round(wantedH))
		if (pixelArt && ratio >= 1) {
			const integerH = frameH * Math.max(1, Math.round(ratio))
			if (Math.abs(integerH - wantedH) / wantedH <= PIXEL_SNAP_TOLERANCE) backingH = integerH
		}
		const backingW = Math.max(1, Math.round(backingH * (frameW / frameH)))

		displayH = backingH / dpr
		displayW = backingW / dpr

		canvas.width = backingW
		canvas.height = backingH
		canvas.style.width = `${displayW}px`
		canvas.style.height = `${displayH}px`
		// Filet de sécurité : si le navigateur doit quand même mettre à l'échelle (zoom en cours), pas de bavure.
		canvas.style.imageRendering = pixelArt ? "pixelated" : "auto"

		ctx.imageSmoothingEnabled = !pixelArt
		ctx.imageSmoothingQuality = "high"
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
	}

	function draw() {
		if (!imageLoaded || !ctx || !activeImage || !displayW) return

		const frames = FRAMES[state.mode]
		const sheetIndex = frames[state.frame % frames.length] ?? frames[0] ?? 0

		ctx.clearRect(0, 0, displayW, displayH)
		ctx.save()

		if (squash.y !== 1) {
			// Écrasement ancré aux pattes (bas du canvas).
			ctx.translate(0, displayH)
			ctx.scale(1, squash.y)
			ctx.translate(0, -displayH)
		}

		if (state.facing === -1) {
			ctx.translate(displayW, 0)
			ctx.scale(-1, 1)
		}

		// Rectangle source aligné sur des pixels entiers : pas de bavure de la frame voisine.
		ctx.drawImage(
			activeImage,
			Math.round(sheetIndex * frameW),
			0,
			Math.floor(frameW),
			frameH,
			0,
			0,
			displayW,
			displayH
		)
		ctx.restore()
	}

	function setMode(mode: AnimMode) {
		if (state.mode === mode) return
		state.mode = mode
		state.frame = 0
		animationElapsed = 0
		draw()
	}

	function tick(_time: number, deltaMs: number) {
		if (isSuspended()) return


		// En saut, les frames sont pilotées par la trajectoire (montée / descente).
		if (motionReduced || !imageLoaded || state.mode === "jump") return

		const frames = FRAMES[state.mode]
		if (frames.length <= 1) return

		const frameDuration = 1000 / (state.mode === "idle" ? idleFps : gaitFps * gaitRate)
		animationElapsed += deltaMs
		if (animationElapsed < frameDuration) return

		animationElapsed %= frameDuration
		state.frame = (state.frame + 1) % frames.length
		draw()
	}

	/* ------------------------------------------------------- couleur des bulles */

	/** Couleur des prochaines bulles : celle de la zone du chat (une bulle garde la sienne). */
	function updateBubbleTextColor(zone: Zone | null) {
		bubbleColorClass =
			(zone ? activeProfile(zone)?.textColorClass : undefined) ?? toValue(textColorClass)
	}

	updateBubbleTextColor(null)

	/* ------------------------------------------------------------------ zones */

	function activeProfile(zone: Zone): ZoneProfile | undefined {
		let best: ZoneProfile | undefined
		let bestRangeWidth = Number.POSITIVE_INFINITY

		for (const profile of zone.profiles) {
			if (profile.minWidth !== undefined && viewport.width < profile.minWidth) continue
			if (profile.maxWidth !== undefined && viewport.width > profile.maxWidth) continue

			const rangeWidth = profileRangeWidth(profile)
			if (!best || rangeWidth < bestRangeWidth) {
				best = profile
				bestRangeWidth = rangeWidth
			}
		}

		return best
	}

	function isZoneActive(zone: Zone) {
		return activeProfile(zone) !== undefined
	}

	/** Host de la zone (conteneur dans lequel vit le chat), ou null pour le repère de page. */
	function hostOf(zone: Zone | null): HTMLElement | null {
		return (zone && activeProfile(zone)?.host) || null
	}

	/**
	 * Origine du repère du chat, en coordonnées viewport.
	 * Page : (-scrollX, -scrollY). Host : coin du padding box du host, qui bouge avec lui
	 * (hero sticky), si bien que les coordonnées des zones relatives au host restent stables.
	 */
	function originOf(host: HTMLElement | null) {
		if (!host) return { x: -window.scrollX, y: -window.scrollY }
		const rect = host.getBoundingClientRect()
		return { x: rect.left + host.clientLeft, y: rect.top + host.clientTop }
	}

	/** Null si la zone n'est pas rendue (détachée, display:none, taille nulle). */
	function measureZone(zone: Zone): ZoneRect | null {
		if (!zone.el.isConnected) return null

		const rect = zone.el.getBoundingClientRect()
		if (!isRectUsable(rect)) return null

		const origin = originOf(hostOf(zone))
		return {
			left: rect.left - origin.x,
			top: rect.top - origin.y,
			width: rect.width,
			height: rect.height,
			originX: origin.x,
			originY: origin.y,
		}
	}

	function isZoneUsable(zone: Zone) {
		return zones.has(zone.el) && isZoneActive(zone) && measureZone(zone) !== null
	}

	/** Plage de déplacement du bord gauche du chat, et ordonnée du sol (le chat marche sur le bas de la zone). */
	function travelOf(rect: ZoneRect) {
		return {
			minX: rect.left,
			maxX: rect.left + Math.max(rect.width - displayW, 0),
			groundY: rect.top + rect.height - displayH,
		}
	}

	function pickInitialZone(): Zone | null {
		let fallback: Zone | null = null
		let fallbackOrder = Number.POSITIVE_INFINITY

		for (const zone of zones.values()) {
			const profile = activeProfile(zone)
			if (!profile || measureZone(zone) === null) continue
			if (profile.isInitial) return zone

			if (profile.order < fallbackOrder) {
				fallback = zone
				fallbackOrder = profile.order
			}
		}

		return fallback
	}

	/* ------------------------------------------------------- montage / visibilité */

	const hostObserver = new MutationObserver(() => syncCoveredState())

	function syncCoveredState() {
		setSuspended("covered", currentHost?.hasAttribute(HOST_COVERED_ATTRIBUTE) ?? false)
	}

	function observeHost(host: HTMLElement | null) {
		hostObserver.disconnect()
		if (host) {
			hostObserver.observe(host, {
				attributes: true,
				attributeFilter: [HOST_COVERED_ATTRIBUTE],
			})
		}
		syncCoveredState()
	}

	/**
	 * Monte le chat (et ses bulles) dans le host de la zone, ou dans <body> sans host.
	 * Idempotent : sans effet si le parent est déjà le bon.
	 */
	function mountSprite(zone: Zone | null) {
		const host = hostOf(zone)
		const parent = host ?? document.body

		if (canvas.parentElement !== parent) {
			if (import.meta.dev && host && getComputedStyle(host).position === "static") {
				console.warn(
					"[useSprite] Le host d'une zone doit être positionné (relative, sticky, ...) :",
					host
				)
			}
			parent.append(canvas)
		}

		const profile = zone ? activeProfile(zone) : undefined
		canvas.style.zIndex = String(profile?.zIndex ?? DEFAULT_Z_INDEX)

		if (host !== currentHost) {
			currentHost = host
			observeHost(host)
		}
	}

	function showSprite() {
		canvas.style.opacity = "1"
		canvas.style.pointerEvents = "auto"
	}

	function hideSprite() {
		resetTransientState()
		canvas.style.opacity = "0"
		canvas.style.pointerEvents = "none"
	}

	function parkSprite() {
		if (parked) return
		parked = true
		hideSprite()
		mountSprite(null)
		setPosition(0, 0)
	}

	function activateZone(zone: Zone) {
		currentZone = zone
		markVisit(zone)
		zoneSince = performance.now()
		mountSprite(zone)
		applySpriteFor(zone)
		updateBubbleTextColor(zone)
	}

	/* ------------------------------------------------- pause / reprise globales */

	function ownedAnimations() {
		return [
			motion,
			nextAction,
			squashTween,
			purrCall,
			...[...bubbles].map((bubble) => bubble.anim),
		].filter((animation): animation is Tween | Timeline => animation !== undefined)
	}

	/**
	 * Suspend ou reprend toute l'activité du chat. Plusieurs raisons peuvent se cumuler :
	 * l'activité ne reprend que quand elles ont toutes disparu.
	 */
	function setSuspended(reason: SuspendReason, on: boolean) {
		const wasSuspended = isSuspended()

		if (on) suspensions.add(reason)
		else suspensions.delete(reason)

		if (wasSuspended === isSuspended()) return
		if (isSuspended()) freeze()
		else thaw()
	}

	function freeze() {
		for (const animation of ownedAnimations()) animation.pause()
	}

	function thaw() {
		resetScrollTracking()

		for (const animation of ownedAnimations()) animation.resume()
		// Filet de sécurité : si plus rien n'est programmé, on relance la boucle de décision.
		if (!motion && !nextAction) scheduleNext()

		// Un resize a pu avoir lieu pendant la pause : on rattrape, hors de la pile d'appel courante.
		requestAnimationFrame(reconcileViewport)
	}

	function reconcileViewport() {
		if (isSuspended()) return
		if (
			window.innerWidth !== viewport.width ||
			window.innerHeight !== viewport.height ||
			resolveDpr() !== dpr
		) {
			commitViewportChange()
		}
	}

	/* -------------------------------------------------------- remise à zéro */

	function killMotion() {
		motion?.kill()
		motion = undefined
		squashTween?.kill()
		squashTween = undefined
		squash.y = 1
	}

	function clearNextAction() {
		nextAction?.kill()
		nextAction = undefined
	}

	function resetTransientState() {
		clearNextAction()
		killMotion()
		purrCall?.kill()
		purrCall = undefined
		clearBubbles()

		phase = "idle"
		jumpTarget = null
	}

	/** Interrompt le mouvement en cours. Un saut en vol peut être terminé instantanément sur sa cible. */
	function abortMotion(landOnTarget = false) {
		const target = jumpTarget
		const wasJumping = phase === "jump"

		killMotion()
		phase = "idle"
		jumpTarget = null

		if (landOnTarget && wasJumping && target && isZoneUsable(target)) activateZone(target)
	}

	/* ---------------------------------------------------------- placement */

	/** Recale le chat dans les bornes de sa zone (après un resize, un layout shift, un atterrissage). */
	function settle() {
		if (!currentZone || isMoving()) return

		const rect = measureZone(currentZone)
		if (!rect) return

		const { minX, maxX, groundY } = travelOf(rect)
		const x = clamp(minX, maxX, getX())
		if (!Number.isFinite(x) || !Number.isFinite(groundY)) return

		setPosition(x, groundY)
	}

	function placeInZone(zone: Zone, preferredX?: number): boolean {
		const rect = measureZone(zone)
		if (!rect) return false

		const { minX, maxX, groundY } = travelOf(rect)
		const x = preferredX === undefined ? (minX + maxX) / 2 : clamp(minX, maxX, preferredX)
		if (!Number.isFinite(x) || !Number.isFinite(groundY)) return false

		const appearing = parked

		resetTransientState()
		activateZone(zone)

		setPosition(x, groundY)
		parked = false
		setMode("idle")
		draw()
		showSprite()

		resetScrollTracking()
		scheduleNext()

		if (appearing) gsap.delayedCall(HELLO_DELAY_S, () => say("hello"))
		return true
	}

	/**
	 * Point d'entrée unique de (re)synchronisation : zone courante invalide → on en choisit une autre,
	 * aucune zone → le chat est rangé, sinon simple recalage. Coalescé sur une frame : appelé par le
	 * ResizeObserver, l'enregistrement/désenregistrement des zones et le chargement du sprite.
	 */
	let syncFrame = 0

	function scheduleSync() {
		if (syncFrame) return
		syncFrame = requestAnimationFrame(() => {
			syncFrame = 0
			syncPlacement()
		})
	}

	function syncPlacement() {
		if (!imageLoaded) return

		if (currentZone && !isZoneUsable(currentZone)) {
			abortMotion()
			clearNextAction()
			currentZone = null
		}

		if (!currentZone) {
			const zone = pickInitialZone()
			if (!zone || !placeInZone(zone)) parkSprite()
			return
		}

		mountSprite(currentZone)
		settle()
	}

	/** Resynchronisation complète (changement de viewport, de taille du chat, retour d'onglet long...). */
	function resync() {
		refreshMetrics()
		resetScrollTracking()
		abortMotion(true)
		clearNextAction()

		syncPlacement()

		if (currentZone && !parked) {
			setMode("idle")
			scheduleNext()
		}
	}

	function refreshMetrics() {
		viewport.width = window.innerWidth
		viewport.height = window.innerHeight

		const nextDpr = resolveDpr()
		const nextHeight = resolveDisplayHeight()
		if (nextDpr === dpr && nextHeight === requestedH) return

		dpr = nextDpr
		requestedH = nextHeight
		setupCanvas()
		draw()
	}

	/* ------------------------------------------------- candidats de déplacement */

	function isLandingVisible(rect: ZoneRect, x: number, y: number, margin: number) {
		const left = rect.originX + x
		const top = rect.originY + y
		return (
			left >= 0 &&
			left + displayW <= viewport.width &&
			top >= margin &&
			top + displayH <= viewport.height - margin
		)
	}

	/** Deux zones sont voisines si elles se touchent (ou presque) par un côté, sur une longueur suffisante. */
	function isAdjacent(a: ZoneRect, b: ZoneRect) {
		const tolerance = displayH * ADJACENT_GAP_HEIGHTS
		const minOverlap = Math.max(ADJACENT_MIN_OVERLAP_PX, displayW * 0.5)

		const gapX = Math.max(b.left - (a.left + a.width), a.left - (b.left + b.width))
		const gapY = Math.max(b.top - (a.top + a.height), a.top - (b.top + b.height))
		const overlapX = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
		const overlapY = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)

		return (
			(gapX <= tolerance && overlapY >= minOverlap) ||
			(gapY <= tolerance && overlapX >= minOverlap)
		)
	}

	/**
	 * Zones atteignables depuis la zone courante : même repère (host), rendues, atterrissage visible.
	 * Dans un host (hero), le chat peut dépasser un peu du viewport : le sol d'un bloc collé au bas de
	 * l'écran reste un atterrissage valide (sinon les blocs du bas ne seraient jamais visités).
	 */
	function collectCandidates(query: CandidateQuery): Candidate[] {
		if (!currentZone) return []

		const host = hostOf(currentZone)
		const rects = new Map<Zone, ZoneRect>()

		for (const zone of zones.values()) {
			if (!isZoneActive(zone) || hostOf(zone) !== host) continue
			const rect = measureZone(zone)
			if (rect) rects.set(zone, rect)
		}

		const fromRect = rects.get(currentZone)
		if (!fromRect) return []

		const margin = host ? -displayH * HOST_VISIBILITY_TOLERANCE : query.margin
		const fromX = getX()
		const fromY = getY()
		const spread = query.jitter ? displayW * 1.2 : 0
		const candidates: Candidate[] = []

		for (const [zone, rect] of rects) {
			if (zone === currentZone) continue

			const { minX, maxX, groundY } = travelOf(rect)
			if (query.direction === "down" && groundY <= fromY + 1) continue
			if (query.direction === "up" && groundY >= fromY - 1) continue

			const x = clamp(minX, maxX, fromX + rand(-spread, spread))
			if (!isLandingVisible(rect, x, groundY, margin)) continue

			candidates.push({
				zone,
				x,
				y: groundY,
				dist: Math.hypot(x - fromX, groundY - fromY),
				adjacent: isAdjacent(fromRect, rect),
			})
		}

		return candidates
	}

	function nearest(candidates: Candidate[]): Candidate | null {
		let best: Candidate | null = null
		for (const candidate of candidates) {
			if (!best || candidate.dist < best.dist) best = candidate
		}
		return best
	}

	/** Voisines d'abord ; s'il n'y en a aucune de visible (layout atypique), les deux zones visibles les plus proches. */
	function preferNeighbours(candidates: Candidate[]): Candidate[] {
		const neighbours = candidates.filter((candidate) => candidate.adjacent)
		if (neighbours.length > 0) return neighbours
		return [...candidates].sort((a, b) => a.dist - b.dist).slice(0, 2)
	}

	function markVisit(zone: Zone | null) {
		if (zone) lastVisitAt.set(zone, performance.now())
	}

	/**
	 * Tirage parmi les zones voisines, pondéré par l'ancienneté de la dernière visite : une zone jamais
	 * visitée est favorisée, celle que le chat vient de quitter l'est très peu. Résultat : il fait le
	 * tour de tous les blocs au lieu de rebondir entre deux.
	 */
	function pickWanderTarget(): Candidate | null {
		const pool = preferNeighbours(
			collectCandidates({ margin: WANDER_MARGIN_PX, jitter: true })
		)
		if (pool.length === 0) return null

		const now = performance.now()
		const weights = pool.map((candidate) => {
			const visitedAt = lastVisitAt.get(candidate.zone)
			if (visitedAt === undefined) return NEVER_VISITED_WEIGHT
			const ageSeconds = (now - visitedAt) / 1000
			return clamp(
				RECENT_VISIT_WEIGHT,
				NEVER_VISITED_WEIGHT,
				RECENT_VISIT_WEIGHT + ageSeconds / VISIT_RECOVERY_S
			)
		})

		let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0)
		for (const [i, candidate] of pool.entries()) {
			roll -= weights[i]!
			if (roll <= 0) return candidate
		}

		return pool[pool.length - 1]!
	}

	function followMargin() {
		return viewport.height * (scrollTriggerRatio + FOLLOW_MARGIN_EXTRA)
	}

	/** Zone visible où le chat revient quand il est hors écran : la plus proche du centre de l'écran, là où l'on regarde. */
	function pickRelocationTarget(): Candidate | null {
		const candidates = collectCandidates({ margin: followMargin(), jitter: true })
		const origin = originOf(currentHost)
		const centerY = viewport.height / 2

		let best: Candidate | null = null
		let bestGap = Number.POSITIVE_INFINITY
		for (const candidate of candidates) {
			const gap = Math.abs(origin.y + candidate.y + displayH / 2 - centerY)
			if (gap < bestGap) {
				best = candidate
				bestGap = gap
			}
		}

		return best
	}

	function relocateTo(target: Candidate) {
		abortMotion()
		markVisit(currentZone)
		if (!placeInZone(target.zone, target.x)) scheduleNext()
	}

	/**
	 * Le chat est hors écran (scroll rapide) : au lieu de se téléporter, il rejoint la zone visible d'un
	 * vrai saut, qui entre par le bord de l'écran du côté d'où il vient. La partie hors écran du trajet
	 * est invisible : on ne voit que l'arc final, à une vitesse normale.
	 */
	function leapIn(target: Candidate, timeScale = 1) {
		if (motionReduced) return relocateTo(target)

		const origin = originOf(currentHost)
		const viewTop = -origin.y
		const viewBottom = viewTop + viewport.height
		const fromAbove = getY() + displayH / 2 < (viewTop + viewBottom) / 2

		let startY = fromAbove ? viewTop - displayH * 1.5 : viewBottom + displayH * 0.5
		// Pas de bavure sous le bas du document : un canvas posé plus bas agrandirait la page.
		if (!currentHost) {
			startY = Math.min(startY, (document.documentElement.scrollHeight || Number.POSITIVE_INFINITY) - displayH)
		}

		const spread = Math.min(viewport.width * 0.25, 280)
		const startX = clamp(
			-origin.x,
			-origin.x + viewport.width - displayW,
			target.x + rand(-spread, spread)
		)

		if (!jumpTo(target.zone, target.x, timeScale, true, { x: startX, y: startY })) {
			relocateTo(target)
		}
	}

	function isCatInViewport() {
		const rect = canvas.getBoundingClientRect()
		return (
			rect.bottom > 0 &&
			rect.top < viewport.height &&
			rect.right > 0 &&
			rect.left < viewport.width
		)
	}

	/* ------------------------------------------------------------ mouvement */

	/**
	 * Trajectoire balistique : x linéaire, y = parabole réelle (gravité constante) passant par
	 * le point de départ, l'apex (`rise` px au-dessus du plus haut des deux points) et l'arrivée.
	 * La durée en découle : un grand saut dure plus longtemps qu'un petit, comme dans la réalité.
	 */
	function flyTo(plan: {
		x: number
		y: number
		rise: number
		timeScale?: number
		onLand: () => void
	}): Tween {
		const { x: toX, y: toY, rise, timeScale = 1, onLand } = plan

		const fromX = getX()
		const fromY = getY()
		const gravity = displayH * jumpGravity
		const apexY = Math.min(fromY, toY) - rise

		const riseTime = Math.sqrt((2 * (fromY - apexY)) / gravity)
		const fallTime = Math.sqrt((2 * (toY - apexY)) / gravity)
		const flightTime = riseTime + fallTime
		const launchVelocity = -gravity * riseTime

		const flight = { progress: 0 }
		let apexReached = false

		setMode("jump")

		return gsap.to(flight, {
			progress: 1,
			duration: flightTime / timeScale,
			ease: "none",
			onUpdate() {
				const t = flight.progress * flightTime
				setPosition(
					fromX + (toX - fromX) * flight.progress,
					fromY + launchVelocity * t + 0.5 * gravity * t * t
				)

				if (!apexReached && t >= riseTime) {
					apexReached = true
					state.frame = 1
					draw()
				}
			},
			onComplete() {
				setPosition(toX, toY)
				onLand()
			},
		})
	}

	function landSquash(depth: number) {
		squashTween?.kill()
		squash.y = depth
		draw()

		squashTween = gsap.to(squash, {
			y: 1,
			duration: 0.3,
			ease: "power3.out",
			onUpdate: draw,
			onComplete() {
				squashTween = undefined
			},
		})
	}

	/**
	 * Profil de vitesse trapézoïdal (accélération, croisière, freinage), normalisé : `accel` et `decel`
	 * sont des fractions de la durée totale. `position` vaut 0 → 1, `velocity` 0 → 1 (1 = croisière).
	 */
	function runProfile(accel: number, decel: number) {
		const peak = 1 / (1 - (accel + decel) / 2)

		return {
			position(t: number) {
				if (accel > 0 && t < accel) return (peak * t * t) / (2 * accel)
				if (decel > 0 && t > 1 - decel) {
					const remaining = 1 - t
					return 1 - (peak * remaining * remaining) / (2 * decel)
				}
				return peak * (accel / 2 + (t - accel))
			},
			velocity(t: number) {
				if (accel > 0 && t < accel) return t / accel
				if (decel > 0 && t > 1 - decel) return (1 - t) / decel
				return 1
			},
		}
	}

	/** Vitesse de croisière d'un trajet : proportionnelle à la taille du chat, légèrement différente à chaque fois (trot ↔ galop). */
	function pickCruiseSpeed() {
		return displayH * runSpeed * rand(RUN_SPEED_MIN, RUN_SPEED_MAX)
	}

	/**
	 * Course d'un point à un autre. La vitesse suit un profil réaliste (le chat démarre, atteint sa
	 * vitesse, freine) et la cadence des pattes suit la vitesse réelle : à vitesse de croisière,
	 * un cycle complet de l'animation couvre exactement `runStride` hauteurs de chat, donc les pattes
	 * ne « glissent » pas ; pendant l'accélération et le freinage, la cadence ralentit en conséquence.
	 */
	function runTo(plan: {
		targetX: number
		cruise: number
		/** Déjà lancé (après un bond) : pas de phase d'accélération. */
		launched?: boolean
		/** Faux : le chat reste à vitesse de croisière jusqu'au bout (juste avant un saut). */
		brake?: boolean
		onArrive: () => void
	}) {
		const { targetX, cruise, launched = false, brake = true, onArrive } = plan

		const fromX = getX()
		const delta = targetX - fromX
		const accelSeconds = launched ? 0 : RUN_ACCEL_S
		const decelSeconds = brake ? RUN_DECEL_S : 0
		const duration = Math.max(
			Math.abs(delta) / cruise + (accelSeconds + decelSeconds) / 2,
			accelSeconds + decelSeconds,
			0.05
		)
		const profile = runProfile(accelSeconds / duration, decelSeconds / duration)

		phase = "walk"
		state.facing = delta >= 0 ? 1 : -1
		gaitFps = (FRAMES.run.length * cruise) / (displayH * runStride)
		gaitRate = launched ? 1 : GAIT_RATE_FLOOR
		setMode("run")

		const run = { t: 0 }

		motion = gsap.to(run, {
			t: 1,
			duration,
			ease: "none",
			onUpdate() {
				setCanvasX(fromX + delta * profile.position(run.t))
				gaitRate = GAIT_RATE_FLOOR + (1 - GAIT_RATE_FLOOR) * profile.velocity(run.t)
			},
			onComplete() {
				setCanvasX(targetX)
				onArrive()
			},
		})
	}

	/** Fin d'une course : on se recale dans la zone (elle a pu bouger pendant le trajet) et on attend. */
	function rest() {
		motion = undefined
		phase = "idle"
		gaitRate = 1
		setMode("idle")
		settle()
		scheduleNext()
	}

	/** Retourne false (sans rien modifier) si le saut est impossible. */
	function jumpTo(
		target: Zone,
		landingX: number,
		timeScale = 1,
		fromRun = false,
		/** Point de départ imposé (saut qui entre par le bord de l'écran) ; sinon, la position du chat. */
		start?: { x: number; y: number }
	): boolean {
		if (!imageLoaded || target === currentZone) return false

		const rect = measureZone(target)
		if (!rect) return false

		const { minX, maxX, groundY } = travelOf(rect)
		const toX = clamp(minX, maxX, landingX)

		// Un chat à l'arrêt se ramasse avant de bondir ; un chat lancé en course bondit directement.
		const crouch = !start && !fromRun && phase !== "walk" && phase !== "hop"

		clearNextAction()
		killMotion()
		if (start) setPosition(start.x, start.y)
		phase = "jump"
		jumpTarget = target

		const deltaX = toX - getX()
		if (Math.abs(deltaX) > 4) state.facing = deltaX > 0 ? 1 : -1

		const distance = Math.hypot(deltaX, groundY - getY())
		const rise = clamp(displayH * JUMP_RISE_MIN, displayH * JUMP_RISE_MAX, distance * JUMP_RISE_RATIO)

		const launch = () => {
			motion = flyTo({
				x: toX,
				y: groundY,
				rise,
				timeScale,
				onLand() {
					motion = undefined
					phase = "idle"
					jumpTarget = null

					markVisit(currentZone)
					activateZone(target)
					gaitRate = 1
					setMode("idle")
					settle()
					landSquash(LANDING_SQUASH)

					const kind =
						landingLine ?? (Math.random() < LANDING_CHATTER_CHANCE ? "landing" : null)
					landingLine = null
					if (kind) say(kind, { spontaneous: kind === "landing" })

					// Le chat ne reste pas figé après un saut : il enchaîne vite.
					scheduleNext(rand(LANDING_PAUSE_MIN_S, LANDING_PAUSE_MAX_S))
					queueViewCheck()
				},
			})
		}

		if (!crouch) {
			launch()
			return true
		}

		setMode("idle")
		motion = gsap.to(squash, {
			y: CROUCH_DEPTH,
			duration: CROUCH_SECONDS,
			ease: "power2.out",
			onUpdate: draw,
			onComplete() {
				squashTween = gsap.to(squash, {
					y: 1,
					duration: 0.14,
					ease: "power2.out",
					onUpdate: draw,
					onComplete() {
						squashTween = undefined
					},
				})
				launch()
			},
		})

		return true
	}

	/**
	 * Saute vers une autre zone en partant du bord le plus proche : si le chat en est loin, il court
	 * d'abord jusque-là puis bondit sans s'arrêter, au lieu de traverser tout le bloc d'un seul saut.
	 */
	function leapTowards(target: Candidate): boolean {
		const rect = currentZone ? measureZone(currentZone) : null
		if (!rect || !measureZone(target.zone)) return false

		const { minX, maxX } = travelOf(rect)
		const takeoffX = clamp(minX, maxX, target.x)
		if (Math.abs(takeoffX - getX()) < displayH * APPROACH_MIN_HEIGHTS) {
			return jumpTo(target.zone, target.x)
		}

		clearNextAction()
		runTo({
			targetX: takeoffX,
			cruise: pickCruiseSpeed(),
			brake: false,
			onArrive() {
				motion = undefined
				if (!jumpTo(target.zone, target.x, 1, true)) rest()
			},
		})

		return true
	}

	function startLeg(speedFactor = 1) {
		const rect = currentZone ? measureZone(currentZone) : null
		if (!rect) return scheduleNext()

		const { minX, maxX, groundY } = travelOf(rect)
		const cruise = pickCruiseSpeed() * speedFactor
		// Assez long pour accélérer puis freiner : en dessous, le chat reste simplement assis.
		const minLeg = Math.max(MIN_LEG_PX, cruise * (RUN_ACCEL_S + RUN_DECEL_S) * 0.6)

		const from = getX()
		const room = (dir: 1 | -1) => (dir === 1 ? maxX - from : from - minX)

		let dir: 1 | -1 = Math.random() < 0.25 ? (state.facing === 1 ? -1 : 1) : state.facing
		if (room(dir) < minLeg) dir = dir === 1 ? -1 : 1

		const distance = Math.min((maxX - minX) * rand(legMin, legMax), room(dir))
		if (distance < minLeg) return scheduleNext()

		const targetX = from + dir * distance

		if (Math.random() < RUN_CHATTER_CHANCE) say("run", { spontaneous: true })

		if (distance >= displayH * MIN_HOP_LEG_HEIGHTS && Math.random() < hopChance) {
			// Bond de départ : le chat s'élance à sa vitesse de croisière, puis retombe en courant.
			const rise = displayH * rand(HOP_RISE_MIN, HOP_RISE_MAX)
			const flightTime = 2 * Math.sqrt((2 * rise) / (displayH * jumpGravity))

			state.facing = dir
			phase = "hop"
			motion = flyTo({
				x: from + dir * Math.min(cruise * flightTime, distance * 0.5),
				y: groundY,
				rise,
				onLand() {
					motion = undefined
					landSquash(HOP_SQUASH)
					runTo({ targetX, cruise, launched: true, onArrive: rest })
				},
			})
			return
		}

		runTo({ targetX, cruise, onArrive: rest })
	}

	/* ------------------------------------------------- boucle de décision */

	function scheduleNext(delaySeconds = rand(pauseMin, pauseMax) / 1000) {
		clearNextAction()
		if (isSuspended() || motionReduced || !imageLoaded || !currentZone) return
		nextAction = gsap.delayedCall(delaySeconds, decide)
	}

	function wanderEnabled() {
		const profile = currentZone ? activeProfile(currentZone) : undefined
		return profile?.wander ?? toValue(wander)
	}

	function decide() {
		nextAction = undefined

		// Rien à faire ici : placeInZone / thaw relanceront la boucle quand ce sera possible.
		if (!currentZone || !imageLoaded || isSuspended() || motionReduced) return

		settle()

		// Chat hors écran : inutile d'animer, on le ramène sur une zone visible si possible.
		if (!isCatInViewport()) {
			const target = pickRelocationTarget()
			if (target) leapIn(target)
			else scheduleNext(OFFSCREEN_RECHECK_S)
			return
		}

		// Caresse en cours : le chat reste en place un moment avant de reprendre sa vie.
		if (hovering && performance.now() - hoverSince < HOVER_HOLD_MS) {
			scheduleNext(0.5)
			return
		}

		if (Math.random() < IDLE_CHATTER_CHANCE) say("idle", { spontaneous: true })

		// Après `maxStay` sur une même zone, le chat part forcément : il fait le tour de tous les blocs.
		const stayedTooLong = performance.now() - zoneSince > maxStay

		if (wanderEnabled() && (stayedTooLong || Math.random() < jumpChance)) {
			const target = pickWanderTarget()
			if (target && leapTowards(target)) return
		}

		startLeg()
	}

	/* ------------------------------------------------------------- scroll */

	let lastScrollY = window.scrollY
	let lastScrollTime = performance.now()
	let scrollVelocity = 0
	let scrollingDown = true
	let scrollFrame = 0
	let viewCheckFrame = 0
	let nextViewCheckAt = 0

	function resetScrollTracking() {
		lastScrollY = window.scrollY
		lastScrollTime = performance.now()
		scrollVelocity = 0
	}

	function onScroll() {
		if (scrollFrame) return

		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0

			const now = performance.now()
			const scrollY = window.scrollY
			const delta = scrollY - lastScrollY
			const dt = Math.max(now - lastScrollTime, 1)

			scrollVelocity = scrollVelocity * 0.7 + (Math.abs(delta) / dt) * 1000 * 0.3
			if (delta !== 0) scrollingDown = delta > 0
			lastScrollY = scrollY
			lastScrollTime = now

			keepInView(true)
		})
	}

	/** Revérifie la visibilité du chat juste après un atterrissage (le scroll a pu continuer pendant le vol). */
	function queueViewCheck() {
		if (viewCheckFrame) return
		viewCheckFrame = requestAnimationFrame(() => {
			viewCheckFrame = 0
			keepInView(false)
		})
	}

	/**
	 * Cas des zones « page » uniquement (un chat dans un host ne bouge pas par rapport à lui, rien à suivre) :
	 * - le chat sort du viewport (scroll en cours) : il saute sur la zone visible la plus proche dans le sens du scroll ;
	 * - il est déjà entièrement hors écran : il est replacé sur une zone visible, sans animation.
	 */
	function keepInView(scrolled: boolean) {
		if (!currentZone || currentHost || isSuspended() || phase === "jump") return

		const now = performance.now()
		if (now < nextViewCheckAt) return

		const top = originOf(null).y + getY()
		const bottom = top + displayH
		const offscreen = bottom <= 0 || top >= viewport.height
		const leaving =
			scrolled &&
			(scrollingDown
				? top <= viewport.height * scrollTriggerRatio
				: bottom >= viewport.height * (1 - scrollTriggerRatio))
		if (!offscreen && !leaving) return

		const target = offscreen
			? pickRelocationTarget()
			: nearest(
					preferNeighbours(
						collectCandidates({
							margin: followMargin(),
							direction: scrollingDown ? "down" : "up",
						})
					)
				)

		if (!target) {
			nextViewCheckAt = now + FOLLOW_COOLDOWN_MS
			return
		}

		if (offscreen) {
			landingLine = scrollVelocity > FAST_SCROLL_PX_S ? "scroll" : null
			leapIn(target, clamp(1, 2, 1 + scrollVelocity / 3000))
		} else if (motionReduced) {
			relocateTo(target)
		} else {
			landingLine = scrollVelocity > FAST_SCROLL_PX_S ? "scroll" : null
			if (!jumpTo(target.zone, target.x, clamp(1, 3, 1 + scrollVelocity / 2200))) {
				landingLine = null
				nextViewCheckAt = now + FOLLOW_COOLDOWN_MS
			}
		}
	}

	/* ------------------------------------------------------------- bulles */

	/**
	 * Une bulle apparaît au-dessus de la tête du chat, puis RESTE où elle est née (elle ne suit pas le
	 * chat) et s'efface. À sa naissance elle ne recouvre ni le chat ni une autre bulle : son emplacement
	 * est choisi parmi des positions libres (au-dessus, décalé, empilé, sur les côtés), dans le viewport.
	 * Toujours au-dessus de tout (z-index 41, donc au-dessus du chat, du titre et des boutons) et
	 * jamais cliquable : rien ne passe par-dessus le texte.
	 */
	function removeBubble(bubble: Bubble) {
		bubble.anim.kill()
		bubble.el.remove()
		bubbles.delete(bubble)
	}

	function clearBubbles() {
		for (const bubble of [...bubbles]) removeBubble(bubble)
	}

	function dismissBubble(bubble: Bubble) {
		if (bubble.dismissing || !bubbles.has(bubble)) return

		bubble.dismissing = true
		bubble.anim.kill()
		bubble.anim = gsap.to(bubble.el, {
			opacity: 0,
			duration: 0.15,
			ease: "power1.in",
			onComplete: () => removeBubble(bubble),
		})
	}

	/** Le viewport, exprimé dans le repère du chat (page ou host), moins une marge. */
	function bubbleBounds(): Box {
		const origin = originOf(currentHost)
		let left = -origin.x
		let top = -origin.y
		let right = left + (currentHost ? viewport.width : document.documentElement.clientWidth || viewport.width)
		let bottom = top + viewport.height

		if (currentHost) {
			left = Math.max(left, 0)
			top = Math.max(top, 0)
			right = Math.min(right, currentHost.clientWidth)
			bottom = Math.min(bottom, currentHost.clientHeight)
		}

		return {
			left: left + BUBBLE_EDGE_PX,
			top: top + BUBBLE_EDGE_PX,
			width: Math.max(right - left - BUBBLE_EDGE_PX * 2, 0),
			height: Math.max(bottom - top - BUBBLE_EDGE_PX * 2, 0),
		}
	}

	function findBubbleSpot(width: number, height: number): Box | null {
		const bounds = bubbleBounds()
		if (width > bounds.width || height > bounds.height) return null

		const cat: Box = { left: getX(), top: getY(), width: displayW, height: displayH }
		// Même une bulle en train de s'effacer reste un obstacle : rien ne se superpose.
		const taken = [...bubbles].map((bubble) => bubble.box)
		const centerX = cat.left + cat.width / 2
		const levelStep = height + BUBBLE_PADDING_PX

		const place = (left: number, top: number): Box => ({
			left: clamp(bounds.left, bounds.left + bounds.width - width, left),
			top: clamp(bounds.top, bounds.top + bounds.height - height, top),
			width,
			height,
		})
		const isFree = (box: Box) =>
			!boxesOverlap(box, cat, 2) &&
			!taken.some((other) => boxesOverlap(box, other, BUBBLE_PADDING_PX))

		const candidates: Box[] = []
		for (let level = 0; level < 3; level++) {
			for (const shift of [0, 0.7, -0.7, 1.4, -1.4]) {
				candidates.push(
					place(
						centerX - width / 2 + shift * width,
						cat.top - BUBBLE_GAP_PX - height - level * levelStep
					)
				)
			}
		}

		const middleY = cat.top + (cat.height - height) / 2
		candidates.push(
			place(cat.left - width - BUBBLE_GAP_PX, middleY),
			place(cat.left + cat.width + BUBBLE_GAP_PX, middleY)
		)

		return candidates.find(isFree) ?? null
	}

	function showBubble(text: string, evictOldest: boolean): boolean {
		const parent = canvas.parentElement
		if (!parent) return false

		const live = [...bubbles].filter((bubble) => !bubble.dismissing)
		if (live.length >= MAX_BUBBLES) {
			if (!evictOldest) return false
			dismissBubble(live[0]!)
		}

		const el = createBubble(text, bubbleColorClass)
		parent.append(el)

		const spot = findBubbleSpot(el.offsetWidth, el.offsetHeight)
		if (!spot) {
			el.remove()
			return false
		}

		// Texte posé sur des pixels physiques entiers : net, jamais flou.
		const left = snap(spot.left)
		const top = snap(spot.top)
		gsap.set(el, { x: left, y: top })

		const drift = motionReduced ? 0 : 5
		const hold = BUBBLE_HOLD_BASE_S + text.length * BUBBLE_HOLD_PER_CHAR_S
		const anim = gsap
			.timeline({ onComplete: () => removeBubble(bubble) })
			.fromTo(
				el,
				{ opacity: 0, scale: motionReduced ? 1 : 0.85, y: top + drift },
				{ opacity: 1, scale: 1, y: top, duration: 0.22, ease: "back.out(2)" }
			)
			.to(el, { opacity: 0, y: top - drift, duration: 0.25, ease: "power1.in" }, `+=${hold}`)

		const bubble: Bubble = { el, parent, box: spot, anim, dismissing: false }
		bubbles.add(bubble)
		return true
	}

	function pickPhrase(kind: PhraseKind): string | null {
		let pool: readonly string[] = phrases[kind]
		if (kind === "hover") pool = [...pool, timeOfDayLine()]

		const zoneLines = currentZone ? activeProfile(currentZone)?.phrases : undefined
		if (
			zoneLines &&
			zoneLines.length > 0 &&
			ZONE_PHRASE_KINDS.has(kind) &&
			Math.random() < ZONE_PHRASE_CHANCE
		) {
			pool = zoneLines
		}

		// On évite de répéter une des dernières répliques, sauf si la liste est trop courte.
		const fresh = pool.filter((line) => !recentPhrases.includes(line))
		const choices = fresh.length > 0 ? fresh : pool
		if (choices.length === 0) return null

		const line = choices[Math.floor(Math.random() * choices.length)]!
		recentPhrases.push(line)
		if (recentPhrases.length > RECENT_PHRASES) recentPhrases.shift()
		return line
	}

	/**
	 * Le chat dit une réplique de la situation. Une réaction à l'utilisateur (survol, clic...) passe
	 * toujours (quitte à remplacer la plus ancienne bulle) ; une réplique spontanée respecte un délai
	 * minimum entre deux, et n'a lieu ni en mouvement réduit ni si les bulles sont déjà nombreuses.
	 */
	function say(kind: PhraseKind, options: { spontaneous?: boolean } = {}): boolean {
		if (parked || !imageLoaded || isSuspended()) return false

		const spontaneous = options.spontaneous ?? false
		const now = performance.now()
		if (spontaneous && (motionReduced || now < nextSpontaneousAt)) return false

		const line = pickPhrase(kind)
		if (!line || !showBubble(line, !spontaneous)) return false

		if (spontaneous) {
			nextSpontaneousAt =
				now + rand(SPONTANEOUS_COOLDOWN_MIN_S, SPONTANEOUS_COOLDOWN_MAX_S) * 1000
		}
		return true
	}

	/* ------------------------------------------------------- interactions */

	function handlePointerEnter(event: PointerEvent) {
		if (event.pointerType !== "mouse" || isSuspended()) return

		const now = performance.now()
		hovering = true
		hoverSince = now

		const moving = phase !== "idle"
		say(moving ? "chase" : now - lastHoverAt < REPEAT_HOVER_WINDOW_MS ? "hoverAgain" : "hover")

		// Curseur qui reste posé : le chat ronronne.
		purrCall?.kill()
		purrCall = gsap.delayedCall(PURR_DELAY_S, () => {
			purrCall = undefined
			if (hovering && phase === "idle") say("purr")
		})
	}

	function handlePointerLeave() {
		hovering = false
		lastHoverAt = performance.now()
		purrCall?.kill()
		purrCall = undefined
	}

	/** Trop de clics : le chat s'enfuit, d'un saut vers une zone voisine ou en courant. */
	function flee() {
		if (phase === "jump") return

		const target = pickWanderTarget()
		if (target && jumpTo(target.zone, target.x, FLEE_SPEED_FACTOR, true)) return

		clearNextAction()
		abortMotion()
		settle()
		startLeg(FLEE_SPEED_FACTOR)
	}

	function handleClick() {
		if (isSuspended() || parked) return

		const now = performance.now()
		clickTimes.push(now)
		while (clickTimes.length > 0 && now - clickTimes[0]! > CLICK_WINDOW_MS) clickTimes.shift()

		if (phase === "idle" && !motionReduced) landSquash(CLICK_SQUASH)

		const clicks = clickTimes.length
		if (clicks >= FURIOUS_CLICKS) {
			clickTimes.length = 0
			say("furious")
			flee()
			return
		}

		say(clicks >= ANNOYED_CLICKS ? "annoyed" : "poke")
	}

	/* --------------------------------------------- viewport / cycle de vie */

	let resizeTimer: ReturnType<typeof setTimeout> | undefined

	function commitViewportChange() {
		if (isSuspended()) return

		const widthChanged = window.innerWidth !== viewport.width
		const heightDelta = Math.abs(window.innerHeight - viewport.height)

		// Barre d'URL mobile qui se replie : simple recalage, sans tout relancer.
		if (!widthChanged && heightDelta > 0 && heightDelta < SOFT_RESIZE_HEIGHT_THRESHOLD) {
			refreshMetrics()
			scheduleSync()
			return
		}

		resync()
	}

	function handleViewportChange() {
		clearTimeout(resizeTimer)
		resizeTimer = setTimeout(commitViewportChange, RESIZE_DEBOUNCE_MS)
	}

	function handleVisibilityChange() {
		const hidden = document.visibilityState === "hidden"
		if (hidden && hiddenAt === 0) hiddenAt = performance.now()

		setSuspended("background", hidden)

		if (!hidden && hiddenAt !== 0) {
			const away = performance.now() - hiddenAt
			hiddenAt = 0
			if (away > BACK_MIN_HIDDEN_MS) say("back")
		}
	}

	function handleMotionPreferenceChange(event: MediaQueryListEvent) {
		motionReduced = event.matches

		if (motionReduced) {
			abortMotion(true)
			clearNextAction()
			setMode("idle")
			settle()
		} else {
			scheduleNext()
		}
	}

	/* ------------------------------------------------------- observateurs */

	const resizeObserver = new ResizeObserver(scheduleSync)
	// Le document lui-même : un layout shift au-dessus d'une zone la déplace sans la redimensionner.
	resizeObserver.observe(document.body)

	const lifecycle = new AbortController()
	const { signal } = lifecycle

	window.addEventListener("scroll", onScroll, { passive: true, signal })
	window.addEventListener("resize", handleViewportChange, { passive: true, signal })
	window.addEventListener("orientationchange", handleViewportChange, { passive: true, signal })
	window.visualViewport?.addEventListener("resize", handleViewportChange, { signal })
	document.addEventListener("visibilitychange", handleVisibilityChange, { signal })
	// bfcache : la page est gelée / restaurée sans toujours déclencher visibilitychange.
	window.addEventListener("pagehide", () => setSuspended("background", true), { signal })
	window.addEventListener("pageshow", handleVisibilityChange, { signal })
	reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange, { signal })

	canvas.addEventListener("pointerenter", handlePointerEnter, { signal })
	canvas.addEventListener("pointerleave", handlePointerLeave, { signal })
	canvas.addEventListener("click", handleClick, { signal })

	gsap.ticker.add(tick)

	// Pas d'onglet au premier plan au chargement : on démarre déjà en pause.
	handleVisibilityChange()

	// Options réactives : les watchers vivent dans le scope détaché du singleton.
	if (options.displayHeight !== undefined) {
		watch(
			() => toValue(options.displayHeight!),
			() => resync()
		)
	}
	if (isRef(textColorClass) || typeof textColorClass === "function") {
		watch(
			() => toValue(textColorClass),
			() => {
				if (!currentZone || !activeProfile(currentZone)?.textColorClass) {
					updateBubbleTextColor(currentZone)
				}
			}
		)
	}

	loadSprite(spriteSrc)
		.then((img) => {
			setSpriteImage(img, spriteSrc)
			scheduleSync()
		})
		.catch(() => console.warn(`[useSprite] Impossible de charger le sprite : ${spriteSrc}`))

	/* ------------------------------------------------------------ API */

	function registerZone(el: HTMLElement, zoneOptions: RegisterZoneOptions = {}): CatZoneHandle {
		let zone = zones.get(el)
		if (!zone) {
			zone = { el, profiles: [] }
			zones.set(el, zone)
			resizeObserver.observe(el)
		}

		const profile: ZoneProfile = {
			order: zoneOptions.order ?? zoneOrderCounter++,
			spriteSrc: zoneOptions.spriteSrc,
			textColorClass: zoneOptions.textColorClass,
			minWidth: zoneOptions.minWidth,
			maxWidth: zoneOptions.maxWidth,
			isInitial: zoneOptions.isInitial,
			host: unref(zoneOptions.host) ?? undefined,
			zIndex: zoneOptions.zIndex,
			wander: zoneOptions.wander,
			phrases: zoneOptions.phrases,
		}
		zone.profiles.push(profile)

		scheduleSync()

		return {
			unregister() {
				const target = zones.get(el)
				if (!target) return

				const index = target.profiles.indexOf(profile)
				if (index !== -1) target.profiles.splice(index, 1)

				if (target.profiles.length === 0) {
					zones.delete(el)
					resizeObserver.unobserve(el)

					lastVisitAt.delete(target)
					if (currentZone === target || jumpTarget === target) {
						currentZone = null
						parkSprite()
					}
				}

				scheduleSync()
			},
		}
	}

	function destroy() {
		lifecycle.abort()
		resizeObserver.disconnect()
		hostObserver.disconnect()
		gsap.ticker.remove(tick)

		clearTimeout(resizeTimer)
		cancelAnimationFrame(syncFrame)
		cancelAnimationFrame(scrollFrame)
		cancelAnimationFrame(viewCheckFrame)

		resetTransientState()
		canvas.remove()
	}

	return { registerZone, resync, destroy }
}