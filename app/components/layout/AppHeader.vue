<template>
	<header
		class="pointer-events-none fixed inset-x-0 top-5 z-9000 flex justify-center px-4"
	>
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
			class="pointer-events-auto fixed inset-x-0 top-0 z-0 h-screen overflow-hidden overscroll-contain md:hidden"
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

			<UiStickerPattern ref="stickerPatternRef" :srcs="stickerSrcs" />

			<div
				v-if="overlayShown"
				class="pointer-events-none absolute inset-x-0 top-18.5 bottom-0 flex flex-col items-center justify-center gap-6"
			>
				<NuxtLink
					v-for="(link, index) in links"
					:key="link.to"
					:ref="(el) => setMobileLinkRef(el, index)"
					:to="link.to"
					class="pointer-events-none relative z-10 inline-block uppercase opacity-0"
					@pointerdown="onMobileLinkPress(index)"
					@pointerup="onMobileLinkRelease(index, $event)"
					@pointerleave="onMobileLinkRelease(index, $event)"
					@pointercancel="onMobileLinkRelease(index, $event)"
					@click="onMobileLinkClick"
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
					<span class="sr-only">Rémy Canal</span>
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
							alt=""
							aria-hidden="true"
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
					class="font-lineal-bold hidden shrink-0 items-center gap-7 tracking-wide text-white uppercase md:flex"
				>
					<NuxtLink
						v-for="link in links"
						:key="link.to"
						:to="link.to"
						v-roll-hover
						class="hover:text-lime lg:hover:text-gray-light focus-visible:text-lime relative block transition-colors duration-300"
						:class="{ 'text-lime lg:hover:text-lime!': isActive(link) }"
						@pointerdown="onLinkPress"
						@pointerup="onLinkRelease"
						@pointerleave="onLinkRelease"
						@pointercancel="onLinkRelease"
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
		</div>
	</header>
</template>

<script setup lang="ts">
import type UiStickerPattern from "@/components/ui/StickerPattern.vue"

const route = useRoute()

const links = [
	{ to: "/", label: "Home" },
	{ to: "/about", label: "About" },
	{ to: "/work", label: "Work" },
	{ to: "/playground", label: "Playground" },
	{ to: "/resume", label: "Resume" },
	{ to: "/blog", label: "Blog" },
	{ to: "/contact", label: "Contact" },
]

const stickerSrcs = [
	"/stickers/character_violet.svg",
	"/stickers/flower_violet.svg",
	"/stickers/dog_violet.svg",
	"/stickers/characterFull_violet.svg",
	"/stickers/cursor_violet.svg",
]

function isActive(link: { to: string }) {
	return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

const MOBILE_REVEAL_IN = 620
const MOBILE_REVEAL_OUT = 420

const boxRef = useTemplateRef<HTMLElement>("boxRef")
const menuBtnRef = useTemplateRef<HTMLElement>("menuBtnRef")
const menuIconRef = useTemplateRef<HTMLElement>("menuIconRef")
const logoFlipRef = useTemplateRef<HTMLElement>("logoFlipRef")
const mobileOverlayRef = useTemplateRef<HTMLElement>("mobileOverlayRef")
const stickerPatternRef =
	useTemplateRef<InstanceType<typeof UiStickerPattern>>("stickerPatternRef")

const open = ref(false)
const fontsReady = useFontsReady()

const overlayActive = ref(false)
const overlayShown = ref(false)
const overlayInteractive = ref(false)
const mobileOverlayStyle = computed(() => ({
	visibility: overlayShown.value ? ("visible" as const) : ("hidden" as const),
	pointerEvents: overlayInteractive.value ? ("auto" as const) : ("none" as const),
}))

const {
	onWiggleEnter: onLogoEnter,
	onWiggleLeave: onLogoLeave,
	onWigglePress: onLogoPress,
} = useWiggle(logoFlipRef)

const mobileLinkEls: (HTMLElement | null)[] = []

function setMobileLinkRef(el: any, index: number) {
	mobileLinkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

let onMobileLinkClick: () => void = () => {}
let onMobileLinkPress: (index: number) => void = () => {}
let onMobileLinkRelease: (index: number, e: PointerEvent) => void = () => {}
let onMenuIconPress: () => void = () => {}
let onMenuIconRelease: () => void = () => {}
let onLinkPress: (e: PointerEvent) => void = () => {}
let onLinkRelease: (e: PointerEvent) => void = () => {}
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

function onTouchMoveLock(e: TouchEvent) {
	e.preventDefault()
}

function onWheelLock(e: WheelEvent) {
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

	async function playIntro() {
		const box = boxRef.value
		if (!box) return

		if (prefersReducedMotion) {
			gsap.set(box, { visibility: "visible" })
			return
		}

		await Promise.all([
			waitForFontsReady(fontsReady),
			waitForAppReady(),
			waitForPageTransition(),
		])

		const offscreen = box.getBoundingClientRect().bottom + 4

		gsap.set(box, {
			visibility: "visible",
			y: -offscreen,
			force3D: true,
		})

		gsap.to(box, {
			y: 0,
			duration: 1.2,
			ease: "power4.out",
			onComplete: () => gsap.set(box, { clearProps: "transform" }),
		})
	}

	playIntro()

	const pressedLinks = new WeakSet<HTMLElement>()

	onLinkPress = (e) => {
		const el = e.currentTarget as HTMLElement | null
		if (!el || prefersReducedMotion) return
		pressedLinks.add(el)
		gsap.to(el, {
			scale: 0.94,
			duration: 0.12,
			ease: "power2.out",
			force3D: true,
			overwrite: "auto",
		})
	}

	onLinkRelease = (e) => {
		const el = e.currentTarget as HTMLElement | null
		if (!el || !pressedLinks.has(el)) return
		pressedLinks.delete(el)
		gsap.to(el, {
			scale: 1,
			duration: 0.45,
			ease: "elastic.out(1, 0.5)",
			overwrite: "auto",
			clearProps: "transform",
		})
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

	/**
	 * État pressé des liens de l'overlay (mobile, tablette, souris sur fenêtre étroite).
	 * Visible dès le pointerdown, conservé jusqu'à la fermeture du menu :
	 * le depop repart de l'état pressé au lieu de le couper net.
	 */
	const MOBILE_PRESS_SCALE = 0.9
	const MOBILE_PRESS_OPACITY = 0.5
	const MOBILE_TAP_CLOSE_DELAY = 180

	const pressedMobileLinks = new Set<HTMLElement>()
	// pointerup reçu : le click suit, on garde l'état pressé.
	const committedMobileLinks = new Set<HTMLElement>()

	function releaseMobileLink(el: HTMLElement) {
		pressedMobileLinks.delete(el)
		committedMobileLinks.delete(el)

		gsap.to(el, {
			opacity: 1,
			duration: 0.25 * d,
			ease: "power2.out",
			overwrite: "auto",
		})
		gsap.to(el, {
			scale: 1,
			duration: 0.45 * d,
			ease: "elastic.out(1, 0.5)",
			overwrite: "auto",
		})
	}

	onMobileLinkPress = (index) => {
		const el = mobileLinkEls[index]
		if (!el) return

		pressedMobileLinks.add(el)
		committedMobileLinks.delete(el)

		gsap.to(el, {
			// Avec prefers-reduced-motion : opacité seule, sans réduction d'échelle.
			scale: prefersReducedMotion ? 1 : MOBILE_PRESS_SCALE,
			opacity: MOBILE_PRESS_OPACITY,
			duration: 0.1 * d,
			ease: "power2.out",
			force3D: true,
			overwrite: "auto",
		})
	}

	onMobileLinkRelease = (index, e) => {
		const el = mobileLinkEls[index]
		if (!el || !pressedMobileLinks.has(el)) return

		if (e.type === "pointerup") {
			committedMobileLinks.add(el)

			// Filet de sécurité : tap annulé (doigt glissé hors du lien), aucun click ne vient.
			window.setTimeout(() => {
				if (open.value && committedMobileLinks.has(el)) releaseMobileLink(el)
			}, MOBILE_TAP_CLOSE_DELAY * 2)

			return
		}

		// Sur tactile, pointerleave arrive juste après pointerup : on l'ignore.
		if (committedMobileLinks.has(el)) return

		releaseMobileLink(el)
	}

	onMobileLinkClick = () => {
		pressedMobileLinks.clear()
		committedMobileLinks.clear()

		window.setTimeout(() => {
			if (open.value) closeMenu()
		}, MOBILE_TAP_CLOSE_DELAY)
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

		Promise.all([depopLinks(), stickerPatternRef.value?.depop()]).then(() => {
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
		stickerPatternRef.value?.pop()
	}

	onOverlayClosed = () => {
		if (!open.value) overlayShown.value = false
	}

	function onDocumentClick(e: MouseEvent) {
		if (!open.value) return
		const target = e.target as Node

		// Les clics sur les liens de l'overlay sont gérés par onMobileLinkClick (fermeture différée).
		if (mobileLinkEls.some((el) => el?.contains(target))) return

		if (boxRef.value && !boxRef.value.contains(target)) closeMenu()
	}

	document.addEventListener("click", onDocumentClick, { passive: true })

	return () => {
		document.removeEventListener("click", onDocumentClick)

		linksTimeline?.kill()

		gsap.killTweensOf([
			boxRef.value,
			menuBtnRef.value,
			menuIconRef.value,
			logoFlipRef.value,
			mobileOverlayRef.value,
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
