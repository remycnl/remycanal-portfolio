<script lang="ts" setup>
const props = defineProps<{
	/** Color of the text of the page: black on a light page, white on a dark one. */
	tone: "white" | "black"
}>()

const { overlay, close } = useOverlay()
const { gsap } = useGsap()
const route = useRoute()

/** True when the page is displayed in the overlay sheet, false when it is a regular page. */
const inSheet = inject(OVERLAY_SHEET_KEY, false)

// Black text: the black pill of the header. White text: its white version, with a light gray border.
const colors = computed(() =>
	props.tone === "white"
		? "border-gray-light bg-white text-black focus-visible:shadow-[0_0_0_2px_var(--color-gray-light),0_0_0_4px_var(--color-black)]"
		: "border-black-light bg-black text-white focus-visible:shadow-[0_0_0_2px_var(--color-black-light),0_0_0_4px_var(--color-white)]"
)

const parent = computed(() => route.meta.overlay?.parent ?? "/")

// In the sheet, "close" goes back to the page behind; reached directly, to the section of the page.
const target = computed(() => (inSheet && overlay.background?.fullPath) || parent.value)

function onClick(event: MouseEvent) {
	// A regular page: the link navigates on its own, page transition included.
	if (!inSheet) return
	if (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return
	}

	event.preventDefault()
	close()
}

function onKeydown(event: KeyboardEvent) {
	if (event.key !== "Escape" || event.defaultPrevented) return
	if (inSheet) close()
	else void navigateTo(target.value)
}

onMounted(() => window.addEventListener("keydown", onKeydown))
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown))

// Same press feedback as the links of the header: it sinks, then springs back.
let pressed = false
const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches

function onPress(event: PointerEvent) {
	if (prefersReducedMotion()) return
	pressed = true
	gsap.to(event.currentTarget as HTMLElement, {
		scale: 0.94,
		duration: 0.12,
		ease: "power2.out",
		force3D: true,
		overwrite: "auto",
	})
}

function onRelease(event: PointerEvent) {
	if (!pressed) return
	pressed = false
	gsap.to(event.currentTarget as HTMLElement, {
		scale: 1,
		duration: 0.45,
		ease: "elastic.out(1, 0.5)",
		overwrite: "auto",
		clearProps: "transform",
	})
}
</script>

<template>
	<!--
		The pill of the header: bordered, rounded, 54px tall. It never goes under the header (a centered
		pill, above the sheet): on its row where there is room (phone, wide screens), under it where
		the navigation is wide (tablet, laptop).

		What it shows depends on what the device can do:
		- mouse and keyboard: the word, rolling on hover, and the Esc shortcut
		- touch, tablet: the word
		- touch, phone: a cross
	-->
	<NuxtLink
		:to="target"
		aria-keyshortcuts="Escape"
		:class="[
			'group font-lineal-bold fixed z-20 inline-flex h-13.5 w-13.5 items-center justify-center gap-3 rounded-lg border px-0 tracking-wide uppercase select-none',
			'transition-[padding-left,padding-right] duration-400',
			'sm:w-auto sm:px-6 [@media(hover:hover)_and_(pointer:fine)]:w-auto [@media(hover:hover)_and_(pointer:fine)]:px-6 [@media(hover:hover)_and_(pointer:fine)]:hover:px-10',
			'focus-visible:outline-2 focus-visible:outline-transparent',
			'top-5 right-[max(1rem,env(safe-area-inset-right))] md:top-21.5 lg:right-[max(2rem,env(safe-area-inset-right))] xl:top-5',
			colors,
		]"
		@click="onClick"
		@pointerdown="onPress"
		@pointerup="onRelease"
		@pointerleave="onRelease"
		@pointercancel="onRelease"
	>
		<!-- Hidden on a phone (the cross says it), but still the name of the link. -->
		<span
			v-roll-hover="{ host: 'a' }"
			class="sr-only sm:not-sr-only [@media(hover:hover)_and_(pointer:fine)]:not-sr-only"
		>
			Close
		</span>

		<span
			aria-hidden="true"
			class="font-vg5000 box-fit hidden rounded-xs border border-current text-[10px] opacity-50 [--fit-x:0.7em] [--fit-y:0.5em] [@media(hover:hover)_and_(pointer:fine)]:inline-block"
		>
			Esc
		</span>

		<!-- The dots of the menu icon in its open state: the corners and the center draw a cross. -->
		<svg
			width="24"
			height="24"
			viewBox="0 0 18 18"
			fill="none"
			aria-hidden="true"
			class="block shrink-0 sm:hidden [@media(hover:hover)_and_(pointer:fine)]:hidden"
		>
			<circle cx="3" cy="3" r="1.7" fill="currentColor" />
			<circle cx="15" cy="3" r="1.7" fill="currentColor" />
			<circle cx="9" cy="9" r="1.7" fill="currentColor" />
			<circle cx="3" cy="15" r="1.7" fill="currentColor" />
			<circle cx="15" cy="15" r="1.7" fill="currentColor" />
		</svg>
	</NuxtLink>
</template>
