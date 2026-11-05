export function useWork() {
	const interaction = useBadgeInteraction({
		label: "See more",
		pressLabel: "Open project",
		loadingLabel: "Opening...",
		loadingOnOpen: false,
	})

	return {
		isActive: interaction.active,
		state: interaction.state,
		badge: interaction.badge,
		onEnter: interaction.onEnter,
		onLeave: interaction.onLeave,
		onPress: interaction.onPress,
		onRelease: interaction.onRelease,
		onOpen: interaction.onOpen,
	}
}
