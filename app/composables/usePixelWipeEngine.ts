import type {
	PixelWipeColors,
	PixelWipeMode,
	ResolvedPixelWipeDirection,
} from "@/types/pixel-wipe"
import type { GsapInstance } from "./useGsap"

interface PixelCell {
	x: number
	y: number
	w: number
	h: number
	t: number
}

interface PixelWipeEngineOptions {
	gsap: GsapInstance
	getCanvas: () => HTMLCanvasElement | null
	getSize: () => { width: number; height: number }
	cellSize?: number | (() => number)
	lead?: number
	spread?: number
	strokeInset?: number
	easeName?: string
}

interface PixelWipeRunOptions {
	mode: PixelWipeMode
	direction: ResolvedPixelWipeDirection
	colors: PixelWipeColors
	duration: number
	finish?: "solid" | "textured"
	textureCoverage?: number
}

export function createPixelWipeEngine(options: PixelWipeEngineOptions) {
	const {
		gsap,
		getCanvas,
		getSize,
		cellSize = 56,
		lead = 0.18,
		spread = 0.55,
		strokeInset = 1,
		easeName = "sine.inOut",
	} = options

	let ctx: CanvasRenderingContext2D | null = null
	let cells: PixelCell[] = []
	let ease = gsap.parseEase(easeName)
	let tickerCb: ((time: number) => void) | null = null
	let lastW = 0
	let lastH = 0
	let filled = false
	let lastBase = "#000000"

	function resolveCellSize() {
		return typeof cellSize === "function" ? cellSize() : cellSize
	}

	function resize() {
		const canvas = getCanvas()
		if (!canvas) return

		const { width, height } = getSize()
		if (width <= 0 || height <= 0) return
		if (width === lastW && height === lastH) return
		lastW = width
		lastH = height

		const dpr = Math.min(window.devicePixelRatio || 1, 2)
		canvas.width = width * dpr
		canvas.height = height * dpr
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
		ctx = canvas.getContext("2d")
		ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)

		if (filled && ctx) {
			ctx.fillStyle = lastBase
			ctx.fillRect(0, 0, width, height)
		}
	}

	function buildGrid(direction: ResolvedPixelWipeDirection, invert: boolean) {
		const size = resolveCellSize()
		const { width, height } = getSize()
		const cols = Math.max(Math.ceil(width / size), 1)
		const rows = Math.max(Math.ceil(height / size), 1)
		const maxSpark = 1 - lead
		const list: PixelCell[] = []

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const norm = directionNorm(direction, col, row, cols, rows)
				const based = invert ? 1 - norm : norm
				const t = Math.min(based * (1 - spread) + Math.random() * spread, 1) * maxSpark
				list.push({ x: col * size, y: row * size, w: size, h: size, t })
			}
		}
		list.sort((a, b) => a.t - b.t)
		cells = list
	}

	function stop() {
		if (tickerCb) {
			gsap.ticker.remove(tickerCb)
			tickerCb = null
		}
	}

	function fillAll(mode: PixelWipeMode, color: string) {
		if (!ctx) return
		const { width, height } = getSize()
		if (mode === "in") {
			ctx.fillStyle = color
			ctx.fillRect(0, 0, width, height)
		} else {
			ctx.clearRect(0, 0, width, height)
		}
	}

	function fillInstant(color: string) {
		resize()
		if (!ctx) return
		const { width, height } = getSize()
		ctx.clearRect(0, 0, width, height)
		ctx.fillStyle = color
		ctx.fillRect(0, 0, width, height)
		filled = true
		lastBase = color
	}

	function drawTexture(colors: PixelWipeColors, coverage: number) {
		const c2d = ctx
		if (!c2d) return

		const threshold = 1 - Math.min(Math.max(coverage, 0), 1)
		const residual = cells.filter((cell) => cell.t >= threshold)
		if (!residual.length) return

		c2d.beginPath()
		residual.forEach((cell) => c2d.rect(cell.x, cell.y, cell.w, cell.h))
		c2d.save()
		c2d.globalAlpha = 0.16
		c2d.fillStyle = colors.accent
		c2d.fill()
		c2d.restore()

		c2d.beginPath()
		residual.forEach((cell) => {
			c2d.rect(
				cell.x + strokeInset,
				cell.y + strokeInset,
				cell.w - strokeInset * 2,
				cell.h - strokeInset * 2
			)
		})
		c2d.save()
		c2d.globalAlpha = 0.5
		c2d.lineWidth = 1.5
		c2d.strokeStyle = colors.accent
		c2d.stroke()
		c2d.restore()
	}

	function run(runOptions: PixelWipeRunOptions): Promise<void> {
		return new Promise((resolve) => {
			const c2d = ctx
			if (!c2d) {
				resolve()
				return
			}

			stop()

			const {
				mode,
				direction,
				colors,
				duration,
				finish: finishMode = "solid",
				textureCoverage = 0.4,
			} = runOptions
			const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
			lastBase = colors.base

			const invert = direction === "corners" && mode === "out"
			buildGrid(direction, invert)

			const complete = () => {
				fillAll(mode, colors.base)
				if (mode === "in" && finishMode === "textured") {
					drawTexture(colors, textureCoverage)
				}
				filled = mode === "in"
				stop()
				resolve()
			}

			if (reduceMotion) {
				complete()
				return
			}

			const start = gsap.ticker.time
			let sparkPointer = 0
			let settlePointer = 0

			tickerCb = (time: number) => {
				const raw = Math.min((time - start) / (duration / 1000), 1)
				const progress = ease(raw)

				c2d.beginPath()
				const strokeStart = sparkPointer
				let sparked = false
				while (sparkPointer < cells.length) {
					const cell = cells[sparkPointer]
					if (!cell || cell.t > progress) break
					c2d.rect(cell.x, cell.y, cell.w, cell.h)
					sparkPointer++
					sparked = true
				}
				if (sparked) {
					c2d.save()
					c2d.globalAlpha = 0.4
					c2d.fillStyle = colors.accent
					c2d.fill()
					c2d.restore()

					c2d.beginPath()
					for (let i = strokeStart; i < sparkPointer; i++) {
						const cell = cells[i]
						if (!cell) continue
						c2d.rect(
							cell.x + strokeInset,
							cell.y + strokeInset,
							cell.w - strokeInset * 2,
							cell.h - strokeInset * 2
						)
					}
					c2d.save()
					c2d.globalAlpha = 0.9
					c2d.lineWidth = 1.5
					c2d.strokeStyle = colors.accent
					c2d.stroke()
					c2d.restore()
				}

				c2d.beginPath()
				let settled = false
				while (settlePointer < cells.length) {
					const cell = cells[settlePointer]
					if (!cell || cell.t + lead > progress) break
					c2d.rect(cell.x, cell.y, cell.w, cell.h)
					settlePointer++
					settled = true
				}
				if (settled) {
					if (mode === "in") {
						c2d.fillStyle = colors.base
						c2d.fill()
					} else {
						c2d.save()
						c2d.globalCompositeOperation = "destination-out"
						c2d.fillStyle = "#000"
						c2d.fill()
						c2d.restore()
					}
				}

				if (raw >= 1) complete()
			}

			gsap.ticker.add(tickerCb)
		})
	}

	function destroy() {
		stop()
	}

	return { resize, run, destroy, fillInstant, isFilled: () => filled }
}
