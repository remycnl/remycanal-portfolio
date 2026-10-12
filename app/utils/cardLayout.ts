export interface CardCell<T> {
	item: T
	/** Grid classes of the card. */
	class: string
}

const PAIR_ROW_SIZE = 2
const TRIPLE_ROW_SIZE = 3

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

function pickRowSlot(
	rows: readonly (readonly string[])[],
	index: number,
	rowSize: number
): string {
	const row = rows[Math.floor(index / rowSize) % rows.length]
	return row?.[index % rowSize] ?? ""
}

export function buildCardCells<T>(items: readonly T[]): CardCell<T>[] {
	return items.map((item, index) => ({
		item,
		class: [
			pickSlot(MOBILE_SLOTS, index),
			RESET_START,
			pickRowSlot(PAIR_ROWS, index, PAIR_ROW_SIZE),
			pickRowSlot(TRIPLE_ROWS, index, TRIPLE_ROW_SIZE),
		].join(" "),
	}))
}
