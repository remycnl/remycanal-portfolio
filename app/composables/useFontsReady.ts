import type { Ref } from "vue"

export function useFontsReady(): Ref<boolean> {
	return useState<boolean>("app-fonts-ready", () => false)
}

export function waitForFontsReady(ready: Ref<boolean>, timeoutMs = 3000): Promise<void> {
	if (ready.value) return Promise.resolve()

	return new Promise((resolve) => {
		const timer = setTimeout(done, timeoutMs)
		const stop = watch(ready, (value) => {
			if (value) done()
		})

		function done() {
			clearTimeout(timer)
			stop()
			resolve()
		}
	})
}
