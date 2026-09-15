import { APP_FONTS } from "@/constants/fonts"

export default defineNuxtPlugin(() => {
	const isReady = useFontsReady()

	onNuxtReady(() => {
		if (!("fonts" in document)) {
			isReady.value = true
			return
		}

		Promise.all(
			APP_FONTS.map((font) =>
				document.fonts.load(font.loadDescriptor).catch((error: unknown) => {
					console.error(
						`[fonts.client] Échec du chargement de la police ${font.family} :`,
						error
					)
				})
			)
		).then(() => {
			isReady.value = true
		})
	})
})
