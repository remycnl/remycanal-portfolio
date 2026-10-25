<script lang="ts" setup>
/** Pool size: more clicks than this within the animation time recycle the oldest effect. */
const POOL_SIZE = 6

/**
 * The bars sit in the upper-left corner of the click, where the cursor does not hide them: left,
 * upper-left and up, 45° apart. 0° is straight up, negative angles turn counter-clockwise.
 */
const BAR_ANGLES_DEG = [-90, -45, 0]

/** Where the bars start, where they end, and how long they live. */
const START_RADIUS_PX = 7
const END_RADIUS_PX = 22
const DURATION_MS = 400
/** Fast start, soft landing. */
const EASE = "cubic-bezier(0.25, 1, 0.5, 1)"

interface Slot {
	root: HTMLElement
	bars: HTMLElement[]
	animations: Animation[]
}

const siteTheme = useSiteTheme()
const { isRevealed } = useLoadingState()
const transitionActive = usePageTransitionActive()
const isDesktopPointer = useDesktopPointer()

const slotRefs = useTemplateRef<HTMLElement[]>("slotRefs")

let slots: Slot[] = []
let cursor = 0
let reducedMotion: MediaQueryList | undefined

function burst(x: number, y: number) {
	const slot = slots[cursor]
	cursor = (cursor + 1) % POOL_SIZE
	if (!slot) return

	// A slot still playing is recycled: its old animations stop, its bars go back to rest.
	for (const animation of slot.animations) animation.cancel()
	slot.animations.length = 0

	// The colour is the theme at the moment of the click: it does not change while it plays.
	slot.root.dataset.theme = siteTheme.value
	slot.root.style.transform = `translate3d(${x}px, ${y}px, 0)`

	BAR_ANGLES_DEG.forEach((angle, index) => {
		const bar = slot.bars[index]
		if (!bar) return

		const rotate = `rotate(${angle}deg)`

		// The inner end flies faster than the outer tip: the bar shortens as it leaves.
		slot.animations.push(
			bar.animate(
				[
					{
						transform: `${rotate} translateY(-${START_RADIUS_PX}px) scaleY(1)`,
						opacity: 1,
					},
					{ opacity: 1, offset: 0.5 },
					{
						transform: `${rotate} translateY(-${END_RADIUS_PX}px) scaleY(0.1)`,
						opacity: 0,
					},
				],
				{ duration: DURATION_MS, easing: EASE }
			)
		)
	})
}

function onPointerDown(event: PointerEvent) {
	// Mouse and pen, main button: a finger on a hybrid laptop does not count.
	if (!event.isPrimary || event.pointerType === "touch" || event.button !== 0) return

	if (reducedMotion?.matches || !isRevealed.value || transitionActive.value) return
	if (event.target instanceof Element && event.target.closest("[data-no-click-fx]"))
		return

	burst(event.clientX, event.clientY)
}

const listenerOptions: AddEventListenerOptions = { capture: true, passive: true }

function enable() {
	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

	slots = (slotRefs.value ?? []).map((root) => ({
		root,
		bars: Array.from(root.children) as HTMLElement[],
		animations: [],
	}))
	cursor = 0

	window.addEventListener("pointerdown", onPointerDown, listenerOptions)
}

function disable() {
	window.removeEventListener("pointerdown", onPointerDown, listenerOptions)

	for (const slot of slots) for (const animation of slot.animations) animation.cancel()
	slots = []
}

// Desktop only: the pool is rendered and listened to only while the device is a desktop pointer.
// After the render, so that the slots exist when they are read.
watch(isDesktopPointer, (isDesktop) => (isDesktop ? enable() : disable()), {
	flush: "post",
})

onBeforeUnmount(disable)
</script>

<template>
	<!-- Outside of the app root, below the page transition: it plays above everything else. -->
	<Teleport to="#teleports">
		<div v-if="isDesktopPointer" class="click-fx" aria-hidden="true">
			<div v-for="slot in POOL_SIZE" :key="slot" ref="slotRefs" class="click-fx__slot">
				<span v-for="bar in BAR_ANGLES_DEG.length" :key="bar" class="click-fx__bar" />
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.click-fx {
	position: fixed;
	inset: 0;
	z-index: 9000;
	overflow: clip;
	pointer-events: none;
	contain: layout paint style;
}

/* Moved to the click with a transform. Its `data-theme` gives the variable below its colour. */
.click-fx__slot {
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
}

/*
 * A bar stands on the click point, its inner end at the origin, and turns around it. At rest it
 * is invisible: it only exists while its animation runs.
 */
.click-fx__bar {
	position: absolute;
	top: 0;
	left: 0;
	width: 2px;
	height: 8px;
	margin: -8px 0 0 -1px;
	border-radius: 1px;
	opacity: 0;
	background: var(--scrollbar-thumb);
	transform-origin: 50% 100%;
}
</style>
