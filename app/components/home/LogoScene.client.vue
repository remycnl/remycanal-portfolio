<template>
	<div ref="container" class="logo-scene" @contextmenu.prevent>
		<!-- DEBUG TEMPORAIRE : à retirer une fois le bug gyroscope résolu -->
		<div v-if="DEBUG_GYRO" class="gyro-debug">
			<button class="gyro-debug__btn" @click="manualRequestPermission">
				Activer le gyroscope
			</button>
			<div class="gyro-debug__log">
				<div v-for="(line, i) in debugLines" :key="i">{{ line }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from "vue"

const container = ref<HTMLDivElement | null>(null)

// --- DEBUG TEMPORAIRE : overlay visible sur mobile, à retirer une fois le bug résolu ---
const DEBUG_GYRO = true
const debugLines = ref<string[]>([])
function debugLog(msg: string) {
	if (!DEBUG_GYRO) return
	const ts = new Date().toISOString().split("T")[1]!.slice(0, 12)
	debugLines.value = [`${ts} ${msg}`, ...debugLines.value].slice(0, 12)
	// eslint-disable-next-line no-console
	console.log("[gyro-debug]", msg)
}
// --- fin bloc debug ---

const prefersReducedMotion =
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Desktop = pointeur fin + hover disponible. Tout le reste (tactile, tablette)
// bascule sur le parallax piloté par le gyroscope.
const isFinePointer =
	typeof window !== "undefined" &&
	window.matchMedia("(hover: hover) and (pointer: fine)").matches

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let logo: THREE.Object3D | null = null
let frameId = 0
let resizeObserver: ResizeObserver
let visibilityObserver: IntersectionObserver
let initialized = false
let isVisible = true
let pmrem: THREE.PMREMGenerator
let envTexture: THREE.Texture | null = null
let flakeMap: THREE.CanvasTexture | null = null

const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
const damping = 0.06
const maxTilt = 0.28

let baseScale = 1
let introStart = 0
const introDuration = prefersReducedMotion ? 1 : 2000
const introSpins = 1.3

// --- État spécifique au parallax gyroscope (mobile/tablette) ---
let gyroListenerAttached = false
let gyroBase: { x: number; y: number } | null = null
let motionGestureHandler: (() => void) | null = null
const gyroRange = 20 // degrés d'inclinaison nécessaires pour atteindre le tilt max
let gyroEventCount = 0

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

function applyGlitterFinish(root: THREE.Object3D) {
	flakeMap = createFlakeNormalMap()
	const seen = new Set<THREE.Material>()

	root.traverse((obj) => {
		if (!(obj instanceof THREE.Mesh)) return
		const materials = Array.isArray(obj.material) ? obj.material : [obj.material]

		materials.forEach((mat) => {
			const m = mat as THREE.MeshStandardMaterial
			if (!m || seen.has(m)) return
			seen.add(m)

			m.normalMap = flakeMap
			m.normalScale.set(0.07, 0.07)
			m.envMapIntensity = m.name === "Metal_Face_Fonce" ? 1.05 : 0.85
			m.needsUpdate = true
		})
	})
}

function initScene(el: HTMLDivElement) {
	const width = el.clientWidth
	const height = el.clientHeight

	scene = new THREE.Scene()

	camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
	camera.position.set(0, 0, 6)

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
	el.appendChild(renderer.domElement)

	pmrem = new THREE.PMREMGenerator(renderer)
	// Reduce the blur/sample parameter to avoid requesting too many samples
	// 0.02 requests far fewer samples and avoids clipping warnings
	envTexture = pmrem.fromScene(new RoomEnvironment(), 0.02).texture
	scene.environment = envTexture
	// Le RoomEnvironment source n'est plus nécessaire une fois la texture PMREM générée.
	pmrem.dispose()

	const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
	keyLight.position.set(3, 4, 5)
	scene.add(keyLight)

	const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
	rimLight.position.set(-4, -2, -3)
	scene.add(rimLight)

	loadLogo()
}

function revealCanvas() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			renderer.domElement.classList.add("logo-scene__canvas--visible")
		})
	})
}

function loadLogo() {
	const loader = new GLTFLoader()
	// Décodeur requis par la compression EXT_meshopt_compression du .glb optimisé.
	loader.setMeshoptDecoder(MeshoptDecoder)

	loader.load(
		"/models/logo-metal-lime.glb",
		(gltf) => {
			logo = gltf.scene
			applyGlitterFinish(logo)
			baseScale = centerAndFit(logo)
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

function centerAndFit(obj: THREE.Object3D) {
	const box = new THREE.Box3().setFromObject(obj)
	const size = box.getSize(new THREE.Vector3())
	const center = box.getCenter(new THREE.Vector3())
	obj.position.sub(center)

	const maxDim = Math.max(size.x, size.y, size.z)
	return 2.6 / maxDim
}

function onPointerMove(e: PointerEvent) {
	const el = container.value
	if (!el) return

	const rect = el.getBoundingClientRect()
	const centerX = rect.left + rect.width / 2
	const centerY = rect.top + rect.height / 2

	const nx = clamp((e.clientX - centerX) / (rect.width / 2), -1, 1)
	const ny = clamp((e.clientY - centerY) / (rect.height / 2), -1, 1)

	target.y = nx * maxTilt
	target.x = -ny * maxTilt
}

// --- Parallax gyroscope pour mobile/tablette ---

function getScreenAngle() {
	if (
		typeof screen !== "undefined" &&
		screen.orientation &&
		typeof screen.orientation.angle === "number"
	) {
		return screen.orientation.angle
	}
	// Fallback pour anciens Safari iOS qui n'exposent pas screen.orientation.
	const legacyOrientation = (window as any).orientation
	return typeof legacyOrientation === "number" ? legacyOrientation : 0
}

function onDeviceOrientation(e: DeviceOrientationEvent) {
	gyroEventCount++
	if (gyroEventCount <= 3 || gyroEventCount % 30 === 0) {
		debugLog(
			`orientation #${gyroEventCount} beta=${e.beta?.toFixed(1) ?? "null"} gamma=${e.gamma?.toFixed(1) ?? "null"} abs=${e.absolute}`
		)
	}

	if (e.beta === null || e.gamma === null) return

	const angle = getScreenAngle()
	let x = e.gamma
	let y = e.beta

	// Remappe beta/gamma selon l'orientation courante de l'écran (portrait/paysage).
	if (angle === 90) {
		x = e.beta
		y = -e.gamma
	} else if (angle === -90 || angle === 270) {
		x = -e.beta
		y = e.gamma
	} else if (angle === 180) {
		x = -e.gamma
		y = -e.beta
	}

	// Calibration sur la première lecture : le parallax part de la position
	// de tenue naturelle du téléphone plutôt que d'un zéro absolu irréaliste.
	if (!gyroBase) {
		gyroBase = { x, y }
		debugLog(`calibration base x=${x.toFixed(1)} y=${y.toFixed(1)}`)
		return
	}

	const nx = clamp((x - gyroBase.x) / gyroRange, -1, 1)
	const ny = clamp((y - gyroBase.y) / gyroRange, -1, 1)

	target.y = nx * maxTilt
	target.x = -ny * maxTilt
}

function attachGyroListener() {
	if (gyroListenerAttached) return
	gyroListenerAttached = true
	debugLog("attachGyroListener() -> addEventListener deviceorientation")
	window.addEventListener("deviceorientation", onDeviceOrientation)

	// Si aucun event n'arrive après 1.5s, l'API existe mais ne délivre rien
	// (cas fréquent : Shields de Brave, ou permission accordée sans vrai accès capteur).
	setTimeout(() => {
		if (gyroEventCount === 0) {
			debugLog("⚠️ 0 event deviceorientation reçu après 1.5s (bloqué par le navigateur ?)")
		}
	}, 1500)
}

function removeMotionGestureHandler() {
	if (!motionGestureHandler) return
	window.removeEventListener("touchend", motionGestureHandler)
	window.removeEventListener("pointerdown", motionGestureHandler)
	motionGestureHandler = null
}

function requestGyroPermission() {
	if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
		debugLog("❌ DeviceOrientationEvent absent de window (API non supportée)")
		return
	}

	const DOE = window.DeviceOrientationEvent as unknown as {
		requestPermission?: () => Promise<"granted" | "denied">
	}

	if (typeof DOE.requestPermission === "function") {
		debugLog("requestPermission() disponible, appel en cours…")
		DOE.requestPermission()
			.then((state) => {
				debugLog(`requestPermission() -> "${state}"`)
				if (state === "granted") attachGyroListener()
				else debugLog("⚠️ permission refusée par l'utilisateur ou le navigateur")
			})
			.catch((err) => {
				debugLog(`❌ requestPermission() a rejeté: ${err?.message ?? err}`)
			})
			.finally(() => removeMotionGestureHandler())
	} else {
		// Android et autres navigateurs : aucune permission requise.
		debugLog("pas de requestPermission() -> attachGyroListener direct (Android/desktop)")
		attachGyroListener()
	}
}

// Bouton de debug : permet de déclencher la demande de permission manuellement,
// sans dépendre du premier tap générique sur la page.
function manualRequestPermission() {
	debugLog("bouton debug cliqué")
	requestGyroPermission()
}

function initMobileParallax() {
	if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
		debugLog("❌ DeviceOrientationEvent absent -> pas de parallax gyroscope possible")
		return
	}

	const DOE = window.DeviceOrientationEvent as unknown as {
		requestPermission?: () => Promise<"granted" | "denied">
	}

	// iOS 13+ exige un geste utilisateur explicite pour demander la permission.
	// On écoute le premier tap/pointerdown de la page, sans UI additionnelle.
	if (typeof DOE.requestPermission === "function") {
		debugLog("iOS 13+ détecté (requestPermission existe) : en attente d'un geste utilisateur…")
		motionGestureHandler = () => {
			debugLog("geste détecté (touchend/pointerdown) -> requestPermission()")
			requestGyroPermission()
		}
		window.addEventListener("touchend", motionGestureHandler, {
			passive: true,
			once: true,
		})
		window.addEventListener("pointerdown", motionGestureHandler, {
			passive: true,
			once: true,
		})
	} else {
		// Android et autres navigateurs : aucune permission requise.
		attachGyroListener()
	}
}

function animate(time: number) {
	frameId = requestAnimationFrame(animate)

	// Ne rend rien tant que le canvas n'est pas visible à l'écran (perf/batterie),
	// sans jamais toucher au rendu visuel une fois affiché.
	if (!isVisible) return

	current.x += (target.x - current.x) * damping
	current.y += (target.y - current.y) * damping

	if (logo) {
		const introElapsed = introStart ? time - introStart : introDuration
		const introT = Math.min(introElapsed / introDuration, 1)

		if (introT < 1) {
			const scaleT = easeOutBack(introT)
			logo.scale.setScalar(Math.max(0, scaleT) * baseScale)

			const spinT = easeOutCubic(introT)
			const remainingSpin = (1 - spinT) * introSpins * Math.PI * 2
			logo.rotation.y = current.y + remainingSpin
			logo.rotation.x = current.x
		} else {
			logo.scale.setScalar(baseScale)
			logo.rotation.x = current.x
			logo.rotation.y = current.y
		}
	}

	renderer.render(scene, camera)
}

function handleResize(el: HTMLDivElement) {
	const width = el.clientWidth
	const height = el.clientHeight
	if (width === 0 || height === 0) return
	camera.aspect = width / height
	camera.updateProjectionMatrix()
	renderer.setSize(width, height)
}

function tryInit(el: HTMLDivElement | null) {
	if (initialized || !el) return
	if (el.clientWidth === 0 || el.clientHeight === 0) return

	initialized = true
	initScene(el)
	frameId = requestAnimationFrame(animate)

	debugLog(
		`init: isFinePointer=${isFinePointer} prefersReducedMotion=${prefersReducedMotion} hasDOE=${typeof window !== "undefined" && "DeviceOrientationEvent" in window}`
	)

	if (isFinePointer) {
		// Desktop : comportement inchangé.
		window.addEventListener("pointermove", onPointerMove, { passive: true })
	} else if (!prefersReducedMotion) {
		// Mobile/tablette : parallax piloté par le gyroscope.
		initMobileParallax()
	} else {
		debugLog("⚠️ prefersReducedMotion=true -> initMobileParallax() jamais appelé")
	}

	resizeObserver = new ResizeObserver(() => handleResize(el))
	resizeObserver.observe(el)

	visibilityObserver = new IntersectionObserver(
		(entries) => {
			isVisible = entries[0]?.isIntersecting ?? true
		},
		{ threshold: 0 }
	)
	visibilityObserver.observe(el)
}

onMounted(async () => {
	await nextTick()
	tryInit(container.value)
})

watch(container, (el) => tryInit(el))

onBeforeUnmount(() => {
	cancelAnimationFrame(frameId)
	window.removeEventListener("pointermove", onPointerMove)
	if (gyroListenerAttached)
		window.removeEventListener("deviceorientation", onDeviceOrientation)
	removeMotionGestureHandler()
	resizeObserver?.disconnect()
	visibilityObserver?.disconnect()

	flakeMap?.dispose()
	envTexture?.dispose()

	scene?.traverse((obj) => {
		if (obj instanceof THREE.Mesh) {
			obj.geometry?.dispose()
			if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
			else obj.material?.dispose()
		}
	})

	renderer?.dispose()
	renderer?.forceContextLoss()
})
</script>

<style scoped>
.logo-scene {
	width: min(98vw, 95vh, 68rem);
	aspect-ratio: 1 / 1;
	margin-inline: auto;
	position: relative;
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

/* DEBUG TEMPORAIRE : à retirer une fois le bug gyroscope résolu */
.gyro-debug {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	pointer-events: auto;
	background: rgba(0, 0, 0, 0.85);
	color: #9eff9e;
	font: 11px/1.4 ui-monospace, monospace;
	padding: 8px;
	max-height: 40vh;
	overflow-y: auto;
}

.gyro-debug__btn {
	display: block;
	width: 100%;
	margin-bottom: 6px;
	padding: 10px;
	background: #2a2a2a;
	color: #fff;
	border: 1px solid #555;
	border-radius: 6px;
	font: 13px/1 ui-monospace, monospace;
	pointer-events: auto;
}

.gyro-debug__log div {
	white-space: pre-wrap;
	word-break: break-all;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	padding: 2px 0;
}
</style>