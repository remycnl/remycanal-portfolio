/**
 * Boîte du personnage (sticker 160×340). Mêmes classes pour le hero et le CV : les deux
 * personnages occupent exactement la même boîte, donc la tranche visible de l'un et celle de
 * l'autre se complètent. Plus petit en responsive.
 */
export const CHARACTER_SLOT_CLASSES =
	"aspect-[160/340] w-[14vw] max-w-20 min-w-12 lg:w-[10.5vw] lg:max-w-none"

/** Ratio de pixels maximal des scènes du personnage : petits canvas décoratifs, inutile d'aller plus haut. */
export const CHARACTER_MAX_PIXEL_RATIO = 1.25
