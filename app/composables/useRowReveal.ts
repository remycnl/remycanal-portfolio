import { createRevealTrigger } from "@/utils/revealTrigger"

/** Where a card stands in the reveal sequence of its grid. */
export interface RevealSlot {
	/** Resolves when the row of the card may reveal. */
	opened: Promise<void>
	/**
	 * To call once the card is ready to play. Resolves at the card's turn in its row: at least
	 * `STAGGER_MS` after the previous card of the row started, so the cards appear one by one
	 * whatever the loading time of their images.
	 */
	turn: () => Promise<void>
}

interface Row {
	opened: Promise<void>
	/** Earliest time (performance.now) at which the next card of the row may start. */
	nextFree: number
}

const STAGGER_MS = 120

const READY: RevealSlot = {
	opened: Promise.resolve(),
	turn: () => Promise.resolve(),
}

/**
 * Reveals the cards of a grid one row at a time: a row opens when its first card reaches the
 * reveal point, then its cards play one after the other, each as soon as its own image is ready.
 * Rows are read from the real layout, so they follow the breakpoints. Cards must be direct
 * children of the grid, marked `data-card`.
 */
export function useRowReveal() {
	const rows = new WeakMap<HTMLElement, Row>()
	const stops: Array<() => void> = []

	let snapshot = new Map<HTMLElement, RevealSlot>()
	let frame = 0

	function rowOf(leader: HTMLElement): Row {
		const known = rows.get(leader)
		if (known) return known

		let open!: () => void
		const opened = new Promise<void>((resolve) => {
			open = resolve
		})
		const { ScrollTrigger } = useGsap()
		stops.push(createRevealTrigger(ScrollTrigger, leader, open))

		const row: Row = { opened, nextFree: 0 }
		rows.set(leader, row)
		return row
	}

	function takeTurn(row: Row): Promise<void> {
		const now = performance.now()
		const start = Math.max(now, row.nextFree)
		row.nextFree = start + STAGGER_MS
		return start > now
			? new Promise((resolve) => setTimeout(resolve, start - now))
			: Promise.resolve()
	}

	/**
	 * Reads the whole grid in one pass (all the layout reads happen before the cards write anything)
	 * and keeps the result for the rest of the frame.
	 */
	function measure(container: HTMLElement) {
		const cards = Array.from(
			container.querySelectorAll<HTMLElement>(":scope > [data-card]")
		)
		const rects = cards.map((card) => card.getBoundingClientRect())
		const next = new Map<HTMLElement, RevealSlot>()

		let leader = 0

		cards.forEach((card, i) => {
			if (i > 0 && rects[i]!.top >= rects[leader]!.bottom) leader = i
			const row = rowOf(cards[leader]!)
			next.set(card, { opened: row.opened, turn: () => takeTurn(row) })
		})

		snapshot = next
		frame ||= requestAnimationFrame(() => {
			frame = 0
			snapshot = new Map()
		})
	}

	/** Call once the layout is stable (the text-reveal directive does it after the fonts). */
	function slotFor(card: HTMLElement): RevealSlot {
		let slot = snapshot.get(card)
		if (!slot && card.parentElement) {
			measure(card.parentElement)
			slot = snapshot.get(card)
		}
		return slot ?? READY
	}

	onScopeDispose(() => {
		if (frame) cancelAnimationFrame(frame)
		for (const stop of stops) stop()
		stops.length = 0
		snapshot = new Map()
	})

	return { slotFor }
}