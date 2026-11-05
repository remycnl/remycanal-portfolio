import type { InjectionKey } from "vue"
import type { RevealSlot } from "@/composables/useRowReveal"

export type CardTint = "lime" | "violet"
export type CardTheme = "white" | "black"

interface CardGridOptions {
	/** Background the grid sits on. Drives the text colors and the frame of its cards. */
	theme?: CardTheme
	/** Accent color of the cursor badge and of the teaser overlay of its cards. */
	tint?: CardTint
	/** Cursor badge label while a card is hovered. */
	label?: string
	/** Cursor badge label while a card is pressed. Defaults to `label`, so only the pill scale animates. */
	pressLabel?: string
	/** Cursor badge label once a card has been clicked and navigation is pending. */
	loadingLabel?: string
}

interface CardGridContext {
	theme: CardTheme
	tint: CardTint
	/** Position of a card in the row-by-row reveal. Call it once the layout is stable. */
	slotFor: (card: HTMLElement) => RevealSlot
	onEnter: () => void
	onLeave: () => void
	onPress: () => void
	onRelease: () => void
	onOpen: () => void
}

const CARD_GRID_KEY: InjectionKey<CardGridContext> = Symbol("card-grid")

const TINT_COLORS: Record<CardTint, { bgColor: string; textColor: string }> = {
	lime: { bgColor: "var(--color-lime)", textColor: "var(--color-black)" },
	violet: { bgColor: "var(--color-violet)", textColor: "var(--color-white)" },
}

export function provideCardGrid({
	theme = "white",
	tint = "lime",
	label = "Open",
	pressLabel,
	loadingLabel = "Opening...",
}: CardGridOptions = {}) {
	const interaction = useBadgeInteraction({ label, pressLabel, loadingLabel })
	const { slotFor } = useRowReveal()

	const badge = useBadgePresentation({
		active: interaction.active,
		state: interaction.state,
		labels: { view: label, press: pressLabel ?? label, loading: loadingLabel },
		bgColor: TINT_COLORS[tint].bgColor,
		textColor: TINT_COLORS[tint].textColor,
	})

	provide(CARD_GRID_KEY, {
		theme,
		tint,
		slotFor,
		onEnter: interaction.onEnter,
		onLeave: interaction.onLeave,
		onPress: interaction.onPress,
		onRelease: interaction.onRelease,
		onOpen: interaction.onOpen,
	})

	return badge
}

export function useCardGridContext() {
	return inject(CARD_GRID_KEY, null)
}
