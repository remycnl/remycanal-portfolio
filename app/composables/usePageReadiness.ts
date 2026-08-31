export function usePageReadiness(): Ref<boolean> {
	const isPageReady = useState("app-loading-ready", () => false)
	const hasStarted = useState("app-loading-ready-started", () => false)

	if (import.meta.client && !hasStarted.value) {
		hasStarted.value = true

		let interactiveReady = document.readyState !== "loading"
		let loadReady = document.readyState === "complete"

		const evaluate = () => {
			isPageReady.value = interactiveReady && loadReady
		}

		if (!interactiveReady) {
			document.addEventListener(
				"readystatechange",
				() => {
					if (document.readyState !== "loading") {
						interactiveReady = true
						evaluate()
					}
				},
				{ once: true },
			)
		}

		if (!loadReady) {
			window.addEventListener(
				"load",
				() => {
					loadReady = true
					evaluate()
				},
				{ once: true },
			)
		}

		evaluate()
	}

	return isPageReady
}