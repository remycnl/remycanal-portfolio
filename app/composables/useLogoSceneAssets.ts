import type * as THREE_TYPES from "three"

interface LogoAssets {
	THREE: typeof import("three")
	gltfScene: THREE_TYPES.Object3D
}

interface AssetCacheEntry {
	promise: Promise<LogoAssets>
	refCount: number
}

const assetCache = new Map<string, AssetCacheEntry>()

const roomEnvironmentModulePromise =
	import("three/examples/jsm/environments/RoomEnvironment.js")

export function acquireLogoSceneAssets(modelUrl: string): Promise<LogoAssets> {
	let entry = assetCache.get(modelUrl)

	if (!entry) {
		entry = {
			promise: loadAssets(modelUrl),
			refCount: 0,
		}

		assetCache.set(modelUrl, entry)
	}

	entry.refCount++

	return entry.promise
}

export function releaseLogoSceneAssets(modelUrl: string) {
	const entry = assetCache.get(modelUrl)

	if (!entry) {
		return
	}

	entry.refCount = Math.max(0, entry.refCount - 1)

	if (entry.refCount > 0) {
		return
	}

	assetCache.delete(modelUrl)

	void entry.promise.then((assets) => {
		assets.gltfScene.traverse((child) => {
			if (child instanceof assets.THREE.Mesh) {
				child.geometry.dispose()
			}
		})
	})
}

export async function bakeEnvironmentTexture(
	THREEInstance: typeof import("three"),
	renderer: THREE_TYPES.WebGLRenderer
): Promise<THREE_TYPES.Texture> {
	const { RoomEnvironment } = await roomEnvironmentModulePromise

	const pmrem = new THREEInstance.PMREMGenerator(renderer)

	const envScene = new RoomEnvironment()

	const envTexture = pmrem.fromScene(envScene, 0.02).texture

	envScene.clear()

	pmrem.dispose()

	return envTexture
}

async function loadAssets(modelUrl: string): Promise<LogoAssets> {
	const [THREE, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
		import("three"),
		import("three/examples/jsm/loaders/GLTFLoader.js"),
		import("three/examples/jsm/libs/meshopt_decoder.module.js"),
	])

	const loader = new GLTFLoader()

	loader.setMeshoptDecoder(MeshoptDecoder)

	const gltfScene = await new Promise<THREE_TYPES.Object3D>((resolve, reject) => {
		loader.load(
			modelUrl,
			(gltf) => resolve(gltf.scene),
			undefined,
			(error) => reject(error)
		)
	})

	return { THREE, gltfScene }
}
