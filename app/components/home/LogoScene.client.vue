<template>
	<div ref="wrapper" class="logo-scene-wrapper" @contextmenu.prevent>
		<div ref="container" class="logo-scene"></div>
	</div>
</template>

<script setup lang="ts">
import type { GLTFLoader as GLTFLoaderType } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { mergeVertices as MergeVerticesType } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// ---------------------------------------------------------------------------
// Couleurs de la structure filaire, selon le type de métal source de chaque
// arête — LES variables à changer pour recolorer.
// ---------------------------------------------------------------------------
const STRUCTURE_COLOR_FACE_FONCE = 0xeaeaea
const STRUCTURE_COLOR_BODY = 0x6840ff
const STRUCTURE_OPACITY = 0.8

const wrapper = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)

// -- État réactif dépendant de l'environnement client (SSR-safe) -----------
const prefersReducedMotion = ref(false)
const isTouchDevice = ref(false)

let THREE: typeof import("three")
let mergeVertices: typeof MergeVerticesType
let scene: import("three").Scene
let camera: import("three").PerspectiveCamera
let renderer: import("three").WebGLRenderer
let logo: import("three").Object3D | null = null
let raycaster: import("three").Raycaster
let frameId = 0
let containerResizeObserver: ResizeObserver
let visibilityObserver: IntersectionObserver
let reducedMotionQuery: MediaQueryList
let touchQuery: MediaQueryList
let dprQuery: MediaQueryList | null = null
let initialized = false
let isVisible = true
let pmrem: import("three").PMREMGenerator
let envTexture: import("three").Texture | null = null
let flakeMap: import("three").CanvasTexture | null = null
let sceneEl: HTMLDivElement | null = null // le petit conteneur 3D (pour le raycast)
let wrapperEl: HTMLDivElement | null = null // le conteneur parent complet (pour le curseur)

// Rect du conteneur 3D, mis en cache et recalculé uniquement au resize —
// jamais lu à chaque frame/pointermove, pour éviter un forced reflow
// synchrone à chaque déplacement de souris (getBoundingClientRect() force
// le navigateur à recalculer le layout s'il est "dirty" à cet instant).
let cachedSceneRect: DOMRect | null = null

// Vecteurs réutilisés d'une frame/d'un event à l'autre pour éviter les
// allocations dans les callbacks à haute fréquence (pointermove, animate).
let sharedNdc: import("three").Vector2
let sharedWorldPoint: import("three").Vector3

let baseScale = 1
let logoMaxDim = 1
let introStart = 0
let introDuration = 2000
const introSpins = 1.3

// -- Rotation continue -------------------------------------------------------
let autoRotationY = 0
const baseRotateSpeed = 0.32
let lastFrameTime = 0

// -- Réaction à la vélocité de scroll (deux étages de lissage) --------------
let lastScrollY = 0
let scrollVelocity = 0
let rotationBoost = 0
const velocityTrackingRate = 13
const boostSmoothingRate = 3.4
const scrollBoostFactor = 0.0017
const maxScrollBoost = 5.8

// -- Respiration organique (tangage) ----------------------------------------
let floatPhase = 0
const floatAmplitude = 0.045
const floatSpeed = 0.7

// -- Survol du logo (desktop) -------------------------------------------------
// Le raycast réel est throttlé à une fois par frame RENDUE plutôt que
// déclenché à chaque event pointermove (qui peut arriver bien plus souvent
// que le rafraîchissement écran) : les handlers ne font que mémoriser la
// dernière position connue du pointeur.
let pendingPointerX = 0
let pendingPointerY = 0
let hasPendingPointer = false
const metalMeshes: import("three").Mesh[] = []

// -- Rotation manuelle au doigt (mobile/tablette uniquement) -----------------
// Un seul axe : le glissé HORIZONTAL fait tourner le logo sur lui-même
// (rotation.y, le même axe que la rotation automatique) — plus de tangage
// (rotation.x) piloté au doigt, qui a été retiré. Jamais actif sur desktop
// (l'interaction desktop reste le survol gooey) : les listeners ne sont
// enregistrés que si isTouchDevice, voir tryInit.
//
// Le geste s'ADDITIONNE directement à `autoRotationY` frame par frame
// (plutôt que de calculer un offset séparé depuis le point de départ), pour
// pouvoir enchaîner naturellement sur l'inertie ci-dessous une fois le
// doigt relâché — un seul et même chemin de rotation, jamais de saut.
let isDragging = false
let dragPointerId: number | null = null
// Comme pour le survol (pendingPointerX/Y) : les events pointermove ne font
// que mémoriser la dernière position, le déplacement réel n'est appliqué
// qu'une fois par frame RENDUE dans updateDragRotation — sinon la vitesse
// mesurée dépendrait du taux d'events du navigateur plutôt que du temps.
let dragLastFrameX = 0
let pendingDragX = 0
let hasPendingDragMove = false
// Vitesse de rotation induite par le doigt, en radians/seconde, lissée dans
// le temps (pas recalculée brute à chaque frame) pour ne pas hériter du
// bruit d'un seul event tactile.
let dragVelocityY = 0
// Vitesse "héritée" du dernier geste, appliquée APRÈS relâchement du doigt
// et qui décroît en douceur vers 0 (voir updateDragRotation) au lieu de
// couper net sur la vitesse de rotation automatique de base.
let inertiaVelocityY = 0
const DRAG_ROTATE_SPEED = 0.012 // radians par pixel glissé horizontalement
const DRAG_VELOCITY_SMOOTHING_RATE = 16 // lissage de la vitesse mesurée pendant le geste
const DRAG_INERTIA_DECAY_RATE = 2.2 // plus petit = l'inertie post-relâchement dure plus longtemps

// -- Masque gooey : taille fixe, ne dépend d'aucune vélocité ------------------
// À l'intérieur : le métal se découpe (discard) pour laisser voir la
// structure derrière. À l'extérieur : le métal reste plein, par défaut.
// La structure fait l'inverse (discard À L'EXTÉRIEUR) via les MÊMES uniforms,
// pour garantir que les deux découpes sont toujours parfaitement
// complémentaires — y compris sur les arêtes/silhouette du modèle.
//
// Tout le calcul se fait maintenant dans UN SEUL référentiel commun : l'espace
// local de `logo` (le groupe racine). Un seul jeu d'uniforms, un seul centre
// de masque, au lieu d'un jeu par mesh — plus simple, moins de travail par
// frame, et garanti cohérent quel que soit le nombre de meshes du modèle.
// Rayon de l'effet gooey, en fraction de la plus grande dimension du logo.
// C'est LE réglage à toucher pour agrandir/rétrécir le cercle sous le curseur.
const MASK_RADIUS_FACTOR = 0.2
// Vitesse globale de l'animation temporelle du masque gooey (vagues du
// contour, domain warping, pulsation). Tous les termes temporels de
// rc_maskStrength passent par ce facteur commun : on garde exactement les
// mêmes RAPPORTS de fréquence entre eux (donc le même "look"), on ralentit
// juste l'horloge globale. Calé sur l'effet de référence, qui n'utilise
// jamais le temps brut mais systématiquement "time * 0.05" avant de s'en
// servir — un mouvement lent et houleux plutôt que nerveux.
const MASK_TIME_SPEED = 0.16
// Amplitude de l'ondulation du contour par rapport au rayon, et largeur de la
// zone de transition. Volontairement modestes et avec une transition assez
// large : on cherche un bord qui se fond en douceur, façon goutte d'eau, et
// non un contour piquant à forte amplitude.
const EDGE_NOISE_RATIO = 0.8
const EDGE_SOFTNESS_RATIO = 0.5
// Domain warping : la POSITION échantillonnée par le bruit est elle-même
// déformée avant d'être lue, au lieu d'un simple décalage additif sur le
// résultat — c'est ce qui fait "couler" le contour plutôt que de le faire
// juste onduler sur place, façon liquide. En fraction de la plus grande
// dimension du logo.
const WARP_AMOUNT_RATIO = 0.14
// Deuxième couche de bruit, plus fine et plus rapide, superposée à la
// première : fait apparaître de petites excroissances sur le contour
// principal plutôt qu'un bord parfaitement lisse. Ce sont de purs
// multiplicateurs (aucune dépendance à logoMaxDim connue seulement après
// chargement du modèle), donc injectés en dur dans le GLSL au chargement du
// module plutôt qu'en uniforms — un upload de moins par frame. Volontairement
// discrets : trop marqués, cette couche fait "bouillonner" le contour au lieu
// de le laisser onduler comme une vague.
const FINE_NOISE_SCALE_MULT = 1.5
const FINE_NOISE_AMOUNT_RATIO = 1.5

interface MaskUniforms {
	uMaskCenter: { value: import("three").Vector3 }
	uMaskRadius: { value: number }
	uNoiseScale: { value: number }
	uNoiseAmount: { value: number }
	uEdgeSoftness: { value: number }
	uWarpAmount: { value: number }
	uTime: { value: number }
	uMotionScale: { value: number }
}

let maskUniforms: MaskUniforms | null = null
let maskCenterCurrent: import("three").Vector3
let maskCenterTarget: import("three").Vector3
let hasMaskTarget = false
let revealProgress = 0
let revealTarget = 0
const revealLerpSpeed = 0.1
const cursorChaseRate = 26

// -- Rendu "structure / architecture" (toujours là, derrière le métal) -------
// Une seule ligne fusionnée PAR GROUPE DE MATÉRIAU (un seul draw call par
// passe de croquis et par groupe, voir plus bas), chaque groupe ayant sa
// propre couleur (STRUCTURE_COLOR_FACE_FONCE / STRUCTURE_COLOR_BODY).
//
// Angle (en degrés) au-delà duquel une arête est considérée "dure" et donc
// dessinée. J'avais initialement testé 25° en pensant filtrer du bruit —
// erreur : en rendant les arêtes du modèle réel à plusieurs seuils (image
// par image, pas juste un comptage), 25° détruit la silhouette du logo, qui
// est faite de courbes fines tessellées en petits angles. La forme reste
// intacte jusqu'à 20° ; en dessous de ~10-12° on garde toute la courbe sans
// trop de segments redondants. 12° est un compromis sûr, validé visuellement
// contre le modèle réel (contrairement à 25°, qui ne l'était pas).
const STRUCTURE_EDGE_THRESHOLD_DEG = 12
// Tolérance de soudure des SOMMETS, en valeur ABSOLUE (unités natives du
// .glb) : elle sert uniquement à recoller les doublons de sommets issus des
// seams UV/normals (bruit de flottant, pas une distance physique), donc une
// petite valeur absolue est correcte ici.
const STRUCTURE_WELD_TOLERANCE = 1e-4
// Important : ce qui ressemblait à des "arêtes doublées par un bevel" est en
// réalité le bord intérieur ET extérieur de formes qui ont une vraie largeur
// en 3D (un anneau de lunettes, un ruban) — visible en rendant chaque mesh
// séparément. Ce n'est pas un défaut à corriger : un anneau a forcément deux
// bords. Toute fusion automatique de segments proches et parallèles risque
// de confondre "deux bords d'un même ruban" avec "deux points consécutifs
// sur une même courbe" (les deux se ressemblent localement), et donc
// d'aplatir de vraies courbes — testé, ça arrive réellement. Aucune fusion
// n'est donc appliquée ici.
const STRUCTURE_PULSE_SPEED = 0.9
const STRUCTURE_PULSE_AMOUNT = 0.08

// -- Effet "croquis à main levée" sur la structure ---------------------------
// Le but : que les arêtes ne ressemblent plus à des segments CAO parfaitement
// droits, mais à un trait tracé à la main — jamais parfaitement propre,
// légèrement décalé, avec plusieurs passes superposées comme un dessinateur
// qui repasse son trait deux ou trois fois.
//
// Décalage FIXE par sommet (basé sur un hash de sa position dans l'espace
// local du logo), en fraction de la plus grande dimension du logo. C'est un
// décalage STABLE (pas une simple animation qui repart de zéro) : deux
// arêtes qui partagent un sommet obtiennent exactement le même hash donc
// exactement le même décalage — les jointures restent connectées, pas de
// "trait qui explose" aux coins.
const SKETCH_JITTER_AMOUNT_RATIO = 0.004
// Échelle spatiale du hash de position : plus petit = décalage cohérent sur
// une grande zone (le trait "dérive" doucement), plus grand = décalage plus
// haché sommet par sommet. Reste bas pour que la forme reste identifiable.
const SKETCH_NOISE_SCALE = 6
// Tremblement supplémentaire DANS LE TEMPS ("la main ne reste jamais
// parfaitement immobile") — amplitude volontairement très faible, juste de
// quoi donner un trait vivant plutôt qu'un rendu figé. Coupé sous
// prefers-reduced-motion (via uMotionScale), contrairement au décalage fixe
// ci-dessus qui reste (c'est une irrégularité de FORME, pas une animation).
const SKETCH_WOBBLE_AMOUNT_RATIO = 0.0012
const SKETCH_WOBBLE_SPEED = 0.5
// Nombre de traits superposés par arête. 1 = trait unique et propre, 2-3 =
// effet "repassé plusieurs fois" façon croquis. Chaque passe a son propre
// seed (donc son propre décalage, indépendant des autres) et une opacité
// plus faible : la superposition donne un cœur de trait plus dense et des
// bords plus incertains, comme un vrai trait de crayon.
const SKETCH_STROKE_OPACITY_RATIOS = [1, 0.55, 0.4]
const SKETCH_STROKE_COUNT = SKETCH_STROKE_OPACITY_RATIOS.length

// Dépassement de coin ("overshoot") : contrairement au jitter ci-dessus (qui
// garde les jointures soudées, car basé sur un hash de POSITION partagée),
// l'overshoot casse volontairement cette continuité aux DEUX vraies
// extrémités de chaque arête — jamais au point milieu ajouté par l'arc
// ci-dessous. C'est le geste qu'une main laisse presque toujours à un coin :
// le trait continue un peu trop loin, ou s'arrête un peu court. Le biais
// (1.4 / -0.3 dans le shader) favorise le dépassement plutôt que le manque,
// qui reste plus rare et plus discret — un trait qui "manque" son point trop
// souvent lit comme un bug, pas comme un style.
const SKETCH_OVERSHOOT_AMOUNT_RATIO = 0.01
// Plafond de l'overshoot en fraction de la longueur du SOUS-segment concerné
// (jamais de l'arête complète), pour qu'un petit segment ne se fasse jamais
// dévorer par un dépassement disproportionné.
const SKETCH_OVERSHOOT_MAX_FRACTION = 0.4

// Arc doux sur chaque arête : jusqu'ici un segment restait parfaitement
// droit entre ses deux sommets (seuls LES SOMMETS bougeaient) — c'est le
// signe le plus lisible d'un trait vectoriel plutôt qu'à main levée, aucune
// règle ne trace une droite parfaite. Chaque arête est donc subdivisée en un
// point milieu, décalé PERPENDICULAIREMENT à sa direction d'origine, de
// façon fixe (hash de la position du milieu, calculé une fois à la
// construction de la géométrie, jamais animé) — une irrégularité de FORME,
// comme le jitter, mais qui porte sur la trajectoire ENTRE deux sommets
// plutôt que sur les sommets eux-mêmes. Elle est donc partagée par les 3
// passes de croquis (qui appliquent ensuite CHACUNE leur propre
// jitter/wobble/overshoot par-dessus cette base déjà légèrement arquée).
const SKETCH_BOW_AMOUNT_RATIO = 0.005
// Plafond de l'arc en fraction de la longueur de l'arête d'origine, pour
// qu'une arête courte ne se retrouve jamais pliée en accordéon.
const SKETCH_BOW_MAX_FRACTION = 0.16

// Grain façon graphite : une texture spatiale FIXE (aucun terme uTime dans
// le calcul, pour ne jamais scintiller) qui fait légèrement varier
// l'opacité du trait sur sa longueur, plutôt qu'un aplat parfaitement
// uniforme — un trait de crayon réel n'est jamais parfaitement dense
// partout. uSketchGrainScale (dérivé de logoMaxDim) contrôle la finesse du
// grain, uSketchGrainMinAlpha son creux minimum — jamais 0, pour que le
// trait ne se troue jamais complètement.
const SKETCH_GRAIN_SCALE = 18
const SKETCH_GRAIN_MIN_ALPHA = 0.7

// Variance entre les 3 passes superposées : jusqu'ici seul le SEED du bruit
// changeait d'une passe à l'autre (donc une forme de décalage différente,
// mais de même AMPLITUDE). Les passes plus faibles en opacité (voir
// SKETCH_STROKE_OPACITY_RATIOS, décroissant) deviennent ici aussi les plus
// "cherchées" : jitter et overshoot grandissent avec l'indice de passe,
// comme les traits de recherche plus lâches qu'un dessinateur laisse sous
// le trait final et appuyé.
const SKETCH_PASS_VARIANCE_STEP = 0.35
// Chaque passe successive s'assombrit très légèrement — une accumulation de
// matière façon crayon plutôt que 3 copies de couleur strictement
// identique superposées. Volontairement subtil.
const SKETCH_PASS_COLOR_DARKEN_STEP = 0.05

let structureMaterials: (import("three").LineBasicMaterial & { opacity: number })[] = []
let structurePulsePhase = 0

function easeOutCubic(t: number) {
	return 1 - Math.pow(1 - t, 3)
}
function easeOutBack(t: number) {
	const c1 = 1.15
	const c3 = c1 + 1
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function clamp(v: number, min: number, max: number) {
	return Math.min(max, Math.max(min, v))
}

function expSmoothingFactor(rate: number, delta: number) {
	return 1 - Math.exp(-rate * delta)
}

// Hash déterministe côté CPU (même esprit que rc_hash côté GLSL, sans avoir
// besoin de correspondre numériquement) utilisé UNIQUEMENT pour l'arc de
// buildStructureEdges/finalizeStructureEdges — volontairement pas
// Math.random() : on veut un résultat stable d'un montage à l'autre, pas un
// logo dont le tracé change à chaque refresh (même principe que les seeds
// fixes du croquis GLSL).
function rc_jsHash(x: number, y: number, z: number) {
	const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
	return s - Math.floor(s)
}

// Générée une seule fois par montage, réutilisée pour tous les matériaux du logo.
function createFlakeNormalMap(size = 256, flakeCount = 900) {
	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext("2d")!

	ctx.fillStyle = "rgb(128, 128, 255)"
	ctx.fillRect(0, 0, size, size)

	for (let i = 0; i < flakeCount; i++) {
		const x = Math.random() * size
		const y = Math.random() * size
		const r = 0.5 + Math.random() * 1.2

		const angle = Math.random() * Math.PI * 2
		const tilt = 35 + Math.random() * 70
		const nx = Math.round(128 + Math.cos(angle) * tilt)
		const ny = Math.round(128 + Math.sin(angle) * tilt)

		ctx.fillStyle = `rgb(${nx}, ${ny}, 255)`
		ctx.beginPath()
		ctx.arc(x, y, r, 0, Math.PI * 2)
		ctx.fill()
	}

	const texture = new THREE.CanvasTexture(canvas)
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.set(7, 7)
	texture.needsUpdate = true
	return texture
}

// -- GLSL partagé pour le masque gooey ---------------------------------------
const RC_MASK_UNIFORMS_GLSL = `
	varying vec3 vObjectPosition;
	uniform vec3 uMaskCenter;
	uniform float uMaskRadius;
	uniform float uNoiseScale;
	uniform float uNoiseAmount;
	uniform float uEdgeSoftness;
	uniform float uWarpAmount;
	uniform float uTime;
	uniform float uMotionScale;
`

const RC_MASK_FUNCTIONS_GLSL = `
	float rc_hash(vec3 p) {
		p = fract(p * 0.1031);
		p += dot(p, p.yzx + 33.33);
		return fract((p.x + p.y) * p.z);
	}

	float rc_noise(vec3 x) {
		vec3 i = floor(x);
		vec3 f = fract(x);
		f = f * f * (3.0 - 2.0 * f);
		float n000 = rc_hash(i);
		float n100 = rc_hash(i + vec3(1.0, 0.0, 0.0));
		float n010 = rc_hash(i + vec3(0.0, 1.0, 0.0));
		float n110 = rc_hash(i + vec3(1.0, 1.0, 0.0));
		float n001 = rc_hash(i + vec3(0.0, 0.0, 1.0));
		float n101 = rc_hash(i + vec3(1.0, 0.0, 1.0));
		float n011 = rc_hash(i + vec3(0.0, 1.0, 1.0));
		float n111 = rc_hash(i + vec3(1.0, 1.0, 1.0));
		float nx00 = mix(n000, n100, f.x);
		float nx10 = mix(n010, n110, f.x);
		float nx01 = mix(n001, n101, f.x);
		float nx11 = mix(n011, n111, f.x);
		float nxy0 = mix(nx00, nx10, f.y);
		float nxy1 = mix(nx01, nx11, f.y);
		return mix(nxy0, nxy1, f.z);
	}

	float rc_fbm(vec3 p) {
		float sum = 0.0;
		float amp = 0.55;
		float freq = 1.0;
		for (int i = 0; i < 3; i++) {
			sum += rc_noise(p * freq) * amp;
			freq *= 2.03;
			amp *= 0.52;
		}
		return sum;
	}

	// Force du masque gooey au point donné (0 = hors zone, 1 = pleinement dedans).
	//
	// Domain warping : au lieu de simplement décaler le RÉSULTAT du bruit
	// (comme une respiration uniforme), on déforme la POSITION échantillonnée
	// avant de la lire. Le contour semble alors couler/onduler comme un
	// liquide plutôt que de gonfler et rétrécir en bloc. Une seconde couche de
	// bruit, plus fine et plus rapide, se superpose à la première pour faire
	// apparaître de petites excroissances sur le contour principal — comme de
	// petites gouttes qui se détachent — plutôt qu'un bord parfaitement lisse.
	//
	// uTime est multiplié par MASK_TIME_SPEED (<< 1) AVANT d'être injecté dans
	// le moindre sin/cos/échantillon de bruit : tous les termes ci-dessous
	// gardent leurs rapports de fréquence relatifs (donc la même "forme" de
	// mouvement), mais l'horloge globale tourne beaucoup plus lentement —
	// même principe que l'effet de référence, qui n'utilise jamais le temps
	// brut mais systématiquement "time * 0.05".
	float rc_maskStrength(vec3 objectPosition) {
		float rcTime = uTime * uMotionScale * ${MASK_TIME_SPEED.toFixed(4)};

		vec3 toCenter = objectPosition - uMaskCenter;
		float rcDist = length(toCenter);

		vec3 rcWarp = vec3(
			sin(objectPosition.y * uNoiseScale * 1.3 + rcTime * 1.6),
			cos(objectPosition.z * uNoiseScale * 1.3 - rcTime * 1.1),
			sin(objectPosition.x * uNoiseScale * 1.3 + rcTime * 1.4)
		) * uWarpAmount;

		vec3 rcEdgeSample = (objectPosition + rcWarp) * uNoiseScale + vec3(rcTime * 0.6, rcTime * -0.4, rcTime * 0.42);
		float rcEdgeNoise = rc_fbm(rcEdgeSample) - 0.5;

		vec3 rcFineSample = (objectPosition + rcWarp * 0.5) * uNoiseScale * ${FINE_NOISE_SCALE_MULT.toFixed(4)} - vec3(rcTime * 0.9);
		float rcFineNoise = rc_fbm(rcFineSample) - 0.5;

		float rcPulse = 1.0 + sin(rcTime * 1.8) * 0.05 * uMotionScale;
		float rcEdge = (uMaskRadius * rcPulse)
			+ rcEdgeNoise * uNoiseAmount
			+ rcFineNoise * uNoiseAmount * ${FINE_NOISE_AMOUNT_RATIO.toFixed(4)};
		float rcMaskStrength = 1.0 - smoothstep(rcEdge - uEdgeSoftness, rcEdge + uEdgeSoftness, rcDist);
		return clamp(rcMaskStrength, 0.0, 1.0);
	}
`

// GLSL du décalage "croquis", injecté UNIQUEMENT dans le vertex shader de la
// structure. Un vertex et un fragment shader sont deux programmes séparés :
// les fonctions de RC_MASK_FUNCTIONS_GLSL (côté fragment) n'y sont pas
// visibles, d'où cette petite copie autonome du hash. `aEdgeDir` est
// l'attribut ajouté par finalizeStructureEdges : direction NON normalisée
// (sa longueur encode la longueur du sous-segment) pointant vers l'EXTÉRIEUR
// du trait depuis ce sommet, nulle aux points milieux de l'arc — voir
// finalizeStructureEdges pour la construction.
const RC_SKETCH_VERTEX_GLSL = `
	uniform float uSketchSeed;
	uniform float uSketchJitterAmount;
	uniform float uSketchNoiseScale;
	uniform float uSketchWobbleAmount;
	uniform float uSketchWobbleSpeed;
	uniform float uSketchOvershootAmount;
	uniform float uTime;
	uniform float uMotionScale;
	attribute vec3 aEdgeDir;

	float rc_vHash(vec3 p) {
		p = fract(p * 0.1031);
		p += dot(p, p.yzx + 33.33);
		return fract((p.x + p.y) * p.z);
	}

	// Retourne un vecteur de décalage dans [-0.5, 0.5]^3, stable pour une
	// position donnée (même position => même décalage, quel que soit le
	// nombre d'arêtes qui partagent ce sommet).
	vec3 rc_vHash3(vec3 p) {
		return vec3(
			rc_vHash(p + vec3(0.0, 0.0, 0.0)),
			rc_vHash(p + vec3(17.0, 3.0, 29.0)),
			rc_vHash(p + vec3(53.0, 71.0, 11.0))
		) - 0.5;
	}
`

// Déclarations d'uniforms côté FRAGMENT pour le grain façon graphite —
// distinctes de RC_SKETCH_VERTEX_GLSL car vertex et fragment sont deux
// programmes séparés, même si les VALEURS (shader.uniforms) sont partagées.
const RC_SKETCH_FRAGMENT_UNIFORMS_GLSL = `
	uniform float uSketchSeed;
	uniform float uSketchGrainScale;
	uniform float uSketchGrainMinAlpha;
`

function createMaskUniforms(): MaskUniforms {
	return {
		uMaskCenter: { value: new THREE.Vector3(0, 0, 0) },
		uMaskRadius: { value: 0 },
		// Fréquence spatiale du bruit de contour : plus bas = moins de lobes,
		// plus larges et plus arrondis (façon vague), plutôt que beaucoup de
		// petites pointes serrées.
		uNoiseScale: { value: 5 / logoMaxDim },
		uNoiseAmount: { value: 0 },
		uEdgeSoftness: { value: 0 },
		uWarpAmount: { value: logoMaxDim * WARP_AMOUNT_RATIO },
		uTime: { value: 0 },
		uMotionScale: { value: prefersReducedMotion.value ? 0 : 1 },
	}
}

// Le métal se découpe (discard) À L'INTÉRIEUR du masque gooey (zone sous le
// curseur), pour laisser voir la structure derrière. `uLocalToRoot` ramène
// chaque sommet du mesh (espace local du mesh) dans l'espace local de `logo`,
// pour que le calcul du masque soit fait dans UN référentiel commun à tous
// les meshes — le même que celui utilisé par la structure fusionnée.
//
// Pas de décalage "croquis" ici volontairement : le métal doit rester une
// copie fidèle du modèle réel, seul le TRAIT de structure doit devenir
// irrégulier.
function applyMetalCutoutShader(
	material: import("three").MeshStandardMaterial,
	sharedUniforms: MaskUniforms,
	localToRoot: import("three").Matrix4
) {
	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, sharedUniforms)
		shader.uniforms.uLocalToRoot = { value: localToRoot }

		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>\nuniform mat4 uLocalToRoot;\nvarying vec3 vObjectPosition;`
			)
			.replace(
				"#include <begin_vertex>",
				`#include <begin_vertex>\nvObjectPosition = (uLocalToRoot * vec4(transformed, 1.0)).xyz;`
			)

		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>\n${RC_MASK_UNIFORMS_GLSL}\n${RC_MASK_FUNCTIONS_GLSL}`
			)
			.replace(
				"vec4 diffuseColor = vec4( diffuse, opacity );",
				`vec4 diffuseColor = vec4( diffuse, opacity );\nif (rc_maskStrength(vObjectPosition) > 0.5) discard;`
			)
	}

	// Clé de cache partagée : le texte du shader est identique pour tous les
	// meshes (seule la VALEUR de uLocalToRoot change), donc un seul programme
	// WebGL est compilé et réutilisé pour tout le métal — au lieu d'un par mesh.
	material.customProgramCacheKey = () => "metal-cutout"
}

// La structure (arêtes fusionnées) se découpe (discard) À L'EXTÉRIEUR du
// masque gooey, ET reçoit en plus le décalage "croquis" décrit plus haut,
// désormais enrichi d'un dépassement de coin et d'un grain de texture. Sa
// géométrie est déjà exprimée dans l'espace local de `logo` (voir
// buildCombinedLocalGeometry), donc pas de matrice à appliquer ici.
//
// Ordre important dans begin_vertex : `vObjectPosition` (qui pilote le
// masque gooey, donc doit rester exactement aligné avec le métal) est
// calculé AVANT tout décalage croquis/overshoot, à partir de la position
// d'origine — ces décalages ne doivent affecter que le TRACÉ du trait,
// jamais la zone de révélation. `sketchSeed` distingue les différentes
// passes superposées (voir buildStructureLineSegments) : même géométrie,
// décalage différent. `passIndex` fait grandir jitter et overshoot d'une
// passe à l'autre (voir SKETCH_PASS_VARIANCE_STEP) : les passes les plus
// faibles en opacité sont aussi les plus "cherchées".
function applyStructureMaskShader(
	material: import("three").Material,
	uniforms: MaskUniforms,
	sketchSeed: number,
	passIndex: number
) {
	const passVariance = 1 + passIndex * SKETCH_PASS_VARIANCE_STEP

	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, uniforms)
		shader.uniforms.uSketchSeed = { value: sketchSeed }
		shader.uniforms.uSketchJitterAmount = {
			value: logoMaxDim * SKETCH_JITTER_AMOUNT_RATIO * passVariance,
		}
		shader.uniforms.uSketchNoiseScale = { value: SKETCH_NOISE_SCALE / logoMaxDim }
		shader.uniforms.uSketchWobbleAmount = {
			value: logoMaxDim * SKETCH_WOBBLE_AMOUNT_RATIO,
		}
		shader.uniforms.uSketchWobbleSpeed = { value: SKETCH_WOBBLE_SPEED }
		shader.uniforms.uSketchOvershootAmount = {
			value: logoMaxDim * SKETCH_OVERSHOOT_AMOUNT_RATIO * passVariance,
		}
		shader.uniforms.uSketchGrainScale = { value: SKETCH_GRAIN_SCALE / logoMaxDim }
		shader.uniforms.uSketchGrainMinAlpha = { value: SKETCH_GRAIN_MIN_ALPHA }

		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>\nvarying vec3 vObjectPosition;\n${RC_SKETCH_VERTEX_GLSL}`
			)
			.replace(
				"#include <begin_vertex>",
				`#include <begin_vertex>
				vObjectPosition = transformed;

				vec3 rcSeedPos = transformed * uSketchNoiseScale + vec3(uSketchSeed);
				vec3 rcJitter = rc_vHash3(rcSeedPos);
				float rcWobblePhase = rc_vHash(rcSeedPos + 91.0) * 6.2831;
				float rcWobble = sin(uTime * uSketchWobbleSpeed + rcWobblePhase) * uMotionScale;

				transformed += rcJitter * (uSketchJitterAmount + rcWobble * uSketchWobbleAmount);

				// Dépassement de coin : nul par construction aux points milieux de
				// l'arc (aEdgeDir y vaut zéro, voir finalizeStructureEdges), donc
				// n'affecte jamais que les deux VRAIES extrémités d'une arête. Le
				// biais (1.4 / -0.3) favorise le dépassement sur le manque.
				float rcEdgeLen = length(aEdgeDir);
				if (rcEdgeLen > 0.0) {
					vec3 rcEdgeDirN = aEdgeDir / rcEdgeLen;
					float rcOvershootHash = rc_vHash(rcSeedPos + 133.7);
					float rcOvershootT = rcOvershootHash * 1.4 - 0.3;
					float rcOvershootCap = min(uSketchOvershootAmount, rcEdgeLen * ${SKETCH_OVERSHOOT_MAX_FRACTION.toFixed(4)});
					transformed += rcEdgeDirN * (rcOvershootT * rcOvershootCap);
				}`
			)
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>\n${RC_MASK_UNIFORMS_GLSL}\n${RC_MASK_FUNCTIONS_GLSL}\n${RC_SKETCH_FRAGMENT_UNIFORMS_GLSL}`
			)
			.replace(
				"vec4 diffuseColor = vec4( diffuse, opacity );",
				`vec4 diffuseColor = vec4( diffuse, opacity );
				if (rc_maskStrength(vObjectPosition) <= 0.5) discard;

				float rcGrain = rc_fbm(vObjectPosition * uSketchGrainScale + vec3(uSketchSeed * 3.1));
				diffuseColor.a *= mix(uSketchGrainMinAlpha, 1.0, smoothstep(0.15, 0.85, rcGrain));`
			)
	}

	// Le texte du shader est identique pour toutes les passes de croquis
	// (seules les VALEURS d'uniforms comme uSketchSeed changent) : un seul
	// programme WebGL est compilé et réutilisé pour les 3 passes.
	material.customProgramCacheKey = () => "structure-mask-sketch"
}

// Matrice qui transforme les sommets d'un mesh (espace local du mesh) vers
// l'espace local de `root`, en composant la chaîne de matrices locales des
// parents intermédiaires — sans dépendre de matrixWorld ni de l'ordre
// d'ajout à la scène.
function localMatrixRelativeTo(
	node: import("three").Object3D,
	root: import("three").Object3D
) {
	const result = node.matrix.clone()
	let current = node.parent
	while (current && current !== root) {
		result.premultiply(current.matrix)
		current = current.parent
	}
	return result
}

// Concatène les positions (déjà ramenées dans l'espace local de `root`) de
// TOUS les meshes en une seule géométrie indexée, en lisant chaque attribut
// via .getX/.getY/.getZ (fonctionne même si "position" est un
// InterleavedBufferAttribute, typique d'un glTF décodé par meshopt — c'est
// la LECTURE sur ce type d'attribut qui est fiable, contrairement à
// l'écriture interne de mergeVertices()).
//
// Souder TOUS les meshes ENSEMBLE (et pas mesh par mesh séparément) est ce
// qui élimine les arêtes fantômes / dédoublées aux coutures ENTRE deux
// pièces du modèle : un sommet partagé par deux meshes différents au même
// endroit dans l'espace n'est désormais fondu qu'une seule fois.
function buildCombinedLocalGeometry(
	meshes: import("three").Mesh[],
	root: import("three").Object3D
) {
	const positions: number[] = []
	const indices: number[] = []
	const localMatrices: import("three").Matrix4[] = []
	const point = new THREE.Vector3()
	let vertexOffset = 0

	meshes.forEach((mesh) => {
		const localToRoot = localMatrixRelativeTo(mesh, root)
		localMatrices.push(localToRoot)

		// `attributes.position` est toujours présent sur un mesh géométrique
		// réel ; TS le type "possiblement undefined" à cause de
		// noUncheckedIndexedAccess sur l'accès par clé, d'où l'assertion.
		const src = mesh.geometry.attributes.position!
		for (let i = 0; i < src.count; i++) {
			point.set(src.getX(i), src.getY(i), src.getZ(i)).applyMatrix4(localToRoot)
			positions.push(point.x, point.y, point.z)
		}

		const index = mesh.geometry.index
		if (index) {
			for (let i = 0; i < index.count; i++) indices.push(index.getX(i) + vertexOffset)
		} else {
			for (let i = 0; i < src.count; i++) indices.push(i + vertexOffset)
		}

		vertexOffset += src.count
	})

	const geometry = new THREE.BufferGeometry()
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.setIndex(indices)
	return { geometry, localMatrices }
}

// Prend la géométrie brute d'EdgesGeometry (paires de sommets indépendantes,
// non indexées — un segment droit par paire) et produit la géométrie finale
// utilisée par la structure :
//  1. subdivise CHAQUE segment en deux, en insérant un point milieu décalé
//     PERPENDICULAIREMENT à la direction d'origine, d'un montant fixe (hash
//     de la position du milieu — voir SKETCH_BOW_AMOUNT_RATIO) : un arc doux
//     qui casse la rectitude parfaite d'un segment CAO, comme une main qui
//     ne trace jamais une droite parfaite ;
//  2. construit en même temps l'attribut `aEdgeDir` consommé par le vertex
//     shader pour le dépassement de coin (voir applyStructureMaskShader) :
//     direction (non normalisée, magnitude = longueur du SOUS-segment)
//     pointant vers l'extérieur du trait aux deux VRAIES extrémités
//     d'origine, et NULLE aux deux occurrences du point milieu — pour que
//     l'arc reste lisse, sans faux coin ni dépassement parasite en son
//     centre.
//
// Le résultat reste un simple flux de paires de sommets (pas d'index), donc
// directement compatible avec THREE.LineSegments comme la géométrie
// d'origine.
function finalizeStructureEdges(rawEdges: import("three").BufferGeometry) {
	const position = rawEdges.attributes.position!
	const segmentCount = position.count / 2

	const positions: number[] = []
	const dirs: number[] = []

	const start = new THREE.Vector3()
	const end = new THREE.Vector3()
	const mid = new THREE.Vector3()
	const segment = new THREE.Vector3()
	const arbitrary = new THREE.Vector3()
	const perp = new THREE.Vector3()

	for (let i = 0; i < segmentCount; i++) {
		const a = i * 2
		const b = a + 1
		start.set(position.getX(a), position.getY(a), position.getZ(a))
		end.set(position.getX(b), position.getY(b), position.getZ(b))

		segment.subVectors(end, start)
		const segLength = segment.length()
		mid.addVectors(start, end).multiplyScalar(0.5)

		if (segLength > 1e-8) {
			// Axe "arbitraire" pour construire une perpendiculaire par produit
			// vectoriel : on bascule sur un second axe si le segment lui est
			// quasi colinéaire, pour éviter un résultat dégénéré (norme ~0).
			arbitrary.set(0, 1, 0)
			if (Math.abs(segment.dot(arbitrary)) > segLength * 0.98) arbitrary.set(1, 0, 0)
			perp.crossVectors(segment, arbitrary).normalize()

			const bowHash = rc_jsHash(mid.x, mid.y, mid.z) - 0.5
			const bowAmount =
				bowHash *
				2 *
				Math.min(
					logoMaxDim * SKETCH_BOW_AMOUNT_RATIO,
					segLength * SKETCH_BOW_MAX_FRACTION
				)
			mid.addScaledVector(perp, bowAmount)
		}

		// Premier sous-segment : start -> mid.
		positions.push(start.x, start.y, start.z, mid.x, mid.y, mid.z)
		segment.set(mid.x - start.x, mid.y - start.y, mid.z - start.z)
		dirs.push(-segment.x, -segment.y, -segment.z) // start : vers l'extérieur du trait
		dirs.push(0, 0, 0) // mid : jamais de dépassement

		// Second sous-segment : mid -> end.
		positions.push(mid.x, mid.y, mid.z, end.x, end.y, end.z)
		dirs.push(0, 0, 0) // mid : jamais de dépassement
		segment.set(end.x - mid.x, end.y - mid.y, end.z - mid.z)
		dirs.push(segment.x, segment.y, segment.z) // end : vers l'extérieur du trait
	}

	const geometry = new THREE.BufferGeometry()
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.setAttribute("aEdgeDir", new THREE.Float32BufferAttribute(dirs, 3))
	return geometry
}

// Construit, pour un GROUPE de meshes (ex: tous les meshes "Metal_Face_Fonce",
// ou tous les autres), UNE SEULE géométrie d'arêtes propre :
//  1. toutes les positions du groupe sont ramenées dans l'espace local de
//     `logo` puis concaténées (voir buildCombinedLocalGeometry) ;
//  2. on soude les sommets EXACTEMENT dupliqués — seams UV/normals internes
//     à un mesh — avant de calculer les arêtes ;
//  3. EdgesGeometry tourne UNE seule fois sur le tout, puis finalizeStructureEdges
//     y ajoute l'arc et l'attribut de dépassement de coin (voir plus haut) —
//     donnant directement la géométrie finale réutilisée par CHAQUE passe de
//     croquis (voir buildStructureLineSegments) : les positions dupliquées à
//     une même couture produisent le même hash côté shader, donc le même
//     décalage — les jointures restent connectées même une fois "crayonnées".
//     Pas de fusion de segments après coup — les paires de lignes proches et
//     parallèles qu'on pourrait être tenté de fusionner sont, sur ce modèle,
//     les bords intérieur/extérieur réels d'anneaux et de rubans en 3D
//     (vérifié visuellement par mesh), pas un défaut à corriger.
//
// Chaque groupe (métal) est soudé et découpé en arêtes INDÉPENDAMMENT des
// autres groupes : les coutures RÉELLES entre deux zones de métal différent
// restent donc visibles comme de vraies arêtes, chacune dans la couleur de
// son propre groupe.
function buildStructureEdges(
	meshes: import("three").Mesh[],
	root: import("three").Object3D
) {
	const { geometry: combined } = buildCombinedLocalGeometry(meshes, root)

	const welded = mergeVertices(combined, STRUCTURE_WELD_TOLERANCE)
	combined.dispose()

	const rawEdges = new THREE.EdgesGeometry(welded, STRUCTURE_EDGE_THRESHOLD_DEG)
	welded.dispose()

	const edges = finalizeStructureEdges(rawEdges)
	rawEdges.dispose()

	return { edges }
}

// Construit un GROUPE de SKETCH_STROKE_COUNT passes de trait superposées,
// toutes sur la MÊME géométrie d'arêtes (un seul achat mémoire GPU pour la
// géométrie, un seul programme shader compilé — seuls les uniforms et
// l'opacité diffèrent d'une passe à l'autre), dans la couleur `color` du
// groupe de métal concerné, très légèrement assombrie à chaque passe
// successive (voir SKETCH_PASS_COLOR_DARKEN_STEP). Chaque passe a un seed
// fixe et arbitraire (pas de Math.random() : on veut un résultat stable
// d'un montage à l'autre, pas un logo qui a un tracé différent à chaque
// refresh). Les matériaux créés sont ajoutés à `structureMaterials`
// (module-level) plutôt que de réinitialiser ce tableau ici, pour pouvoir
// accumuler plusieurs groupes.
function buildStructureLineSegments(
	edges: import("three").BufferGeometry,
	uniforms: MaskUniforms,
	color: number
) {
	const group = new THREE.Group()
	const baseColor = new THREE.Color(color)

	for (let i = 0; i < SKETCH_STROKE_COUNT; i++) {
		const opacityRatio = SKETCH_STROKE_OPACITY_RATIOS[i] ?? 1
		const passColor = baseColor
			.clone()
			.multiplyScalar(1 - i * SKETCH_PASS_COLOR_DARKEN_STEP)

		const material = new THREE.LineBasicMaterial({
			color: passColor,
			transparent: true,
			opacity: STRUCTURE_OPACITY * opacityRatio,
			depthWrite: false,
		}) as import("three").LineBasicMaterial & { opacity: number }

		const sketchSeed = i * 41.37 + 7.0
		applyStructureMaskShader(material, uniforms, sketchSeed, i)
		structureMaterials.push(material)

		const lines = new THREE.LineSegments(edges, material)
		lines.frustumCulled = false // objet petit et toujours proche du centre écran : le test de culling ne fait qu'ajouter du coût
		group.add(lines)
	}

	return group
}

// Pour chaque mesh du logo : le matériau métal (par défaut, visible partout)
// se découpe dans la zone gooey pour laisser apparaître la structure fusionnée
// ajoutée une seule fois comme enfant de `logo`. La structure est construite
// SÉPARÉMENT pour chaque type de métal (Metal_Face_Fonce vs le reste), afin
// que chaque groupe garde sa propre couleur — les deux groupes partagent
// néanmoins les mêmes uniforms de masque gooey, pour que la zone de
// révélation reste identique quel que soit le groupe survolé.
function prepareLogoMaterials(root: import("three").Object3D) {
	flakeMap = createFlakeNormalMap()

	// 1) Collecte en lecture seule : on ne touche pas à l'arbre pendant le
	//    traverse (sinon les enfants qu'on ajoutera plus bas seraient
	//    eux-mêmes visités par ce même traverse → récursion infinie → crash).
	const targetMeshes: import("three").Mesh[] = []
	root.traverse((obj) => {
		if (obj instanceof THREE.Mesh) targetMeshes.push(obj)
	})

	// 2) Matériaux métal, en dehors de tout traverse, sur la liste déjà figée.
	const metalMaterials = targetMeshes.map((obj) => {
		// Le "!" est sûr : Array.isArray garantit que obj.material[0] existe
		// quand obj.material est un tableau (glTF n'exporte jamais un tableau
		// de matériaux vide), TS le type juste "possiblement undefined" à
		// cause de noUncheckedIndexedAccess.
		const original = (
			Array.isArray(obj.material) ? obj.material[0]! : obj.material
		) as import("three").MeshStandardMaterial
		const metalMaterial = original.clone()
		metalMaterial.normalMap = flakeMap
		metalMaterial.normalScale.set(0.07, 0.07)
		metalMaterial.envMapIntensity =
			metalMaterial.name === "Metal_Face_Fonce" ? 1.05 : 0.85
		metalMaterial.needsUpdate = true
		obj.material = metalMaterial
		return metalMaterial
	})

	const hasHover = !isTouchDevice.value // pas de hover sur tactile : métal plein, pas de structure
	if (!hasHover || !targetMeshes.length) return

	maskUniforms = createMaskUniforms()

	// Les matrices locale->root pour le cutout du métal restent calculées sur
	// TOUT targetMeshes (même ordre, même longueur que metalMaterials),
	// indépendamment du regroupement par matériau utilisé ci-dessous pour la
	// structure — les deux ne doivent pas être couplés.
	const localMatrices = targetMeshes.map((obj) => localMatrixRelativeTo(obj, root))
	targetMeshes.forEach((obj, i) => {
		applyMetalCutoutShader(metalMaterials[i]!, maskUniforms!, localMatrices[i]!)
		metalMeshes.push(obj)
	})

	structureMaterials = []

	const faceFonceMeshes = targetMeshes.filter(
		(_, i) => metalMaterials[i]!.name === "Metal_Face_Fonce"
	)
	const bodyMeshes = targetMeshes.filter(
		(_, i) => metalMaterials[i]!.name !== "Metal_Face_Fonce"
	)

	if (faceFonceMeshes.length) {
		const { edges } = buildStructureEdges(faceFonceMeshes, root)
		root.add(buildStructureLineSegments(edges, maskUniforms, STRUCTURE_COLOR_FACE_FONCE))
	}
	if (bodyMeshes.length) {
		const { edges } = buildStructureEdges(bodyMeshes, root)
		root.add(buildStructureLineSegments(edges, maskUniforms, STRUCTURE_COLOR_BODY))
	}
}

// -- Perte / restauration du contexte WebGL ----------------------------------
// Le navigateur peut tuer le contexte WebGL sans prévenir (mémoire GPU sous
// pression, bascule d'app mobile prolongée, plusieurs contextes 3D ouverts
// en même temps). Sans ces deux handlers, le canvas reste figé/noir de façon
// définitive, sans la moindre erreur JS à catcher. preventDefault() sur
// "webglcontextlost" est ce qui autorise le navigateur à restaurer le
// contexte plus tard plutôt que de l'abandonner.
function onContextLost(e: Event) {
	e.preventDefault()
	stopLoop()
}

function onContextRestored() {
	// Le contexte restauré est neuf : toutes les textures/programmes/buffers
	// GPU précédents ont disparu avec l'ancien contexte. On ne peut pas se
	// contenter de relancer la boucle, il faut reconstruire toute la scène.
	initialized = false
	tryInit(sceneEl, wrapperEl)
}

async function initScene(el: HTMLDivElement) {
	THREE = await import("three")
	const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
	const { MeshoptDecoder } =
		await import("three/examples/jsm/libs/meshopt_decoder.module.js")
	const { RoomEnvironment } =
		await import("three/examples/jsm/environments/RoomEnvironment.js")
	const bufferGeometryUtils =
		await import("three/examples/jsm/utils/BufferGeometryUtils.js")
	mergeVertices = bufferGeometryUtils.mergeVertices

	sharedNdc = new THREE.Vector2()
	sharedWorldPoint = new THREE.Vector3()
	maskCenterCurrent = new THREE.Vector3()
	maskCenterTarget = new THREE.Vector3()

	const width = el.clientWidth
	const height = el.clientHeight

	scene = new THREE.Scene()

	camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
	camera.position.set(0, 0, 6)

	raycaster = new THREE.Raycaster()

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: "high-performance",
	})
	renderer.setSize(width, height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.toneMappingExposure = 0.85
	renderer.outputColorSpace = THREE.SRGBColorSpace

	renderer.domElement.classList.add("logo-scene__canvas")
	renderer.domElement.addEventListener("webglcontextlost", onContextLost, false)
	renderer.domElement.addEventListener("webglcontextrestored", onContextRestored, false)
	el.appendChild(renderer.domElement)

	pmrem = new THREE.PMREMGenerator(renderer)
	envTexture = pmrem.fromScene(new RoomEnvironment(), 0.02).texture
	scene.environment = envTexture
	pmrem.dispose()

	const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
	keyLight.position.set(3, 4, 5)
	scene.add(keyLight)

	const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
	rimLight.position.set(-4, -2, -3)
	scene.add(rimLight)

	loadLogo(GLTFLoader, MeshoptDecoder)
}

function revealCanvas() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			renderer.domElement.classList.add("logo-scene__canvas--visible")
		})
	})
}

function loadLogo(GLTFLoader: typeof GLTFLoaderType, MeshoptDecoder: unknown) {
	const loader = new GLTFLoader()
	loader.setMeshoptDecoder(MeshoptDecoder as any)

	loader.load(
		"/models/logo-metal-lime.glb",
		(gltf) => {
			logo = gltf.scene
			baseScale = centerAndFit(logo)

			// Les matrices locales (.matrix) doivent être à jour avant qu'on les
			// compose dans localMatrixRelativeTo — updateMatrixWorld(true)
			// force ce recalcul sur tout le sous-arbre en une passe.
			logo.updateMatrixWorld(true)

			prepareLogoMaterials(logo)

			logo.scale.setScalar(0)
			scene.add(logo)
			renderer.render(scene, camera)
			introStart = performance.now()
			revealCanvas()
		},
		undefined,
		(err) => {
			console.error("[LogoScene] échec du chargement:", err)
		}
	)
}

function centerAndFit(obj: import("three").Object3D) {
	const box = new THREE.Box3().setFromObject(obj)
	const size = box.getSize(new THREE.Vector3())
	const center = box.getCenter(new THREE.Vector3())
	obj.position.sub(center)

	const maxDim = Math.max(size.x, size.y, size.z)
	logoMaxDim = maxDim
	return 2.6 / maxDim
}

// Retourne true si le curseur intersecte effectivement un mesh du logo.
// Un seul point d'impact, une seule conversion vers l'espace local de
// `logo` (au lieu d'une conversion par mesh comme avant) : c'est le même
// référentiel que celui utilisé par le masque et par la structure fusionnée.
// Utilise cachedSceneRect (mis à jour uniquement au resize, voir
// handleContainerResize) plutôt que de rappeler getBoundingClientRect() ici
// à chaque frame — cet appel force un recalcul de layout synchrone si le
// document est "dirty" à cet instant précis.
function raycastFromPointer(clientX: number, clientY: number): boolean {
	if (!logo || !raycaster || !camera || !cachedSceneRect || !metalMeshes.length)
		return false

	const rect = cachedSceneRect
	sharedNdc.set(
		((clientX - rect.left) / rect.width) * 2 - 1,
		-((clientY - rect.top) / rect.height) * 2 + 1
	)

	raycaster.setFromCamera(sharedNdc, camera)

	const hits = raycaster.intersectObjects(metalMeshes, false)
	const hit = hits[0]
	if (!hit) return false

	sharedWorldPoint.copy(hit.point)
	logo.worldToLocal(maskCenterTarget.copy(sharedWorldPoint))
	if (!hasMaskTarget) {
		maskCenterCurrent.copy(maskCenterTarget)
		hasMaskTarget = true
	}

	return true
}

// Une seule fonction pour 'pointerenter' ET 'pointermove' : les deux ne font
// que mémoriser la position, le raycast réel a lieu une fois par frame dans
// updateHoverRaycast().
function onWrapperPointerActivity(e: PointerEvent) {
	pendingPointerX = e.clientX
	pendingPointerY = e.clientY
	hasPendingPointer = true
}

function onWrapperPointerLeave() {
	hasPendingPointer = false
	revealTarget = 0
}

// Raycast throttlé à une fois par frame rendue — voir onWrapperPointerActivity.
function updateHoverRaycast() {
	if (!hasPendingPointer) return
	const isOverLogo = raycastFromPointer(pendingPointerX, pendingPointerY)
	revealTarget = isOverLogo ? 1 : 0
}

// -- Rotation manuelle au doigt (mobile/tablette) ----------------------------
function onWrapperPointerDown(e: PointerEvent) {
	if (e.pointerType !== "touch" && e.pointerType !== "pen") return
	isDragging = true
	dragPointerId = e.pointerId
	dragLastFrameX = e.clientX
	pendingDragX = e.clientX
	hasPendingDragMove = false
	dragVelocityY = 0
	// Un nouveau contact reprend la main immédiatement sur l'inertie du
	// geste précédent, sinon les deux se cumuleraient.
	inertiaVelocityY = 0
	wrapperEl?.setPointerCapture(e.pointerId)
}

// Ne fait que mémoriser la position la plus récente ; voir updateDragRotation
// pour le traitement réel, throttlé à une fois par frame rendue (même
// principe que onWrapperPointerActivity pour le survol desktop).
function onWrapperPointerDragMove(e: PointerEvent) {
	if (!isDragging || e.pointerId !== dragPointerId) return
	pendingDragX = e.clientX
	hasPendingDragMove = true
}

function onWrapperPointerDragEnd(e: PointerEvent) {
	if (e.pointerId !== dragPointerId) return
	isDragging = false
	dragPointerId = null
	// La rotation continue au relâchement à la dernière vitesse mesurée,
	// puis décroît en douceur — voir updateDragRotation.
	inertiaVelocityY = dragVelocityY
}

// Applique, une fois par frame, le déplacement du doigt pendant le geste
// (en mettant à jour une estimation lissée de sa vitesse), puis, une fois le
// doigt relâché, prolonge ce mouvement avec une inertie qui décroît de façon
// exponentielle vers 0 — la rotation manuelle se fond ainsi progressivement
// dans la rotation automatique de base plutôt que de s'arrêter net.
function updateDragRotation(delta: number) {
	if (isDragging) {
		if (hasPendingDragMove && delta > 0) {
			const deltaX = pendingDragX - dragLastFrameX
			dragLastFrameX = pendingDragX
			hasPendingDragMove = false

			const instantVelocity = (deltaX * DRAG_ROTATE_SPEED) / delta
			dragVelocityY +=
				(instantVelocity - dragVelocityY) *
				expSmoothingFactor(DRAG_VELOCITY_SMOOTHING_RATE, delta)
			autoRotationY += deltaX * DRAG_ROTATE_SPEED
		}
		return
	}

	if (Math.abs(inertiaVelocityY) < 0.001) {
		inertiaVelocityY = 0
		return
	}

	autoRotationY += inertiaVelocityY * delta
	// Décroissance exponentielle : une vitesse qui s'annule progressivement,
	// jamais un arrêt en un seul pas de frame.
	inertiaVelocityY *= Math.exp(-DRAG_INERTIA_DECAY_RATE * delta)
}

function updateReveal(delta: number) {
	if (!maskUniforms) return

	revealProgress += (revealTarget - revealProgress) * revealLerpSpeed
	if (Math.abs(revealTarget - revealProgress) < 0.002) revealProgress = revealTarget

	// Apparition/disparition douce, mais la taille cible est fixe : aucune
	// dépendance à la vitesse du curseur.
	const eased = revealProgress * revealProgress * (3 - 2 * revealProgress)
	const targetRadius = logoMaxDim * MASK_RADIUS_FACTOR * eased
	const noiseAmount = targetRadius * EDGE_NOISE_RATIO
	const edgeSoftness = Math.max(targetRadius * EDGE_SOFTNESS_RATIO, 0.0001)

	maskUniforms.uMaskRadius.value = targetRadius
	maskUniforms.uNoiseAmount.value = noiseAmount
	maskUniforms.uEdgeSoftness.value = edgeSoftness
	maskUniforms.uTime.value += delta

	if (hasMaskTarget) {
		const chaseFactor = expSmoothingFactor(cursorChaseRate, delta)
		maskCenterCurrent.lerp(maskCenterTarget, chaseFactor)
		maskUniforms.uMaskCenter.value.copy(maskCenterCurrent)
	}
}

// Légère respiration lumineuse de chaque passe de trait, dans le temps
// uniquement (aucune dépendance à la vitesse ou à la position du curseur).
// Toutes les passes pulsent en phase (même onde), seule leur opacité de base
// diffère — le rapport visuel entre les traits reste stable.
function updateStructurePulse(delta: number) {
	if (!structureMaterials.length) return
	if (prefersReducedMotion.value) return

	structurePulsePhase += delta * STRUCTURE_PULSE_SPEED
	const wave = Math.sin(structurePulsePhase)
	const pulse = 1 + wave * STRUCTURE_PULSE_AMOUNT

	structureMaterials.forEach((material, i) => {
		const opacityRatio = SKETCH_STROKE_OPACITY_RATIOS[i % SKETCH_STROKE_COUNT] ?? 1
		material.opacity = STRUCTURE_OPACITY * opacityRatio * pulse
	})
}

function updateScrollBoost(delta: number) {
	const scrollY = window.scrollY
	const rawDelta = scrollY - lastScrollY
	lastScrollY = scrollY

	if (prefersReducedMotion.value || delta <= 0) {
		scrollVelocity = 0
		rotationBoost = 0
		return
	}

	const instantVelocity = Math.abs(rawDelta) / delta
	scrollVelocity +=
		(instantVelocity - scrollVelocity) * expSmoothingFactor(velocityTrackingRate, delta)

	const targetBoost = clamp(scrollVelocity * scrollBoostFactor, 0, maxScrollBoost)
	rotationBoost +=
		(targetBoost - rotationBoost) * expSmoothingFactor(boostSmoothingRate, delta)
}

function animate(time: number) {
	frameId = requestAnimationFrame(animate)

	const delta = lastFrameTime ? (time - lastFrameTime) / 1000 : 0
	lastFrameTime = time

	updateHoverRaycast()
	updateScrollBoost(delta)
	updateReveal(delta)
	updateStructurePulse(delta)

	if (logo) {
		const introElapsed = introStart ? time - introStart : introDuration
		const introT = Math.min(introElapsed / introDuration, 1)

		if (introT < 1) {
			const scaleT = easeOutBack(introT)
			logo.scale.setScalar(Math.max(0, scaleT) * baseScale)

			const spinT = easeOutCubic(introT)
			const remainingSpin = (1 - spinT) * introSpins * Math.PI * 2
			autoRotationY = remainingSpin
			logo.rotation.y = remainingSpin
			logo.rotation.x = 0
		} else {
			logo.scale.setScalar(baseScale)

			const speed = prefersReducedMotion.value ? 0 : baseRotateSpeed + rotationBoost
			autoRotationY += speed * delta
			// Sur desktop, isDragging reste toujours false et inertiaVelocityY à
			// 0 (aucun listener de drag enregistré, voir tryInit) : cet appel
			// est alors un no-op, sans effet sur la rotation.
			updateDragRotation(delta)
			logo.rotation.y = autoRotationY

			floatPhase += floatSpeed * delta
			const floatTilt = prefersReducedMotion.value
				? 0
				: Math.sin(floatPhase) * floatAmplitude
			logo.rotation.x = floatTilt
		}
	}

	renderer.render(scene, camera)
}

// Le rendu ne tourne QUE si le composant est visible à l'écran : on
// suspend complètement requestAnimationFrame (et donc tout calcul CPU/GPU)
// plutôt que de continuer à boucler avec un early-return, comme avant.
function startLoop() {
	if (frameId) return
	lastFrameTime = 0
	lastScrollY = window.scrollY
	frameId = requestAnimationFrame(animate)
}

function stopLoop() {
	if (!frameId) return
	cancelAnimationFrame(frameId)
	frameId = 0
}

function handleContainerResize(el: HTMLDivElement) {
	const width = el.clientWidth
	const height = el.clientHeight
	if (width === 0 || height === 0) return
	if (
		width === renderer.domElement.clientWidth &&
		height === renderer.domElement.clientHeight
	) {
		cachedSceneRect = el.getBoundingClientRect()
		return
	}
	camera.aspect = width / height
	camera.updateProjectionMatrix()
	renderer.setSize(width, height)
	cachedSceneRect = el.getBoundingClientRect()
}

function handleReducedMotionChange(e: MediaQueryListEvent) {
	prefersReducedMotion.value = e.matches
	introDuration = prefersReducedMotion.value ? 1 : 2000
	if (maskUniforms) maskUniforms.uMotionScale.value = prefersReducedMotion.value ? 0 : 1
}

function handleTouchChange(e: MediaQueryListEvent) {
	isTouchDevice.value = e.matches
}

// matchMedia sur une résolution exacte ne notifie qu'un seul franchissement
// (le "change" event ne se redéclenche pas pour un DPR qui bouge à nouveau
// une fois qu'on l'a déjà passé) : on se réabonne donc à chaque déclenchement
// avec la nouvelle valeur de référence, plutôt qu'un abonnement figé au DPR
// initial. Couvre le cas d'un utilisateur qui déplace la fenêtre entre un
// écran Retina et un écran standard (setup multi-écrans).
function watchDevicePixelRatio() {
	dprQuery?.removeEventListener("change", handleDprChange)
	dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
	dprQuery.addEventListener("change", handleDprChange, { once: true })
}

function handleDprChange() {
	if (!renderer || !sceneEl) return
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	handleContainerResize(sceneEl)
	watchDevicePixelRatio()
}

async function tryInit(el: HTMLDivElement | null, wrap: HTMLDivElement | null) {
	if (initialized || !el || !wrap) return
	if (el.clientWidth === 0 || el.clientHeight === 0) return

	initialized = true
	sceneEl = el
	wrapperEl = wrap

	reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
	prefersReducedMotion.value = reducedMotionQuery.matches
	reducedMotionQuery.addEventListener("change", handleReducedMotionChange)
	introDuration = prefersReducedMotion.value ? 1 : 2000

	touchQuery = window.matchMedia("(hover: none), (pointer: coarse)")
	isTouchDevice.value = touchQuery.matches
	touchQuery.addEventListener("change", handleTouchChange)

	lastScrollY = window.scrollY

	await initScene(el)

	cachedSceneRect = el.getBoundingClientRect()
	watchDevicePixelRatio()

	if (!isTouchDevice.value) {
		wrap.addEventListener("pointerenter", onWrapperPointerActivity)
		wrap.addEventListener("pointermove", onWrapperPointerActivity, { passive: true })
		wrap.addEventListener("pointerleave", onWrapperPointerLeave)
	} else {
		// pan-y : le scroll vertical de la page reste géré nativement par le
		// navigateur, seul le geste HORIZONTAL est capté en JS pour la
		// rotation — pas besoin de preventDefault ni de bloquer le scroll.
		wrap.style.touchAction = "pan-y"
		// passive: true est sûr ici : onWrapperPointerDown ne fait que
		// setPointerCapture + reset de variables, jamais de preventDefault —
		// le navigateur n'a donc pas besoin d'attendre le handler avant de
		// traiter le geste.
		wrap.addEventListener("pointerdown", onWrapperPointerDown, { passive: true })
		wrap.addEventListener("pointermove", onWrapperPointerDragMove, { passive: true })
		wrap.addEventListener("pointerup", onWrapperPointerDragEnd)
		wrap.addEventListener("pointercancel", onWrapperPointerDragEnd)
	}

	containerResizeObserver = new ResizeObserver(() => handleContainerResize(el))
	containerResizeObserver.observe(el)

	visibilityObserver = new IntersectionObserver(
		(entries) => {
			isVisible = entries[0]?.isIntersecting ?? true
			if (isVisible) startLoop()
			else stopLoop()
		},
		{ threshold: 0 }
	)
	visibilityObserver.observe(wrap)

	if (isVisible) startLoop()
}

onMounted(async () => {
	await nextTick()
	tryInit(container.value, wrapper.value)
})

watch([container, wrapper], ([el, wrap]) => tryInit(el, wrap))

onBeforeUnmount(() => {
	stopLoop()
	reducedMotionQuery?.removeEventListener("change", handleReducedMotionChange)
	touchQuery?.removeEventListener("change", handleTouchChange)
	dprQuery?.removeEventListener("change", handleDprChange)
	wrapperEl?.removeEventListener("pointerenter", onWrapperPointerActivity)
	wrapperEl?.removeEventListener("pointermove", onWrapperPointerActivity)
	wrapperEl?.removeEventListener("pointerleave", onWrapperPointerLeave)
	wrapperEl?.removeEventListener("pointerdown", onWrapperPointerDown)
	wrapperEl?.removeEventListener("pointermove", onWrapperPointerDragMove)
	wrapperEl?.removeEventListener("pointerup", onWrapperPointerDragEnd)
	wrapperEl?.removeEventListener("pointercancel", onWrapperPointerDragEnd)
	containerResizeObserver?.disconnect()
	visibilityObserver?.disconnect()
	renderer?.domElement.removeEventListener("webglcontextlost", onContextLost)
	renderer?.domElement.removeEventListener("webglcontextrestored", onContextRestored)

	flakeMap?.dispose()
	envTexture?.dispose()

	const disposedGeometries = new WeakSet<object>()
	const disposedMaterials = new WeakSet<object>()

	scene?.traverse((obj: any) => {
		if (obj.isMesh || obj.isLineSegments) {
			if (obj.geometry && !disposedGeometries.has(obj.geometry)) {
				disposedGeometries.add(obj.geometry)
				obj.geometry.dispose()
			}
			const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
			mats.forEach((m: any) => {
				if (m && !disposedMaterials.has(m)) {
					disposedMaterials.add(m)
					m.dispose()
				}
			})
		}
	})

	renderer?.dispose()
	renderer?.forceContextLoss()
})
</script>

<style scoped>
.logo-scene-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo-scene {
	position: relative;
	z-index: 1;
	width: min(98vw, 95vh, 68rem);
	max-width: 100%;
	max-height: 100%;
	aspect-ratio: 1 / 1;
	flex: 0 0 auto;
	background: transparent;
	pointer-events: none;
}

.logo-scene :deep(.logo-scene__canvas) {
	display: block;
	width: 100% !important;
	height: 100% !important;
	background: transparent;
	pointer-events: none;
	opacity: 0;
	transition: opacity 0.5s ease-out;
}

.logo-scene :deep(.logo-scene__canvas--visible) {
	opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
	.logo-scene :deep(.logo-scene__canvas) {
		transition: none;
	}
}
</style>
