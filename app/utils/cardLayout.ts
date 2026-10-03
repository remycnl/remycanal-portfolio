export type CardLayoutName = "blog" | "templates"

export interface CardCell<T> {
	item: T
	/** Classes de grille de la carte. */
	class: string
	/** Intensité du parallax, entre -1 et 1. */
	depth: number
}

interface Slot {
	class: string
	depth: number
}

/**
 * Placement sur mobile / tablette (en dessous de lg) : une carte par ligne,
 * alternativement ancrée à gauche et à droite.
 * Les classes sont écrites en toutes lettres pour que Tailwind les détecte.
 */
const LEFT = "col-span-10 col-start-1 md:col-span-7"
const RIGHT = "col-span-10 col-start-3 md:col-span-7 md:col-start-6"

function slot(mobile: string, desktop: string, depth: number): Slot {
	return { class: `${mobile} ${desktop}`, depth }
}

/**
 * Règles à respecter pour modifier une composition :
 * - une rangée = 1 ou 2 cartes ;
 * - dans une rangée de 2, les colonnes ne se chevauchent pas et il reste au moins
 *   2 colonnes vides entre les cartes ;
 * - |depth| <= 0.8 pour que le parallax ne rapproche jamais deux cartes de plus
 *   que l'écart entre rangées ;
 * - les classes restent écrites en entier (pas de `col-span-${n}`).
 */
const LAYOUTS: Record<CardLayoutName, Slot[][]> = {
	// Éditorial : une grande carte, des petites perdues dans le vide, un rythme asymétrique.
	blog: [
		// 1 : grande à gauche, petite très descendue à droite
		[
			slot(LEFT, "lg:col-span-6 lg:col-start-1", 0.7),
			slot(RIGHT, "lg:col-span-3 lg:col-start-10 lg:mt-56", -0.5),
		],
		// 2 : seule, légèrement à gauche du centre
		[slot(RIGHT, "lg:col-span-4 lg:col-start-4", 0.4)],
		// 3 : petite en retrait à gauche, large à droite
		[
			slot(LEFT, "lg:col-span-3 lg:col-start-2", -0.6),
			slot(RIGHT, "lg:col-span-5 lg:col-start-7 lg:mt-32", 0.8),
		],
		// 4 : seule, collée au bord droit
		[slot(LEFT, "lg:col-span-4 lg:col-start-9", -0.7)],
		// 5 : large à gauche, étroite et descendue au centre-droit
		[
			slot(LEFT, "lg:col-span-5 lg:col-start-1", 0.5),
			slot(RIGHT, "lg:col-span-3 lg:col-start-8 lg:mt-48", -0.8),
		],
		// 6 : seule, petite, dans le vide
		[slot(RIGHT, "lg:col-span-4 lg:col-start-3", 0.6)],
	],

	// Vitrine : paires décalées en miroir, une carte « hero » centrée au milieu.
	templates: [
		// 1 : deux cartes égales, la seconde descendue
		[
			slot(LEFT, "lg:col-span-4 lg:col-start-2", 0.6),
			slot(RIGHT, "lg:col-span-4 lg:col-start-8 lg:mt-40", -0.7),
		],
		// 2 : hero large, centrée
		[slot(LEFT, "lg:col-span-6 lg:col-start-4", 0.4)],
		// 3 : étroite au bord gauche, large et très descendue
		[
			slot(RIGHT, "lg:col-span-3 lg:col-start-1", -0.5),
			slot(LEFT, "lg:col-span-5 lg:col-start-6 lg:mt-56", 0.8),
		],
		// 4 : moyenne en retrait, étroite au bord droit
		[
			slot(LEFT, "lg:col-span-5 lg:col-start-3", 0.6),
			slot(RIGHT, "lg:col-span-3 lg:col-start-10 lg:mt-24", -0.6),
		],
		// 5 : seule, à gauche
		[slot(RIGHT, "lg:col-span-4 lg:col-start-2", 0.5)],
	],
}

/**
 * Répartit une liste d'éléments en rangées selon la composition choisie.
 * La composition se répète quand il y a plus d'éléments que de rangées.
 */
export function buildCardRows<T>(
	items: readonly T[],
	name: CardLayoutName
): CardCell<T>[][] {
	const pattern = LAYOUTS[name]
	const rows: CardCell<T>[][] = []
	let index = 0
	let rowIndex = 0

	while (index < items.length) {
		const slots = pattern[rowIndex % pattern.length]!
		const row: CardCell<T>[] = []

		for (const s of slots) {
			if (index >= items.length) break
			row.push({ item: items[index]!, class: s.class, depth: s.depth })
			index++
		}

		rows.push(row)
		rowIndex++
	}

	return rows
}
