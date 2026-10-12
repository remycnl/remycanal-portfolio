import type { ScrollTriggerInstance } from "@/composables/useGsap"

const FAST_SCROLL = 900
const FAST_LEAD = 140

/** Distance (px) above the bottom of the viewport at which an element starts revealing. */
function getStartOffset(): number {
	const { innerWidth: w, innerHeight: h } = window
	const ratio = w < 640 ? 0.12 : w < 1024 ? 0.16 : 0.2
	return Math.round(Math.min(Math.max(h * ratio, 100), 320))
}

/**
 * Calls `onReveal` once, when `el` enters the viewport (or has been scrolled past).
 * A second, earlier trigger anticipates the reveal when the scroll is fast.
 * As soon as one of them fires, both are killed.
 * Returns a function that kills both triggers.
 */
export function createRevealTrigger(
	ScrollTrigger: ScrollTriggerInstance,
	el: HTMLElement,
	onReveal: () => void,
	start?: string
): () => void {
	const triggers: Array<{ kill: () => void }> = []
	let done = false

	const kill = () => {
		for (const trigger of triggers) trigger.kill()
		triggers.length = 0
	}

	const reveal = () => {
		if (done) return
		done = true
		kill()
		onReveal()
	}

	triggers.push(
		ScrollTrigger.create({
			trigger: el,
			start: () => start ?? `top bottom-=${getStartOffset()}`,
			once: true,
			onEnter: reveal,
			onLeave: reveal,
		})
	)

	if (!start) {
		triggers.push(
			ScrollTrigger.create({
				trigger: el,
				start: () => `top bottom-=${Math.max(getStartOffset() - FAST_LEAD, 40)}`,
				once: true,
				onEnter: (self) => {
					if (Math.abs(self.getVelocity()) > FAST_SCROLL) reveal()
				},
			})
		)
	}

	// A trigger can fire synchronously while being created (element already scrolled past).
	if (done) kill()

	return kill
}