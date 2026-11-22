import {
	acquireLogoSceneAssets,
	releaseLogoSceneAssets,
} from "@/composables/useLogoSceneAssets"
import { DEFAULT_LOGO_MODEL_URL } from "@/constants/logo"

interface IdleCallbackWindow {
	requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
	cancelIdleCallback?: (handle: number) => void
}

interface LogoScenePreloadOptions {
	/**
	 * true  : l'asset reste en cache toute la session (comportement historique,
	 *         par défaut pour le logo de la home).
	 * false : la référence est relâchée quand le composant / la page appelante
	 *         est démonté, et le GLB est libéré de la mémoire si plus aucune
	 *         scène ne l'utilise (par défaut pour tous les autres modèles).
	 */
	keepAlive?: boolean
}

const keepAlivePreloads = new Set<string>()

function scheduleIdlePreload(task: () => void): () => void {
	const idleWindow = window as unknown as IdleCallbackWindow

	if (typeof idleWindow.requestIdleCallback === "function") {
		const handle = idleWindow.requestIdleCallback(task, { timeout: 1500 })

		return () => idleWindow.cancelIdleCallback?.(handle)
	}

	const handle = window.setTimeout(task, 1)

	return () => window.clearTimeout(handle)
}

export function useLogoScenePreload(
	modelUrl: string = DEFAULT_LOGO_MODEL_URL,
	options: LogoScenePreloadOptions = {}
) {
	const keepAlive = options.keepAlive ?? modelUrl === DEFAULT_LOGO_MODEL_URL

	const stateKey =
		modelUrl === DEFAULT_LOGO_MODEL_URL
			? "logo-scene-preload-ready"
			: `logo-scene-preload-ready:${modelUrl}`

	const isReady = useState(stateKey, () => false)

	if (!import.meta.client) {
		return isReady
	}

	if (keepAlive) {
		if (keepAlivePreloads.has(modelUrl)) {
			return isReady
		}

		keepAlivePreloads.add(modelUrl)

		scheduleIdlePreload(() => {
			acquireLogoSceneAssets(modelUrl)
				.then(() => {
					isReady.value = true
				})
				.catch((error) => {
					console.error("[useLogoScenePreload] Échec du préchargement.", modelUrl, error)

					isReady.value = true
				})
		})

		return isReady
	}

	let acquired = false
	let disposed = false

	const cancelIdle = scheduleIdlePreload(() => {
		if (disposed) {
			return
		}

		acquired = true

		acquireLogoSceneAssets(modelUrl)
			.then(() => {
				isReady.value = true
			})
			.catch((error) => {
				// L'entrée du cache est supprimée par acquireLogoSceneAssets en cas d'échec :
				// il n'y a donc plus de référence à relâcher.
				acquired = false

				console.error("[useLogoScenePreload] Échec du préchargement.", modelUrl, error)

				isReady.value = true
			})
	})

	if (getCurrentScope()) {
		onScopeDispose(() => {
			disposed = true

			cancelIdle()

			if (acquired) {
				acquired = false

				releaseLogoSceneAssets(modelUrl)
			}

			isReady.value = false
		})
	}

	return isReady
}
