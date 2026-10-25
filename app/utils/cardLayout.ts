export interface CardCell<T> {
	item: T
	/** Grid classes of the card. */
	class: string
}

interface CardCellsOptions<T> {
	/**
	 * Ratio (width / height) of the media of an item. When provided, the spans of each row are
	 * arranged by format (wide formats on the large slots, tall formats on the small ones). The
	 * editorial rhythm of the rows is always kept: sizes vary whatever the formats are.
	 */
	getRatio?: (item: T) => number | undefined
}

const PAIR_ROW_SIZE = 2
const TRIPLE_ROW_SIZE = 3

const DEFAULT_RATIO = 16 / 9
const MIN_RATIO = 0.5
const MAX_RATIO = 3

const RESET_START = "md:col-start-auto"

const MOBILE_SLOTS: readonly string[] = [
	"col-span-20 col-start-1",
	"col-span-15 col-start-10",
	"col-span-24 col-start-1",
	"col-span-17 col-start-1",
	"col-span-21 col-start-4",
	"col-span-15 col-start-1",
	"col-span-18 col-start-7",
]

const PAIR_ROWS: readonly (readonly string[])[] = [
	["md:col-span-14", "md:col-span-10"],
	["md:col-span-9", "md:col-span-15"],
	["md:col-span-13", "md:col-span-11"],
	["md:col-span-15", "md:col-span-9"],
	["md:col-span-10", "md:col-span-14"],
	["md:col-span-11", "md:col-span-13"],
]

const TRIPLE_ROWS: readonly (readonly string[])[] = [
	["lg:col-span-10", "lg:col-span-6", "lg:col-span-8"],
	["lg:col-span-7", "lg:col-span-11", "lg:col-span-6"],
	["lg:col-span-9", "lg:col-span-7", "lg:col-span-8"],
	["lg:col-span-6", "lg:col-span-8", "lg:col-span-10"],
	["lg:col-span-11", "lg:col-span-6", "lg:col-span-7"],
	["lg:col-span-8", "lg:col-span-9", "lg:col-span-7"],
	["lg:col-span-6", "lg:col-span-10", "lg:col-span-8"],
	["lg:col-span-7", "lg:col-span-6", "lg:col-span-11"],
	["lg:col-span-9", "lg:col-span-8", "lg:col-span-7"],
	["lg:col-span-8", "lg:col-span-10", "lg:col-span-6"],
	["lg:col-span-11", "lg:col-span-7", "lg:col-span-6"],
	["lg:col-span-7", "lg:col-span-8", "lg:col-span-9"],
]

function pickSlot(slots: readonly string[], index: number): string {
	return slots[index % slots.length] ?? ""
}

function spanOf(slot: string): number {
	return Number(/col-span-(\d+)$/.exec(slot)?.[1] ?? 0)
}

/** Close formats (16/9 and 3/2, for instance) count as the same one, so they keep the editorial order. */
function bucketRatio(ratio: number | undefined): number {
	const safe = ratio && Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_RATIO
	return Math.round(Math.min(Math.max(safe, MIN_RATIO), MAX_RATIO) * 3) / 3
}

function permutations(size: number): number[][] {
	if (size <= 1) return [[0]]

	const result: number[][] = []
	for (const order of permutations(size - 1)) {
		for (let at = 0; at <= order.length; at++) {
			result.push([...order.slice(0, at), size - 1, ...order.slice(at)])
		}
	}
	return result
}

/**
 * Places the slots of a row on its items so that the biggest spans go to the widest formats. The
 * original order is kept unless another one is strictly better, so equal formats keep the rhythm.
 */
function arrangeRow(slots: readonly string[], ratios: readonly number[]): string[] {
	const available = slots.slice(0, ratios.length)
	if (available.length < 2) return [...available]

	const score = (order: readonly number[]) =>
		order.reduce(
			(total, slotIndex, itemIndex) =>
				total + spanOf(available[slotIndex] ?? "") * (ratios[itemIndex] ?? 1),
			0
		)

	let best = available.map((_, index) => index)
	let bestScore = score(best)

	for (const order of permutations(available.length)) {
		const orderScore = score(order)
		if (orderScore > bestScore + 1e-6) {
			best = order
			bestScore = orderScore
		}
	}

	return best.map((slotIndex) => available[slotIndex] ?? "")
}

function arrangeRows(
	rows: readonly (readonly string[])[],
	rowSize: number,
	ratios: readonly number[]
): string[] {
	const slots: string[] = []

	for (let start = 0; start < ratios.length; start += rowSize) {
		const pattern = rows[(start / rowSize) % rows.length] ?? []
		slots.push(...arrangeRow(pattern, ratios.slice(start, start + rowSize)))
	}

	return slots
}

export function buildCardCells<T>(
	items: readonly T[],
	{ getRatio }: CardCellsOptions<T> = {}
): CardCell<T>[] {
	const ratios = items.map((item) => bucketRatio(getRatio?.(item)))
	const pairSlots = arrangeRows(PAIR_ROWS, PAIR_ROW_SIZE, ratios)
	const tripleSlots = arrangeRows(TRIPLE_ROWS, TRIPLE_ROW_SIZE, ratios)

	return items.map((item, index) => ({
		item,
		class: [
			pickSlot(MOBILE_SLOTS, index),
			RESET_START,
			pairSlots[index] ?? "",
			tripleSlots[index] ?? "",
		].join(" "),
	}))
}
