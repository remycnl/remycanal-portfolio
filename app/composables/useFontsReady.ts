import type { Ref } from "vue"
import { APP_FONTS } from "@/constants/fonts"

export function useFontsReady(): Ref<boolean> {
	const isReady = useState("app-fonts-ready", () => false)
	const hasStarted = useState("app-fonts-ready-started", () => false)

	if (import.meta.client && !hasStarted.value) {
		hasStarted.value = true

		if (!("fonts" in document)) {
			isReady.value = true
		} else {
			Promise.all(
				APP_FONTS.map((font) =>
					document.fonts.load(font.loadDescriptor).catch((error: unknown) => {
						console.error(
							`[useFontsReady] Échec du chargement de la police ${font.family} :`,
							error
						)
					})
				)
			).then(() => {
				isReady.value = true
			})
		}
	}

	return isReady
}
