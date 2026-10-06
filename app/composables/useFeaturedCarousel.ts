import type { CarouselElements, CarouselPointer } from "@/composables/useCarouselEngine"

type BadgeState = "view" | "press" | "loading"

export function useFeaturedCarousel({
	section,
	viewport,
	surface,
	track,
}: CarouselElements) {
	const isDesktopPointer = useDesktopPointer()

	const activeIndex = ref(0)
	const hoveredIndex = ref<number | null>(null)
	const pressedIndex = ref<number | null>(null)
	const isOpening = ref(false)

	const cardEls: HTMLElement[] = []
	const pointer: CarouselPointer = { x: 0, y: 0, live: false }

	const isActiveHovered = computed(() => hoveredIndex.value === activeIndex.value)
	const isBadgeActive = computed(() => hoveredIndex.value !== null || isOpening.value)
	const badgeState = computed<BadgeState>(() => {
		if (isOpening.value) return "loading"
		const hovered = hoveredIndex.value
		return hovered !== null && pressedIndex.value === hovered ? "press" : "view"
	})

	function setCardRef(el: Element | ComponentPublicInstance | null, index: number) {
		if (!el) return
		const domEl = "$el" in el ? el.$el : el
		if (domEl instanceof HTMLElement) cardEls[index] = domEl
	}

	function isHoverPointer(event: PointerEvent) {
		return isDesktopPointer.value && event.pointerType === "mouse"
	}

	function trackPointer(event: PointerEvent) {
		pointer.live = true
		pointer.x = event.clientX
		pointer.y = event.clientY
		wake()
	}

	function onCardEnter(index: number, event: PointerEvent) {
		if (!isHoverPointer(event)) return
		isOpening.value = false
		hoveredIndex.value = index
		trackPointer(event)
	}

	function onCardMove(event: PointerEvent) {
		if (isHoverPointer(event)) trackPointer(event)
	}

	function onCardLeave(index: number) {
		hoveredIndex.value = null
		pointer.live = false
		onCardRelease(index)
	}

	function onCardPress(index: number) {
		isOpening.value = false
		pressedIndex.value = index
	}

	function onCardRelease(index: number) {
		if (pressedIndex.value === index) pressedIndex.value = null
	}

	function onCardClick(event: MouseEvent) {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return
		}
		isOpening.value = true
	}

	function cancelInteraction() {
		pressedIndex.value = null
		hoveredIndex.value = null
		pointer.live = false
	}

	const { wake } = useCarouselEngine({
		section,
		viewport,
		surface,
		track,
		cards: cardEls,
		bridge: {
			getHoveredIndex: () => hoveredIndex.value,
			getPressedIndex: () => pressedIndex.value,
			getPointer: () => pointer,
			onActiveChange: (index) => {
				activeIndex.value = index
			},
			onDragStart: cancelInteraction,
		},
	})

	watch([hoveredIndex, pressedIndex], wake)

	return {
		activeIndex,
		isActiveHovered,
		isBadgeActive,
		badgeState,
		setCardRef,
		onCardEnter,
		onCardMove,
		onCardLeave,
		onCardPress,
		onCardRelease,
		onCardClick,
	}
}
