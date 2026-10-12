import type { InjectionKey } from "vue"
import type { BadgeProps } from "@/components/ui/Badge.vue"
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
	const isHovering = shallowRef(false)
	const isPressed = shallowRef(false)
	const isOpening = useOpening()
	const { slotFor } = useRowReveal()

	const badge = computed<BadgeProps>(() => ({
		...TINT_COLORS[tint],
		active: isHovering.value || isOpening.value,
		state: isOpening.value ? "loading" : isPressed.value ? "press" : "view",
		labels: { view: label, press: pressLabel ?? label, loading: loadingLabel },
	}))

	provide(CARD_GRID_KEY, {
		theme,
		tint,
		slotFor,
		onEnter: () => {
			isHovering.value = true
		},
		onLeave: () => {
			isHovering.value = false
			isPressed.value = false
		},
		onPress: () => {
			isPressed.value = true
		},
		onRelease: () => {
			isPressed.value = false
		},
		onOpen: () => {
			isOpening.value = true
			isPressed.value = false
		},
	})

	return badge
}

export function useCardGridContext() {
	return inject(CARD_GRID_KEY, null)
}
