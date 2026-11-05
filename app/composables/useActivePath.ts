export function useActivePath() {
	const route = useRoute()
	const { overlay } = useOverlay()
	const backgroundPath = shallowRef<string | null>(null)

	watch(
		() => overlay.background?.path,
		(path) => {
			if (path) backgroundPath.value = path
		},
		{ immediate: true }
	)

	watch(
		() => Boolean(route.meta.overlay),
		(isOverlayRoute) => {
			if (!isOverlayRoute) backgroundPath.value = null
		}
	)

	return computed(() => {
		if (overlay.background) return overlay.background.path
		if (route.meta.overlay && backgroundPath.value) return backgroundPath.value
		return route.path
	})
}
