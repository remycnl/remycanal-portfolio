/**
 * Géométrie de la grille « Work » : chaque rangée est séparée de la suivante par une
 * diagonale légère, et chaque carte est découpée selon ces diagonales (`clip-path`).
 *
 * Fonctions pures, sans accès au DOM : facile à tester et à réutiliser.
 */

export interface WorkPoint {
	x: number
	y: number
}

export interface WorkCell {
	path: string
	x: number
	y: number
	w: number
	h: number
}

export interface WorkShape {
	/** Variables et `clip-path` de la forme finale, posés sur le lien. */
	link: Record<string, string>
	/** `clip-path` propre au calque image. */
	media: Record<string, string>
}

/** Pente de la diagonale qui précède chaque rangée (la première rangée reste droite). */
const SLOPES = [-0.05, 0.045, -0.05, 0.04, -0.045, 0.05] as const
const RADIUS = 18
const INNER_RADIUS = RADIUS - 4
const LABEL_PAD = 16
const LABEL_MAX = 240
const MEDIA_OUTSET = 1
/** Marge de sécurité ajoutée au calque image pour éviter tout liseré. */
const BLEED_MARGIN = 2
/** Sens de décalage de chaque coin : haut-gauche, haut-droite, bas-droite, bas-gauche. */
const OUTSET_DIRECTIONS: readonly WorkPoint[] = [
	{ x: -1, y: -1 },
	{ x: 1, y: -1 },
	{ x: 1, y: 1 },
	{ x: -1, y: 1 },
]

const round = (n: number, digits = 2) => {
	const factor = 10 ** digits
	return Math.round(n * factor) / factor
}

function direction(from: WorkPoint, to: WorkPoint): WorkPoint {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const length = Math.hypot(dx, dy) || 1
	return { x: dx / length, y: dy / length }
}

/** Polygone aux coins arrondis, au format `path()` de `clip-path`. */
function roundedPath(points: readonly WorkPoint[], radius: number): string {
	const count = points.length
	let path = ""

	for (let i = 0; i < count; i++) {
		const curr = points[i]!
		const prev = points[(i + count - 1) % count]!
		const next = points[(i + 1) % count]!
		const toPrev = direction(curr, prev)
		const toNext = direction(curr, next)
		const dot = Math.min(1, Math.max(-1, toPrev.x * toNext.x + toPrev.y * toNext.y))
		const tan = Math.tan(Math.acos(dot) / 2)

		const limit =
			Math.min(
				Math.hypot(prev.x - curr.x, prev.y - curr.y),
				Math.hypot(next.x - curr.x, next.y - curr.y)
			) / 2
		const cut = Math.min(radius / tan, limit)
		const r = round(cut * tan)

		const startX = round(curr.x + toPrev.x * cut)
		const startY = round(curr.y + toPrev.y * cut)
		const endX = round(curr.x + toNext.x * cut)
		const endY = round(curr.y + toNext.y * cut)

		path += `${i === 0 ? "M" : "L"}${startX} ${startY}A${r} ${r} 0 0 1 ${endX} ${endY}`
	}

	return `${path}Z`
}

/** Regroupe les cellules (dans l'ordre du DOM) par rangée visuelle. */
function groupRows(cells: readonly WorkCell[]): WorkCell[][] {
	const rows: WorkCell[][] = []

	for (const cell of cells) {
		const row = rows.at(-1)
		if (row && Math.abs(row[0]!.y - cell.y) < 1) row.push(cell)
		else rows.push([cell])
	}

	return rows
}

/**
 * Calcule la forme de chaque carte.
 *
 * @param cells Position et taille de chaque cellule, relatives à la grille.
 * @param width Largeur de la grille (sert de centre aux diagonales).
 */
export function computeWorkShapes(
	cells: readonly WorkCell[],
	width: number
): Record<string, WorkShape> {
	const shapes: Record<string, WorkShape> = {}
	const rows = groupRows(cells)
	if (rows.length === 0) return shapes

	const tops = rows.map((row) => Math.min(...row.map((c) => c.y)))
	const bottoms = rows.map((row) => Math.max(...row.map((c) => c.y + c.h)))
	const last = rows.length - 1
	const centerX = width / 2

	const slope = (i: number) => (i <= 0 || i > last ? 0 : SLOPES[(i - 1) % SLOPES.length]!)

	// Les diagonales conservent l'écart (gap) de la grille entre deux rangées :
	// le haut de la rangée k et le bas de la rangée k-1 partagent la même pente.
	const topEdge = (k: number, x: number) => tops[k]! + slope(k) * (x - centerX)
	const bottomEdge = (k: number, x: number) => bottoms[k]! + slope(k + 1) * (x - centerX)

	rows.forEach((row, k) => {
		for (const cell of row) {
			const topAt = (dx: number) => topEdge(k, cell.x + dx) - cell.y
			const bottomAt = (dx: number) => bottomEdge(k, cell.x + dx) - cell.y

			const points: WorkPoint[] = [
				{ x: 0, y: topAt(0) },
				{ x: cell.w, y: topAt(cell.w) },
				{ x: cell.w, y: bottomAt(cell.w) },
				{ x: 0, y: bottomAt(0) },
			]

			const bleedTop = Math.max(0, -Math.min(points[0]!.y, points[1]!.y)) + BLEED_MARGIN
			const bleedBottom =
				Math.max(0, Math.max(points[2]!.y, points[3]!.y) - cell.h) + BLEED_MARGIN
			const mediaHeight = cell.h + bleedTop + bleedBottom

			const mediaPoints = points.map((point, i) => ({
				x: point.x + OUTSET_DIRECTIONS[i]!.x * MEDIA_OUTSET,
				y: point.y + OUTSET_DIRECTIONS[i]!.y * MEDIA_OUTSET + bleedTop,
			}))

			const labelSpan = Math.min(cell.w, LABEL_MAX)
			const tagDrop = Math.max(0, topAt(cell.w - labelSpan), topAt(cell.w))
			const titleRise = Math.max(0, cell.h - Math.min(bottomAt(0), bottomAt(labelSpan)))

			shapes[cell.path] = {
				link: {
					clipPath: `path('${roundedPath(points, RADIUS)}')`,
					"--card-ratio": String(round(cell.w / mediaHeight, 4)),
					"--bleed-top": `${-round(bleedTop)}px`,
					"--bleed-bottom": `${-round(bleedBottom)}px`,
					"--tag-top": `${round(LABEL_PAD + tagDrop)}px`,
					"--title-bottom": `${round(LABEL_PAD + titleRise)}px`,
				},
				media: {
					clipPath: `path('${roundedPath(mediaPoints, INNER_RADIUS + MEDIA_OUTSET)}')`,
				},
			}
		}
	})

	return shapes
}
