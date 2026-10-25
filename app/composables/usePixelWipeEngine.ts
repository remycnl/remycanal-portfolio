import type {
	PixelWipeColors,
	PixelWipeMode,
	ResolvedPixelWipeDirection,
} from "@/types/pixel-wipe"
import type { GsapInstance } from "./useGsap"

interface PixelCell {
	col: number
	row: number
	/** Instant d'allumage de la cellule, en fraction (0 → 1) de la durée totale. */
	start: number
}

interface PixelWipeEngineOptions {
	gsap: GsapInstance
	getCanvas: () => HTMLCanvasElement | null
	getSize: () => { width: number; height: number }
	cellSize?: number | (() => number)
	/**
	 * Durée de vie du voile + liseré accent d'une cellule, en fraction de la durée
	 * totale (temps réel, pas de progression easée). 0.12 ≈ 100 ms sur 860 ms.
	 */
	sparkLife?: number
	spread?: number
	/** Épaisseur du liseré en px CSS (arrondie à un nombre entier de pixels physiques). */
	strokeWidth?: number
	easeName?: string
	/**
	 * Plafond du nombre de pixels du buffer (illimité par défaut). Au-delà, le DPR effectif
	 * est réduit : beaucoup moins de travail pour le GPU, au prix de bords un peu moins nets.
	 */
	maxPixels?: number
}

interface PixelWipeRunOptions {
	mode: PixelWipeMode
	direction: ResolvedPixelWipeDirection
	colors: PixelWipeColors
	duration: number
}

/**
 * Une frame ne peut pas faire avancer l'animation de plus que ça : si le thread
 * principal est bloqué 150 ms, la vague ralentit un instant au lieu de sauter.
 */
const MAX_FRAME_MS = 50
const INVERSE_STEPS = 256

/** Table d'inversion de l'ease (monotone) : y → instant où l'ease atteint y. */
function buildInverseTable(ease: (progress: number) => number) {
	const table: number[] = []
	for (let i = 0; i <= INVERSE_STEPS; i++) {
		const y = i / INVERSE_STEPS
		let lo = 0
		let hi = 1
		for (let step = 0; step < 24; step++) {
			const mid = (lo + hi) / 2
			if (ease(mid) < y) lo = mid
			else hi = mid
		}
		table.push((lo + hi) / 2)
	}
	return table
}

export function createPixelWipeEngine(options: PixelWipeEngineOptions) {
	const {
		gsap,
		getCanvas,
		getSize,
		cellSize = 56,
		sparkLife = 0.12,
		spread = 0.55,
		strokeWidth = 1.5,
		easeName = "sine.inOut",
		maxPixels = Number.POSITIVE_INFINITY,
	} = options

	const inverseTable = buildInverseTable(gsap.parseEase(easeName))

	let ctx: CanvasRenderingContext2D | null = null
	let cells: PixelCell[] = []
	// Bords des colonnes / lignes en pixels PHYSIQUES entiers, partagés entre voisines.
	let xEdges: number[] = []
	let yEdges: number[] = []
	let tickerCb: ((time: number, deltaMs: number) => void) | null = null
	let dpr = 1
	let bufW = 0
	let bufH = 0
	let filled = false
	let running = false
	let pendingResize = false
	let lastBase = "#000000"

	// Rectangle de travail réutilisé (aucune allocation par frame).
	const box = { x: 0, y: 0, w: 0, h: 0 }

	function resolveCellSize() {
		return typeof cellSize === "function" ? cellSize() : cellSize
	}

	function inverseEase(y: number) {
		const pos = Math.min(Math.max(y, 0), 1) * INVERSE_STEPS
		const index = Math.floor(pos)
		const a = inverseTable[index] ?? 0
		const b = inverseTable[Math.min(index + 1, INVERSE_STEPS)] ?? 1
		return a + (b - a) * (pos - index)
	}

	function resize() {
		// Réallouer le canvas en pleine animation l'efface et coûte cher :
		// on diffère jusqu'à la fin du run.
		if (running) {
			pendingResize = true
			return
		}

		const canvas = getCanvas()
		if (!canvas) return

		const { width, height } = getSize()
		if (width <= 0 || height <= 0) return

		// Pas de plafond de DPR par défaut : un buffer plus petit que l'écran serait ré-étiré
		// (bords flous). `maxPixels` permet de plafonner si le GPU est le goulot.
		let nextDpr = window.devicePixelRatio || 1
		const cssArea = width * height
		if (cssArea * nextDpr * nextDpr > maxPixels) nextDpr = Math.sqrt(maxPixels / cssArea)

		const w = Math.round(width * nextDpr)
		const h = Math.round(height * nextDpr)
		if (ctx && w === bufW && h === bufH && nextDpr === dpr) return

		dpr = nextDpr
		bufW = w
		bufH = h
		// La taille CSS est gérée par le CSS (100 % du conteneur), pas ici.
		canvas.width = w
		canvas.height = h
		ctx = canvas.getContext("2d")

		if (filled && ctx) {
			ctx.fillStyle = lastBase
			ctx.fillRect(0, 0, w, h)
		}
	}

	function buildEdges(count: number, step: number, max: number) {
		const edges: number[] = []
		for (let i = 0; i < count; i++) edges.push(Math.min(Math.round(i * step), max))
		edges.push(max)
		return edges
	}

	function buildGrid(direction: ResolvedPixelWipeDirection, invert: boolean) {
		const size = resolveCellSize()
		const { width, height } = getSize()
		const cols = Math.max(Math.ceil(width / size), 1)
		const rows = Math.max(Math.ceil(height / size), 1)

		xEdges = buildEdges(cols, size * dpr, bufW)
		yEdges = buildEdges(rows, size * dpr, bufH)

		const list: PixelCell[] = []
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const norm = directionNorm(direction, col, row, cols, rows)
				const based = invert ? 1 - norm : norm
				const t = Math.min(based * (1 - spread) + Math.random() * spread, 1)
				// Même cadence de vague qu'avant (via l'inverse de l'ease), mais exprimée
				// en temps réel pour que chaque cellule ait la même durée de vie.
				list.push({ col, row, start: inverseEase(t) * (1 - sparkLife) })
			}
		}
		list.sort((a, b) => a.start - b.start)
		cells = list
	}

	function stop() {
		if (tickerCb) {
			gsap.ticker.remove(tickerCb)
			tickerCb = null
		}
	}

	function paintFull(mode: PixelWipeMode, color: string) {
		if (!ctx) return
		if (mode === "in") {
			ctx.fillStyle = color
			ctx.fillRect(0, 0, bufW, bufH)
		} else {
			ctx.clearRect(0, 0, bufW, bufH)
		}
	}

	/** Mesure la cellule (alignée pixel) dans `box`. Renvoie false si elle est vide. */
	function measure(cell: PixelCell | undefined) {
		if (!cell) return false
		const x0 = xEdges[cell.col]
		const x1 = xEdges[cell.col + 1]
		const y0 = yEdges[cell.row]
		const y1 = yEdges[cell.row + 1]
		if (x0 === undefined || x1 === undefined || y0 === undefined || y1 === undefined) {
			return false
		}

		const w = x1 - x0
		const h = y1 - y0
		if (w <= 0 || h <= 0) return false

		box.x = x0
		box.y = y0
		box.w = w
		box.h = h
		return true
	}

	/** Cadre de `bw` pixels en 4 bandes qui ne se chevauchent pas (alpha uniforme aux coins). */
	function fillFrame(c: CanvasRenderingContext2D, bw: number) {
		const { x, y, w, h } = box
		if (w <= bw * 2 || h <= bw * 2) {
			c.fillRect(x, y, w, h)
			return
		}
		c.fillRect(x, y, w, bw)
		c.fillRect(x, y + h - bw, w, bw)
		c.fillRect(x, y + bw, bw, h - bw * 2)
		c.fillRect(x + w - bw, y + bw, bw, h - bw * 2)
	}

	/**
	 * Voile accent + liseré des cellules [from, to[.
	 * Uniquement des fillRect alignés sur des pixels entiers : pas d'antialiasing, et surtout
	 * aucun gros path à rastériser (un path éparpillé sur tout l'écran, avec des trous,
	 * est une opération coûteuse pour le GPU).
	 */
	function paintSpark(
		c: CanvasRenderingContext2D,
		from: number,
		to: number,
		accent: string,
		borderPx: number
	) {
		if (to <= from) return

		c.fillStyle = accent

		c.globalAlpha = 0.4
		for (let i = from; i < to; i++) {
			if (measure(cells[i])) c.fillRect(box.x, box.y, box.w, box.h)
		}

		c.globalAlpha = 0.9
		for (let i = from; i < to; i++) {
			if (measure(cells[i])) fillFrame(c, borderPx)
		}

		c.globalAlpha = 1
	}

	/** Pose définitivement les cellules [from, to[ : fond plein (in) ou effacement (out). */
	function paintSettle(
		c: CanvasRenderingContext2D,
		mode: PixelWipeMode,
		from: number,
		to: number,
		base: string
	) {
		if (to <= from) return

		if (mode === "in") {
			c.fillStyle = base
			for (let i = from; i < to; i++) {
				if (measure(cells[i])) c.fillRect(box.x, box.y, box.w, box.h)
			}
			return
		}

		for (let i = from; i < to; i++) {
			if (measure(cells[i])) c.clearRect(box.x, box.y, box.w, box.h)
		}
	}

	function run(runOptions: PixelWipeRunOptions): Promise<void> {
		return new Promise((resolve) => {
			stop()
			running = false
			resize()

			const c2d = ctx
			if (!c2d) {
				resolve()
				return
			}

			const { mode, direction, colors, duration } = runOptions
			const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
			lastBase = colors.base

			const complete = () => {
				stop()
				running = false
				paintFull(mode, colors.base)
				filled = mode === "in"

				if (pendingResize) {
					pendingResize = false
					resize()
				}
				resolve()
			}

			if (reduceMotion) {
				complete()
				return
			}

			const invert = direction === "corners" && mode === "out"
			buildGrid(direction, invert)

			const borderPx = Math.max(1, Math.round(strokeWidth * dpr))

			// État de départ explicite : transparent pour "in", plein pour "out".
			paintFull(mode === "in" ? "out" : "in", colors.base)

			running = true

			let started = false
			let elapsed = 0
			let sparkPointer = 0
			let settlePointer = 0

			tickerCb = (_time: number, deltaMs: number) => {
				// L'horloge démarre à la PREMIÈRE frame : une tâche longue entre l'appel de run()
				// et le premier rendu ne mange plus le début de l'animation.
				if (started) elapsed += Math.min(deltaMs, MAX_FRAME_MS)
				else started = true

				const raw = Math.min(elapsed / duration, 1)

				const prevSpark = sparkPointer
				const prevSettle = settlePointer

				while (
					sparkPointer < cells.length &&
					(cells[sparkPointer]?.start ?? Infinity) <= raw
				) {
					sparkPointer++
				}
				while (
					settlePointer < cells.length &&
					(cells[settlePointer]?.start ?? Infinity) + sparkLife <= raw
				) {
					settlePointer++
				}

				// Incrémental : on ne dessine QUE ce qui change cette frame.
				// Une cellule qui s'allume et se pose dans la même frame (grosse frame) saute le voile.
				paintSpark(
					c2d,
					Math.max(prevSpark, settlePointer),
					sparkPointer,
					colors.accent,
					borderPx
				)
				paintSettle(c2d, mode, prevSettle, settlePointer, colors.base)

				if (raw >= 1) complete()
			}

			gsap.ticker.add(tickerCb)
		})
	}

	function destroy() {
		stop()
		running = false
	}

	return { resize, run, destroy }
}
