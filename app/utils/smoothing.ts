export interface SpringState {
	position: number
	velocity: number
}

export const expSmoothingFactor = (rate: number, delta: number) =>
	1 - Math.exp(-rate * delta)

export const approach = (
	current: number,
	target: number,
	factor: number,
	epsilon = 0.0005
) => {
	const next = current + (target - current) * factor
	return Math.abs(target - next) < epsilon ? target : next
}

export const stepSpring = (
	state: SpringState,
	target: number,
	omega: number,
	delta: number
) => {
	const offset = state.position - target
	const decay = Math.exp(-omega * delta)
	const carry = state.velocity + omega * offset
	state.position = target + (offset + carry * delta) * decay
	state.velocity = (state.velocity - omega * carry * delta) * decay
}

const resistOverflow = (overflow: number, limit: number) =>
	limit * (1 - 1 / ((overflow * 0.55) / limit + 1))

export const rubberBand = (value: number, min: number, max: number, limit: number) => {
	if (value < min) return min - resistOverflow(min - value, limit)
	if (value > max) return max + resistOverflow(value - max, limit)
	return value
}
