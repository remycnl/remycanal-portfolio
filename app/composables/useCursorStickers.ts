import type { MaybeRef, Ref } from "vue"

interface CursorStickersOptions {
	/** URLs des stickers, utilisées en rotation. */
	sources: readonly string[]
	/** Largeur d'un sticker (px). */
	size?: number
	/** Distance minimale (px) parcourue par la souris entre deux pops. */
	distance?: number
	/** Délai minimal (ms) entre deux pops. */
	interval?: number
	/** Durée de vie (s) avant le dépop. */
	lifetime?: number
	/** Nombre maximum de stickers affichés en même temps. */
	max?: number
}

export function useCursorStickers(
	zone: MaybeRef<HTMLElement | null>,
	layer: MaybeRef<HTMLElement | null>,
	enabled: Ref<boolean>,
	options: CursorStickersOptions
) {
	const { gsap } = useGsap()

	const {
		sources,
		size = 200,
		distance = 150,
		interval = 100,
		lifetime = 4,
		max = 10,
	} = options

	interface Live {
		el: HTMLImageElement
		tl: gsap.core.Timeline
	}

	const pool: HTMLImageElement[] = []
	const live: Live[] = []

	let index = 0
	let lastX = 0
	let lastY = 0
	let lastTime = 0
	let hasLast = false
	let attached = false
	let preloaded = false
	let zoneEl: HTMLElement | null = null
	let layerEl: HTMLElement | null = null

	function acquire(): HTMLImageElement {
		const known = pool.pop()
		if (known) return known

		const img = new Image()
		img.alt = ""
		img.draggable = false
		img.decoding = "async"
		img.className = "pointer-events-none absolute top-0 left-0 select-none"
		img.style.width = `${size}px`
		return img
	}

	function release(item: Live) {
		const i = live.indexOf(item)
		if (i !== -1) live.splice(i, 1)
		item.tl.kill()
		item.el.remove()
		item.el.style.willChange = "auto"
		pool.push(item.el)
	}

	function spawn(x: number, y: number, dirX: number, dirY: number) {
		if (!layerEl) return

		if (live.length >= max) {
			const oldest = live.shift()!
			oldest.tl.kill()
			gsap.to(oldest.el, {
				scale: 0,
				opacity: 0,
				duration: 0.25,
				ease: "power2.in",
				overwrite: true,
				onComplete: () => release(oldest),
			})
		}

		const el = acquire()
		el.src = sources[index++ % sources.length]!
		layerEl.append(el)

		const rotation = gsap.utils.random(-22, 22)
		const driftX = dirX * gsap.utils.random(30, 70)
		const driftY = dirY * gsap.utils.random(30, 70)

		gsap.set(el, {
			xPercent: -50,
			yPercent: -50,
			x,
			y: y + 12,
			scale: 0,
			opacity: 0,
			rotation: rotation - 35,
			force3D: true,
		})
		el.style.willChange = "transform, opacity"

		const item = { el } as Live

		item.tl = gsap
			.timeline({ onComplete: () => release(item) })
			.to(el, { opacity: 1, duration: 0.18, ease: "power1.out" }, 0)
			.to(el, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.5)" }, 0)
			.to(el, { rotation, duration: 0.9, ease: "elastic.out(1, 0.6)" }, 0)
			.to(el, { x: x + driftX, y: y + driftY, duration: 1.4, ease: "power3.out" }, 0)
			.to(
				el,
				{
					scale: 0,
					opacity: 0,
					rotation: rotation + gsap.utils.random(-30, 30),
					duration: 0.5,
					ease: "back.in(1.8)",
				},
				lifetime
			)

		live.push(item)
	}

	function onMove(event: PointerEvent) {
		if (event.pointerType !== "mouse" || !layerEl) return

		const now = performance.now()

		if (!hasLast) {
			hasLast = true
			lastX = event.clientX
			lastY = event.clientY
			lastTime = now
			return
		}

		const dx = event.clientX - lastX
		const dy = event.clientY - lastY
		const dist = Math.hypot(dx, dy)

		if (dist < distance || now - lastTime < interval) return

		const rect = layerEl.getBoundingClientRect()
		spawn(event.clientX - rect.left, event.clientY - rect.top, dx / dist, dy / dist)

		lastX = event.clientX
		lastY = event.clientY
		lastTime = now
	}

	function onLeave() {
		hasLast = false
	}

	function attach() {
		if (attached) return

		zoneEl = unref(zone)
		layerEl = unref(layer)
		if (!zoneEl || !layerEl || !sources.length) return
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		attached = true

		if (!preloaded) {
			preloaded = true
			for (const src of sources) new Image().src = src
		}

		zoneEl.addEventListener("pointermove", onMove)
		zoneEl.addEventListener("pointerleave", onLeave)
	}

	function detach() {
		hasLast = false

		if (attached) {
			attached = false
			zoneEl?.removeEventListener("pointermove", onMove)
			zoneEl?.removeEventListener("pointerleave", onLeave)
		}

		for (const item of [...live]) release(item)
	}

	// Réactivité dans le setup (et non dans un contexte GSAP) : le watcher suit le cycle de vie du composant.
	let mounted = false

	watch(enabled, (on) => {
		if (!mounted) return
		if (on) attach()
		else detach()
	})

	onMounted(() => {
		mounted = true
		if (enabled.value) attach()
	})

	onBeforeUnmount(() => {
		mounted = false
		detach()
		pool.length = 0
	})
}
