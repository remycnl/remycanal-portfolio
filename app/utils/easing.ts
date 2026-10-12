interface SpringOptions {
	/** 0 < damping < 1. Plus c'est bas, plus ça rebondit (0.5 = un dépassement doux). */
	damping?: number
	/** Durée (s) de l'animation à laquelle ce easing sera appliqué. */
	duration?: number
	/** Nombre de points de la courbe. */
	points?: number
}

/**
 * Generates a CSS `linear()` easing from a damped spring, so the animation can run on the
 * compositor (WAAPI / CSS) with a natural spring feel. Falls back to a simple "back out" curve
 * where `linear()` is not supported.
 */
export function springEasing({
	damping = 0.5,
	duration = 1.4,
	points = 90,
}: SpringOptions = {}): string {
	if (typeof CSS === "undefined" || !CSS.supports("animation-timing-function", "linear(0, 1)")) {
		return "cubic-bezier(0.34, 1.4, 0.64, 1)"
	}

	// The envelope decays to ~0.2% at the end of the duration.
	const decay = 6.2 / duration
	const omega = decay / damping
	const omegaD = omega * Math.sqrt(1 - damping * damping)

	const values: number[] = []
	for (let i = 0; i < points; i++) {
		const t = (i / (points - 1)) * duration
		const x =
			1 - Math.exp(-decay * t) * (Math.cos(omegaD * t) + (decay / omegaD) * Math.sin(omegaD * t))
		values.push(i === points - 1 ? 1 : Number(x.toFixed(4)))
	}

	return `linear(${values.join(", ")})`
}