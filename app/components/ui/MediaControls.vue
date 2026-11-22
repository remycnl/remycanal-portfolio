<script lang="ts" setup>
interface Props {
	/** The video the controls drive. `null` until it is mounted. */
	video: HTMLVideoElement | null
	/** Element that goes fullscreen, so that the controls stay on screen with the video. */
	container: HTMLElement | null
}

const props = defineProps<Props>()

/** Seconds skipped by the arrow keys. */
const SEEK_STEP = 5
/** Time without interaction before the controls fade out while the video plays, in ms. */
const IDLE_DELAY = 2400

const button =
	"grid size-9 shrink-0 place-items-center rounded-full outline-0 transition-[background-color,scale] duration-200 ease-out hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white/80 active:scale-90 motion-reduce:transition-none"
const stacked =
	"col-start-1 row-start-1 size-5 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none"

const paused = ref(true)
const muted = ref(true)
const duration = ref(0)
/** Whole seconds elapsed: the text only changes once a second, the playhead is painted separately. */
const second = ref(0)
const scrubbing = ref(false)
/** A video that was playing when the scrub started: it plays again on release. */
const resuming = ref(false)
const active = ref(false)
const keyboardFocus = ref(false)
const fullscreen = ref(false)

const track = useTemplateRef<HTMLElement>("track")

/** What the person sees: a video paused only to be scrubbed still reads as playing. */
const showPaused = computed(() => paused.value && !resuming.value)
const visible = computed(
	() => showPaused.value || active.value || scrubbing.value || keyboardFocus.value
)

function format(seconds: number) {
	const total = Math.max(0, Math.floor(seconds))
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

const label = computed(() => `${format(second.value)} / ${format(duration.value)}`)

// ── Playhead ────────────────────────────────────────────────
// The playhead and the buffer are CSS variables written straight to the DOM: no re-render per
// frame, and the bars only use `scale` / `translate`, which never trigger a layout.

function paint() {
	const el = props.video
	if (!el || !track.value) return

	const total = Number.isFinite(el.duration) ? el.duration : 0
	track.value.style.setProperty("--p", String(total > 0 ? el.currentTime / total : 0))

	const time = Math.floor(el.currentTime)
	if (time !== second.value) second.value = time
}

function paintBuffered() {
	const el = props.video
	if (!el || !track.value) return

	const total = Number.isFinite(el.duration) ? el.duration : 0
	let end = 0
	// The buffered range that holds the playhead.
	for (let index = 0; index < el.buffered.length; index++) {
		if (
			el.buffered.start(index) <= el.currentTime &&
			el.currentTime <= el.buffered.end(index)
		) {
			end = el.buffered.end(index)
			break
		}
	}
	track.value.style.setProperty("--b", String(total > 0 ? end / total : 0))
}

let frame = 0

function loop() {
	paint()
	frame = requestAnimationFrame(loop)
}

function stopLoop() {
	cancelAnimationFrame(frame)
	frame = 0
}

// The playhead only needs to move on screen while the video plays and the controls are visible.
watch(
	() => !paused.value && visible.value,
	(running) => {
		stopLoop()
		paint()
		if (running) frame = requestAnimationFrame(loop)
	}
)

// ── Video state ─────────────────────────────────────────────

function syncDuration(el: HTMLVideoElement) {
	duration.value = Number.isFinite(el.duration) ? el.duration : 0
}

watch(
	() => props.video,
	(el, _previous, onCleanup) => {
		if (!el) return

		const listeners: [string, () => void][] = [
			["play", () => (paused.value = false)],
			["pause", () => (paused.value = true)],
			["volumechange", () => (muted.value = el.muted)],
			[
				"durationchange",
				() => {
					syncDuration(el)
					paint()
					paintBuffered()
				},
			],
			["progress", paintBuffered],
			[
				"seeked",
				() => {
					if (!scrubbing.value) paint()
					paintBuffered()
				},
			],
		]

		for (const [name, listener] of listeners) el.addEventListener(name, listener)

		paused.value = el.paused
		muted.value = el.muted
		syncDuration(el)
		paint()
		paintBuffered()

		onCleanup(() => {
			for (const [name, listener] of listeners) el.removeEventListener(name, listener)
		})
	},
	{ immediate: true }
)

// ── Actions ─────────────────────────────────────────────────

function togglePlay() {
	const el = props.video
	if (!el) return
	if (el.paused) el.play().catch(() => {})
	else el.pause()
}

function toggleMute() {
	if (props.video) props.video.muted = !props.video.muted
}

function seek(to: number) {
	const el = props.video
	if (!el || !duration.value) return
	el.currentTime = Math.min(duration.value, Math.max(0, to))
}

function seekBy(delta: number) {
	if (props.video) seek(props.video.currentTime + delta)
}

async function toggleFullscreen() {
	const target = props.container
	if (!target) return

	try {
		if (document.fullscreenElement) await document.exitFullscreen()
		else if (target.requestFullscreen) await target.requestFullscreen()
		// iPhone only goes fullscreen through the video itself, and loses the custom controls.
		else
			(
				props.video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
			)?.webkitEnterFullscreen?.()
	} catch {
		// Refused by the browser: nothing to do.
	}
}

function syncFullscreen() {
	fullscreen.value =
		Boolean(props.container) && document.fullscreenElement === props.container
}

// ── Idle ────────────────────────────────────────────────────

let idleTimer: ReturnType<typeof setTimeout> | undefined

function wake(delay = IDLE_DELAY) {
	active.value = true
	clearTimeout(idleTimer)
	idleTimer = setTimeout(() => (active.value = false), delay)
}

function onLeave(event: PointerEvent) {
	// A finger leaving the screen is not a mouse leaving the player: only the mouse hides at once.
	if (event.pointerType === "mouse") wake(500)
}

function onSurfaceClick() {
	// On a playing video, the first tap only brings the controls back, like on a phone.
	if (visible.value) togglePlay()
	wake()
}

function onFocusIn(event: FocusEvent) {
	keyboardFocus.value = (event.target as HTMLElement).matches(":focus-visible")
}

function onKeydown(event: KeyboardEvent) {
	wake()
	// Buttons and the slider keep their own keys: shortcuts only apply to the player itself.
	if (event.target !== event.currentTarget) return

	const actions: Record<string, () => void> = {
		" ": togglePlay,
		k: togglePlay,
		ArrowLeft: () => seekBy(-SEEK_STEP),
		ArrowRight: () => seekBy(SEEK_STEP),
		m: toggleMute,
		f: () => void toggleFullscreen(),
	}
	const action = actions[event.key]
	if (!action) return

	event.preventDefault()
	action()
}

// ── Scrubbing ───────────────────────────────────────────────

function ratioAt(event: PointerEvent) {
	const rect = track.value?.getBoundingClientRect()
	if (!rect?.width) return 0
	return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
}

function scrubTo(event: PointerEvent) {
	const el = props.video
	if (!el) return

	const ratio = ratioAt(event)
	track.value?.style.setProperty("--p", String(ratio))
	second.value = Math.floor(ratio * duration.value)
	el.currentTime = ratio * duration.value
}

function onScrubStart(event: PointerEvent) {
	const el = props.video
	if (!el || !duration.value || event.button !== 0) return

	track.value?.setPointerCapture(event.pointerId)
	resuming.value = !el.paused
	if (resuming.value) el.pause()
	scrubbing.value = true
	scrubTo(event)
}

function onScrubMove(event: PointerEvent) {
	if (scrubbing.value) scrubTo(event)
}

function onScrubEnd() {
	if (!scrubbing.value) return

	scrubbing.value = false
	if (resuming.value) {
		props.video
			?.play()
			.catch(() => {})
			.finally(() => (resuming.value = false))
	}
	wake()
}

function onTrackKeydown(event: KeyboardEvent) {
	const actions: Record<string, () => void> = {
		ArrowLeft: () => seekBy(-SEEK_STEP),
		ArrowDown: () => seekBy(-SEEK_STEP),
		ArrowRight: () => seekBy(SEEK_STEP),
		ArrowUp: () => seekBy(SEEK_STEP),
		Home: () => seek(0),
		End: () => seek(duration.value),
	}
	const action = actions[event.key]
	if (!action) return

	event.preventDefault()
	action()
}

onMounted(() => document.addEventListener("fullscreenchange", syncFullscreen))

onBeforeUnmount(() => {
	document.removeEventListener("fullscreenchange", syncFullscreen)
	clearTimeout(idleTimer)
	stopLoop()
})
</script>

<template>
	<span
		role="group"
		aria-label="Video controls"
		tabindex="0"
		:class="[
			'group/player @container absolute inset-0 block outline-0 select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white/70',
			visible ? '' : 'cursor-none',
		]"
		@click.self="onSurfaceClick"
		@pointermove="wake()"
		@pointerleave="onLeave"
		@keydown="onKeydown"
		@focusin="onFocusIn"
		@focusout="keyboardFocus = false"
	>
		<!-- Play indicator: decorative, the click goes through to the surface. -->
		<span
			aria-hidden="true"
			:class="[
				'pointer-events-none absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur-md transition-[opacity,scale,visibility] duration-300 ease-out motion-reduce:transition-none',
				showPaused
					? 'visible scale-100 opacity-100 group-hover/player:scale-110'
					: 'invisible scale-75 opacity-0',
			]"
		>
			<svg
				class="size-6 translate-x-px"
				viewBox="0 0 24 24"
				fill="currentColor"
				focusable="false"
			>
				<path
					d="M7 4.6a1 1 0 0 1 1.52-.85l11.2 7.4a1 1 0 0 1 0 1.7l-11.2 7.4A1 1 0 0 1 7 19.4V4.6Z"
				/>
			</svg>
		</span>

		<span
			:class="[
				'absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-full bg-black/55 p-1 text-white ring-1 ring-white/10 backdrop-blur-md transition-[opacity,translate,visibility] duration-300 ease-out motion-reduce:transition-none @md:inset-x-4 @md:bottom-4 @md:gap-1.5 @md:p-1.5',
				visible
					? 'visible translate-y-0 opacity-100'
					: 'invisible translate-y-2 opacity-0',
			]"
		>
			<button
				type="button"
				:class="button"
				:aria-label="showPaused ? 'Play' : 'Pause'"
				@click="togglePlay"
			>
				<span class="grid size-5 place-items-center">
					<svg
						:class="[
							stacked,
							showPaused ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
						]"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
					>
						<path
							d="M7 4.6a1 1 0 0 1 1.52-.85l11.2 7.4a1 1 0 0 1 0 1.7l-11.2 7.4A1 1 0 0 1 7 19.4V4.6Z"
						/>
					</svg>
					<svg
						:class="[
							stacked,
							showPaused ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
						]"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
					>
						<rect x="6" y="4" width="4" height="16" rx="1.2" />
						<rect x="14" y="4" width="4" height="16" rx="1.2" />
					</svg>
				</span>
			</button>

			<span
				class="font-vg5000 hidden px-1 text-[0.65rem] tracking-wider whitespace-nowrap text-white/80 tabular-nums @sm:block"
			>
				{{ label }}
			</span>

			<span
				ref="track"
				role="slider"
				tabindex="0"
				aria-label="Seek"
				aria-valuemin="0"
				:aria-valuemax="Math.round(duration)"
				:aria-valuenow="second"
				:aria-valuetext="label"
				class="group/scrub relative mx-1 flex h-9 min-w-0 flex-1 cursor-pointer touch-none items-center outline-0 @md:mx-2"
				@pointerdown="onScrubStart"
				@pointermove="onScrubMove"
				@pointerup="onScrubEnd"
				@pointercancel="onScrubEnd"
				@keydown="onTrackKeydown"
			>
				<span class="@container relative block h-1 w-full">
					<span
						:class="[
							'absolute inset-0 origin-center overflow-hidden rounded-full bg-white/25 transition-transform duration-200 ease-out group-hover/scrub:scale-y-[1.75] group-focus-visible/scrub:scale-y-[1.75] motion-reduce:transition-none',
							scrubbing ? 'scale-y-[1.75]' : '',
						]"
					>
						<span class="absolute inset-0 origin-left scale-[var(--b,0)_1] bg-white/35" />
						<span class="absolute inset-0 origin-left scale-[var(--p,0)_1] bg-white" />
					</span>
					<span
						:class="[
							'absolute top-1/2 left-0 -mt-1.5 -ml-1.5 block size-3 [translate:calc(var(--p,0)*100cqw)_0] rounded-full bg-white shadow-md transition-[scale] duration-200 ease-out motion-reduce:transition-none',
							scrubbing
								? 'scale-100'
								: 'scale-0 group-hover/scrub:scale-100 group-focus-visible/scrub:scale-100',
						]"
					/>
				</span>
			</span>

			<button
				type="button"
				:class="button"
				:aria-label="muted ? 'Unmute' : 'Mute'"
				@click="toggleMute"
			>
				<svg
					class="size-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M11 5 6 9H3v6h3l5 4V5Z" />
					<template v-if="muted">
						<path d="m22 9-6 6" />
						<path d="m16 9 6 6" />
					</template>
					<template v-else>
						<path d="M15.5 8.5a5 5 0 0 1 0 7" />
						<path d="M18.5 5.5a9 9 0 0 1 0 13" />
					</template>
				</svg>
			</button>

			<button
				type="button"
				:class="button"
				:aria-label="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
				@click="toggleFullscreen"
			>
				<svg
					class="size-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					focusable="false"
				>
					<template v-if="fullscreen">
						<path d="M8 3v3a2 2 0 0 1-2 2H3" />
						<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
						<path d="M3 16h3a2 2 0 0 1 2 2v3" />
						<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
					</template>
					<template v-else>
						<path d="M8 3H5a2 2 0 0 0-2 2v3" />
						<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
						<path d="M3 16v3a2 2 0 0 0 2 2h3" />
						<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
					</template>
				</svg>
			</button>
		</span>
	</span>
</template>
