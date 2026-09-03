<template>
	<header class="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
		<svg width="0" height="0" class="absolute" aria-hidden="true">
			<defs>
				<filter id="nav-text-outline" x="-20%" y="-20%" width="140%" height="140%">
					<feMorphology
						operator="dilate"
						radius="1.1"
						in="SourceAlpha"
						result="dilated"
					/>
					<feComposite in="dilated" in2="SourceAlpha" operator="out" result="outline" />
					<feFlood flood-color="#ffffff" result="color" />
					<feComposite in="color" in2="outline" operator="in" result="coloredOutline" />
					<feMerge>
						<feMergeNode in="coloredOutline" />
					</feMerge>
				</filter>
			</defs>
		</svg>

		<div
			ref="mobileOverlayRef"
			:style="mobileOverlayStyle"
			class="pointer-events-auto fixed inset-x-0 top-0 z-0 h-svh overflow-hidden overscroll-contain md:hidden"
		>
			<UiPixelReveal
				:active="overlayActive"
				direction="corners"
				base-color="--color-violet"
				accent-color="--color-gray-light"
				:in-duration="MOBILE_REVEAL_IN"
				:out-duration="MOBILE_REVEAL_OUT"
				@opened="onOverlayOpened"
				@closed="onOverlayClosed"
			/>

			<div
				class="pointer-events-none absolute inset-x-0 top-18.5 bottom-0 flex flex-col items-center justify-center gap-6"
			>
				<NuxtLink
					v-for="(link, index) in links"
					:key="link.to"
					:ref="(el) => setMobileLinkRef(el, index)"
					:to="link.to"
					class="pointer-events-auto relative z-10 inline-block uppercase"
					@click="onMobileLinkClick(index)"
				>
					<UiOutlineText
						:text="link.label"
						:active="isActive(link)"
						font-class="font-lineal-heavy text-4xl leading-none text-white sm:text-5xl"
					/>
					<span
						class="font-vg5000 absolute top-0 text-[10px] leading-none text-white"
						:class="index % 2 === 0 ? 'left-full ml-1.5' : 'right-full mr-1.5'"
					>
						{{ String(index + 1).padStart(2, "0") }}
					</span>
				</NuxtLink>
			</div>

			<div
				ref="stickersLayerRef"
				data-drag-bounds
				class="pointer-events-none fixed inset-0 z-20"
			>
				<UiPopImage
					v-for="(sticker, index) in visibleStickers"
					:key="sticker.id"
					:ref="(el) => setStickerRef(el, index)"
					:src="sticker.src"
					alt=""
					:rotate="sticker.rotate"
					:animate="false"
					draggable
					:data-index="index"
					:img-class="`pointer-events-auto absolute z-[999] ${sticker.class}`"
				/>
			</div>
		</div>

		<div
			ref="boxRef"
			style="visibility: hidden"
			:class="
				open
					? 'border-white bg-white text-black'
					: 'border-black-light bg-black text-white'
			"
			class="pointer-events-auto relative z-10 flex flex-col overflow-hidden rounded-lg border px-6 py-2.5 transition-[background-color,border-color,color,padding-left,padding-right] duration-400 lg:hover:px-10"
		>
			<div class="flex items-center justify-between gap-10 md:justify-start">
				<NuxtLink
					to="/"
					class="flex max-h-8 max-w-8 shrink-0 items-center justify-center select-none"
					@contextmenu.prevent
					@click="closeMenu"
				>
					<span
						ref="logoFlipRef"
						class="relative block h-8 w-8"
						style="perspective: 800px; transform-style: preserve-3d"
						@mouseenter="onLogoEnter"
						@mouseleave="onLogoLeave"
						@pointerdown="onLogoPress"
					>
						<img
							src="/logos/R-lime.svg"
							alt="Rémy Canal"
							width="32"
							height="32"
							class="absolute inset-0 h-8 w-8"
							style="backface-visibility: hidden; -webkit-backface-visibility: hidden"
						/>

						<img
							src="/logos/R-violet.svg"
							alt=""
							aria-hidden="true"
							width="32"
							height="32"
							class="absolute inset-0 h-8 w-8"
							style="
								transform: rotateY(180deg);
								backface-visibility: hidden;
								-webkit-backface-visibility: hidden;
							"
						/>
					</span>
				</NuxtLink>

				<nav
					ref="navRef"
					class="font-lineal-bold hidden shrink-0 items-center gap-7 tracking-wide text-white uppercase md:flex"
				>
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						v-roll-hover
						class="hover:text-lime lg:hover:text-gray-light focus-visible:text-lime relative block transition-colors duration-300"
						:class="{ 'text-lime lg:hover:text-lime!': isActive(link) }"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>

				<button
					ref="menuBtnRef"
					:class="open ? 'text-black-light' : 'text-white'"
					class="relative flex h-8 w-8 items-center justify-center self-center md:hidden"
					aria-label="Menu"
					:aria-expanded="open"
					@click="toggleMenu"
					@pointerdown="onMenuIconPress"
					@pointerup="onMenuIconRelease"
					@pointerleave="onMenuIconRelease"
					@pointercancel="onMenuIconRelease"
					@lostpointercapture="onMenuIconRelease"
				>
					<svg ref="menuIconRef" width="24" height="24" viewBox="0 0 18 18" fill="none">
						<circle class="dot dot-c" cx="3" cy="3" r="1.7" fill="currentColor" />
						<circle class="dot dot-e" cx="9" cy="3" r="1.7" fill="currentColor" />
						<circle class="dot dot-c" cx="15" cy="3" r="1.7" fill="currentColor" />
						<circle class="dot dot-e" cx="3" cy="9" r="1.7" fill="currentColor" />
						<circle class="dot dot-m" cx="9" cy="9" r="1.7" fill="currentColor" />
						<circle class="dot dot-e" cx="15" cy="9" r="1.7" fill="currentColor" />
						<circle class="dot dot-c" cx="3" cy="15" r="1.7" fill="currentColor" />
						<circle class="dot dot-e" cx="9" cy="15" r="1.7" fill="currentColor" />
						<circle class="dot dot-c" cx="15" cy="15" r="1.7" fill="currentColor" />
					</svg>
				</button>
			</div>

			<canvas
				v-if="showRevealCanvas"
				ref="revealCanvasRef"
				style="visibility: visible"
				class="pointer-events-none absolute inset-0 z-20 block"
				aria-hidden="true"
			/>
		</div>
	</header>
</template>

<script setup lang="ts">
let hasPlayedIntro = false

const route = useRoute()

const links = [
	{ to: "/", label: "Home" },
	{ to: "/about", label: "About" },
	{ to: "/work", label: "Work" },
	{ to: "/resume", label: "Resume" },
	{ to: "/blog", label: "Blog" },
	{ to: "/templates", label: "Templates" },
	{ to: "/contact", label: "Contact" },
]

interface MenuSticker {
	id: string
	src: string
	rotate: number
	class: string
}

const stickers: MenuSticker[] = [
	{
		id: "remy",
		src: "/stickers/sticker-remy.png",
		rotate: -16,
		class: "top-[22%] left-[10%] w-20 sm:top-[20%] sm:left-[15%] sm:w-20",
	},
	{
		id: "wave",
		src: "/stickers/sticker-wave.png",
		rotate: 18,
		class: "top-[27%] right-[10%] w-20 sm:top-[25%] sm:right-[15%] sm:w-20",
	},
	{
		id: "raven",
		src: "/stickers/sticker-raven.png",
		rotate: -5,
		class: "top-[47%] left-[7%] w-20 sm:top-[45%] sm:left-[13%] sm:w-20",
	},
	{
		id: "computer",
		src: "/stickers/sticker-computer.png",
		rotate: 24,
		class: "top-[55%] right-[7%] w-20 sm:top-[60%] sm:right-[13%] sm:w-20",
	},
	{
		id: "robot",
		src: "/stickers/sticker-robot.png",
		rotate: -12,
		class: "bottom-[15%] left-[7%] w-20 sm:bottom-[20%] sm:left-[10%] sm:w-20",
	},
]

function isActive(link: { to: string }) {
	return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

function themeColor(name: string) {
	if (!name.startsWith("--")) return name
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const MOBILE_REVEAL_IN = 620
const MOBILE_REVEAL_OUT = 420

const boxRef = useTemplateRef<HTMLElement>("boxRef")
const revealCanvasRef = useTemplateRef<HTMLCanvasElement>("revealCanvasRef")
const menuBtnRef = useTemplateRef<HTMLElement>("menuBtnRef")
const menuIconRef = useTemplateRef<HTMLElement>("menuIconRef")
const logoFlipRef = useTemplateRef<HTMLElement>("logoFlipRef")
const mobileOverlayRef = useTemplateRef<HTMLElement>("mobileOverlayRef")
const stickersLayerRef = useTemplateRef<HTMLElement>("stickersLayerRef")

const open = ref(false)

const overlayActive = ref(false)
const showRevealCanvas = ref(!hasPlayedIntro)

const overlayShown = ref(false)
const overlayInteractive = ref(false)
const mobileOverlayStyle = computed(() => ({
	visibility: overlayShown.value ? ("visible" as const) : ("hidden" as const),
	pointerEvents: overlayInteractive.value ? ("auto" as const) : ("none" as const),
}))

const {
	onWiggleEnter: onLogoEnterBase,
	onWiggleLeave: onLogoLeave,
	onWigglePress: onLogoPress,
	wiggle: playLogoWiggle,
} = useWiggle(logoFlipRef)

let introInProgress = false

function onLogoEnter() {
	if (introInProgress) return
	onLogoEnterBase()
}

const mobileLinkEls: (HTMLElement | null)[] = []
const stickerRefs: (HTMLElement | null)[] = []

function setMobileLinkRef(el: any, index: number) {
	mobileLinkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

function setStickerRef(el: any, index: number) {
	stickerRefs[index] = (el?.$el ?? el) as HTMLElement | null
}

const visibleStickers = ref<MenuSticker[]>([])

let onMobileLinkClick: (index: number) => void = () => {}
let onMenuIconPress: () => void = () => {}
let onMenuIconRelease: () => void = () => {}
let toggleMenu: () => void = () => {}
let closeMenu: () => void = () => {}
let onOverlayOpened: () => void = () => {}
let onOverlayClosed: () => void = () => {}

let lockedScrollY = 0

function getStableViewportHeight() {
	return Math.round(window.visualViewport?.height ?? window.innerHeight)
}

function isTouchLikeDevice() {
	return window.matchMedia("(hover: none), (pointer: coarse)").matches
}

function isDragTarget(target: EventTarget | null) {
	return target instanceof Element && Boolean(target.closest("[data-drag-bounds]"))
}

function onTouchMoveLock(e: TouchEvent) {
	if (isDragTarget(e.target)) return
	e.preventDefault()
}

function onWheelLock(e: WheelEvent) {
	if (isDragTarget(e.target)) return
	e.preventDefault()
}

let touchScrollLockActive = false

function lockScroll() {
	lockedScrollY = window.scrollY

	const viewportHeight = getStableViewportHeight()

	if (mobileOverlayRef.value) {
		mobileOverlayRef.value.style.height = `${viewportHeight}px`
	}

	document.documentElement.style.setProperty("--app-vh", `${viewportHeight}px`)

	if (isTouchLikeDevice()) {
		document.addEventListener("touchmove", onTouchMoveLock, { passive: false })
		document.addEventListener("wheel", onWheelLock, { passive: false })
		touchScrollLockActive = true
		return
	}

	const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

	document.body.style.overflow = "hidden"

	if (scrollbarWidth > 0) {
		document.body.style.paddingRight = `${scrollbarWidth}px`
	}
}

function unlockScroll() {
	if (touchScrollLockActive) {
		document.removeEventListener("touchmove", onTouchMoveLock)
		document.removeEventListener("wheel", onWheelLock)
		touchScrollLockActive = false
	}

	document.body.style.overflow = ""
	document.body.style.paddingRight = ""

	document.documentElement.style.removeProperty("--app-vh")

	if (mobileOverlayRef.value) {
		mobileOverlayRef.value.style.removeProperty("height")
	}

	window.scrollTo(0, lockedScrollY)
}

const { useGsapContext } = useGsap()

useGsapContext(({ gsap }) => {
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches

	const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches

	async function waitForFonts() {
		if (!("fonts" in document)) return
		try {
			await document.fonts.ready
		} catch {
			// noop
		}
	}

	function bounceLink(el: HTMLElement | null) {
		if (!el || prefersReducedMotion || !isTouchDevice) return

		gsap.killTweensOf(el)

		gsap
			.timeline()
			.set(el, { transformOrigin: "50% 50%", willChange: "transform" })
			.to(el, { scale: 0.9, duration: 0.1, ease: "power2.out" })
			.to(el, { scale: 1.08, duration: 0.2, ease: "back.out(2.8)" })
			.to(el, {
				scale: 1,
				duration: 0.28,
				ease: "elastic.out(1, 0.55)",
				clearProps: "willChange",
			})
	}

	onMobileLinkClick = (index) => {
		bounceLink(mobileLinkEls[index] ?? null)

		if (prefersReducedMotion) {
			closeMenu()
			return
		}

		window.setTimeout(() => {
			if (open.value) closeMenu()
		}, 110)
	}

	const cornerDots = menuIconRef.value
		? Array.from(menuIconRef.value.querySelectorAll(".dot-c"))
		: []
	const centerDot = menuIconRef.value
		? Array.from(menuIconRef.value.querySelectorAll(".dot-m"))
		: []
	const edgeDots = menuIconRef.value
		? Array.from(menuIconRef.value.querySelectorAll(".dot-e"))
		: []

	gsap.set([...cornerDots, ...centerDot, ...edgeDots], { transformOrigin: "50% 50%" })

	if (menuIconRef.value) {
		gsap.set(menuIconRef.value, {
			transformOrigin: "50% 50%",
			scaleX: 1,
			scaleY: 1,
			force3D: true,
		})
	}

	const setIconPressScaleX = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "scaleX", { duration: 0.32, ease: "power3.out" })
		: null
	const setIconPressScaleY = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "scaleY", { duration: 0.32, ease: "power3.out" })
		: null
	const setIconPressY = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "y", { duration: 0.32, ease: "power3.out" })
		: null

	let isIconPressed = false

	onMenuIconPress = () => {
		if (prefersReducedMotion || isIconPressed) return
		isIconPressed = true
		setIconPressScaleX?.(0.78)
		setIconPressScaleY?.(0.78)
		setIconPressY?.(1.5)
	}

	onMenuIconRelease = () => {
		if (prefersReducedMotion || !isIconPressed) return
		isIconPressed = false
		setIconPressScaleX?.(1)
		setIconPressScaleY?.(1)
		setIconPressY?.(0)
	}

	function animateLogoFlip(isOpen: boolean) {
		const logo = logoFlipRef.value
		if (!logo) return

		const rotation = isOpen ? 180 : 0

		gsap.killTweensOf(logo)

		if (prefersReducedMotion) {
			gsap.set(logo, { rotationY: rotation, rotationX: 0, rotationZ: 0 })
			return
		}

		gsap.to(logo, {
			rotationY: rotation,
			rotationX: isOpen ? -2 : 0,
			rotationZ: isOpen ? 1 : 0,
			duration: 0.55,
			ease: "power2.inOut",
			transformPerspective: 800,
			transformOrigin: "50% 50%",
			force3D: true,
			overwrite: "auto",
		})
	}

	async function revealHeader() {
		const boxEl = boxRef.value
		const canvasEl = revealCanvasRef.value

		if (!boxEl) return

		if (!canvasEl || prefersReducedMotion) {
			gsap.set(boxEl, { visibility: "visible" })
			hasPlayedIntro = true
			return
		}

		introInProgress = true

		const getBoxSize = () => {
			const rect = boxEl.getBoundingClientRect()
			return { width: rect.width, height: rect.height }
		}

		const engine = createPixelWipeEngine({
			gsap,
			getCanvas: () => canvasEl,
			getSize: getBoxSize,
			cellSize: () => {
				const { width, height } = getBoxSize()
				const shortSide = Math.min(width, height)
				return Math.max(4, Math.min(14, Math.round(shortSide / 6)))
			},
		})

		engine.resize()
		engine.fillInstant(themeColor("--color-black"))

		gsap.set(boxEl, { visibility: "visible" })

		await Promise.all([waitForFonts(), waitForAppReady()])

		engine.resize()

		await engine.run({
			mode: "out",
			direction: "left",
			colors: {
				base: themeColor("--color-black"),
				accent: themeColor("--color-lime"),
			},
			duration: 700,
		})

		engine.destroy()
		showRevealCanvas.value = false
		hasPlayedIntro = true
		introInProgress = false

		playLogoWiggle()
	}

	if (hasPlayedIntro) {
		gsap.set(boxRef.value, { visibility: "visible" })
	} else {
		revealHeader()
	}

	// --- Liens de l'overlay mobile --------------------------------------

	const d = prefersReducedMotion ? 0.01 : 1

	const LINK_POP_BEAT = 0.04
	const LINK_POP_STAGGER = 0.06
	const LINK_CLOSE_STAGGER = 0.035
	const LINK_CLOSE_DURATION = 0.2

	let linksTimeline: ReturnType<typeof gsap.timeline> | null = null

	function resetLinksHidden(els: HTMLElement[]) {
		gsap.set(els, {
			opacity: 0,
			y: 24,
			scale: 0.92,
			pointerEvents: "none",
			transformOrigin: "50% 50%",
		})
	}

	resetLinksHidden(mobileLinkEls.filter((el): el is HTMLElement => Boolean(el)))

	function popLinks() {
		linksTimeline?.kill()

		const els = mobileLinkEls.filter((el): el is HTMLElement => Boolean(el))
		if (!els.length) return

		resetLinksHidden(els)

		linksTimeline = gsap
			.timeline({
				onStart: () => els.forEach((el) => (el.style.pointerEvents = "auto")),
			})
			.to(
				els,
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.5 * d,
					ease: "back.out(1.8)",
					stagger: LINK_POP_STAGGER * d,
				},
				LINK_POP_BEAT * d
			)
	}

	function depopLinks(): Promise<void> {
		linksTimeline?.kill()

		const els = mobileLinkEls.filter((el): el is HTMLElement => Boolean(el))
		if (!els.length) return Promise.resolve()

		return new Promise((resolve) => {
			linksTimeline = gsap
				.timeline({
					onStart: () => els.forEach((el) => (el.style.pointerEvents = "none")),
					onComplete: resolve,
				})
				.to(els, {
					opacity: 0,
					y: 16,
					scale: 0.92,
					duration: LINK_CLOSE_DURATION * d,
					ease: "power2.in",
					stagger: LINK_CLOSE_STAGGER * d,
					overwrite: "auto",
				})
		})
	}

	// --- Stickers ---------------------------------------------------------

	const STICKER_POP_BEAT = 0.04
	const STICKER_STAGGER = 0.08
	const STICKER_CLOSE_STAGGER = 0.045
	const STICKER_CLOSE_DURATION = 0.28

	let stickersTimeline: ReturnType<typeof gsap.timeline> | null = null

	function popStickers() {
		stickersTimeline?.kill()

		visibleStickers.value = [...stickers]

		nextTick(() => {
			const els = stickerRefs.filter((el): el is HTMLElement => Boolean(el))
			if (!els.length) return

			gsap.set(els, {
				opacity: 0,
				scale: 0.25,
				y: 60,
				rotation: (i: number) => stickers[i]!.rotate - 35,
				transformOrigin: "50% 50%",
				force3D: true,
				pointerEvents: "none",
			})

			stickersTimeline = gsap
				.timeline({
					onStart: () => els.forEach((el) => (el.style.pointerEvents = "auto")),
				})
				.to(
					els,
					{
						opacity: 1,
						duration: 0.25 * d,
						ease: "power1.out",
						stagger: STICKER_STAGGER * d,
					},
					STICKER_POP_BEAT * d
				)
				.to(
					els,
					{
						y: 0,
						scale: 1,
						duration: 0.6 * d,
						ease: "elastic.out(1, 0.55)",
						stagger: STICKER_STAGGER * d,
					},
					STICKER_POP_BEAT * d
				)
				.to(
					els,
					{
						rotation: (i: number) => stickers[i]!.rotate + gsap.utils.random(-4, 4),
						duration: 0.6 * d,
						ease: "elastic.out(1, 0.65)",
						stagger: STICKER_STAGGER * d,
					},
					STICKER_POP_BEAT * d
				)
		})
	}

	function depopStickers(): Promise<void> {
		stickersTimeline?.kill()

		const els = stickerRefs.filter((el): el is HTMLElement => Boolean(el))

		if (!els.length) {
			visibleStickers.value = []
			stickerRefs.length = 0
			return Promise.resolve()
		}

		return new Promise((resolve) => {
			stickersTimeline = gsap
				.timeline({
					onComplete: () => {
						visibleStickers.value = []
						stickerRefs.length = 0
						resolve()
					},
				})
				.to([...els].reverse(), {
					opacity: 0,
					scale: 0.25,
					y: 60,
					rotation: "-=35",
					duration: STICKER_CLOSE_DURATION * d,
					ease: "power2.in",
					stagger: STICKER_CLOSE_STAGGER * d,
					overwrite: "auto",
				})
		})
	}

	function animateMenuIcon(isOpen: boolean) {
		const dots = [...cornerDots, ...centerDot, ...edgeDots]

		gsap.killTweensOf(dots)

		if (isOpen) {
			gsap
				.timeline()
				.to(edgeDots, { scale: 0, opacity: 0, duration: 0.4 * d, ease: "power2.inOut" })
				.to(
					[...cornerDots, ...centerDot],
					{ scale: 1.18, duration: 0.24 * d, ease: "power2.out" },
					"<"
				)
				.to(
					[...cornerDots, ...centerDot],
					{ scale: 1, duration: 0.4 * d, ease: "elastic.out(1, 0.55)" },
					">-0.1"
				)
		} else {
			gsap.to(edgeDots, {
				scale: 1,
				opacity: 1,
				duration: 0.4 * d,
				ease: "power2.out",
				overwrite: "auto",
			})
		}
	}

	function openOverlayMenu() {
		open.value = true

		animateMenuIcon(true)
		animateLogoFlip(true)

		lockScroll()
		overlayInteractive.value = true
		overlayShown.value = true
		overlayActive.value = true
	}

	function closeOverlayMenu() {
		open.value = false

		animateMenuIcon(false)
		animateLogoFlip(false)

		overlayInteractive.value = false
		unlockScroll()

		Promise.all([depopLinks(), depopStickers()]).then(() => {
			overlayActive.value = false
		})
	}

	toggleMenu = () => (open.value ? closeOverlayMenu() : openOverlayMenu())

	closeMenu = () => {
		if (open.value) closeOverlayMenu()
	}

	onOverlayOpened = () => {
		if (!open.value) return
		popLinks()
		popStickers()
	}

	onOverlayClosed = () => {
		if (!open.value) overlayShown.value = false
	}

	function onDocumentClick(e: MouseEvent) {
		if (!open.value) return
		const target = e.target as Node
		if (boxRef.value && !boxRef.value.contains(target)) closeMenu()
	}

	document.addEventListener("click", onDocumentClick, { passive: true })

	return () => {
		document.removeEventListener("click", onDocumentClick)

		linksTimeline?.kill()
		stickersTimeline?.kill()

		gsap.killTweensOf([
			boxRef.value,
			menuBtnRef.value,
			menuIconRef.value,
			logoFlipRef.value,
			mobileOverlayRef.value,
			stickersLayerRef.value,
			...stickerRefs,
			...mobileLinkEls,
			...cornerDots,
			...centerDot,
			...edgeDots,
		])

		if (open.value) unlockScroll()

		document.removeEventListener("touchmove", onTouchMoveLock)
		document.removeEventListener("wheel", onWheelLock)
	}
}, boxRef)
</script>
