const LOADER_EXIT_DURATION_MS = 400

export async function waitForAppReady(): Promise<void> {
	const isLoading = useState("app-loading", () => true)

	if (!isLoading.value) return

	await new Promise<void>((resolve) => {
		const stop = watch(isLoading, (loading) => {
			if (!loading) {
				stop()
				resolve()
			}
		})
	})

	await new Promise((resolve) => setTimeout(resolve, LOADER_EXIT_DURATION_MS))
}
