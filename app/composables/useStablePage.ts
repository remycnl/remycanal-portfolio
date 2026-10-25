function nextFrame(): Promise<number> {
	return new Promise((resolve) => requestAnimationFrame(resolve))
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Résout une fois que `frames` frames ont été présentées à l'écran.
 *
 * À appeler entre « la dernière frame d'une vague est dessinée » et « du travail lourd démarre
 * (changement de page, intros, pop des stickers…) » : sans ça, le travail lourd s'exécute dans la
 * même tâche que le dernier dessin, le navigateur ne peint qu'après, et l'écran reste figé sur
 * une image incomplète pendant toute la durée du travail.
 */
export async function waitForPaint(frames = 2): Promise<void> {
	if (import.meta.server) return
	for (let i = 0; i < frames; i++) await nextFrame()
}

/** Décode les images actuellement visibles pour qu'elles n'apparaissent pas en plein reveal. */
async function decodeVisibleImages(): Promise<void> {
	const viewportHeight = window.innerHeight

	const pending = Array.from(document.images)
		.filter((img) => {
			const rect = img.getBoundingClientRect()
			return rect.width > 0 && rect.bottom > 0 && rect.top < viewportHeight
		})
		.map((img) => img.decode().catch(() => undefined))

	await Promise.all(pending)
}

/**
 * Attend `quietFrames` frames consécutives de durée normale.
 * Le seuil s'adapte à l'écran (60 Hz, 120 Hz, mode économie d'énergie à 30 fps).
 */
async function waitForQuietFrames(quietFrames: number, budgetMs: number): Promise<void> {
	const deadline = performance.now() + budgetMs
	let last = await nextFrame()
	let baseline = Infinity
	let quiet = 0
	let seen = 0

	while (performance.now() < deadline) {
		const now = await nextFrame()
		const delta = now - last
		last = now
		seen++

		if (delta > 4) baseline = Math.min(baseline, delta)

		// Les deux premières frames servent seulement à calibrer le seuil.
		if (seen <= 2) continue

		quiet = delta <= Math.max(24, baseline * 1.5) ? quiet + 1 : 0
		if (quiet >= quietFrames) return
	}
}

/**
 * À appeler pendant que l'écran est encore couvert, juste avant de lancer le reveal :
 * laisse la nouvelle page finir son montage (layout, décodage des images visibles, tâches
 * différées) pour que la vague démarre sur un thread principal calme.
 * Borné par `timeoutMs` : au pire, le reveal part quand même.
 */
export async function waitForStablePage(
	options: { timeoutMs?: number; quietFrames?: number } = {}
): Promise<void> {
	if (import.meta.server) return

	const { timeoutMs = 700, quietFrames = 4 } = options
	const deadline = performance.now() + timeoutMs
	const remaining = () => Math.max(deadline - performance.now(), 0)

	await Promise.race([decodeVisibleImages(), wait(Math.min(400, remaining() * 0.6))])
	await waitForQuietFrames(quietFrames, remaining())
}
