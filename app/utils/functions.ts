export function expSmoothingFactor(rate: number, delta: number): number {
	return 1 - Math.exp(-rate * delta)
}