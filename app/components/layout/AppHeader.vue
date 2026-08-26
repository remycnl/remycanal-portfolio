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
			style="visibility: hidden; opacity: 0; pointer-events: none"
			class="bg-violet bg-grid-violet pointer-events-auto fixed inset-x-0 top-0 z-0 h-screen overflow-hidden overscroll-contain md:hidden"
		>
			<div
				class="pointer-events-none absolute inset-x-0 top-18.5 bottom-0 flex flex-col items-center justify-center gap-6"
			>
				<NuxtLink
					v-for="(link, index) in links"
					:key="link.to"
					:ref="(el) => setMobileLinkRef(el, index)"
					:to="link.to"
					class="pointer-events-auto relative z-10 flex items-start gap-1.5 uppercase"
					:class="index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'"
					@click="onMobileLinkClick(index)"
				>
					<UiOutlineText
						:text="link.label"
						:active="isActive(link)"
						font-class="font-lineal-heavy text-4xl leading-none text-white sm:text-5xl"
					/>
					<span class="font-vg5000 shrink-0 text-[10px] leading-none text-white">
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
					class="font-lineal-bold relative hidden shrink-0 items-center gap-7 tracking-wide text-white uppercase md:flex"
					@mouseleave="onNavLeave"
				>
					<span
						ref="indicatorRef"
						class="bg-lime pointer-events-none absolute top-1/2 left-0 z-0 opacity-0 will-change-transform -translate-y-1/2 scale-[0.8] rounded-xs w-2 h-2"
					/>

					<NuxtLink
						v-for="(link, index) in links"
						:key="link.to"
						:ref="(el) => setLinkRef(el, index)"
						:to="link.to"
						class="relative z-10 block transition-colors duration-300"
						:class="{ 'text-lime': isActive(link) }"
						@mouseenter="onLinkEnter(index)"
						@focus="onLinkEnter(index)"
						@click="onLinkClick(index)"
					>
						<span
							v-for="(char, ci) in link.label.split('')"
							:key="ci"
							:ref="(el) => setNavCharRef(el, index, ci)"
							class="inline-block"
							style="opacity: 0"
						>
							{{ char === " " ? "\u00A0" : char }}
						</span>
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

const boxRef = useTemplateRef<HTMLElement>("boxRef")
const indicatorRef = useTemplateRef<HTMLElement>("indicatorRef")
const menuBtnRef = useTemplateRef<HTMLElement>("menuBtnRef")
const menuIconRef = useTemplateRef<HTMLElement>("menuIconRef")
const logoFlipRef = useTemplateRef<HTMLElement>("logoFlipRef")
const navRef = useTemplateRef<HTMLElement>("navRef")
const mobileOverlayRef = useTemplateRef<HTMLElement>("mobileOverlayRef")
const stickersLayerRef = useTemplateRef<HTMLElement>("stickersLayerRef")

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

const linkEls: (HTMLElement | null)[] = []
const mobileLinkEls: (HTMLElement | null)[] = []
const navCharEls: (HTMLElement | null)[][] = []
const stickerRefs: (HTMLElement | null)[] = []

function getElementAt(
	elements: (HTMLElement | null)[],
	index: number
): HTMLElement | null {
	return elements[index] ?? null
}

function setLinkRef(el: any, index: number) {
	linkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

function setMobileLinkRef(el: any, index: number) {
	mobileLinkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

function setNavCharRef(el: any, index: number, charIndex: number) {
	if (!navCharEls[index]) {
		navCharEls[index] = []
	}

	navCharEls[index][charIndex] = (el?.$el ?? el) as HTMLElement | null
}

function setStickerRef(el: any, index: number) {
	stickerRefs[index] = (el?.$el ?? el) as HTMLElement | null
}

const visibleStickers = ref<MenuSticker[]>([])
const open = ref(false)

let onLinkEnter: (index: number) => void = () => {}
let onNavLeave: () => void = () => {}
let onLinkClick: (index: number) => void = () => {}
let onMobileLinkClick: (index: number) => void = () => {}
let onMenuIconPress: () => void = () => {}
let onMenuIconRelease: () => void = () => {}
let toggleMenu: () => void = () => {}
let closeMenu: () => void = () => {}

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

	let hideTimer: ReturnType<typeof setTimeout> | null = null
	let isIndicatorVisible = false

	function clearHideTimer() {
		if (hideTimer) {
			clearTimeout(hideTimer)
		}

		hideTimer = null
	}

	function hideIndicator(delay = 120) {
		clearHideTimer()

		isIndicatorVisible = false

		hideTimer = setTimeout(() => {
			const indicator = indicatorRef.value

			if (!indicator) return

			gsap.to(indicator, {
				opacity: 0,
				scale: 0.9,
				duration: 0.22,
				ease: "power2.out",
				overwrite: "auto",
			})
		}, delay)
	}

	const CUBE_SIZE = 8
	const LINE_HEIGHT = 3
	const CUBE_GAP = 4

	function getCubeTargetX(link: HTMLElement) {
		return link.offsetLeft - CUBE_GAP - CUBE_SIZE
	}

	function moveIndicatorTo(index: number) {
		const link = getElementAt(linkEls, index)
		const indicator = indicatorRef.value

		if (!link || !indicator) return

		const targetX = getCubeTargetX(link)

		gsap.killTweensOf(indicator)

		if (!isIndicatorVisible) {
			gsap.set(indicator, {
				x: targetX,
				yPercent: -50,
				width: CUBE_SIZE,
				height: CUBE_SIZE,
				borderRadius: 2,
			})

			gsap.to(indicator, {
				opacity: 1,
				scale: 1,
				duration: 0.16,
				ease: "power2.out",
				overwrite: "auto",
			})

			isIndicatorVisible = true
			return
		}

		const currentX = Number(gsap.getProperty(indicator, "x"))

		if (Math.abs(targetX - currentX) < 0.5) return

		const leftEdge = Math.min(currentX, targetX)
		const rightEdge = Math.max(currentX, targetX) + CUBE_SIZE
		const travelWidth = rightEdge - leftEdge

		gsap
			.timeline({ overwrite: "auto" })
			.to(indicator, {
				x: leftEdge,
				width: travelWidth,
				height: LINE_HEIGHT,
				borderRadius: 1.5,
				opacity: 1,
				scale: 1,
				duration: 0.28,
				ease: "power3.out",
			})
			.to(
				indicator,
				{
					x: targetX,
					width: CUBE_SIZE,
					height: CUBE_SIZE,
					borderRadius: 2,
					duration: 0.5,
					ease: "elastic.out(1, 0.6)",
				},
				"-=0.02"
			)
	}

	onLinkEnter = (index) => {
		clearHideTimer()
		moveIndicatorTo(index)
	}

	onNavLeave = () => hideIndicator(140)

	function bounceLink(el: HTMLElement | null) {
		if (!el || prefersReducedMotion || !isTouchDevice) return

		gsap.killTweensOf(el)

		gsap
			.timeline()
			.set(el, {
				transformOrigin: "50% 50%",
				willChange: "transform",
			})
			.to(el, {
				scale: 0.9,
				duration: 0.1,
				ease: "power2.out",
			})
			.to(el, {
				scale: 1.08,
				duration: 0.2,
				ease: "back.out(2.8)",
			})
			.to(el, {
				scale: 1,
				duration: 0.28,
				ease: "elastic.out(1, 0.55)",
				clearProps: "willChange",
			})
	}

	onLinkClick = (index) => {
		const link = getElementAt(linkEls, index)

		bounceLink(link)

		const indicator = indicatorRef.value

		if (!indicator || !isIndicatorVisible) return

		gsap
			.timeline({ overwrite: "auto" })
			.to(indicator, {
				scale: 0.85,
				duration: 0.12,
				ease: "power2.in",
			})
			.to(indicator, {
				scale: 1,
				duration: 0.32,
				ease: "back.out(2.5)",
			})
	}

	onMobileLinkClick = (index) => {
		const link = getElementAt(mobileLinkEls, index)

		bounceLink(link)

		if (prefersReducedMotion) {
			closeMenu()
			return
		}

		window.setTimeout(() => {
			if (open.value) {
				closeMenu()
			}
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

	gsap.set([...cornerDots, ...centerDot, ...edgeDots], {
		transformOrigin: "50% 50%",
	})

	if (menuIconRef.value) {
		gsap.set(menuIconRef.value, {
			transformOrigin: "50% 50%",
			scaleX: 1,
			scaleY: 1,
			force3D: true,
		})
	}

	const setIconPressScaleX = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "scaleX", {
				duration: 0.32,
				ease: "power3.out",
			})
		: null

	const setIconPressScaleY = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "scaleY", {
				duration: 0.32,
				ease: "power3.out",
			})
		: null

	const setIconPressY = menuIconRef.value
		? gsap.quickTo(menuIconRef.value, "y", {
				duration: 0.32,
				ease: "power3.out",
			})
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
			gsap.set(logo, {
				rotationY: rotation,
				rotationX: 0,
				rotationZ: 0,
			})

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

	async function playHeaderIntro() {
		const box = boxRef.value
		const logo = logoFlipRef.value

		if (!box || !logo) return

		const offFlowEls = [navRef.value, menuBtnRef.value].filter((el): el is HTMLElement =>
			Boolean(el)
		)

		const naturalWidth = box.getBoundingClientRect().width

		const circleSize = box.getBoundingClientRect().height

		const boxStyles = window.getComputedStyle(box)

		const naturalPaddingX = parseFloat(boxStyles.paddingLeft)

		const collapsedPaddingX = parseFloat(boxStyles.paddingTop)

		const charGroups = navCharEls.map((chars) =>
			(chars ?? []).filter((el): el is HTMLElement => Boolean(el))
		)

		const d = prefersReducedMotion ? 0.01 : 1

		introInProgress = true

		gsap.set(box, {
			visibility: "visible",
			width: circleSize,
			paddingLeft: collapsedPaddingX,
			paddingRight: collapsedPaddingX,
			opacity: 0,
			y: -64,
			contain: "layout paint style",
			transition: "none",
			willChange: "opacity, transform",
			force3D: true,
		})

		gsap.set(logo, {
			pointerEvents: "none",
			rotationY: 0,
			rotationX: 0,
			rotationZ: 0,
		})

		gsap.set(charGroups.flat(), {
			opacity: 0,
			force3D: false,
		})

		gsap.set(offFlowEls, {
			display: "none",
		})

		if (menuBtnRef.value) {
			gsap.set(menuBtnRef.value, {
				autoAlpha: 0,
			})
		}

		await gsap.delayedCall(1 * d, () => {})

		await gsap.to(box, {
			y: 0,
			opacity: 1,
			duration: 0.9 * d,
			ease: "power3.out",
		})

		await playLogoWiggle()

		const tl = gsap.timeline({
			defaults: {
				overwrite: "auto",
				force3D: true,
			},

			onComplete: () => {
				gsap.set(box, {
					clearProps:
						"width,paddingLeft,paddingRight,opacity,y,willChange,transition,force3D,contain",
				})

				gsap.set(logo, {
					clearProps: "pointerEvents",
				})

				introInProgress = false
				hasPlayedIntro = true
			},
		})

		tl.to(box, {
			width: naturalWidth,
			paddingLeft: naturalPaddingX,
			paddingRight: naturalPaddingX,
			duration: 1.05 * d,
			ease: "back.out(1.7)",
			onStart: () => {
				gsap.set(box, {
					willChange: "width, padding",
				})
			},
		})
			.set(
				offFlowEls,
				{
					clearProps: "display",
				},
				"-=0.35"
			)
			.addLabel("links", "-=0.4")

		if (menuBtnRef.value) {
			tl.to(
				menuBtnRef.value,
				{
					autoAlpha: 1,
					scale: 1,
					duration: 0.5 * d,
					ease: "elastic.out(1, 0.6)",
				},
				"links"
			)
		}

		charGroups.forEach((chars, index) => {
			if (!chars.length) return

			tl.to(
				chars,
				{
					opacity: 1,
					duration: 0.22 * d,
					stagger: 0.035 * d,
					ease: "power1.out",
					force3D: false,
					clearProps: "opacity",
				},
				`links+=${index * 0.1 * d}`
			)
		})
	}

	if (hasPlayedIntro) {
		gsap.set(boxRef.value, {
			visibility: "visible",
		})

		gsap.set(
			navCharEls.flat().filter((el): el is HTMLElement => Boolean(el)),
			{
				clearProps: "opacity",
			}
		)
	} else {
		waitForFonts().then(playHeaderIntro)
	}

	let mobileMenuTween: gsap.core.Tween | gsap.core.Timeline | null = null

	let stickerOpenTween: ReturnType<typeof gsap.timeline> | null = null

	let stickerCloseTween: ReturnType<typeof gsap.timeline> | null = null

	let stickerTimers: ReturnType<typeof setTimeout>[] = []

	const STICKER_OPEN_DELAY = 0.25
	const STICKER_STAGGER = 0.08
	const STICKER_CLOSE_STAGGER = 0.045
	const STICKER_CLOSE_DURATION = 0.28

	function killStickerTween(tween: ReturnType<typeof gsap.timeline> | null) {
		tween?.kill()
	}

	function clearStickerTimers() {
		stickerTimers.forEach(clearTimeout)
		stickerTimers = []
	}

	function popStickers() {
		clearStickerTimers()
		killStickerTween(stickerOpenTween)
		killStickerTween(stickerCloseTween)

		visibleStickers.value = [...stickers]

		nextTick(() => {
			const d = prefersReducedMotion ? 0.01 : 1

			stickerRefs.forEach((el, index) => {
				if (!el) return

				const sticker = stickers[index]

				if (!sticker) return

				const jitter = gsap.utils.random(-4, 4)

				gsap.set(el, {
					opacity: 0,
					scale: 0.25,
					y: 60,
					rotation: sticker.rotate - 35,
					transformOrigin: "50% 50%",
					force3D: true,
					pointerEvents: "none",
				})

				const timer = setTimeout(
					() => {
						if (!open.value) return

						el.style.pointerEvents = "auto"
						el.style.willChange = "transform, opacity"

						gsap
							.timeline({
								onComplete: () => {
									el.style.willChange = "auto"
								},
							})
							.to(
								el,
								{
									opacity: 1,
									duration: 0.25 * d,
									ease: "power1.out",
								},
								0
							)
							.to(
								el,
								{
									y: 0,
									scale: 1,
									duration: 0.6 * d,
									ease: "elastic.out(1, 0.55)",
								},
								0
							)
							.to(
								el,
								{
									rotation: sticker.rotate + jitter,
									duration: 0.6 * d,
									ease: "elastic.out(1, 0.65)",
								},
								0
							)
					},
					(STICKER_OPEN_DELAY + index * STICKER_STAGGER) * 1000
				)

				stickerTimers.push(timer)
			})
		})
	}

	function depopStickers() {
		clearStickerTimers()
		killStickerTween(stickerOpenTween)
		killStickerTween(stickerCloseTween)

		const elements = stickerRefs.filter((el): el is HTMLElement => Boolean(el))

		const d = prefersReducedMotion ? 0.01 : 1

		if (!elements.length) {
			visibleStickers.value = []
			stickerRefs.length = 0
			return
		}

		const tl = gsap.timeline({
			onComplete: () => {
				visibleStickers.value = []
				stickerRefs.length = 0
			},
		})

		elements
			.slice()
			.reverse()
			.forEach((el, index) => {
				tl.to(
					el,
					{
						opacity: 0,
						scale: 0.25,
						y: 60,
						rotation: "-=35",
						duration: STICKER_CLOSE_DURATION * d,
						ease: "power2.in",
						overwrite: "auto",
					},
					index * STICKER_CLOSE_STAGGER * d
				)
			})

		stickerCloseTween = tl
	}

	function playMobileMenuOpen() {
		const overlay = mobileOverlayRef.value

		if (!overlay) return

		mobileMenuTween?.kill()

		const d = prefersReducedMotion ? 0.01 : 1

		gsap.set(overlay, {
			autoAlpha: 1,
			pointerEvents: "auto",
		})

		if (prefersReducedMotion) {
			gsap.set(overlay, {
				opacity: 1,
				scale: 1,
			})

			popStickers()
			return
		}

		gsap.set(overlay, {
			opacity: 0,
			scale: 0.98,
			transformOrigin: "50% 50%",
			force3D: true,
		})

		mobileMenuTween = gsap.to(overlay, {
			opacity: 1,
			scale: 1,
			duration: 0.38 * d,
			ease: "power3.out",
			force3D: true,
			onComplete: () => {
				gsap.set(overlay, {
					clearProps: "opacity,scaleX,scaleY,transformOrigin,force3D",
				})

				popStickers()
			},
		})
	}

	function playMobileMenuClose() {
		const overlay = mobileOverlayRef.value

		if (!overlay) return

		mobileMenuTween?.kill()

		const d = prefersReducedMotion ? 0.01 : 1

		depopStickers()

		if (prefersReducedMotion) {
			gsap.set(overlay, {
				autoAlpha: 0,
				pointerEvents: "none",
			})

			return
		}

		mobileMenuTween = gsap.to(overlay, {
			opacity: 0,
			scale: 0.98,
			duration: 0.28 * d,
			delay: 0.15 * d,
			ease: "power2.in",
			force3D: true,
			onComplete: () => {
				gsap.set(overlay, {
					autoAlpha: 0,
					pointerEvents: "none",
					clearProps: "opacity,scaleX,scaleY,transformOrigin,force3D",
				})
			},
		})
	}

	function animateMenuIcon(isOpen: boolean) {
		const d = prefersReducedMotion ? 0.01 : 1

		const dots = [...cornerDots, ...centerDot, ...edgeDots]

		gsap.killTweensOf(dots)

		if (isOpen) {
			gsap
				.timeline()
				.to(edgeDots, {
					scale: 0,
					opacity: 0,
					duration: 0.4 * d,
					ease: "power2.inOut",
				})
				.to(
					[...cornerDots, ...centerDot],
					{
						scale: 1.18,
						duration: 0.24 * d,
						ease: "power2.out",
					},
					"<"
				)
				.to(
					[...cornerDots, ...centerDot],
					{
						scale: 1,
						duration: 0.4 * d,
						ease: "elastic.out(1, 0.55)",
					},
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

	toggleMenu = () => {
		const nextOpen = !open.value

		open.value = nextOpen

		animateMenuIcon(nextOpen)
		animateLogoFlip(nextOpen)

		if (nextOpen) {
			lockScroll()
			playMobileMenuOpen()
		} else {
			unlockScroll()
			playMobileMenuClose()
		}
	}

	closeMenu = () => {
		if (!open.value) return

		open.value = false

		animateMenuIcon(false)
		animateLogoFlip(false)

		unlockScroll()
		playMobileMenuClose()
	}

	function onDocumentClick(e: MouseEvent) {
		if (!open.value) return

		const target = e.target as Node

		if (boxRef.value && !boxRef.value.contains(target)) {
			closeMenu()
		}
	}

	document.addEventListener("click", onDocumentClick, {
		passive: true,
	})

	return () => {
		clearHideTimer()
		clearStickerTimers()

		document.removeEventListener("click", onDocumentClick)

		mobileMenuTween?.kill()

		killStickerTween(stickerOpenTween)
		killStickerTween(stickerCloseTween)

		gsap.killTweensOf([
			boxRef.value,
			indicatorRef.value,
			menuBtnRef.value,
			menuIconRef.value,
			logoFlipRef.value,
			mobileOverlayRef.value,
			stickersLayerRef.value,
			...stickerRefs,
			...linkEls,
			...mobileLinkEls,
			...navCharEls.flat(),
			...cornerDots,
			...centerDot,
			...edgeDots,
		])

		if (open.value) {
			unlockScroll()
		}

		document.removeEventListener("touchmove", onTouchMoveLock)
		document.removeEventListener("wheel", onWheelLock)
	}
}, boxRef)
</script>
