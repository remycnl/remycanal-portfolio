/**
 * Resolves once the image is loaded and decoded, and never rejects.
 * Waits for the `load` event first, then decodes off the main thread, so the reveal never starts
 * on an empty image nor decodes in the middle of the animation.
 * `timeout` (ms) is only a safety net: a failed or very slow image must not keep a text hidden.
 * A lazy image that has not loaded yet is switched to eager, so it starts loading right away.
 */
export function decodeImage(
	img: HTMLImageElement | null | undefined,
	timeout = 4000
): Promise<void> {
	if (!img) return Promise.resolve()

	if (!img.complete && img.loading === "lazy") img.loading = "eager"

	return new Promise((resolve) => {
		let settled = false

		const finish = () => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			img.removeEventListener("load", decode)
			img.removeEventListener("error", finish)
			resolve()
		}

		const decode = () => {
			if (typeof img.decode !== "function") return finish()
			img
				.decode()
				.catch(() => {})
				.finally(finish)
		}

		const timer = setTimeout(finish, timeout)

		img.addEventListener("error", finish)
		if (img.complete) decode()
		else img.addEventListener("load", decode, { once: true })
	})
}
