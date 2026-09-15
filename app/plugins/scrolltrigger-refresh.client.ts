export default defineNuxtPlugin(() => {
	const { refresh, refreshImmediate } = useScrollRefresh()
	const fontsReady = useFontsReady()

	waitForAppReady().then(() => {
		nextTick(() => refreshImmediate())
	})

	const stopFontsWatch = watch(
		fontsReady,
		(ready) => {
			if (!ready) return

			nextTick(() => refreshImmediate())
			stopFontsWatch()
		},
		{ immediate: true }
	)

	window.addEventListener("load", () => refresh(0), { once: true })

	useViewportResize(() => refresh(150), 150)
})
