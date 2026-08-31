import { acquireLogoSceneAssets } from "@/composables/useLogoSceneAssets"
import { DEFAULT_LOGO_MODEL_URL } from "@/constants/logo"

export function useLogoScenePreload(modelUrl = DEFAULT_LOGO_MODEL_URL) {
	const isReady = useState(`logo-scene-preload-ready:${modelUrl}`, () => false)
	const hasStarted = useState(`logo-scene-preload-started:${modelUrl}`, () => false)

	if (import.meta.client && !hasStarted.value) {
		hasStarted.value = true

		acquireLogoSceneAssets(modelUrl)
			.then(() => {
				isReady.value = true
			})
			.catch((error: unknown) => {
				console.error("[useLogoScenePreload] Échec du préchargement du logo :", error)
				isReady.value = true
			})
	}

	return isReady
}
