import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { BadgeData } from "~/types/badge"
import {
	drawBadgeFrontFace,
	drawBadgeBackFace,
	drawStrapTexture,
	drawStrapBumpTexture,
	BADGE_TEXTURE_WIDTH,
	BADGE_TEXTURE_HEIGHT,
	STRAP_TEXTURE_WIDTH,
	STRAP_TEXTURE_HEIGHT,
} from "~/utils/badge/drawBadgeFace"
import { createStrapRibbon, type StrapRibbon } from "~/utils/badge/strapRibbon"
import {
	computeHardwareLayout,
	createLanyardHardware,
} from "~/utils/badge/lanyardHardware"

/**
 * Options for {@link useLanyardBadge}.
 */
export interface UseLanyardBadgeOptions {
	/** Target canvas the WebGL renderer draws into */
	canvas: Ref<HTMLCanvasElement | null>
	/** Element used to measure available size and observe resize */
	container: Ref<HTMLElement | null>
	/** Reactive badge content; texture and physics rebuild when it changes */
	data: Ref<BadgeData> | ComputedRef<BadgeData>
}

// ─── Carte ───────────────────────────────────────────────────────────────────
const CARD_WIDTH = 1
const CARD_HEIGHT = 1.42
const CARD_THICKNESS = 0.03
const CARD_DENSITY = 3
const CARD_CORNER_RADIUS = (64 / 1024) * CARD_WIDTH // même rayon que le design canvas (64px / 1024)
const CARD_BEVEL = 0.008
const CARD_FACE_OFFSET = 0.0006 // évite le z-fighting entre la face texturée et le corps

// ─── Attache : porte-badge à mousqueton pivotant (voir utils/badge/lanyardHardware.ts) ────────────
// De haut en bas : embout plein (la sangle s'y perd) → tige d'émerillon → fût pivotant → mousqueton à
// gâchette, dont le bas passe dans la fente de la carte. Le fût et le mousqueton tournent avec la carte
// autour de l'axe vertical ; l'embout et la sangle, non.
const SLOT_WIDTH = 0.12
const SLOT_HEIGHT = 0.05
const SLOT_CENTER_Y = CARD_HEIGHT / 2 - 0.085
const HARDWARE_YAW = 0.44 // rad (~25°) : la boucle du mousqueton est vue de biais, on distingue dos et gâchette
const HARDWARE_LAYOUT = computeHardwareLayout({
	slotCenterY: SLOT_CENTER_Y,
	slotHeight: SLOT_HEIGHT,
})
// Le point d'attache de la sangle (là où s'applique la traction physique) est à l'intérieur de l'embout.
const CARD_ATTACH_Y = HARDWARE_LAYOUT.attachY

// ─── Sangle élastique ────────────────────────────────────────────────────────
// La sangle est une chaîne de points massiques reliés par des ressorts amortis à sens unique
// (ils tirent quand on les étire, jamais quand ils sont détendus). Le point d'accroche est hors
// champ, très haut : à l'écran on ne voit que le bas de la sangle.
const STRAP_SEGMENTS = 4
const STRAP_LINKS = STRAP_SEGMENTS - 1
const STRAP_SEGMENT_REST = 0.45 // longueur au repos d'un segment (non étiré)
const STRAP_REST_LENGTH = STRAP_SEGMENTS * STRAP_SEGMENT_REST
const STRAP_STIFFNESS = 30 // "EA" : force (N) pour doubler la longueur → plus bas = plus élastique
const STRAP_DAMPING = 12 // amortissement axial : plus haut = retour plus calme, moins de rebond
const STRAP_STIFFENING = 0.8 // déformation à partir de laquelle la sangle durcit (limite l'étirement max)
const STRAP_SOLVER_ITERATIONS = 6
const LINK_DENSITY = 30
const LINK_RADIUS = 0.045
const LINK_LINEAR_DAMPING = 1.5
const CARD_REST_CENTER_Y = 0.29 // hauteur du centre de la carte au repos (position validée visuellement)
const REST_CLIP_Y = CARD_REST_CENTER_Y + CARD_ATTACH_Y // bout de sangle au repos : la carte ne bouge pas quand l'attache change
const STRAP_MIN_WIDTH_RATIO = 0.55 // la sangle s'amincit quand on l'étire (effet élastique)

// Ruban : proportions d'un vrai lanyard (la carte fait ~105 mm de large → 1 unité ≈ 105 mm,
// donc 0.105 ≈ 11 mm de large et 0.011 ≈ 1.2 mm d'épaisseur de tissu). Proportions de la référence :
// la sangle est à peu près aussi large que le haut de l'anneau, qu'elle traverse.
const STRAP_WIDTH = 0.105
const STRAP_THICKNESS = 0.011
const STRAP_END_SLANT = 0 // le bout de la sangle est caché dans l'embout : coupe droite
const RIBBON_SAMPLES = 64
// Longueur monde d'un motif de texture : la texture (2048x448) est carrée à la largeur du ruban
const STRAP_TEXTURE_LENGTH = (STRAP_WIDTH * STRAP_TEXTURE_WIDTH) / STRAP_TEXTURE_HEIGHT

// ─── Physique ────────────────────────────────────────────────────────────────
const GRAVITY = 9.81
const FIXED_TIMESTEP = 1 / 120
const MAX_SUBSTEPS = 10
const CARD_LINEAR_DAMPING = 0.8
const CARD_ANGULAR_DAMPING = 2.8
const MAX_LINK_SPEED = 10
const MAX_CARD_LINEAR_SPEED = 12
const MAX_CARD_ANGULAR_SPEED = 8

// Drag : la carte reste un corps dynamique, un ressort amorti tire le point saisi vers le pointeur.
// La force est plafonnée, donc l'étirement de la sangle a une limite naturelle.
const DRAG_STIFFNESS = 110
const DRAG_DAMPING = 16
const MAX_DRAG_ERROR = 1.6

// ─── Cadrage caméra (le badge peut sortir du cadre quand on tire, c'est voulu) ──
const CAMERA_FOV = 32
const STRAP_VISIBLE_HEIGHT = 0.575 // hauteur de sangle visible au-dessus du point d'attache au repos
const FRAME_BOTTOM_PADDING = 0.16 // petit padding sous la carte au repos
const MIN_VISIBLE_WIDTH = CARD_WIDTH * 1.7 // garde de la place pour le balancement (mobile)
const MAX_SHIFT_RATIO = 0.22 // décalage max du badge vers la droite (part de la largeur visible)

// ─── Arrivée sur la page : le badge tombe du haut une fois la transition de page terminée ──
const DROP_CLEARANCE = 0.1 // marge au-dessus du bord haut du cadre : la carte démarre hors champ
const DROP_TILT = 0.12 // léger angle initial (rad) pour que la chute ne soit pas parfaitement raide
const DROP_SPIN = 0.6 // léger effet de rotation au départ (rad/s)

// ─── Flip au clic ────────────────────────────────────────────────────────────
const CLICK_MOVE_THRESHOLD = 6 // px
const CLICK_MAX_DURATION = 350 // ms
const FLIP_STIFFNESS = 90
const FLIP_DAMPING = 14

// ─── Chargement ──────────────────────────────────────────────────────────────
const MAX_TEXTURE_SCALE = 2 // plafond du sur-échantillonnage des faces de la carte
const BACK_FACE_DELAY_MS = 1200 // la face arrière (invisible au départ) est dessinée une fois le drop terminé

// Masses et inerties analytiques
const CARD_MASS = CARD_DENSITY * CARD_WIDTH * CARD_HEIGHT * CARD_THICKNESS
const CARD_INV_MASS = 1 / CARD_MASS
const CARD_INERTIA_X = (CARD_MASS * (CARD_HEIGHT ** 2 + CARD_THICKNESS ** 2)) / 12
const CARD_INERTIA_Y = (CARD_MASS * (CARD_WIDTH ** 2 + CARD_THICKNESS ** 2)) / 12
const CARD_INERTIA_Z = (CARD_MASS * (CARD_WIDTH ** 2 + CARD_HEIGHT ** 2)) / 12
const LINK_MASS = LINK_DENSITY * (4 / 3) * Math.PI * LINK_RADIUS ** 3

// Nœuds de la sangle : 0 = ancre fixe, 1..STRAP_LINKS = maillons, dernier = clip sur la carte
const STRAP_NODES = STRAP_LINKS + 2
const CLIP_NODE = STRAP_NODES - 1

// L'ancre est calibrée à l'initialisation pour que le clip s'immobilise pile à REST_CLIP_Y
const ANCHOR = new THREE.Vector3(0, REST_CLIP_Y + STRAP_REST_LENGTH * 1.06, 0)

function clampVectorMagnitude(vector: THREE.Vector3, maxLength: number): boolean {
	const lengthSq = vector.lengthSq()
	if (lengthSq <= maxLength * maxLength) return false
	vector.multiplyScalar(maxLength / Math.sqrt(lengthSq))
	return true
}

// Fente en "stade" (rectangle à bouts ronds)
function createSlotPath(cx: number, cy: number, w: number, h: number): THREE.Path {
	const r = h / 2
	const path = new THREE.Path()
	path.moveTo(cx - w / 2 + r, cy - h / 2)
	path.lineTo(cx + w / 2 - r, cy - h / 2)
	path.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false)
	path.lineTo(cx - w / 2 + r, cy + h / 2)
	path.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false)
	return path
}

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
	const x = -w / 2
	const y = -h / 2
	const shape = new THREE.Shape()
	shape.moveTo(x + r, y)
	shape.lineTo(x + w - r, y)
	shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
	shape.lineTo(x + w, y + h - r)
	shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
	shape.lineTo(x + r, y + h)
	shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
	shape.lineTo(x, y + r)
	shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
	return shape
}

// Contour de la carte + fente d'accroche. Le biseau rogne la fente de CARD_BEVEL de chaque côté :
// on la dessine un peu plus grande pour que l'ouverture finale fasse SLOT_WIDTH x SLOT_HEIGHT.
function createCardShape(w: number, h: number, r: number): THREE.Shape {
	const shape = createRoundedRectShape(w, h, r)
	shape.holes.push(
		createSlotPath(
			0,
			SLOT_CENTER_Y,
			SLOT_WIDTH + CARD_BEVEL * 2,
			SLOT_HEIGHT + CARD_BEVEL * 2
		)
	)
	return shape
}

// Face plate arrondie avec des UV normalisés 0→1 (pour plaquer la texture canvas)
function createFaceGeometry(w: number, h: number, r: number): THREE.ShapeGeometry {
	const geometry = new THREE.ShapeGeometry(createCardShape(w, h, r), 12)
	const pos = geometry.attributes.position!
	const uv = geometry.attributes.uv!
	for (let i = 0; i < pos.count; i++) {
		uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h)
	}
	uv.needsUpdate = true
	return geometry
}

// Hauteur de monde visible, selon le ratio du conteneur. Partagé entre le cadrage caméra et le choix
// de la résolution des textures (inutile de dessiner plus de pixels que ce que l'écran peut montrer).
function getFrameMetrics(aspect: number) {
	const cardRestBottom = REST_CLIP_Y - CARD_ATTACH_Y - CARD_HEIGHT / 2
	const frameBottom = cardRestBottom - FRAME_BOTTOM_PADDING
	let frameTop = REST_CLIP_Y + STRAP_VISIBLE_HEIGHT
	let frameHeight = frameTop - frameBottom

	// Écran étroit : on élargit le cadre pour laisser la place au balancement
	const minHeightForWidth = MIN_VISIBLE_WIDTH / aspect
	if (frameHeight < minHeightForWidth) {
		frameHeight = minHeightForWidth
		frameTop = frameBottom + frameHeight
	}
	return { frameTop, frameBottom, frameHeight }
}

interface StrapSegmentState {
	normal: THREE.Vector3
	stretch: number
	bias: number
	gamma: number
	effectiveInvMass: number
	endInvMass: number
	accumulated: number
	active: boolean
}

export function useLanyardBadge(options: UseLanyardBadgeOptions) {
	if (!import.meta.client) return

	// À appeler ici, en synchrone dans setup() : waitForPageTransition() utilise useState/watch,
	// qui exigent le contexte Nuxt (perdu après le premier `await`). On récupère juste la promesse.
	const pageTransitionDone = waitForPageTransition()

	// Détection en JS plutôt qu'en CSS (voir aussi son usage pour pointer-events plus bas) : sert ici
	// à adapter plusieurs réglages de performance à la classe d'appareil (mobile/tactile = mémoire et
	// GPU nettement plus contraints que desktop).
	const supportsTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0

	// Résolution des textures de la carte, choisie à l'init selon la taille réelle de la carte à l'écran.
	let cardTextureScale = 1

	let scene: THREE.Scene | null = null
	let camera: THREE.PerspectiveCamera | null = null
	let renderer: THREE.WebGLRenderer | null = null
	let resizeObserver: ResizeObserver | null = null

	let cardGroup: THREE.Group
	let flipGroup: THREE.Group
	let topGroup: THREE.Group
	let strapRibbon: StrapRibbon
	let backMesh: THREE.Mesh | null = null

	// ─── État physique (intégrateur maison, plus de moteur externe) ──────────
	// Seuls la sangle et la carte bougent, sans aucune collision : un intégrateur de quelques lignes
	// suffit, et évite de charger/initialiser un module WASM de ~2 Mo.
	const linkPos = Array.from({ length: STRAP_LINKS }, () => new THREE.Vector3())
	const linkVel = Array.from({ length: STRAP_LINKS }, () => new THREE.Vector3())
	const cardPos = new THREE.Vector3()
	const cardVel = new THREE.Vector3()
	const cardAngVel = new THREE.Vector3()
	const cardQuaternion = new THREE.Quaternion()
	const cardQuaternionInverse = new THREE.Quaternion()
	let physicsReady = false

	const clipWorld = new THREE.Vector3()
	const clipLever = new THREE.Vector3()
	const clipVelocity = new THREE.Vector3()
	const cardImpulse = new THREE.Vector3()

	// Courbe de rendu : ancre + maillons + clip
	const curve = new THREE.CatmullRomCurve3(
		Array.from({ length: STRAP_NODES }, () => new THREE.Vector3())
	)
	const cardAttachLocalOffset = new THREE.Vector3(0, CARD_ATTACH_Y, 0)
	const cardXAxis = new THREE.Vector3()
	const swingQuaternion = new THREE.Quaternion()
	const twistQuaternion = new THREE.Quaternion()
	const tmpBandPoint = new THREE.Vector3()
	const tmpVelocity = new THREE.Vector3()
	const tmpAngularVelocity = new THREE.Vector3()
	const tmpTorque = new THREE.Vector3()
	const tmpDeltaQuat = new THREE.Quaternion()
	const tmpAxis = new THREE.Vector3()

	// État du solveur de sangle : les nœuds partagent directement les vecteurs d'état (aucune copie)
	const nodePositions: THREE.Vector3[] = [ANCHOR, ...linkPos, clipWorld]
	const nodeVelocities: THREE.Vector3[] = [new THREE.Vector3(), ...linkVel, clipVelocity]
	const nodeInvMass = new Array<number>(STRAP_NODES).fill(0)
	for (let i = 1; i <= STRAP_LINKS; i++) nodeInvMass[i] = 1 / LINK_MASS
	const strapSegments: StrapSegmentState[] = Array.from(
		{ length: STRAP_SEGMENTS },
		() => ({
			normal: new THREE.Vector3(),
			stretch: 0,
			bias: 0,
			gamma: 0,
			effectiveInvMass: 0,
			endInvMass: 0,
			accumulated: 0,
			active: false,
		})
	)
	const tmpLeverCross = new THREE.Vector3()
	let restAnchorDistance = STRAP_REST_LENGTH
	let bandStretch = 0

	// ─── Textures ────────────────────────────────────────────────────────────
	const frontTexture = new THREE.CanvasTexture(document.createElement("canvas"))
	const backTexture = new THREE.CanvasTexture(document.createElement("canvas"))
	const strapTexture = new THREE.CanvasTexture(document.createElement("canvas"))
	const strapBumpTexture = new THREE.CanvasTexture(document.createElement("canvas"))
	for (const t of [frontTexture, backTexture, strapTexture]) {
		t.colorSpace = THREE.SRGBColorSpace
	}

	// La face arrière n'est visible qu'après un clic : on ne la dessine (ni ne l'envoie au GPU) qu'après
	// le drop, ou dès que l'utilisateur attrape la carte.
	let backBuilt = false
	let backBuilding: Promise<void> | null = null

	const raycaster = new THREE.Raycaster()
	const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
	const pointerNDC = new THREE.Vector2()
	const dragTarget = new THREE.Vector3() // point du plan z=0 sous le pointeur
	const dragLocalGrab = new THREE.Vector3() // point saisi, exprimé dans le repère de la carte
	const tmpQuaternion = new THREE.Quaternion()
	const tmpEuler = new THREE.Euler(0, 0, 0, "YXZ")
	const tmpLever = new THREE.Vector3()
	const tmpGrabWorld = new THREE.Vector3()
	const tmpError = new THREE.Vector3()
	const tmpPointVelocity = new THREE.Vector3()
	const tmpImpulse = new THREE.Vector3()
	let dragging = false
	let dragMoved = false
	let pointerDownX = 0
	let pointerDownY = 0
	let pointerDownTime = 0

	// Flip (ressort sur la rotation Y de la face visible)
	let flipTarget = 0
	let flipAngle = 0
	let flipVelocity = 0

	let frameTopY = REST_CLIP_Y + STRAP_VISIBLE_HEIGHT // bord haut du cadre visible (monde), mis à jour au resize

	let rafId = 0
	let accumulator = 0
	let lastFrameTime = 0
	let destroyed = false

	// Pause complète du rendu (aucune frame demandée, pas juste "rendu sauté") dès que ça ne sert à
	// rien : onglet masqué, ou badge scrollé hors du champ visible. Un vrai gain CPU/GPU/batterie pour
	// une animation qui autrement tournerait en continu même quand personne ne la regarde.
	let isTabVisible =
		typeof document !== "undefined" && document.visibilityState !== "hidden"
	let isInViewport = true // l'IntersectionObserver confirme dès son premier callback ; true par défaut pour ne pas retarder le tout premier rendu
	let renderLoopActive = false
	let intersectionObserver: IntersectionObserver | null = null

	function isRenderingAllowed(): boolean {
		return isTabVisible && isInViewport && !destroyed
	}

	function startRenderLoop() {
		if (renderLoopActive || !isRenderingAllowed()) return
		renderLoopActive = true
		lastFrameTime = performance.now() // évite un grand saut de temps après une pause
		rafId = requestAnimationFrame(tick)
	}

	function stopRenderLoop() {
		renderLoopActive = false
		cancelAnimationFrame(rafId)
	}

	function handleVisibilityChange() {
		isTabVisible = document.visibilityState !== "hidden"
		if (isRenderingAllowed()) startRenderLoop()
		else stopRenderLoop()
	}

	function observeVisibility() {
		const containerEl = options.container.value
		if (!containerEl) return
		intersectionObserver = new IntersectionObserver(
			([entry]) => {
				isInViewport = entry?.isIntersecting ?? true
				if (isRenderingAllowed()) startRenderLoop()
				else stopRenderLoop()
			},
			{ threshold: 0 }
		)
		intersectionObserver.observe(containerEl)
		document.addEventListener("visibilitychange", handleVisibilityChange)
	}

	// `decode()` termine le décodage hors du thread principal : le premier drawImage ne le paie pas.
	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.decoding = "async"
			image.onload = () => {
				const decoded = image.decode ? image.decode() : Promise.resolve()
				decoded.catch(() => {}).then(() => resolve(image))
			}
			image.onerror = reject
			image.src = src
		})
	}

	// Logo utilisé pour la trame en filigrane du recto (voir drawBrandPattern dans drawBadgeFace.ts).
	// Chargé une seule fois et mis en cache. Si le fichier est absent, le badge reste pleinement
	// fonctionnel, simplement sans motif de fond.
	let brandMarkImage: HTMLImageElement | null = null
	let brandMarkImagePromise: Promise<HTMLImageElement | null> | null = null
	function loadBrandMarkImage(): Promise<HTMLImageElement | null> {
		if (brandMarkImage) return Promise.resolve(brandMarkImage)
		if (!brandMarkImagePromise) {
			brandMarkImagePromise = loadImage("/logos/R-white.svg")
				.then((image) => {
					brandMarkImage = image
					return image
				})
				.catch(() => null)
		}
		return brandMarkImagePromise
	}

	function resolveMaterialColor(cssColor: string): string {
		if (typeof document === "undefined") return cssColor
		const probe = document.createElement("span")
		probe.style.color = cssColor
		probe.style.display = "none"
		document.body.appendChild(probe)
		const resolved = getComputedStyle(probe).color || cssColor
		document.body.removeChild(probe)
		return resolved
	}

	function prepareCanvasTexture(
		texture: THREE.CanvasTexture,
		width: number,
		height: number,
		scale = 1
	): CanvasRenderingContext2D {
		const canvasEl = texture.image as HTMLCanvasElement
		canvasEl.width = Math.round(width * scale)
		canvasEl.height = Math.round(height * scale)
		const ctx = canvasEl.getContext("2d")
		if (!ctx) throw new Error("2D context unavailable for badge texture canvas")
		// Le contenu dessiné (drawBadgeFace.ts) continue de raisonner dans l'espace logique
		// width×height ; ce scale fait juste correspondre chaque unité logique à plus de pixels réels.
		if (scale !== 1) ctx.scale(scale, scale)
		return ctx
	}

	// Résolution de texture = pixels réellement affichables pour la carte (hauteur d'écran × DPR), entre
	// ×1 et ×2. Un écran standard n'a pas besoin des ~2900 px de haut d'un supersample ×2.
	function pickCardTextureScale(): number {
		const containerEl = options.container.value
		const width = Math.max(containerEl?.clientWidth ?? 1, 1)
		const height = Math.max(containerEl?.clientHeight ?? 1, 1)
		const dpr = Math.min(window.devicePixelRatio, supportsTouch ? 1.5 : 2)
		const { frameHeight } = getFrameMetrics(width / height)
		const cardScreenPx = height * (CARD_HEIGHT / frameHeight) * dpr
		const ratio = cardScreenPx / BADGE_TEXTURE_HEIGHT
		return THREE.MathUtils.clamp(Math.ceil(ratio * 4) / 4, 1, MAX_TEXTURE_SCALE)
	}

	function buildFrontTexture(data: BadgeData, brandMark: HTMLImageElement | null) {
		const ctx = prepareCanvasTexture(
			frontTexture,
			BADGE_TEXTURE_WIDTH,
			BADGE_TEXTURE_HEIGHT,
			cardTextureScale
		)
		drawBadgeFrontFace(ctx, data, brandMark)
		frontTexture.needsUpdate = true
	}

	async function loadQrImage(data: BadgeData): Promise<HTMLImageElement | null> {
		try {
			const qrModule = await qrModuleReady
			if (!qrModule) return null
			const toDataURL = qrModule.toDataURL ?? qrModule.default?.toDataURL
			if (!toDataURL) return null
			const linkedIn = data.linkedin
				? data.linkedin.startsWith("http")
					? data.linkedin
					: `https://${data.linkedin}`
				: "https://example.com"
			const dataUrl = await toDataURL(linkedIn, {
				margin: 0,
				// Bitmap source à la même densité que la texture qui l'accueille (dessinée à 300
				// unités logiques dans drawQrBlock) : sinon le QR serait lui-même agrandi et flou.
				width: Math.round(320 * cardTextureScale),
				color: { dark: "#000000", light: "#ffffff" },
			})
			return await loadImage(dataUrl)
		} catch {
			return null
		}
	}

	function buildBackFace(): Promise<void> {
		if (backBuilding) return backBuilding
		backBuilding = (async () => {
			const qrImage = await loadQrImage(toValue(options.data))
			if (destroyed || !renderer) return
			const ctx = prepareCanvasTexture(
				backTexture,
				BADGE_TEXTURE_WIDTH,
				BADGE_TEXTURE_HEIGHT,
				cardTextureScale
			)
			drawBadgeBackFace(ctx, toValue(options.data), qrImage)
			backTexture.needsUpdate = true
			renderer.initTexture(backTexture) // upload maintenant, pas au moment du flip
			if (backMesh) backMesh.visible = true
			backBuilt = true
		})().finally(() => {
			backBuilding = null
		})
		return backBuilding
	}

	function ensureBackFace() {
		if (!backBuilt) void buildBackFace()
	}

	function scheduleIdle(callback: () => void) {
		if ("requestIdleCallback" in window) {
			window.requestIdleCallback(callback, { timeout: 2500 })
		} else {
			setTimeout(callback, 300)
		}
	}

	function buildStrapTexture(data: BadgeData) {
		const colorCtx = prepareCanvasTexture(
			strapTexture,
			STRAP_TEXTURE_WIDTH,
			STRAP_TEXTURE_HEIGHT
		)
		// Même noir et même blanc que la carte (data.colors, déjà résolus depuis le thème par l'appelant) :
		// la sangle et la carte restent visuellement une seule pièce.
		drawStrapTexture(
			colorCtx,
			data.company,
			data.eventCode,
			data.colors.cardBg,
			data.colors.nameColor
		)
		const bumpCtx = prepareCanvasTexture(
			strapBumpTexture,
			STRAP_TEXTURE_WIDTH,
			STRAP_TEXTURE_HEIGHT
		)
		drawStrapBumpTexture(bumpCtx)
		for (const t of [strapTexture, strapBumpTexture]) {
			t.wrapS = THREE.RepeatWrapping
			t.wrapT = THREE.ClampToEdgeWrapping
			t.needsUpdate = true
		}
	}

	// ─── Physique ────────────────────────────────────────────────────────────

	// Longueur d'équilibre de la sangle sous le poids de la carte, calculée directement.
	// Chaque segment porte tout ce qui est en dessous : EA · s · (1 + (s / S)²) = T, avec s la
	// déformation. La fonction est croissante et convexe, Newton converge en quelques itérations
	// depuis s = T / EA (toujours au-dessus de la racine). Remplace les 480 pas de simulation.
	function initStrapPhysics() {
		let totalLength = 0
		for (let i = 0; i < STRAP_SEGMENTS; i++) {
			const linksBelow = Math.max(STRAP_LINKS - i, 0)
			const tension = GRAVITY * (CARD_MASS + linksBelow * LINK_MASS)
			let strain = tension / STRAP_STIFFNESS
			for (let k = 0; k < 8; k++) {
				const ratio = (strain / STRAP_STIFFENING) ** 2
				const f = STRAP_STIFFNESS * strain * (1 + ratio) - tension
				const df = STRAP_STIFFNESS * (1 + 3 * ratio)
				strain -= f / df
			}
			totalLength += STRAP_SEGMENT_REST * (1 + Math.max(strain, 0))
		}
		ANCHOR.y = REST_CLIP_Y + totalLength
		restAnchorDistance = totalLength
	}

	// Position et vitesse du clip dans le monde (le clip suit la carte)
	function updateClipState() {
		clipLever.copy(cardAttachLocalOffset).applyQuaternion(cardQuaternion)
		clipWorld.copy(cardPos).add(clipLever)
		tmpLeverCross.copy(cardAngVel).cross(clipLever)
		clipVelocity.copy(cardVel).add(tmpLeverCross)
	}

	// Impulsion appliquée à la carte en un point du monde : variation de vitesse linéaire, et de
	// vitesse angulaire via l'inertie (diagonale dans le repère de la carte).
	function applyCardImpulse(impulse: THREE.Vector3, point: THREE.Vector3) {
		cardVel.addScaledVector(impulse, CARD_INV_MASS)

		cardQuaternionInverse.copy(cardQuaternion).invert()
		tmpTorque
			.subVectors(point, cardPos)
			.cross(impulse)
			.applyQuaternion(cardQuaternionInverse)
		tmpTorque.set(
			tmpTorque.x / CARD_INERTIA_X,
			tmpTorque.y / CARD_INERTIA_Y,
			tmpTorque.z / CARD_INERTIA_Z
		)
		tmpTorque.applyQuaternion(cardQuaternion)
		cardAngVel.add(tmpTorque)
	}

	/**
	 * Résout l'élasticité de la sangle pour un sous-step.
	 * Contraintes "souples" (ressort + amortisseur) résolues au niveau des vitesses, à la Box2D :
	 * stables quelle que soit la raideur, et à sens unique (pas de poussée quand la sangle est détendue).
	 * La raideur augmente avec l'étirement (comme une sangle réelle), ce qui borne l'élongation maximale.
	 */
	function solveStrap(h: number) {
		updateClipState()
		cardQuaternionInverse.copy(cardQuaternion).invert()

		for (let i = 0; i < STRAP_SEGMENTS; i++) {
			const seg = strapSegments[i]!
			const a = i
			const b = i + 1
			seg.normal.subVectors(nodePositions[b]!, nodePositions[a]!)
			const length = seg.normal.length()
			seg.normal.multiplyScalar(1 / Math.max(length, 1e-6))
			seg.stretch = length - STRAP_SEGMENT_REST
			seg.accumulated = 0
			seg.active = seg.stretch > 0
			if (!seg.active) continue

			const strain = seg.stretch / STRAP_SEGMENT_REST
			const stiffening = 1 + (strain / STRAP_STIFFENING) ** 2
			const k = (STRAP_STIFFNESS / STRAP_SEGMENT_REST) * stiffening
			seg.gamma = 1 / (h * (STRAP_DAMPING + h * k))
			seg.bias = seg.stretch * h * k * seg.gamma

			let endInvMass = nodeInvMass[b]!
			if (b === CLIP_NODE) {
				// masse effective du clip le long de la sangle : translation + rotation de la carte
				tmpLeverCross
					.crossVectors(clipLever, seg.normal)
					.applyQuaternion(cardQuaternionInverse)
				endInvMass =
					CARD_INV_MASS +
					(tmpLeverCross.x * tmpLeverCross.x) / CARD_INERTIA_X +
					(tmpLeverCross.y * tmpLeverCross.y) / CARD_INERTIA_Y +
					(tmpLeverCross.z * tmpLeverCross.z) / CARD_INERTIA_Z
			}
			seg.endInvMass = endInvMass
			seg.effectiveInvMass = nodeInvMass[a]! + endInvMass
		}

		cardImpulse.set(0, 0, 0)
		for (let iteration = 0; iteration < STRAP_SOLVER_ITERATIONS; iteration++) {
			for (let i = 0; i < STRAP_SEGMENTS; i++) {
				const seg = strapSegments[i]!
				if (!seg.active) continue
				const a = i
				const b = i + 1
				tmpVelocity.subVectors(nodeVelocities[b]!, nodeVelocities[a]!)
				const stretchRate = tmpVelocity.dot(seg.normal)
				let delta =
					(stretchRate + seg.bias - seg.gamma * seg.accumulated) /
					(seg.effectiveInvMass + seg.gamma)
				const accumulated = Math.max(seg.accumulated + delta, 0) // la sangle ne fait que tirer
				delta = accumulated - seg.accumulated
				seg.accumulated = accumulated
				nodeVelocities[a]!.addScaledVector(seg.normal, delta * nodeInvMass[a]!)
				nodeVelocities[b]!.addScaledVector(seg.normal, -delta * seg.endInvMass)
				if (b === CLIP_NODE) cardImpulse.addScaledVector(seg.normal, -delta)
			}
		}

		// Les vitesses des maillons sont déjà à jour (vecteurs partagés) ; reste l'impulsion sur la carte.
		if (cardImpulse.lengthSq() > 0) applyCardImpulse(cardImpulse, clipWorld)
	}

	// Intégration semi-implicite d'un pas : gravité, amortissement (même formule que Rapier :
	// v *= 1 / (1 + c·dt)), puis positions et rotation de la carte.
	function integrate(h: number) {
		const linkDamping = 1 / (1 + h * LINK_LINEAR_DAMPING)
		for (let i = 0; i < STRAP_LINKS; i++) {
			const vel = linkVel[i]!
			vel.y -= GRAVITY * h
			vel.multiplyScalar(linkDamping)
			linkPos[i]!.addScaledVector(vel, h)
		}

		cardVel.y -= GRAVITY * h
		cardVel.multiplyScalar(1 / (1 + h * CARD_LINEAR_DAMPING))
		cardAngVel.multiplyScalar(1 / (1 + h * CARD_ANGULAR_DAMPING))
		cardPos.addScaledVector(cardVel, h)

		const angularSpeed = cardAngVel.length()
		if (angularSpeed > 1e-9) {
			tmpAxis.copy(cardAngVel).multiplyScalar(1 / angularSpeed)
			tmpDeltaQuat.setFromAxisAngle(tmpAxis, angularSpeed * h)
			cardQuaternion.premultiply(tmpDeltaQuat).normalize()
		}
	}

	// Place le badge au-dessus du cadre, hors champ, avec la sangle détendue : il n'a plus qu'à tomber.
	// La sangle élastique le rattrape, il rebondit un peu et se stabilise à sa position de repos.
	function placeForDrop() {
		const clipY = frameTopY + DROP_CLEARANCE + CARD_HEIGHT / 2 + CARD_ATTACH_Y
		const clipStart = new THREE.Vector3(ANCHOR.x, clipY, ANCHOR.z)
		const tilt = (Math.random() - 0.5) * 2 * DROP_TILT
		const spin = (Math.random() - 0.5) * 2 * DROP_SPIN

		// Les maillons sont répartis entre l'ancre et le clip (jamais plus espacés que leur longueur
		// de repos) : la sangle démarre détendue, sans à-coup.
		for (let i = 0; i < STRAP_LINKS; i++) {
			linkPos[i]!.copy(ANCHOR).lerp(clipStart, (i + 1) / STRAP_SEGMENTS)
			linkVel[i]!.set(0, 0, 0)
		}

		cardPos.set(ANCHOR.x, clipY - CARD_ATTACH_Y, ANCHOR.z)
		cardQuaternion.setFromEuler(tmpEuler.set(0, 0, tilt))
		cardVel.set(0, 0, 0)
		cardAngVel.set(0, 0, spin)

		accumulator = 0
		bandInitialized = false
		bandStretch = 0
		physicsReady = true
	}

	function buildBand() {
		if (!scene) return

		// Tissu : mat, avec un léger voile de "sheen" (reflet soyeux typique du polyester tissé)
		// et un relief de tissage qui accroche la lumière.
		const strapMaterial = new THREE.MeshPhysicalMaterial({
			map: strapTexture,
			bumpMap: strapBumpTexture,
			bumpScale: 1.6,
			roughness: 0.82,
			metalness: 0,
			sheen: 1,
			sheenRoughness: 0.55,
			sheenColor: new THREE.Color("#9aa3b5"),
			envMapIntensity: 0.7,
		})
		strapRibbon = createStrapRibbon({
			samples: RIBBON_SAMPLES,
			width: STRAP_WIDTH,
			thickness: STRAP_THICKNESS,
			textureLength: STRAP_TEXTURE_LENGTH,
			restLength: STRAP_REST_LENGTH,
			endSlant: STRAP_END_SLANT,
			material: strapMaterial,
		})
		scene.add(strapRibbon.mesh)

		const pinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16)
		const pinMaterial = new THREE.MeshStandardMaterial({
			color: "#222222",
			roughness: 0.4,
			metalness: 0.6,
		})
		const pin = new THREE.Mesh(pinGeometry, pinMaterial)
		pin.position.copy(ANCHOR)
		scene.add(pin)
	}

	function buildCard(data: BadgeData) {
		if (!scene) return
		cardGroup = new THREE.Group()
		// flipGroup porte la carte : on le fait tourner sur Y sans toucher à l'état physique
		flipGroup = new THREE.Group()

		// Une seule résolution de couleur CSS (chacune force un recalcul de style)
		const cardColor = resolveMaterialColor(data.colors.cardBg)

		// Le biseau étend le contour de CARD_BEVEL : on part d'une forme réduite
		// pour que la carte finie fasse exactement CARD_WIDTH x CARD_HEIGHT
		const innerW = CARD_WIDTH - CARD_BEVEL * 2
		const innerH = CARD_HEIGHT - CARD_BEVEL * 2
		const innerR = CARD_CORNER_RADIUS - CARD_BEVEL
		const extrudeDepth = CARD_THICKNESS - CARD_BEVEL * 2

		// Corps : tranche arrondie + arêtes biseautées qui captent la lumière
		const bodyGeometry = new THREE.ExtrudeGeometry(
			createCardShape(innerW, innerH, innerR),
			{
				depth: extrudeDepth,
				bevelEnabled: true,
				bevelThickness: CARD_BEVEL,
				bevelSize: CARD_BEVEL,
				bevelSegments: 3,
				curveSegments: 12,
			}
		)
		bodyGeometry.translate(0, 0, -extrudeDepth / 2)

		const edgeMaterial = new THREE.MeshPhysicalMaterial({
			color: cardColor, // même noir que les faces : la tranche ne fait qu'un avec la carte
			roughness: 0.22,
			metalness: 0.7,
			clearcoat: 1,
			clearcoatRoughness: 0.08,
			envMapIntensity: 1.3,
		})
		const body = new THREE.Mesh(bodyGeometry, edgeMaterial)
		body.name = "lanyard-card"
		flipGroup.add(body)

		// Faces texturées : vernis brillant (clearcoat) + rugosité de base pour un rendu "PVC laminé".
		// Même configuration pour les deux faces : un seul programme de shader pour les deux.
		const makeFaceMaterial = (map: THREE.Texture) =>
			new THREE.MeshPhysicalMaterial({
				map,
				roughness: 0.42,
				metalness: 0.05,
				clearcoat: 1,
				clearcoatRoughness: 0.06,
				envMapIntensity: 1.15,
				polygonOffset: true,
				polygonOffsetFactor: -1,
				polygonOffsetUnits: -1,
			})

		const faceGeometry = createFaceGeometry(innerW, innerH, innerR)
		const zFace = CARD_THICKNESS / 2 + CARD_FACE_OFFSET

		const front = new THREE.Mesh(faceGeometry, makeFaceMaterial(frontTexture))
		front.position.z = zFace
		flipGroup.add(front)

		// La face arrière est tournée de 180° : la texture se lit à l'endroit vue de derrière.
		// Invisible tant que sa texture n'est pas dessinée (voir buildBackFace).
		const back = new THREE.Mesh(faceGeometry, makeFaceMaterial(backTexture))
		back.rotation.y = Math.PI
		back.position.z = -zFace
		back.visible = backBuilt
		backMesh = back
		flipGroup.add(back)

		cardGroup.add(flipGroup)

		// Porte-badge noir mat, brillant comme du métal laqué.
		// Même noir que la carte (data.colors.cardBg, résolu depuis le thème par l'appelant) : peinture
		// mate, pas un métal poli qui vire au gris sous la lumière. metalness bas + clearcoat fin = un
		// léger reflet satiné en haut des arêtes, sans jamais désaturer le noir en plein milieu des faces.
		const blackMetal = new THREE.MeshPhysicalMaterial({
			color: cardColor,
			metalness: 0.15,
			roughness: 0.55,
			clearcoat: 0.35,
			clearcoatRoughness: 0.3,
			envMapIntensity: 0.6,
		})
		const hardware = createLanyardHardware(
			{ slotCenterY: SLOT_CENTER_Y, slotHeight: SLOT_HEIGHT, yaw: HARDWARE_YAW },
			STRAP_WIDTH,
			blackMetal
		)

		// Fût de l'émerillon + mousqueton : dans flipGroup, ils tournent avec la carte (le mousqueton est
		// passé dans la fente, sur l'axe vertical) quand on la retourne.
		flipGroup.add(hardware.rotating)

		// Embout + tige : placés au point d'attache de la sangle, ils n'héritent que de l'inclinaison de
		// la carte, pas de sa rotation autour de l'axe vertical : c'est le rôle du pivot.
		topGroup = hardware.fixed
		scene.add(topGroup)

		scene.add(cardGroup)
	}

	const BAND_SAMPLE_SMOOTHING = 0.75
	let bandInitialized = false

	// Décompose la rotation de la carte en inclinaison ("swing") et rotation autour de son axe vertical
	// ("twist"). Le pivot de l'émerillon absorbe le twist : seule l'inclinaison passe à l'embout.
	function updateSwivelFrame() {
		const len = Math.hypot(cardQuaternion.y, cardQuaternion.w)
		if (len < 1e-6) {
			swingQuaternion.copy(cardQuaternion) // cas dégénéré : carte retournée de 180° autour d'un axe horizontal
			return
		}
		twistQuaternion.set(0, cardQuaternion.y / len, 0, cardQuaternion.w / len)
		swingQuaternion.copy(cardQuaternion).multiply(twistQuaternion.invert())
	}

	function syncBand() {
		if (!strapRibbon) return
		curve.points[0]!.copy(ANCHOR)

		for (let i = 0; i < STRAP_LINKS; i++) {
			if (!bandInitialized) {
				curve.points[i + 1]!.copy(linkPos[i]!)
			} else {
				curve.points[i + 1]!.lerp(linkPos[i]!, BAND_SAMPLE_SMOOTHING)
			}
		}

		// Pas de lissage sur le dernier point : la sangle finit toujours pile dans le sertissage
		updateClipState()
		curve.points[CLIP_NODE]!.copy(clipWorld)
		bandInitialized = true

		// Pivot : la sangle s'aligne sur l'embout, qui n'hérite pas de la rotation de la carte autour de
		// l'axe vertical (elle est absorbée par l'émerillon)
		updateSwivelFrame()
		cardXAxis.set(1, 0, 0).applyQuaternion(swingQuaternion)

		// Elle s'amincit quand elle s'étire (conservation du volume, comme un vrai élastique)
		const stretch = Math.max(clipWorld.distanceTo(ANCHOR) / restAnchorDistance - 1, 0)
		bandStretch += (stretch - bandStretch) * 0.2
		const widthRatio = Math.max(
			1 / Math.sqrt(1 + bandStretch * 1.2),
			STRAP_MIN_WIDTH_RATIO
		)

		strapRibbon.update(curve, cardXAxis, widthRatio)
	}

	function syncCard() {
		cardGroup.position.copy(cardPos)
		cardGroup.quaternion.copy(cardQuaternion)
		flipGroup.rotation.y = flipAngle

		// L'embout suit le point d'attache de la sangle (état calculé par syncBand juste avant)
		topGroup.position.copy(clipWorld)
		topGroup.quaternion.copy(swingQuaternion)
	}

	function updateFlip(deltaSeconds: number) {
		// ressort amorti (léger rebond) — intégration semi-implicite
		flipVelocity +=
			((flipTarget - flipAngle) * FLIP_STIFFNESS - flipVelocity * FLIP_DAMPING) *
			deltaSeconds
		flipAngle += flipVelocity * deltaSeconds
	}

	function toggleFlip() {
		ensureBackFace()
		// on avance toujours dans le même sens, la rotation reste fluide
		flipTarget += Math.PI
	}

	function applyUprightCorrection() {
		if (dragging) return
		tmpEuler.setFromQuaternion(cardQuaternion, "YXZ")

		let yawError = tmpEuler.y
		if (yawError > Math.PI) yawError -= Math.PI * 2
		if (yawError < -Math.PI) yawError += Math.PI * 2

		const correction = THREE.MathUtils.clamp(yawError * 0.6, -2, 2)
		cardAngVel.y -= correction
	}

	// Ressort amorti appliqué au point saisi de la carte : la carte suit le pointeur
	// en gardant sa physique (inertie, rotation due au bras de levier, tension de la sangle)
	function applyDragForce(dt: number) {
		if (!dragging || !dragMoved || !physicsReady) return

		tmpLever.copy(dragLocalGrab).applyQuaternion(cardQuaternion)
		tmpGrabWorld.copy(cardPos).add(tmpLever)

		tmpError.subVectors(dragTarget, tmpGrabWorld)
		tmpError.z = 0 // on ne pousse jamais la carte hors de son plan
		clampVectorMagnitude(tmpError, MAX_DRAG_ERROR)

		tmpAngularVelocity.copy(cardAngVel).cross(tmpLever)
		tmpPointVelocity.copy(cardVel).add(tmpAngularVelocity)

		tmpImpulse
			.copy(tmpError)
			.multiplyScalar(DRAG_STIFFNESS)
			.addScaledVector(tmpPointVelocity, -DRAG_DAMPING)
			.multiplyScalar(CARD_MASS * dt)

		applyCardImpulse(tmpImpulse, tmpGrabWorld)
	}

	// Filet de sécurité : empêche toute vitesse aberrante (jamais atteint en usage normal)
	function clampBodyVelocities() {
		for (const velocity of linkVel) clampVectorMagnitude(velocity, MAX_LINK_SPEED)
		clampVectorMagnitude(cardVel, MAX_CARD_LINEAR_SPEED)
		clampVectorMagnitude(cardAngVel, MAX_CARD_ANGULAR_SPEED)
	}

	function stepPhysics(deltaSeconds: number) {
		if (!physicsReady) return
		accumulator += deltaSeconds
		let steps = 0
		while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUBSTEPS) {
			applyDragForce(FIXED_TIMESTEP)
			solveStrap(FIXED_TIMESTEP)
			integrate(FIXED_TIMESTEP)
			applyUprightCorrection()
			clampBodyVelocities()
			accumulator -= FIXED_TIMESTEP
			steps += 1
		}
		// Si l'onglet a été mis en pause, on abandonne le retard plutôt que de le rattraper d'un coup
		if (steps === MAX_SUBSTEPS) accumulator = 0
	}

	function tick(now: number) {
		if (destroyed || !renderer || !scene || !camera) return
		if (!isRenderingAllowed()) {
			// Ne redemande pas de frame : c'est handleVisibilityChange / l'IntersectionObserver qui
			// relancera la boucle via startRenderLoop() quand ça redevient utile. Vraie pause, pas juste
			// un rendu sauté à chaque frame (qui continuerait à consommer du CPU pour rien).
			renderLoopActive = false
			return
		}
		const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.1)
		lastFrameTime = now
		stepPhysics(deltaSeconds)
		updateFlip(deltaSeconds)
		syncBand()
		syncCard()
		renderer.render(scene, camera)
		rafId = requestAnimationFrame(tick)
	}

	// ─── Interactions ────────────────────────────────────────────────────────

	function getCanvasNDC(event: PointerEvent): THREE.Vector2 {
		const canvasEl = options.canvas.value!
		const rect = canvasEl.getBoundingClientRect()
		pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		return pointerNDC
	}

	// Intersection du rayon caméra avec le plan z = 0 (plan de la carte)
	function unprojectToDragPlane(
		ndc: THREE.Vector2,
		target: THREE.Vector3
	): THREE.Vector3 {
		if (!camera) return target
		raycaster.setFromCamera(ndc, camera)
		raycaster.ray.intersectPlane(dragPlane, target)
		return target
	}

	// Survol : le canvas reste pointer-events:none par défaut, pour que le reste de la page — texte,
	// liens — se comporte normalement (sélection, clic...) partout où la carte n'est pas visuellement
	// présente. On ne réactive le canvas, avec le curseur de préhension, que pile au-dessus de sa
	// géométrie 3D, via un raycast au survol. Écouté sur `window` (et non le canvas) : un élément
	// pointer-events:none ne reçoit jamais ses propres évènements, il faut donc les capter plus haut,
	// où ils remontent toujours par bulles.
	//
	// Uniquement sur un appareil qui n'a AUCUNE capacité tactile détectée : le tactile n'a pas de
	// survol, et touch-action (qui empêche le défilement de la page pendant le glisser) doit être
	// posé par avance sur l'élément qui reçoit le tout premier contact — impossible à activer après
	// coup, une fois le geste commencé. Sur un appareil tactile (y compris hybride, souris + tactile),
	// le canvas reste donc pointer-events:auto en permanence, comme avant ce correctif : mieux vaut
	// garder le glisser fonctionnel que restreindre le survol. Détection en JS plutôt qu'en CSS
	// (`@media (pointer: fine)`) : cette media query reflète le pointeur "principal" du système et
	// peut se tromper sur les machines hybrides (portable tactile utilisé à la souris), laissant le
	// canvas tout capturer en permanence sans qu'on s'en rende compte.

	let isHoveringBadge = false
	const hoverNDC = new THREE.Vector2()

	function setBadgeInteractive(interactive: boolean) {
		isHoveringBadge = interactive
		const canvasEl = options.canvas.value
		if (!canvasEl) return
		canvasEl.style.pointerEvents = interactive ? "auto" : "none"
		canvasEl.style.cursor = interactive ? "grab" : ""
	}

	function updateHoverState(event: PointerEvent) {
		if (dragging || !camera || !flipGroup || !topGroup) return
		const canvasEl = options.canvas.value
		if (!canvasEl) return
		const rect = canvasEl.getBoundingClientRect()
		if (
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom
		) {
			if (isHoveringBadge) setBadgeInteractive(false)
			return
		}
		hoverNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		hoverNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		raycaster.setFromCamera(hoverNDC, camera)
		const hits = raycaster.intersectObjects([flipGroup, topGroup], true)
		const hovering = hits.length > 0
		if (hovering !== isHoveringBadge) setBadgeInteractive(hovering)
	}

	function onPointerDown(event: PointerEvent) {
		if (!camera || !flipGroup || !topGroup || !physicsReady) return
		const ndc = getCanvasNDC(event)
		raycaster.setFromCamera(ndc, camera)
		const hits = raycaster.intersectObjects([flipGroup, topGroup], true)
		if (hits.length === 0) return

		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
		dragging = true
		if (!supportsTouch) {
			isHoveringBadge = true
			;(event.currentTarget as HTMLElement).style.cursor = "grabbing"
		}
		dragMoved = false
		pointerDownX = event.clientX
		pointerDownY = event.clientY
		pointerDownTime = performance.now()

		// L'utilisateur touche la carte : il peut la retourner, la face arrière doit être prête
		ensureBackFace()

		// On mémorise le point saisi dans le repère de la carte : il reste "collé" au doigt
		// même quand la carte tourne (saisir un coin la fait pivoter, comme en vrai)
		const hitPoint = hits[0]!.point
		tmpQuaternion.copy(cardQuaternion).invert()
		dragLocalGrab.copy(hitPoint).sub(cardPos).applyQuaternion(tmpQuaternion)
		dragTarget.copy(hitPoint)
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging || !camera) return

		if (!dragMoved) {
			const moved = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY)
			if (moved < CLICK_MOVE_THRESHOLD) return // encore un "clic", on ne tire pas la carte
			dragMoved = true
		}

		unprojectToDragPlane(getCanvasNDC(event), dragTarget)
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) return
		;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
		dragging = false

		const isClick =
			event.type === "pointerup" &&
			!dragMoved &&
			performance.now() - pointerDownTime < CLICK_MAX_DURATION

		if (isClick) toggleFlip()
		// Pas de vitesse de lâcher à gérer : la sangle se détend et la carte garde son élan

		if (!supportsTouch) {
			// Redéfinit proprement l'état de survol : le pointeur peut très bien avoir fini le glisser
			// ailleurs que sur la carte, auquel cas il faut redonner la main au reste de la page.
			isHoveringBadge = false
			updateHoverState(event)
		}
	}

	function attachPointerEvents() {
		const canvasEl = options.canvas.value
		if (!canvasEl) return
		canvasEl.style.touchAction = "none"
		// { passive: true } partout : aucun de ces gestionnaires n'appelle jamais preventDefault() (le
		// blocage du défilement pendant le glisser passe par touch-action:none, pas par du JS), le
		// navigateur peut donc les traiter sans attendre — un vrai gain de fluidité au scroll/toucher.
		canvasEl.addEventListener("pointerdown", onPointerDown, { passive: true })
		canvasEl.addEventListener("pointermove", onPointerMove, { passive: true })
		canvasEl.addEventListener("pointerup", onPointerUp, { passive: true })
		canvasEl.addEventListener("pointercancel", onPointerUp, { passive: true })
		if (supportsTouch) {
			// Comportement historique : le canvas capture tout, sur toute sa surface, en permanence.
			canvasEl.style.pointerEvents = "auto"
		} else {
			// Pointeur fin, sans tactile détecté : on part masqué, et seul le survol (raycast) réactive
			// le canvas pile au-dessus du badge — voir updateHoverState.
			canvasEl.style.pointerEvents = "none"
			window.addEventListener("pointermove", updateHoverState, { passive: true })
		}
	}

	function detachPointerEvents() {
		const canvasEl = options.canvas.value
		if (!canvasEl) return
		canvasEl.removeEventListener("pointerdown", onPointerDown)
		canvasEl.removeEventListener("pointermove", onPointerMove)
		canvasEl.removeEventListener("pointerup", onPointerUp)
		canvasEl.removeEventListener("pointercancel", onPointerUp)
		if (!supportsTouch) window.removeEventListener("pointermove", updateHoverState)
	}

	// ─── Rendu ───────────────────────────────────────────────────────────────

	// Cadre la scène : un bout de sangle visible en haut, carte au repos + petit padding en bas,
	// et badge décalé vers la droite (uniquement sur écrans larges)
	function updateCameraFraming(aspect: number) {
		if (!camera) return

		const { frameTop, frameBottom, frameHeight } = getFrameMetrics(aspect)
		frameTopY = frameTop
		const centerY = (frameTop + frameBottom) / 2
		const distance = frameHeight / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2))
		const visibleWidth = frameHeight * aspect
		const shiftRatio = THREE.MathUtils.clamp((aspect - 0.9) * 0.25, 0, MAX_SHIFT_RATIO)
		const cameraX = ANCHOR.x - visibleWidth * shiftRatio

		camera.position.set(cameraX, centerY, distance)
		camera.lookAt(cameraX, centerY, 0)
	}

	function handleResize() {
		const containerEl = options.container.value
		if (!containerEl || !renderer || !camera) return
		const width = Math.max(containerEl.clientWidth, 1)
		const height = Math.max(containerEl.clientHeight, 1)
		renderer.setSize(width, height, false)
		camera.aspect = width / height
		updateCameraFraming(camera.aspect)
		camera.updateProjectionMatrix()
	}

	function observeResize() {
		const containerEl = options.container.value
		if (!containerEl) return
		resizeObserver = new ResizeObserver(() => handleResize())
		resizeObserver.observe(containerEl)
	}

	// Compilation des shaders : asynchrone quand le navigateur le permet (le GPU compile pendant que le
	// CPU dessine les textures), synchrone sinon.
	async function compileScene() {
		if (!renderer || !scene || !camera) return
		try {
			if (typeof renderer.compileAsync === "function") {
				await renderer.compileAsync(scene, camera)
			} else {
				renderer.compile(scene, camera)
			}
		} catch {
			// Le premier rendu compilera ce qui manque
		}
	}

	async function init() {
		if (!options.canvas.value || !options.container.value) return

		// Seul vrai point d'attente : on ne démarre le travail lourd qu'une fois la transition finie.
		await pageTransitionDone
		if (destroyed) return

		const badgeData = toValue(options.data)

		// Équilibre de la sangle calculé directement (aucune simulation à faire tourner)
		initStrapPhysics()
		cardTextureScale = pickCardTextureScale()

		scene = new THREE.Scene()
		camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)

		renderer = new THREE.WebGLRenderer({
			canvas: options.canvas.value,
			// MSAA coûte cher sur les GPU mobiles ; les textures sur-échantillonnées + le rendu à haute
			// densité de pixels suffisent à garder des arêtes propres sans ce coût-là sur tactile.
			antialias: !supportsTouch,
			alpha: true,
			// "low-power" laisse le système garder le GPU efficace (moins de chauffe/de batterie) sur
			// mobile ; "high-performance" ailleurs, pour ne rien sacrifier sur desktop.
			powerPreference: supportsTouch ? "low-power" : "high-performance",
		})
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, supportsTouch ? 1.5 : 2))
		renderer.toneMapping = THREE.ACESFilmicToneMapping
		renderer.outputColorSpace = THREE.SRGBColorSpace

		const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 4)
		frontTexture.anisotropy = maxAniso
		backTexture.anisotropy = maxAniso
		strapTexture.anisotropy = maxAniso
		strapBumpTexture.anisotropy = maxAniso

		const pmremGenerator = new THREE.PMREMGenerator(renderer)
		scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
		pmremGenerator.dispose()

		const keyLight = new THREE.DirectionalLight("#ffffff", 1.4)
		keyLight.position.set(2, 3, 4)
		scene.add(keyLight)

		// Lumière d'appoint froide : liseré de reflet sur les tranches quand la carte tourne
		const rimLight = new THREE.DirectionalLight("#9fb8ff", 0.9)
		rimLight.position.set(-3, 2, -2)
		scene.add(rimLight)

		scene.add(new THREE.AmbientLight("#ffffff", 0.5))

		// Scène complète AVANT de dessiner les textures : le programme de shader ne dépend pas du contenu
		// des textures, donc la compilation peut démarrer tout de suite.
		buildBand()
		buildCard(badgeData)
		observeResize()
		handleResize()

		const compiled = compileScene()

		// Pendant que le GPU compile, le CPU dessine les textures visibles au départ.
		const [brandMark] = await Promise.all([loadBrandMarkImage(), fontReady])
		if (destroyed) return
		buildStrapTexture(badgeData)
		buildFrontTexture(badgeData, brandMark)

		await compiled
		if (destroyed || !renderer) return
		for (const texture of [frontTexture, strapTexture, strapBumpTexture]) {
			renderer.initTexture(texture)
		}

		placeForDrop()
		attachPointerEvents()
		observeVisibility()
		startRenderLoop()

		// Face arrière : une fois le drop terminé, en temps mort
		setTimeout(() => scheduleIdle(ensureBackFace), BACK_FACE_DELAY_MS)
	}

	function disposeMaterial(material: THREE.Material) {
		const withMap = material as THREE.MeshStandardMaterial
		withMap.map?.dispose()
		withMap.bumpMap?.dispose()
		material.dispose()
	}

	function dispose() {
		destroyed = true
		stopRenderLoop()
		resizeObserver?.disconnect()
		intersectionObserver?.disconnect()
		document.removeEventListener("visibilitychange", handleVisibilityChange)
		detachPointerEvents()

		scene?.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose()
				const materials = Array.isArray(object.material)
					? object.material
					: [object.material]
				materials.forEach(disposeMaterial)
			}
		})
		frontTexture.dispose()
		backTexture.dispose()
		strapTexture.dispose()
		strapBumpTexture.dispose()
		scene?.environment?.dispose()
		renderer?.dispose()
	}

	// ─── Préchargement léger ─────────────────────────────────────────────────
	// Réseau et décodage uniquement (police, module qrcode, logo) : aucun calcul sur le thread principal,
	// donc ça ne gêne pas la transition. Quand elle se termine, tout est déjà là.
	const fontReady: Promise<unknown> = document.fonts
		.load('400 150px "VG5000"')
		.catch(() => [])
	const qrModuleReady = import("qrcode").catch(() => null)
	void loadBrandMarkImage()

	const stopRefWatch = watch(
		[options.canvas, options.container],
		([canvasEl, containerEl]) => {
			if (!canvasEl || !containerEl) return
			stopRefWatch()
			init().catch((err) => {
				console.error("[LanyardBadge] init() a rejeté:", err)
			})
		},
		{ immediate: true }
	)

	onBeforeUnmount(() => {
		stopRefWatch()
		dispose()
	})

	watch(
		() => toValue(options.data),
		async (badgeData) => {
			if (!scene || !renderer) return
			buildStrapTexture(badgeData)
			buildFrontTexture(badgeData, brandMarkImage)
			// La face arrière n'est redessinée que si elle existe déjà
			if (backBuilt) await buildBackFace()
		},
		{ deep: true }
	)
}
