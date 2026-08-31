export function usePageTransitionActive() {
	return useState<boolean>("page-transition-active", () => false)
}

export async function waitForPageTransition() {
	if (import.meta.server) return

	const active = usePageTransitionActive()
	if (!active.value) return

	await new Promise<void>((resolve) => {
		const stop = watch(active, (value) => {
			if (value) return
			stop()
			resolve()
		})
	})
}
