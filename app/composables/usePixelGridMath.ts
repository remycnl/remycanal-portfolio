import type { ResolvedPixelWipeDirection } from "@/types/pixel-wipe"

export function axisNorm(
	direction: Exclude<ResolvedPixelWipeDirection, "corners">,
	col: number,
	row: number,
	cols: number,
	rows: number
): number {
	switch (direction) {
		case "left":
			return col / Math.max(cols - 1, 1)
		case "right":
			return 1 - col / Math.max(cols - 1, 1)
		case "top":
			return row / Math.max(rows - 1, 1)
		case "bottom":
			return 1 - row / Math.max(rows - 1, 1)
		default: {
			const _exhaustive: never = direction
			return _exhaustive
		}
	}
}

export function cornerNorm(col: number, row: number, cols: number, rows: number) {
	const maxDist = Math.hypot((cols - 1) / 2, (rows - 1) / 2) || 1
	const d = Math.min(
		Math.hypot(col, row),
		Math.hypot(cols - 1 - col, row),
		Math.hypot(col, rows - 1 - row),
		Math.hypot(cols - 1 - col, rows - 1 - row)
	)
	return Math.min(d / maxDist, 1)
}

export function directionNorm(
	direction: ResolvedPixelWipeDirection,
	col: number,
	row: number,
	cols: number,
	rows: number
): number {
	return direction === "corners"
		? cornerNorm(col, row, cols, rows)
		: axisNorm(direction, col, row, cols, rows)
}

export function expSmoothingFactor(rate: number, delta: number) {
	return 1 - Math.exp(-rate * delta)
}
