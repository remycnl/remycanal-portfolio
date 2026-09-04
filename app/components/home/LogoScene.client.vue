<template>
	<div ref="wrapper" class="logo-scene-wrapper" @contextmenu.prevent>
		<div ref="container" class="logo-scene" />
	</div>
</template>

<script lang="ts">
import type * as THREE_TYPES from "three"

let sharedFlakeNormalMap: THREE_TYPES.CanvasTexture | null = null
let flakeNormalMapRefCount = 0
let scrollTriggerMobileResizeConfigured = false

let activeRendererCount = 0
let hasWarnedContextBudget = false

const MAX_RECOMMENDED_CONTEXTS = 6

function createFlakeNormalMapTexture(
	THREE: typeof THREE_TYPES,
	size = 256,
	flakeCount = 900
) {
	const canvas = document.createElement("canvas")

	canvas.width = size
	canvas.height = size

	const context = canvas.getContext("2d")

	if (!context) {
		throw new Error("[LogoScene] Impossible de créer le contexte 2D.")
	}

	context.fillStyle = "rgb(128, 128, 255)"
	context.fillRect(0, 0, size, size)

	for (let i = 0; i < flakeCount; i++) {
		const x = Math.random() * size
		const y = Math.random() * size

		const radius = 0.5 + Math.random() * 1.2

		const angle = Math.random() * Math.PI * 2

		const tilt = 35 + Math.random() * 70

		const nx = Math.round(128 + Math.cos(angle) * tilt)

		const ny = Math.round(128 + Math.sin(angle) * tilt)

		context.fillStyle = `rgb(${nx}, ${ny}, 255)`

		context.beginPath()

		context.arc(x, y, radius, 0, Math.PI * 2)

		context.fill()
	}

	const texture = new THREE.CanvasTexture(canvas)

	texture.wrapS = THREE.RepeatWrapping

	texture.wrapT = THREE.RepeatWrapping

	texture.repeat.set(7, 7)

	texture.colorSpace = THREE.NoColorSpace

	texture.needsUpdate = true

	return texture
}

function acquireFlakeNormalMap(THREE: typeof THREE_TYPES) {
	if (!sharedFlakeNormalMap) {
		sharedFlakeNormalMap = createFlakeNormalMapTexture(THREE)
	}

	flakeNormalMapRefCount++

	return sharedFlakeNormalMap
}

function releaseFlakeNormalMap() {
	flakeNormalMapRefCount = Math.max(0, flakeNormalMapRefCount - 1)

	if (flakeNormalMapRefCount === 0 && sharedFlakeNormalMap) {
		sharedFlakeNormalMap.dispose()

		sharedFlakeNormalMap = null
	}
}
</script>

<script setup lang="ts">
import {
	acquireLogoSceneAssets,
	bakeEnvironmentTexture,
	releaseLogoSceneAssets,
} from "@/composables/useLogoSceneAssets"
import { DEFAULT_LOGO_MODEL_URL } from "@/constants/logo"

const XRAY_TINT_COLOR = 0x8fd8ff
const XRAY_TINT_MIX = 0.85
const XRAY_OPACITY = 0.3
const XRAY_DEPTH_DARKEN = 0.2

const XRAY_EDGE_GLOW_COLOR = 0xd5f4ff
const XRAY_EDGE_GLOW_INTENSITY = 1.5
const XRAY_EDGE_GLOW_WIDTH_RATIO = 0.01

const INTRO_DURATION = 2000
const INTRO_SPINS = 1.3

const BASE_ROTATE_SPEED = 0.32

const DRAG_ROTATE_SPEED = 0.012
const DRAG_VELOCITY_SMOOTHING_RATE = 16
const DRAG_INERTIA_DECAY_RATE = 2.2

const VELOCITY_TRACKING_RATE = 13
const BOOST_SMOOTHING_RATE = 3.4
const SCROLL_BOOST_FACTOR = 0.0017
const MAX_SCROLL_BOOST = 5.8

const FLOAT_AMPLITUDE = 0.045
const FLOAT_SPEED = 0.7

const MASK_RADIUS_FACTOR = 0.2
const MASK_TIME_SPEED = 0.2
const EDGE_NOISE_RATIO = 1
const EDGE_SOFTNESS_RATIO = 0.5
const WARP_AMOUNT_RATIO = 0.2

const FINE_NOISE_SCALE_MULT = 1.5
const FINE_NOISE_AMOUNT_RATIO = 2

const REVEAL_LERP_RATE = 8
const CURSOR_CHASE_RATE = 26

const COLOR_TWEEN_DURATION = 0.6

const FACE_MATERIAL_NAME = "Metal_Face_Fonce"

const IDLE_EPSILON = 0.0005

const MAX_PIXEL_RATIO = 2
const MAX_PIXEL_RATIO_UNDER_LOAD = 1.5
const PIXEL_RATIO_BUDGET_THRESHOLD = 2

const DISPOSABLE_TEXTURE_KEYS = [
	"map",
	"aoMap",
	"alphaMap",
	"bumpMap",
	"displacementMap",
	"emissiveMap",
	"envMap",
	"lightMap",
	"metalnessMap",
	"normalMap",
	"roughnessMap",
] as const

const props = withDefaults(
	defineProps<{
		modelUrl?: string
		skipIntro?: boolean
		bodyColor?: string
		faceColor?: string
		scrollReveal?: boolean
		triggerEl?: HTMLElement | null
	}>(),
	{
		modelUrl: DEFAULT_LOGO_MODEL_URL,
		skipIntro: false,
		bodyColor: undefined,
		faceColor: undefined,
		scrollReveal: false,
		triggerEl: null,
	}
)

const wrapper = useTemplateRef<HTMLDivElement>("wrapper")
const container = useTemplateRef<HTMLDivElement>("container")

const lenis = useLenis()

const { gsap, ScrollTrigger, useGsapContext } = useGsap()

if (!scrollTriggerMobileResizeConfigured) {
	ScrollTrigger.config({ ignoreMobileResize: true })

	scrollTriggerMobileResizeConfigured = true
}

let THREE: typeof import("three")

let scene: THREE_TYPES.Scene
let camera: THREE_TYPES.PerspectiveCamera
let renderer: THREE_TYPES.WebGLRenderer
let raycaster: THREE_TYPES.Raycaster

let logo: THREE_TYPES.Object3D | null = null

let sharedNdc: THREE_TYPES.Vector2
let sharedWorldPoint: THREE_TYPES.Vector3

let maskCenterCurrent: THREE_TYPES.Vector3
let maskCenterTarget: THREE_TYPES.Vector3

let maskUniforms: MaskUniforms | null = null

let flakeMap: THREE_TYPES.CanvasTexture | null = null
let envTexture: THREE_TYPES.Texture | null = null

let sceneEl: HTMLDivElement | null = null
let wrapperEl: HTMLDivElement | null = null

let containerResizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null

let pendingInitObserver: ResizeObserver | null = null
let resizeRafId = 0

let reducedMotionQuery: MediaQueryList | null = null
let touchQuery: MediaQueryList | null = null
let dprQuery: MediaQueryList | null = null

let cachedSceneRect: DOMRect | null = null

let initialized = false
let isUnmounted = false
let assetsAcquired = false
let rendererRegistered = false
let isVisible = true
let isTabVisible = true
let loopActive = false

let prefersReducedMotion = false
let isTouchDevice = false

let baseScale = 1
let logoMaxDim = 1

let introActive = false
let introElapsedMs = 0
let introDuration = INTRO_DURATION

let autoRotationY = 0
let floatPhase = 0

let lastScrollY = 0
let scrollVelocity = 0
let rotationBoost = 0

let pendingPointerX = 0
let pendingPointerY = 0
let hasPendingPointer = false

let isDragging = false
let dragPointerId: number | null = null

let dragLastFrameX = 0
let pendingDragX = 0
let hasPendingDragMove = false

let dragVelocityY = 0
let inertiaVelocityY = 0

const metalMeshes: THREE_TYPES.Mesh[] = []

interface ColorMaterialEntry {
	material: THREE_TYPES.MeshStandardMaterial
	originalColor: THREE_TYPES.Color
}

interface ColorGroup {
	entries: ColorMaterialEntry[]
	targetCss: string | null
	tweens: ReturnType<typeof gsap.to>[]
}

function createColorGroup(): ColorGroup {
	return {
		entries: [],
		targetCss: null,
		tweens: [],
	}
}

const bodyColorGroup = createColorGroup()
const faceColorGroup = createColorGroup()

let isColorActive = false

let hasMaskTarget = false

let revealProgress = 0
let revealTarget = 0

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

function expSmoothingFactor(rate: number, delta: number) {
	return 1 - Math.exp(-rate * delta)
}

function easeOutCubic(t: number) {
	return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number) {
	const c1 = 1.15
	const c3 = c1 + 1

	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function resolveCssColor(color: string): string {
	if (typeof document === "undefined") {
		return color
	}

	const probe = document.createElement("span")

	probe.style.position = "absolute"
	probe.style.visibility = "hidden"
	probe.style.pointerEvents = "none"
	probe.style.color = color

	document.body.appendChild(probe)

	const resolved = getComputedStyle(probe).color

	probe.remove()

	const canvas = document.createElement("canvas")

	canvas.width = 1
	canvas.height = 1

	const ctx = canvas.getContext("2d")

	if (!ctx) {
		return resolved || color
	}

	ctx.fillStyle = resolved || color

	ctx.fillRect(0, 0, 1, 1)

	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

	return `rgb(${r}, ${g}, ${b})`
}

interface IdleCallbackWindow {
	requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
}

function scheduleIdleTask(task: () => void) {
	if (typeof window === "undefined") {
		return
	}

	const idleWindow = window as unknown as IdleCallbackWindow

	if (typeof idleWindow.requestIdleCallback === "function") {
		idleWindow.requestIdleCallback(task, { timeout: 500 })
	} else {
		window.setTimeout(task, 1)
	}
}

interface MaskUniforms {
	uMaskCenter: {
		value: THREE_TYPES.Vector3
	}

	uMaskRadius: {
		value: number
	}

	uNoiseScale: {
		value: number
	}

	uNoiseAmount: {
		value: number
	}

	uEdgeSoftness: {
		value: number
	}

	uWarpAmount: {
		value: number
	}

	uTime: {
		value: number
	}

	uMotionScale: {
		value: number
	}

	uXrayTint: {
		value: THREE_TYPES.Color
	}

	uXrayTintMix: {
		value: number
	}

	uXrayOpacity: {
		value: number
	}

	uXrayDepthDarken: {
		value: number
	}

	uEdgeGlowColor: {
		value: THREE_TYPES.Color
	}

	uEdgeGlowIntensity: {
		value: number
	}

	uEdgeGlowWidth: {
		value: number
	}
}

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

    uniform vec3 uXrayTint;
    uniform float uXrayTintMix;
    uniform float uXrayOpacity;
    uniform float uXrayDepthDarken;

    uniform vec3 uEdgeGlowColor;
    uniform float uEdgeGlowIntensity;
    uniform float uEdgeGlowWidth;
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

    vec2 rc_maskDistEdge(vec3 objectPosition) {
        float rcTime =
            uTime *
            uMotionScale *
            ${MASK_TIME_SPEED.toFixed(4)};

        vec3 toCenter =
            objectPosition -
            uMaskCenter;

        float rcDist =
            length(toCenter);

        vec3 rcWarp =
            vec3(
                sin(
                    objectPosition.y *
                    uNoiseScale *
                    1.3 +
                    rcTime * 1.6
                ),

                cos(
                    objectPosition.z *
                    uNoiseScale *
                    1.3 -
                    rcTime * 1.1
                ),

                sin(
                    objectPosition.x *
                    uNoiseScale *
                    1.3 +
                    rcTime * 1.4
                )
            ) *
            uWarpAmount;

        vec3 rcEdgeSample =
            (objectPosition + rcWarp) *
            uNoiseScale +
            vec3(
                rcTime * 0.6,
                rcTime * -0.4,
                rcTime * 0.42
            );

        float rcEdgeNoise =
            rc_fbm(rcEdgeSample) -
            0.5;

        vec3 rcFineSample =
            (objectPosition + rcWarp * 0.5) *
            uNoiseScale *
            ${FINE_NOISE_SCALE_MULT.toFixed(4)}
            -
            vec3(rcTime * 0.9);

        float rcFineNoise =
            rc_fbm(rcFineSample) -
            0.5;

        float rcPulse =
            1.0 +
            sin(rcTime * 1.8) *
            0.05 *
            uMotionScale;

        float rcEdge =
            (uMaskRadius * rcPulse) +
            rcEdgeNoise * uNoiseAmount +
            rcFineNoise *
            uNoiseAmount *
            ${FINE_NOISE_AMOUNT_RATIO.toFixed(4)};

        return vec2(
            rcDist,
            rcEdge
        );
    }

    float rc_maskStrength(
        vec3 objectPosition
    ) {
        vec2 rcDE =
            rc_maskDistEdge(
                objectPosition
            );

        float rcMaskStrength =
            1.0 -
            smoothstep(
                rcDE.y - uEdgeSoftness,
                rcDE.y + uEdgeSoftness,
                rcDE.x
            );

        return clamp(
            rcMaskStrength,
            0.0,
            1.0
        );
    }

    float rc_edgeGlow(
        vec3 objectPosition
    ) {
        vec2 rcDE =
            rc_maskDistEdge(
                objectPosition
            );

        float rcD =
            abs(
                rcDE.x -
                rcDE.y
            );

        float rcWidth =
            max(
                uEdgeGlowWidth,
                0.0001
            );

        return exp(
            -(rcD * rcD) /
            (
                2.0 *
                rcWidth *
                rcWidth
            )
        );
    }

    float rc_maskDepth(
        vec3 objectPosition
    ) {
        vec2 rcDE =
            rc_maskDistEdge(
                objectPosition
            );

        float rcEdge =
            max(
                rcDE.y,
                0.0001
            );

        return clamp(
            1.0 -
            rcDE.x / rcEdge,
            0.0,
            1.0
        );
    }
`

function createMaskUniforms(): MaskUniforms {
	return {
		uMaskCenter: {
			value: new THREE.Vector3(),
		},

		uMaskRadius: {
			value: 0,
		},

		uNoiseScale: {
			value: 5 / logoMaxDim,
		},

		uNoiseAmount: {
			value: 0,
		},

		uEdgeSoftness: {
			value: 0,
		},

		uWarpAmount: {
			value: logoMaxDim * WARP_AMOUNT_RATIO,
		},

		uTime: {
			value: 0,
		},

		uMotionScale: {
			value: prefersReducedMotion ? 0 : 1,
		},

		uXrayTint: {
			value: new THREE.Color(XRAY_TINT_COLOR),
		},

		uXrayTintMix: {
			value: XRAY_TINT_MIX,
		},

		uXrayOpacity: {
			value: XRAY_OPACITY,
		},

		uXrayDepthDarken: {
			value: XRAY_DEPTH_DARKEN,
		},

		uEdgeGlowColor: {
			value: new THREE.Color(XRAY_EDGE_GLOW_COLOR),
		},

		uEdgeGlowIntensity: {
			value: XRAY_EDGE_GLOW_INTENSITY,
		},

		uEdgeGlowWidth: {
			value: logoMaxDim * XRAY_EDGE_GLOW_WIDTH_RATIO,
		},
	}
}

function localMatrixRelativeTo(node: THREE_TYPES.Object3D, root: THREE_TYPES.Object3D) {
	const result = node.matrix.clone()

	let current = node.parent

	while (current && current !== root) {
		result.premultiply(current.matrix)

		current = current.parent
	}

	return result
}

function applyMetalCutoutShader(
	material: THREE_TYPES.MeshStandardMaterial,
	sharedUniforms: MaskUniforms,
	localToRoot: THREE_TYPES.Matrix4
) {
	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, sharedUniforms)

		shader.uniforms.uLocalToRoot = {
			value: localToRoot,
		}

		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`
                        #include <common>

                        uniform mat4 uLocalToRoot;

                        varying vec3 vObjectPosition;
                    `
			)
			.replace(
				"#include <begin_vertex>",
				`
                        #include <begin_vertex>

                        vObjectPosition =
                            (
                                uLocalToRoot *
                                vec4(
                                    transformed,
                                    1.0
                                )
                            ).xyz;
                    `
			)

		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`
                        #include <common>

                        ${RC_MASK_UNIFORMS_GLSL}
                        ${RC_MASK_FUNCTIONS_GLSL}
                    `
			)
			.replace(
				"vec4 diffuseColor = vec4( diffuse, opacity );",
				`
                        vec4 diffuseColor =
                            vec4(
                                diffuse,
                                opacity
                            );

                        float rcStrength =
                            rc_maskStrength(
                                vObjectPosition
                            );

                        float rcGlow =
                            rc_edgeGlow(
                                vObjectPosition
                            );

                        float rcDepth =
                            rc_maskDepth(
                                vObjectPosition
                            );

                        vec3 rcXrayColor =
                            mix(
                                diffuseColor.rgb,
                                uXrayTint,
                                uXrayTintMix
                            );

                        rcXrayColor *=
                            mix(
                                1.0,
                                1.0 -
                                    uXrayDepthDarken,
                                rcDepth
                            );

                        diffuseColor.rgb =
                            mix(
                                diffuseColor.rgb,
                                rcXrayColor,
                                rcStrength
                            );

                        diffuseColor.a =
                            mix(
                                diffuseColor.a,
                                uXrayOpacity,
                                rcStrength
                            );

                        diffuseColor.rgb +=
                            uEdgeGlowColor *
                            (
                                rcGlow *
                                uEdgeGlowIntensity
                            );
                    `
			)
	}

	material.customProgramCacheKey = () => "metal-xray-v1"
}

function captureColorGroupMaterials(
	group: ColorGroup,
	materials: (THREE_TYPES.MeshStandardMaterial | null)[],
	predicate: (material: THREE_TYPES.MeshStandardMaterial) => boolean
) {
	group.entries = materials
		.filter((material): material is THREE_TYPES.MeshStandardMaterial => {
			return !!material && predicate(material)
		})
		.map((material) => ({
			material,
			originalColor: material.color.clone(),
		}))
}

function syncColorGroup(group: ColorGroup, active: boolean, animate: boolean) {
	if (!group.entries.length) {
		return
	}

	group.tweens.forEach((tween) => tween.kill())
	group.tweens = []

	const targetColor =
		active && group.targetCss ? new THREE.Color().setStyle(group.targetCss) : null

	group.entries.forEach(({ material, originalColor }) => {
		const target = targetColor ?? originalColor

		if (!animate || prefersReducedMotion) {
			material.color.copy(target)
			return
		}

		group.tweens.push(
			gsap.to(material.color, {
				r: target.r,
				g: target.g,
				b: target.b,
				duration: COLOR_TWEEN_DURATION,
				ease: "power2.out",
				overwrite: "auto",
			})
		)
	})
}

function setColorActive(active: boolean, animate: boolean) {
	isColorActive = active

	syncColorGroup(bodyColorGroup, active, animate)
	syncColorGroup(faceColorGroup, active, animate)
}

function isColorGroupTweening(group: ColorGroup) {
	return group.tweens.some((tween) => tween.isActive())
}

function prepareLogoMaterials(root: THREE_TYPES.Object3D) {
	flakeMap = acquireFlakeNormalMap(THREE)

	const targetMeshes: THREE_TYPES.Mesh[] = []

	root.traverse((object) => {
		if (object instanceof THREE.Mesh) {
			object.matrixAutoUpdate = false

			targetMeshes.push(object)
		}
	})

	if (!targetMeshes.length) {
		return
	}

	const materials = targetMeshes.map((mesh) => {
		const originalMaterial = Array.isArray(mesh.material)
			? mesh.material[0]
			: mesh.material

		if (!originalMaterial || !(originalMaterial instanceof THREE.MeshStandardMaterial)) {
			return null
		}

		const material = originalMaterial.clone()

		material.normalMap = flakeMap

		material.normalScale.set(0.07, 0.07)

		material.envMapIntensity = material.name === FACE_MATERIAL_NAME ? 1.05 : 0.85

		material.needsUpdate = true

		mesh.material = material

		return material
	})

	captureColorGroupMaterials(
		bodyColorGroup,
		materials,
		(material) => material.name !== FACE_MATERIAL_NAME
	)
	captureColorGroupMaterials(
		faceColorGroup,
		materials,
		(material) => material.name === FACE_MATERIAL_NAME
	)

	syncColorGroup(bodyColorGroup, isColorActive, false)
	syncColorGroup(faceColorGroup, isColorActive, false)

	if (isTouchDevice) {
		return
	}

	maskUniforms = createMaskUniforms()

	const localMatrices = targetMeshes.map((mesh) => localMatrixRelativeTo(mesh, root))

	targetMeshes.forEach((mesh, index) => {
		const material = materials[index]

		if (!material) {
			return
		}

		material.transparent = true
		material.depthWrite = true

		applyMetalCutoutShader(material, maskUniforms!, localMatrices[index]!)

		metalMeshes.push(mesh)
	})
}

function centerAndFit(object: THREE_TYPES.Object3D) {
	object.updateMatrixWorld(true)

	const box = new THREE.Box3().setFromObject(object)

	const size = box.getSize(new THREE.Vector3())

	const center = box.getCenter(new THREE.Vector3())

	object.position.sub(center)

	object.updateMatrixWorld(true)

	const maxDim = Math.max(size.x, size.y, size.z)

	if (!Number.isFinite(maxDim) || maxDim <= 0) {
		logoMaxDim = 1
		return 1
	}

	logoMaxDim = maxDim

	return 2.6 / maxDim
}

function onContextLost(event: Event) {
	event.preventDefault()
	stopLoop()
}

function onContextRestored() {
	if (isUnmounted) {
		return
	}

	teardownRenderResources()
	teardownInteractionListeners()

	initialized = false

	if (sceneEl && wrapperEl) {
		void tryInit(sceneEl, wrapperEl)
	}
}

function pixelRatioCap() {
	return activeRendererCount > PIXEL_RATIO_BUDGET_THRESHOLD
		? MAX_PIXEL_RATIO_UNDER_LOAD
		: MAX_PIXEL_RATIO
}

function registerActiveRenderer() {
	if (rendererRegistered) {
		return
	}

	rendererRegistered = true
	activeRendererCount++

	if (activeRendererCount > MAX_RECOMMENDED_CONTEXTS && !hasWarnedContextBudget) {
		hasWarnedContextBudget = true

		console.warn(
			`[LogoScene] ${activeRendererCount} contextes WebGL actifs simultanément (seuil recommandé: ${MAX_RECOMMENDED_CONTEXTS}). Le navigateur peut commencer à évincer les plus anciens. Envisager de réduire le nombre d'occurrences simultanées ou un rendu mutualisé.`
		)
	}
}

function unregisterActiveRenderer() {
	if (!rendererRegistered) {
		return
	}

	rendererRegistered = false
	activeRendererCount = Math.max(0, activeRendererCount - 1)
}

async function initScene(el: HTMLDivElement) {
	const assets = await acquireLogoSceneAssets(props.modelUrl)

	if (isUnmounted) {
		return
	}

	assetsAcquired = true

	THREE = assets.THREE

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
		powerPreference: isTouchDevice ? "low-power" : "high-performance",
	})

	registerActiveRenderer()

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()))

	renderer.setSize(width, height, false)

	renderer.toneMapping = THREE.ACESFilmicToneMapping

	renderer.toneMappingExposure = 0.85

	renderer.outputColorSpace = THREE.SRGBColorSpace

	renderer.domElement.classList.add("logo-scene__canvas")

	renderer.domElement.addEventListener("webglcontextlost", onContextLost, false)

	renderer.domElement.addEventListener("webglcontextrestored", onContextRestored, false)

	el.appendChild(renderer.domElement)

	envTexture = await bakeEnvironmentTexture(THREE, renderer)

	if (isUnmounted) {
		return
	}

	scene.environment = envTexture

	const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)

	keyLight.position.set(3, 4, 5)

	scene.add(keyLight)

	const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)

	rimLight.position.set(-4, -2, -3)

	scene.add(rimLight)

	logo = assets.gltfScene.clone(true)

	baseScale = centerAndFit(logo)

	logo.updateMatrixWorld(true)

	prepareLogoMaterials(logo)

	if (props.skipIntro) {
		logo.scale.setScalar(baseScale)
		autoRotationY = 0
		logo.rotation.y = 0
	} else {
		logo.scale.setScalar(0)
	}

	scene.add(logo)

	renderer.render(scene, camera)

	introActive = !props.skipIntro
	introElapsedMs = 0

	revealCanvas()
}

function revealCanvas() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			if (renderer?.domElement) {
				renderer.domElement.classList.add("logo-scene__canvas--visible")
			}
		})
	})
}

function raycastFromPointer(clientX: number, clientY: number) {
	if (!logo || !raycaster || !camera || !cachedSceneRect || !metalMeshes.length) {
		return false
	}

	const rect = cachedSceneRect

	if (rect.width <= 0 || rect.height <= 0) {
		return false
	}

	sharedNdc.set(
		((clientX - rect.left) / rect.width) * 2 - 1,

		-((clientY - rect.top) / rect.height) * 2 + 1
	)

	raycaster.setFromCamera(sharedNdc, camera)

	const hits = raycaster.intersectObjects(metalMeshes, false)

	const hit = hits[0]

	if (!hit) {
		return false
	}

	sharedWorldPoint.copy(hit.point)

	logo.worldToLocal(maskCenterTarget.copy(sharedWorldPoint))

	if (!hasMaskTarget) {
		maskCenterCurrent.copy(maskCenterTarget)

		hasMaskTarget = true
	}

	return true
}

function onWrapperPointerActivity(event: PointerEvent) {
	pendingPointerX = event.clientX

	pendingPointerY = event.clientY

	hasPendingPointer = true
}

function onWrapperPointerLeave() {
	hasPendingPointer = false
	revealTarget = 0
}

function updateHoverRaycast() {
	if (!hasPendingPointer || isTouchDevice) {
		return
	}

	const isOverLogo = raycastFromPointer(pendingPointerX, pendingPointerY)

	revealTarget = isOverLogo ? 1 : 0
}

function onWrapperPointerDown(event: PointerEvent) {
	if (event.pointerType !== "touch" && event.pointerType !== "pen") {
		return
	}

	isDragging = true

	dragPointerId = event.pointerId

	dragLastFrameX = event.clientX

	pendingDragX = event.clientX

	hasPendingDragMove = false

	dragVelocityY = 0
	inertiaVelocityY = 0

	sceneEl?.setPointerCapture(event.pointerId)
}

function onWrapperPointerDragMove(event: PointerEvent) {
	if (!isDragging || event.pointerId !== dragPointerId) {
		return
	}

	pendingDragX = event.clientX

	hasPendingDragMove = true
}

function onWrapperPointerDragEnd(event: PointerEvent) {
	if (event.pointerId !== dragPointerId) {
		return
	}

	isDragging = false
	dragPointerId = null

	inertiaVelocityY = dragVelocityY
}

function updateDragRotation(delta: number) {
	if (isDragging) {
		if (hasPendingDragMove && delta > 0) {
			const deltaX = pendingDragX - dragLastFrameX

			dragLastFrameX = pendingDragX

			const instantVelocity = (deltaX * DRAG_ROTATE_SPEED) / delta

			const smoothing = expSmoothingFactor(DRAG_VELOCITY_SMOOTHING_RATE, delta)

			dragVelocityY += (instantVelocity - dragVelocityY) * smoothing

			autoRotationY += deltaX * DRAG_ROTATE_SPEED

			hasPendingDragMove = false
		}

		return
	}

	if (Math.abs(inertiaVelocityY) < 0.001) {
		inertiaVelocityY = 0
		return
	}

	autoRotationY += inertiaVelocityY * delta

	inertiaVelocityY *= Math.exp(-DRAG_INERTIA_DECAY_RATE * delta)
}

function updateReveal(delta: number) {
	if (!maskUniforms) {
		return
	}

	const revealSmoothing = expSmoothingFactor(REVEAL_LERP_RATE, delta)

	revealProgress += (revealTarget - revealProgress) * revealSmoothing

	if (Math.abs(revealTarget - revealProgress) < 0.002) {
		revealProgress = revealTarget
	}

	const eased = revealProgress * revealProgress * (3 - 2 * revealProgress)

	const targetRadius = logoMaxDim * MASK_RADIUS_FACTOR * eased

	const noiseAmount = targetRadius * EDGE_NOISE_RATIO

	const edgeSoftness = Math.max(targetRadius * EDGE_SOFTNESS_RATIO, 0.0001)

	maskUniforms.uMaskRadius.value = targetRadius

	maskUniforms.uNoiseAmount.value = noiseAmount

	maskUniforms.uEdgeSoftness.value = edgeSoftness

	if (!prefersReducedMotion) {
		maskUniforms.uTime.value += delta
	}

	maskUniforms.uEdgeGlowIntensity.value = XRAY_EDGE_GLOW_INTENSITY * eased

	if (hasMaskTarget) {
		const chaseFactor = expSmoothingFactor(CURSOR_CHASE_RATE, delta)

		maskCenterCurrent.lerp(maskCenterTarget, chaseFactor)

		maskUniforms.uMaskCenter.value.copy(maskCenterCurrent)
	}
}

function updateScrollBoost(delta: number) {
	if (prefersReducedMotion || delta <= 0) {
		scrollVelocity = 0
		rotationBoost = 0
		lastScrollY = window.scrollY

		return
	}

	let rawDelta: number

	if (lenis) {
		rawDelta = lenis.velocity
	} else {
		const scrollY = window.scrollY

		rawDelta = scrollY - lastScrollY

		lastScrollY = scrollY
	}

	const instantVelocity = Math.abs(rawDelta) / delta

	scrollVelocity +=
		(instantVelocity - scrollVelocity) * expSmoothingFactor(VELOCITY_TRACKING_RATE, delta)

	const targetBoost = clamp(scrollVelocity * SCROLL_BOOST_FACTOR, 0, MAX_SCROLL_BOOST)

	rotationBoost +=
		(targetBoost - rotationBoost) * expSmoothingFactor(BOOST_SMOOTHING_RATE, delta)
}

function isSceneSettled() {
	if (introActive || isDragging || Math.abs(inertiaVelocityY) > IDLE_EPSILON) {
		return false
	}

	if (maskUniforms && Math.abs(revealTarget - revealProgress) > IDLE_EPSILON) {
		return false
	}

	if (isColorGroupTweening(bodyColorGroup) || isColorGroupTweening(faceColorGroup)) {
		return false
	}

	return true
}

function animate(_time: number, deltaTime: number) {
	const delta = Math.min(deltaTime / 1000, 0.1)

	updateHoverRaycast()
	updateScrollBoost(delta)
	updateReveal(delta)

	if (logo) {
		if (introActive) {
			introElapsedMs += deltaTime

			const introProgress = Math.min(introElapsedMs / introDuration, 1)

			if (introProgress >= 1) {
				introActive = false
			}

			const scaleT = easeOutBack(introProgress)

			logo.scale.setScalar(Math.max(0, scaleT) * baseScale)

			const spinT = easeOutCubic(introProgress)

			const remainingSpin = (1 - spinT) * INTRO_SPINS * Math.PI * 2

			autoRotationY = remainingSpin

			logo.rotation.y = remainingSpin

			logo.rotation.x = 0
		} else {
			logo.scale.setScalar(baseScale)

			const speed = prefersReducedMotion ? 0 : BASE_ROTATE_SPEED + rotationBoost

			autoRotationY += speed * delta

			updateDragRotation(delta)

			logo.rotation.y = autoRotationY

			if (prefersReducedMotion) {
				logo.rotation.x = 0
			} else {
				floatPhase += FLOAT_SPEED * delta

				logo.rotation.x = Math.sin(floatPhase) * FLOAT_AMPLITUDE
			}
		}
	}

	if (!prefersReducedMotion || !isSceneSettled()) {
		renderer.render(scene, camera)
	}
}

function refreshSceneRect() {
	if (sceneEl) {
		cachedSceneRect = sceneEl.getBoundingClientRect()
	}
}

function startLoop() {
	if (loopActive || !renderer) {
		return
	}

	loopActive = true

	lastScrollY = window.scrollY

	gsap.ticker.add(animate)
}

function stopLoop() {
	if (!loopActive) {
		return
	}

	loopActive = false

	gsap.ticker.remove(animate)
}

function evaluateLoopState() {
	if (isVisible && isTabVisible) {
		startLoop()
	} else {
		stopLoop()
	}
}

function handleContainerResize(element: HTMLDivElement) {
	if (!renderer || !camera) {
		return
	}

	const width = element.clientWidth

	const height = element.clientHeight

	if (width <= 0 || height <= 0) {
		return
	}

	camera.aspect = width / height

	camera.updateProjectionMatrix()

	renderer.setSize(width, height, false)

	refreshSceneRect()
}

function watchDevicePixelRatio() {
	dprQuery?.removeEventListener("change", handleDprChange)

	dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)

	dprQuery.addEventListener("change", handleDprChange, {
		once: true,
	})
}

function handleDprChange() {
	if (!renderer || !sceneEl) {
		return
	}

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()))

	handleContainerResize(sceneEl)

	watchDevicePixelRatio()
}

function handleReducedMotionChange(event: MediaQueryListEvent) {
	prefersReducedMotion = event.matches

	introDuration = event.matches ? 1 : INTRO_DURATION

	if (maskUniforms) {
		maskUniforms.uMotionScale.value = event.matches ? 0 : 1
	}

	if (event.matches && logo) {
		logo.rotation.x = 0
	}
}

function handleTouchChange(event: MediaQueryListEvent) {
	isTouchDevice = event.matches
}

function handleVisibilityChange() {
	isTabVisible = !document.hidden

	evaluateLoopState()
}

function disposeInstance() {
	pendingInitObserver?.disconnect()
	pendingInitObserver = null

	teardownRenderResources()
	teardownInteractionListeners()

	cachedSceneRect = null
	sceneEl = null
	wrapperEl = null

	initialized = false
}

async function tryInit(element: HTMLDivElement | null, wrap: HTMLDivElement | null) {
	if (initialized || !element || !wrap || isUnmounted) {
		return
	}

	if (element.clientWidth <= 0 || element.clientHeight <= 0) {
		pendingInitObserver?.disconnect()

		pendingInitObserver = new ResizeObserver(() => {
			if (isUnmounted) {
				pendingInitObserver?.disconnect()
				pendingInitObserver = null

				return
			}

			if (element.clientWidth > 0 && element.clientHeight > 0) {
				pendingInitObserver?.disconnect()
				pendingInitObserver = null

				void tryInit(element, wrap)
			}
		})

		pendingInitObserver.observe(element)

		return
	}

	pendingInitObserver?.disconnect()
	pendingInitObserver = null

	initialized = true

	sceneEl = element
	wrapperEl = wrap

	reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

	prefersReducedMotion = reducedMotionQuery.matches

	reducedMotionQuery.addEventListener("change", handleReducedMotionChange)

	introDuration = prefersReducedMotion ? 1 : INTRO_DURATION

	touchQuery = window.matchMedia("(hover: none), (pointer: coarse)")

	isTouchDevice = touchQuery.matches

	touchQuery.addEventListener("change", handleTouchChange)

	isTabVisible = !document.hidden

	document.addEventListener("visibilitychange", handleVisibilityChange)

	lastScrollY = window.scrollY

	try {
		await initScene(element)
	} catch (error) {
		console.error("[LogoScene] Échec de l'initialisation de la scène.", error)

		disposeInstance()

		return
	}

	if (isUnmounted) {
		disposeInstance()

		return
	}

	refreshSceneRect()

	watchDevicePixelRatio()

	if (!isTouchDevice) {
		element.addEventListener("pointerenter", onWrapperPointerActivity)

		element.addEventListener("pointermove", onWrapperPointerActivity, {
			passive: true,
		})

		element.addEventListener("pointerleave", onWrapperPointerLeave)
	} else {
		element.style.touchAction = "pan-y"

		element.addEventListener("pointerdown", onWrapperPointerDown, {
			passive: true,
		})

		element.addEventListener("pointermove", onWrapperPointerDragMove, {
			passive: true,
		})

		element.addEventListener("pointerup", onWrapperPointerDragEnd, {
			passive: true,
		})

		element.addEventListener("pointercancel", onWrapperPointerDragEnd, {
			passive: true,
		})
	}

	if (lenis) {
		lenis.on("scroll", refreshSceneRect)
	} else {
		window.addEventListener("scroll", refreshSceneRect, { passive: true })
	}

	containerResizeObserver = new ResizeObserver(() => {
		if (resizeRafId) {
			return
		}

		resizeRafId = requestAnimationFrame(() => {
			resizeRafId = 0

			if (sceneEl) {
				handleContainerResize(sceneEl)
			}
		})
	})

	containerResizeObserver.observe(element)

	visibilityObserver = new IntersectionObserver(
		(entries) => {
			isVisible = entries[0]?.isIntersecting ?? true

			evaluateLoopState()
		},
		{
			threshold: 0,
		}
	)

	visibilityObserver.observe(element)

	evaluateLoopState()
}

function collectMaterialTextures(
	material: THREE_TYPES.Material,
	target: Set<THREE_TYPES.Texture>,
	preserved: Set<THREE_TYPES.Texture>
) {
	for (const key of DISPOSABLE_TEXTURE_KEYS) {
		const value = (material as unknown as Record<string, unknown>)[key]

		if (value instanceof THREE.Texture && !preserved.has(value)) {
			target.add(value)
		}
	}
}

function disposeInstanceResources(root: THREE_TYPES.Object3D) {
	const materials = new Set<THREE_TYPES.Material>()

	const textures = new Set<THREE_TYPES.Texture>()

	const preserved = new Set<THREE_TYPES.Texture>()

	if (flakeMap) {
		preserved.add(flakeMap)
	}

	root.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			const meshMaterials = Array.isArray(child.material)
				? child.material
				: [child.material]

			for (const material of meshMaterials) {
				if (!material) {
					continue
				}

				materials.add(material)

				collectMaterialTextures(material, textures, preserved)
			}
		}
	})

	for (const material of materials) {
		material.dispose()
	}

	for (const texture of textures) {
		texture.dispose()
	}
}

function teardownInteractionListeners() {
	reducedMotionQuery?.removeEventListener("change", handleReducedMotionChange)

	touchQuery?.removeEventListener("change", handleTouchChange)

	dprQuery?.removeEventListener("change", handleDprChange)

	document.removeEventListener("visibilitychange", handleVisibilityChange)

	if (lenis) {
		lenis.off("scroll", refreshSceneRect)
	} else {
		window.removeEventListener("scroll", refreshSceneRect)
	}

	if (sceneEl) {
		sceneEl.removeEventListener("pointerenter", onWrapperPointerActivity)

		sceneEl.removeEventListener("pointermove", onWrapperPointerActivity)

		sceneEl.removeEventListener("pointerleave", onWrapperPointerLeave)

		sceneEl.removeEventListener("pointerdown", onWrapperPointerDown)

		sceneEl.removeEventListener("pointermove", onWrapperPointerDragMove)

		sceneEl.removeEventListener("pointerup", onWrapperPointerDragEnd)

		sceneEl.removeEventListener("pointercancel", onWrapperPointerDragEnd)
	}

	containerResizeObserver?.disconnect()
	containerResizeObserver = null

	if (resizeRafId) {
		cancelAnimationFrame(resizeRafId)
		resizeRafId = 0
	}

	visibilityObserver?.disconnect()
	visibilityObserver = null
}

function teardownRenderResources() {
	stopLoop()

	if (renderer?.domElement) {
		renderer.domElement.removeEventListener("webglcontextlost", onContextLost)

		renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored)

		renderer.domElement.remove()
	}

	if (scene) {
		disposeInstanceResources(scene)

		scene.clear()
	}

	if (flakeMap) {
		releaseFlakeNormalMap()

		flakeMap = null
	}

	envTexture?.dispose()
	envTexture = null

	renderer?.dispose()
	renderer?.forceContextLoss()

	unregisterActiveRenderer()

	logo = null
	maskUniforms = null

	metalMeshes.length = 0

	;[bodyColorGroup, faceColorGroup].forEach((group) => {
		group.tweens.forEach((tween) => tween.kill())
		group.tweens = []
		group.entries = []
		group.targetCss = null
	})

	isColorActive = false

	hasMaskTarget = false
	revealProgress = 0
	revealTarget = 0
	introActive = false
	introElapsedMs = 0

	if (assetsAcquired) {
		releaseLogoSceneAssets(props.modelUrl)

		assetsAcquired = false
	}
}

const resolvedTriggerEl = computed(() => props.triggerEl ?? wrapper.value)

function setupScrollEffects(triggerElement: HTMLElement, wrapperElement: HTMLElement) {
	const hasColorProp = !!props.bodyColor || !!props.faceColor

	if (!hasColorProp && !props.scrollReveal) {
		return null
	}

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	const createdScrollTriggers: ReturnType<typeof ScrollTrigger.create>[] = []

	let riseTween: ReturnType<typeof gsap.fromTo> | null = null

	if (hasColorProp) {
		bodyColorGroup.targetCss = props.bodyColor ? resolveCssColor(props.bodyColor) : null
		faceColorGroup.targetCss = props.faceColor ? resolveCssColor(props.faceColor) : null

		createdScrollTriggers.push(
			ScrollTrigger.create({
				trigger: triggerElement,
				start: "top bottom",
				onEnter: () => setColorActive(true, !reduceMotion),
				onEnterBack: () => setColorActive(true, !reduceMotion),
				onLeaveBack: () => setColorActive(false, !reduceMotion),
			})
		)
	}

	if (props.scrollReveal && !reduceMotion) {
		riseTween = gsap.fromTo(
			wrapperElement,
			{ yPercent: 140, opacity: 0.85 },
			{
				yPercent: 0,
				opacity: 1,
				ease: "power2.out",
				scrollTrigger: {
					trigger: triggerElement,
					start: "top bottom",
					end: "center center",
					scrub: 1,
				},
			}
		)
	}

	return () => {
		createdScrollTriggers.forEach((trigger) => trigger.kill())

		riseTween?.scrollTrigger?.kill()
		riseTween?.kill()

		if (hasColorProp) {
			bodyColorGroup.targetCss = null
			faceColorGroup.targetCss = null
			setColorActive(false, false)
		}

		if (props.scrollReveal) {
			gsap.set(wrapperElement, { clearProps: "transform,opacity" })
		}
	}
}

useGsapContext(() => {
	let cleanup: (() => void) | null = null

	watch(
		[resolvedTriggerEl, wrapper],
		([el, wrapperEl]) => {
			cleanup?.()
			cleanup = null

			if (!el || !wrapperEl) {
				return
			}

			cleanup = setupScrollEffects(el, wrapperEl)
		},
		{ immediate: true, flush: "post" }
	)

	return () => {
		cleanup?.()
		cleanup = null
	}
}, wrapper)

onMounted(async () => {
	await nextTick()

	scheduleIdleTask(() => {
		void tryInit(container.value, wrapper.value)
	})
})

watch([container, wrapper], ([element, wrap]) => {
	void tryInit(element, wrap)
})

onBeforeUnmount(() => {
	isUnmounted = true

	disposeInstance()
})
</script>

<style scoped>
.logo-scene-wrapper {
	position: relative;

	width: 100%;
	height: 100%;

	display: flex;
	align-items: center;
	justify-content: center;

	touch-action: pan-y;
	user-select: none;
	-webkit-user-select: none;

	pointer-events: none;
}

.logo-scene {
	position: relative;

	z-index: 1;

	width: var(--logo-scene-width, min(98vw, 95svh, 68rem));
	max-width: 100%;

	aspect-ratio: 1 / 1;

	flex: 0 0 auto;

	background: transparent;

	pointer-events: auto;
}

.logo-scene :deep(.logo-scene__canvas) {
	display: block;

	width: 100% !important;
	height: 100% !important;

	background: transparent;

	pointer-events: none;

	opacity: 0;

	transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1);
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
