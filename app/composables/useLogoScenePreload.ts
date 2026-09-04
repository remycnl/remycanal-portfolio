import { acquireLogoSceneAssets } from "@/composables/useLogoSceneAssets"
import { DEFAULT_LOGO_MODEL_URL } from "@/constants/logo"

interface IdleCallbackWindow {
	requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
}

let preloadStarted = false

function scheduleIdlePreload(task: () => void) {
	const idleWindow = window as unknown as IdleCallbackWindow

	if (typeof idleWindow.requestIdleCallback === "function") {
		idleWindow.requestIdleCallback(task, { timeout: 1500 })
	} else {
		window.setTimeout(task, 1)
	}
}

export function useLogoScenePreload() {
	const isReady = useState("logo-scene-preload-ready", () => false)

	if (import.meta.client && !preloadStarted) {
		preloadStarted = true

		scheduleIdlePreload(() => {
			acquireLogoSceneAssets(DEFAULT_LOGO_MODEL_URL)
				.then(() => {
					isReady.value = true
				})
				.catch((error) => {
					console.error(
						"[useLogoScenePreload] Échec du préchargement des assets du logo.",
						error
					)

					isReady.value = true
				})
		})
	}

	return isReady
}
