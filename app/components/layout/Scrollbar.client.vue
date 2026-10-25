<script lang="ts" setup>
import type { SiteTheme } from "@/types/theme"

/** The gauge leaves only if the page really has nothing to scroll for this long. */
const HIDE_DELAY_MS = 400
/** The fill glides for this long when its source changes (page to sheet and back). */
const GLIDE_MS = 700
/** Grabbing the tip of the fill this closely keeps the offset, farther away the fill jumps there. */
const GRAB_RADIUS_PX = 20

const nuxtApp = useNuxtApp()
const { overlay } = useOverlay()
const lenis = useLenis()
const visibleRoute = useVisibleRoute()
const transitionActive = usePageTransitionActive()
const covered = usePageCovered()

const rootRef = useTemplateRef<HTMLElement>("rootRef")

/** What the gauge follows: the sheet while an overlay is open, the page otherwise. */
const scroller = computed(() => (overlay.sheet ? overlay.scroller : null))

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

// ---------------------------------------------------------------------------
// Theme: it changes under the page transition, never in plain sight.
// ---------------------------------------------------------------------------

const routeTheme = computed<SiteTheme>(
	() => visibleRoute.value.meta.footerTheme ?? DEFAULT_SITE_THEME
)

/** The theme drawn by the gauge. */
const theme = ref<SiteTheme>(routeTheme.value)

// The route changes when the navigation starts, but the wipe only starts once the new page is
// ready: the gauge waits for the screen to be fully covered.
watch(covered, (isCovered) => {
	if (isCovered) theme.value = routeTheme.value
})

// No wipe ran for this navigation: there is nothing to hide, it changes with the page.
const stopPageFinish = nuxtApp.hook("page:finish", () => {
	if (!transitionActive.value) theme.value = routeTheme.value
})

// ---------------------------------------------------------------------------
// Progress: how far the page (or the sheet) is scrolled, from 0 to 1.
// ---------------------------------------------------------------------------

/** Last measure: what dragging needs to turn a pointer position into a scroll position. */
let progress = 0
let range = 0

let frame = 0
let glideTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

/** The fill glides to its new value instead of jumping, when the source changes. */
function glide() {
	const root = rootRef.value
	if (!root) return

	root.dataset.gliding = ""
	clearTimeout(glideTimer)
	glideTimer = setTimeout(() => delete root.dataset.gliding, GLIDE_MS)
}

function cancelHide() {
	clearTimeout(hideTimer)
	hideTimer = undefined
}

function hide() {
	hideTimer = undefined
	range = 0
	if (rootRef.value) rootRef.value.dataset.scrollable = "false"
}

function update() {
	frame = 0
	const root = rootRef.value
	if (!root || !root.clientHeight) return

	const sheet = scroller.value
	const top = sheet ? sheet.scrollTop : window.scrollY
	const height = sheet ? sheet.scrollHeight : document.documentElement.scrollHeight
	const view = sheet ? sheet.clientHeight : window.innerHeight
	const scrollable = height - view

	if (scrollable <= 1) {
		// While a page is swapped (or still loading), "nothing to scroll" is only transient: the
		// gauge stays exactly as it is until the new page is in place.
		if (transitionActive.value) return

		// Otherwise it leaves only if the page really has nothing to scroll.
		hideTimer ??= setTimeout(hide, HIDE_DELAY_MS)
		return
	}

	cancelHide()

	range = scrollable
	progress = clamp(top / scrollable, 0, 1)

	root.dataset.scrollable = "true"
	root.style.setProperty("--progress", String(progress))
}

function schedule() {
	if (!frame) frame = requestAnimationFrame(update)
}

watch(transitionActive, (active) => {
	if (active) cancelHide()
	// The new page is in place: the gauge settles on it, whatever was measured meanwhile.
	else schedule()
})

// ---------------------------------------------------------------------------
// Sources: the page, or the sheet while an overlay is open.
// ---------------------------------------------------------------------------

let appObserver: ResizeObserver | undefined
let sheetObserver: ResizeObserver | undefined

watch(
	scroller,
	(sheet, previous) => {
		previous?.removeEventListener("scroll", schedule)
		sheetObserver?.disconnect()

		if (sheet) {
			sheet.addEventListener("scroll", schedule, { passive: true })
			sheetObserver = new ResizeObserver(schedule)
			sheetObserver.observe(sheet)
			if (sheet.firstElementChild) sheetObserver.observe(sheet.firstElementChild)
		}

		glide()
		schedule()
	},
	{ flush: "post" }
)

onMounted(() => {
	window.addEventListener("scroll", schedule, { passive: true })
	window.addEventListener("resize", schedule, { passive: true })

	// The height of the page changes with its content, not with the window.
	const app = document.getElementById("__nuxt")
	if (app) {
		appObserver = new ResizeObserver(schedule)
		appObserver.observe(app)
	}

	schedule()
})

onBeforeUnmount(() => {
	stopPageFinish()
	cancelAnimationFrame(frame)
	clearTimeout(glideTimer)
	cancelHide()
	window.removeEventListener("scroll", schedule)
	window.removeEventListener("resize", schedule)
	scroller.value?.removeEventListener("scroll", schedule)
	appObserver?.disconnect()
	sheetObserver?.disconnect()
})

// ---------------------------------------------------------------------------
// Dragging: the gauge works like a scrollbar. The pointer position along it is the progress.
// ---------------------------------------------------------------------------

/** Distance between the pointer and the tip of the fill while dragging, null when not dragging. */
let grab: number | null = null

function scrollTo(top: number) {
	const sheet = scroller.value

	if (sheet) sheet.scrollTop = top
	// Immediate: a smooth scroll still running would fight the drag.
	else if (lenis) lenis.scrollTo(top, { immediate: true, force: true })
	else window.scrollTo({ top, left: 0, behavior: "instant" })
}

function drag(clientY: number) {
	const root = rootRef.value
	if (!root || grab === null || range <= 0) return

	const { top, height } = root.getBoundingClientRect()
	scrollTo(clamp((clientY - top - grab) / height, 0, 1) * range)
}

function onPointerDown(event: PointerEvent) {
	const root = rootRef.value
	if (!root || event.button !== 0 || range <= 0) return

	const { top, height } = root.getBoundingClientRect()
	const pointer = event.clientY - top
	const tip = progress * height

	// On the tip, the fill follows the pointer without jumping. Anywhere else, it jumps there.
	grab = Math.abs(pointer - tip) <= GRAB_RADIUS_PX ? pointer - tip : 0

	root.setPointerCapture(event.pointerId)
	root.dataset.dragging = ""
	drag(event.clientY)
	event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
	drag(event.clientY)
}

function onPointerUp(event: PointerEvent) {
	const root = rootRef.value
	if (!root) return

	grab = null
	delete root.dataset.dragging
	if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId)
}
</script>

<template>
	<!-- Outside of the app root: above the sheet, whatever the stacking contexts of the layout. -->
	<Teleport to="#teleports">
		<div
			ref="rootRef"
			class="gauge"
			:data-theme="theme"
			data-scrollable="false"
			data-no-click-fx
			aria-hidden="true"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointercancel="onPointerUp"
		>
			<div class="gauge__track">
				<div class="gauge__fill" />
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
/*
 * The root is the grab zone: wider than the gauge, so that it is easy to catch with a pointer.
 * It carries the theme, whose variables (`--scrollbar-*`) the track and the fill read.
 */
.gauge {
	--gauge-width: 0.375rem;
	--gauge-width-active: 0.625rem;
	--gauge-track: var(--scrollbar-track);

	position: fixed;
	inset-block: 0;
	inset-inline-end: 0;
	z-index: 80;
	width: 1rem;
	pointer-events: none;
	user-select: none;
	touch-action: none;
	transition: opacity 0.3s ease;
}

/* Mouse and trackpad: the gauge can be grabbed. */
@media (hover: hover) and (pointer: fine) {
	.gauge {
		pointer-events: auto;
		cursor: grab;
	}

	.gauge[data-dragging] {
		cursor: grabbing;
	}

	.gauge:hover .gauge__track,
	.gauge[data-dragging] .gauge__track {
		width: var(--gauge-width-active);
	}
}

/* Small screens and touch: thinner and more discreet. Only an indicator there, it is not grabbed. */
@media (max-width: 767px), (pointer: coarse) {
	.gauge {
		--gauge-width: 0.1875rem;
		--gauge-width-active: 0.375rem;
		--gauge-track: color-mix(in srgb, var(--scrollbar-track) 40%, transparent);
	}

	.gauge__fill {
		opacity: 0.85;
	}
}

.gauge[data-scrollable="false"] {
	opacity: 0;
	pointer-events: none;
}

.gauge__track {
	position: absolute;
	inset-block: 0;
	inset-inline-end: 0;
	width: var(--gauge-width);
	background: var(--gauge-track);
	transition: width 0.2s ease;
}

.gauge__fill {
	position: absolute;
	inset: 0;
	background: var(--scrollbar-thumb);
	transform: scaleY(var(--progress, 0));
	transform-origin: top;
	will-change: transform;
}

/* Only while the source changes: the rest of the time, the fill follows the scroll exactly. */
.gauge[data-gliding] .gauge__fill {
	transition: transform 0.6s cubic-bezier(0.76, 0, 0.24, 1);
}

@media (prefers-reduced-motion: reduce) {
	.gauge__track,
	.gauge[data-gliding] .gauge__fill {
		transition: none;
	}
}
</style>
