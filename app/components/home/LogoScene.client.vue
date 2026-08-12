<template>
	<div ref="container" class="logo-scene" @contextmenu.prevent></div>
</template>

<script setup lang="ts">
import type { GLTFLoader as GLTFLoaderType } from "three/examples/jsm/loaders/GLTFLoader.js"

const container = ref<HTMLDivElement | null>(null)

// -- État réactif dépendant de l'environnement client (SSR-safe) -----------
const prefersReducedMotion = ref(false)
const isTouchDevice = ref(false)

let scene: import("three").Scene
let camera: import("three").PerspectiveCamera
let renderer: import("three").WebGLRenderer
let logo: import("three").Object3D | null = null
let frameId = 0
let resizeObserver: ResizeObserver
let visibilityObserver: IntersectionObserver
let reducedMotionQuery: MediaQueryList
let touchQuery: MediaQueryList
let initialized = false
let isVisible = true
let pmrem: import("three").PMREMGenerator
let envTexture: import("three").Texture | null = null
let flakeMap: import("three").CanvasTexture | null = null

// -- Parallax (desktop / pointeur précis) -----------------------------------
const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
const damping = 0.06
const maxTilt = 0.28

// -- Rotation automatique (mobile / tablette / pointeur tactile) -----------
let autoRotationY = 0
let autoRotateSpeed = 0.45 // radians / seconde
let lastFrameTime = 0

let baseScale = 1
let introStart = 0
let introDuration = 2000
const introSpins = 1.3

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
function createFlakeNormalMap(
	THREE: typeof import("three"),
	size = 256,
	flakeCount = 900
) {
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

function applyGlitterFinish(
	THREE: typeof import("three"),
	root: import("three").Object3D
) {
	flakeMap = createFlakeNormalMap(THREE)
	const seen = new Set<import("three").Material>()

	root.traverse((obj) => {
		if (!(obj instanceof THREE.Mesh)) return
		const materials = Array.isArray(obj.material) ? obj.material : [obj.material]

		materials.forEach((mat) => {
			const m = mat as import("three").MeshStandardMaterial
			if (!m || seen.has(m)) return
			seen.add(m)

			m.normalMap = flakeMap
			m.normalScale.set(0.07, 0.07)
			m.envMapIntensity = m.name === "Metal_Face_Fonce" ? 1.05 : 0.85
			m.needsUpdate = true
		})
	})
}

async function initScene(el: HTMLDivElement) {
	// Chargement client-only et paresseux de three.js : évite d'alourdir le
	// bundle SSR / le payload initial pour un composant qui ne rend rien côté serveur.
	const THREE = await import("three")
	const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
	const { MeshoptDecoder } =
		await import("three/examples/jsm/libs/meshopt_decoder.module.js")
	const { RoomEnvironment } =
		await import("three/examples/jsm/environments/RoomEnvironment.js")

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
	// Réduire le paramètre de flou/échantillons évite de demander trop de samples
	// (0.02 limite les warnings de clipping).
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

	loadLogo(THREE, GLTFLoader, MeshoptDecoder)
}

function revealCanvas() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			renderer.domElement.classList.add("logo-scene__canvas--visible")
		})
	})
}

function loadLogo(
	THREE: typeof import("three"),
	GLTFLoader: typeof GLTFLoaderType,
	MeshoptDecoder: unknown
) {
	const loader = new GLTFLoader()
	// Décodeur requis par la compression EXT_meshopt_compression du .glb optimisé.
	loader.setMeshoptDecoder(MeshoptDecoder as any)

	loader.load(
		"/models/logo-metal-lime.glb",
		(gltf) => {
			logo = gltf.scene
			applyGlitterFinish(THREE, logo)
			baseScale = centerAndFit(THREE, logo)
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

function centerAndFit(THREE: typeof import("three"), obj: import("three").Object3D) {
	const box = new THREE.Box3().setFromObject(obj)
	const size = box.getSize(new THREE.Vector3())
	const center = box.getCenter(new THREE.Vector3())
	obj.position.sub(center)

	const maxDim = Math.max(size.x, size.y, size.z)
	return 2.6 / maxDim
}

function onPointerMove(e: PointerEvent) {
	if (isTouchDevice.value) return

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

function animate(time: number) {
	frameId = requestAnimationFrame(animate)

	// Ne rend rien tant que le canvas n'est pas visible à l'écran (perf/batterie),
	// sans jamais toucher au rendu visuel une fois affiché.
	if (!isVisible) return

	const delta = lastFrameTime ? (time - lastFrameTime) / 1000 : 0
	lastFrameTime = time

	if (logo) {
		const introElapsed = introStart ? time - introStart : introDuration
		const introT = Math.min(introElapsed / introDuration, 1)

		if (introT < 1) {
			const scaleT = easeOutBack(introT)
			logo.scale.setScalar(Math.max(0, scaleT) * baseScale)

			const spinT = easeOutCubic(introT)
			const remainingSpin = (1 - spinT) * introSpins * Math.PI * 2

			if (isTouchDevice.value) {
				// Sur mobile/tablette : pas de tilt lié au pointeur, juste le spin d'intro.
				logo.rotation.x = 0
				logo.rotation.y = remainingSpin
				autoRotationY = remainingSpin
			} else {
				logo.rotation.y = current.y + remainingSpin
				logo.rotation.x = current.x
			}
		} else if (isTouchDevice.value) {
			// Rotation continue et fluide sur elle-même, indépendante du framerate.
			logo.scale.setScalar(baseScale)
			autoRotationY += autoRotateSpeed * delta
			logo.rotation.y = autoRotationY
			logo.rotation.x = 0
		} else {
			logo.scale.setScalar(baseScale)
			current.x += (target.x - current.x) * damping
			current.y += (target.y - current.y) * damping
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

function updatePointerListener() {
	window.removeEventListener("pointermove", onPointerMove)
	if (!isTouchDevice.value) {
		window.addEventListener("pointermove", onPointerMove, { passive: true })
	} else {
		// Repart d'un tilt neutre pour éviter un saut visuel si l'appareil
		// bascule (rotation d'écran, changement de type de pointeur, etc.).
		target.x = 0
		target.y = 0
		current.x = 0
		current.y = 0
	}
}

function handleReducedMotionChange(e: MediaQueryListEvent) {
	prefersReducedMotion.value = e.matches
	introDuration = prefersReducedMotion.value ? 1 : 2000
	autoRotateSpeed = prefersReducedMotion.value ? 0 : 0.45
}

function handleTouchChange(e: MediaQueryListEvent) {
	isTouchDevice.value = e.matches
	updatePointerListener()
}

async function tryInit(el: HTMLDivElement | null) {
	if (initialized || !el) return
	if (el.clientWidth === 0 || el.clientHeight === 0) return

	initialized = true

	reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
	prefersReducedMotion.value = reducedMotionQuery.matches
	reducedMotionQuery.addEventListener("change", handleReducedMotionChange)
	introDuration = prefersReducedMotion.value ? 1 : 2000
	autoRotateSpeed = prefersReducedMotion.value ? 0 : 0.45

	// (hover: none) / (pointer: coarse) détecte les appareils sans pointeur
	// précis (tactile) de façon fiable, indépendamment de la largeur d'écran.
	touchQuery = window.matchMedia("(hover: none), (pointer: coarse)")
	isTouchDevice.value = touchQuery.matches
	touchQuery.addEventListener("change", handleTouchChange)

	await initScene(el)
	frameId = requestAnimationFrame(animate)

	updatePointerListener()

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
	reducedMotionQuery?.removeEventListener("change", handleReducedMotionChange)
	touchQuery?.removeEventListener("change", handleTouchChange)
	resizeObserver?.disconnect()
	visibilityObserver?.disconnect()

	flakeMap?.dispose()
	envTexture?.dispose()

	scene?.traverse((obj: any) => {
		if (obj.isMesh) {
			obj.geometry?.dispose()
			if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose())
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
</style>
