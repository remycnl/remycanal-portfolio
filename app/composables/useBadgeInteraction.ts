import type { BadgeProps, BadgeState } from "@/components/ui/Badge.vue"

interface BadgeInteractionOptions {
	label?: string
	pressLabel?: string
	loadingLabel?: string
	loadingOnOpen?: boolean
}

interface BadgePresentationOptions {
	active: MaybeRefOrGetter<boolean>
	state?: MaybeRefOrGetter<BadgeState | undefined>
	labels?: MaybeRefOrGetter<BadgeProps["labels"]>
	bgColor?: MaybeRefOrGetter<string>
	textColor?: MaybeRefOrGetter<string>
	offset?: MaybeRefOrGetter<BadgeProps["offset"]>
}

export function useBadgePresentation(options: BadgePresentationOptions) {
	return computed<BadgeProps>(() => ({
		active: toValue(options.active),
		state: toValue(options.state),
		labels: toValue(options.labels),
		bgColor: toValue(options.bgColor),
		textColor: toValue(options.textColor),
		offset: toValue(options.offset),
	}))
}

export function useBadgeInteraction({
	label = "Open",
	pressLabel = label,
	loadingLabel = "Opening...",
	loadingOnOpen = true,
}: BadgeInteractionOptions = {}) {
	const isOpening = useOpening()
	const isHovering = shallowRef(false)
	const isPressed = shallowRef(false)

	const active = computed(() => isHovering.value || isOpening.value)
	const state = computed<BadgeState>(() => {
		if (isOpening.value) return "loading"
		return isPressed.value ? "press" : "view"
	})

	function onEnter(event?: PointerEvent) {
		isHovering.value = !event || event.pointerType !== "touch"
	}

	function onLeave() {
		isHovering.value = false
		isPressed.value = false
	}

	function onPress(event?: PointerEvent) {
		if (!event || event.button === 0) isPressed.value = true
	}

	function onRelease() {
		isPressed.value = false
	}

	function onOpen() {
		if (loadingOnOpen) isOpening.value = true
		isHovering.value = false
		isPressed.value = false
	}

	const badge = useBadgePresentation({
		active,
		state,
		labels: { view: label, press: pressLabel, loading: loadingLabel },
	})

	return { active, state, badge, onEnter, onLeave, onPress, onRelease, onOpen }
}
