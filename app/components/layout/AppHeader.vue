<template>
	<header class="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
		<div
			ref="boxRef"
			class="pointer-events-auto flex flex-col overflow-hidden rounded-4xl bg-black border border-black-light px-6 py-2.5 transition-[padding-left,padding-right] duration-400 lg:hover:px-10"
		>
			<div class="flex items-center justify-between gap-10 md:justify-start">
				<NuxtLink
					to="/"
					class="flex max-h-8 max-w-8 items-center justify-center select-none"
					@contextmenu.prevent
					@click="closeMenu"
				>
					<img
						ref="logoImgRef"
						src="/logos/R-lime.svg"
						alt="Rémy Canal"
						class="h-8 w-8"
						@mouseenter="onLogoEnter"
						@mouseleave="onLogoLeave"
						@pointerdown="onLogoPress"
					/>
				</NuxtLink>

				<nav
					class="font-lineal-bold relative hidden items-center gap-7 tracking-wide text-white uppercase md:flex"
					@mouseleave="onNavLeave"
				>
					<span
						ref="indicatorRef"
						class="bg-lime/25 pointer-events-none absolute top-1/2 left-0 h-9 rounded-full opacity-0 will-change-transform"
						style="transform: translateY(-50%) scale(0.85); width: 0px"
					/>

					<NuxtLink
						v-for="(link, index) in links"
						:key="link.to"
						:ref="(el) => setLinkRef(el, index)"
						:to="link.to"
						class="relative z-10 transition-colors duration-300"
						:class="isActive(link) ? 'text-lime' : 'hover:text-lime'"
						@mouseenter="onLinkEnter(index)"
						@focus="onLinkEnter(index)"
						@click="onLinkClick(index)"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>

				<button
					ref="menuBtnRef"
					class="relative flex h-8 w-8 items-center justify-center self-center text-white md:hidden"
					aria-label="Menu"
					@click="toggleMenu"
				>
					<svg ref="menuIconRef" width="18" height="18" viewBox="0 0 18 18" fill="none">
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

			<div ref="mobileNavRef" class="overflow-hidden md:hidden" style="height: 0px">
				<nav
					ref="mobileNavInnerRef"
					class="font-lineal-bold flex flex-col items-center gap-4 tracking-wide text-white uppercase"
				>
					<NuxtLink
						v-for="(link, index) in links"
						:key="link.to"
						:ref="(el) => setMobileLinkRef(el, index)"
						:to="link.to"
						class="transition-colors"
						:class="isActive(link) ? 'text-lime' : 'hover:text-lime'"
						@click="closeMenu"
					>
						{{ link.label }}
					</NuxtLink>
				</nav>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
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

function isActive(link: { to: string }) {
	return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

const boxRef = useTemplateRef<HTMLElement>("boxRef")
const indicatorRef = useTemplateRef<HTMLElement>("indicatorRef")
const mobileNavRef = useTemplateRef<HTMLElement>("mobileNavRef")
const mobileNavInnerRef = useTemplateRef<HTMLElement>("mobileNavInnerRef")
const menuBtnRef = useTemplateRef<HTMLElement>("menuBtnRef")
const menuIconRef = useTemplateRef<HTMLElement>("menuIconRef")
const logoImgRef = useTemplateRef<HTMLElement>("logoImgRef")

const {
	onWiggleEnter: onLogoEnter,
	onWiggleLeave: onLogoLeave,
	onWigglePress: onLogoPress,
} = useWiggle(logoImgRef)

const linkEls: (HTMLElement | null)[] = []
function setLinkRef(el: any, index: number) {
	linkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

const mobileLinkEls: (HTMLElement | null)[] = []
function setMobileLinkRef(el: any, index: number) {
	mobileLinkEls[index] = (el?.$el ?? el) as HTMLElement | null
}

const open = ref(false)
const isAnimating = ref(false)

const CONFIG = {
	openPadX: 24,
	openPadBottom: 36,
	collapsedPadY: 10,
	ease: "power3.inOut",
} as const

let collapsedWidth = 0

let onLinkEnter: (index: number) => void = () => {}
let onNavLeave: () => void = () => {}
let onLinkClick: (index: number) => void = () => {}
let toggleMenu: () => void = () => {}
let closeMenu: () => void = () => {}

const { useGsapContext } = useGsap()

useGsapContext(({ gsap }) => {
	let hideTimer: ReturnType<typeof setTimeout> | null = null
	let isIndicatorVisible = false

	function clearHideTimer() {
		if (hideTimer) clearTimeout(hideTimer)
		hideTimer = null
	}

	function hideIndicator(delay = 120) {
		clearHideTimer()
		isIndicatorVisible = false
		hideTimer = setTimeout(() => {
			if (!indicatorRef.value) return
			gsap.to(indicatorRef.value, {
				opacity: 0,
				scale: 0.9,
				duration: 0.22,
				ease: "power2.out",
				overwrite: "auto",
			})
		}, delay)
	}

	onLinkEnter = (index: number) => {
		clearHideTimer()
		moveIndicatorTo(index)
	}

	onNavLeave = () => hideIndicator(140)

	onLinkClick = (index: number) => {
		const indicator = indicatorRef.value
		if (!indicator || !isIndicatorVisible) return
		gsap
			.timeline({ overwrite: "auto" })
			.to(indicator, { scale: 0.85, duration: 0.12, ease: "power2.in" })
			.to(indicator, { scale: 1, duration: 0.32, ease: "back.out(2.5)" })
	}

	function moveIndicatorTo(index: number) {
		const linkEl = linkEls[index]
		const indicator = indicatorRef.value
		if (!linkEl || !indicator) return

		const left = linkEl.offsetLeft - 12
		const width = linkEl.offsetWidth + 24

		if (!isIndicatorVisible) {
			gsap.killTweensOf(indicator)
			gsap.set(indicator, { x: left, width })
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

		gsap.to(indicator, {
			x: left,
			width,
			opacity: 1,
			scale: 1,
			duration: 0.32,
			ease: "power2.out",
			overwrite: "auto",
		})
	}

	let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

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

	function pressIcon() {
		if (!menuIconRef.value) return
		gsap.killTweensOf(menuIconRef.value)
		gsap
			.timeline()
			.to(menuIconRef.value, { scale: 0.82, duration: 0.1, ease: "power2.in" })
			.to(menuIconRef.value, { scale: 1, duration: 0.36, ease: "back.out(2.4)" })
	}

	toggleMenu = () => {
		if (isAnimating.value) return
		pressIcon()
		open.value ? closeMenu() : openMenu()
	}

	function openMenu() {
		const box = boxRef.value
		const mobileNav = mobileNavRef.value
		const mobileNavInner = mobileNavInnerRef.value
		if (!box || !mobileNav || !mobileNavInner) return

		isAnimating.value = true
		open.value = true

		collapsedWidth = box.getBoundingClientRect().width
		const parentWidth = box.parentElement?.getBoundingClientRect().width ?? collapsedWidth
		const targetHeight = mobileNavInner.getBoundingClientRect().height + CONFIG.openPadX

		gsap.set(box, { width: collapsedWidth, willChange: "width, padding" })
		gsap.set(mobileNav, { willChange: "height" })
		gsap.set(mobileNavInner, { marginTop: CONFIG.openPadX })
		gsap.set(mobileLinkEls.filter(Boolean), { autoAlpha: 0, y: 10 })

		const d = prefersReducedMotion ? 0.01 : 1

		const tl = gsap.timeline({
			defaults: { ease: CONFIG.ease },
			onComplete: () => {
				isAnimating.value = false
				gsap.set([box, mobileNav], { clearProps: "willChange" })
			},
		})

		tl.to(box, { width: parentWidth, duration: 0.45 * d })
			.addLabel("grow", ">-0.05")
			.to(
				box,
				{
					paddingTop: CONFIG.openPadX,
					paddingBottom: CONFIG.openPadBottom,
					duration: 0.45 * d,
				},
				"grow"
			)
			.to(
				mobileNav,
				{ height: targetHeight, duration: 0.45 * d, ease: "power3.out" },
				"grow"
			)

		tl.to(
			edgeDots,
			{ scale: 0, opacity: 0, duration: 0.4 * d, ease: "power2.inOut" },
			"grow"
		)
			.to(
				[...cornerDots, ...centerDot],
				{ scale: 1.18, duration: 0.24 * d, ease: "power2.out" },
				"grow"
			)
			.to(
				[...cornerDots, ...centerDot],
				{ scale: 1, duration: 0.4 * d, ease: "elastic.out(1, 0.55)" },
				"grow+=0.2"
			)

		tl.to(
			mobileLinkEls.filter(Boolean),
			{ autoAlpha: 1, y: 0, duration: 0.32 * d, stagger: 0.06 * d, ease: "power2.out" },
			">-0.15"
		)
	}

	closeMenu = () => {
		if (!open.value) return
		const box = boxRef.value
		const mobileNav = mobileNavRef.value
		if (!box || !mobileNav) return

		isAnimating.value = true

		gsap.set(box, { willChange: "width, padding" })
		gsap.set(mobileNav, { willChange: "height" })

		const d = prefersReducedMotion ? 0.01 : 1

		const tl = gsap.timeline({
			defaults: { ease: CONFIG.ease },
			onComplete: () => {
				open.value = false
				isAnimating.value = false
				gsap.set(box, { clearProps: "width,paddingTop,paddingBottom,willChange" })
				gsap.set(mobileNav, { clearProps: "willChange" })
			},
		})

		tl.to([...mobileLinkEls].filter(Boolean).reverse(), {
			autoAlpha: 0,
			y: 10,
			duration: 0.18 * d,
			stagger: 0.045 * d,
			ease: "power2.in",
		}).addLabel("shrink", ">-0.05")

		tl.to(
			edgeDots,
			{ scale: 1, opacity: 1, duration: 0.4 * d, ease: "power2.out" },
			"shrink"
		)

		tl.to(
			box,
			{
				paddingTop: CONFIG.collapsedPadY,
				paddingBottom: CONFIG.collapsedPadY,
				duration: 0.4 * d,
			},
			"shrink"
		)
			.to(mobileNav, { height: 0, duration: 0.4 * d, ease: "power3.in" }, "shrink")
			.to(box, { width: collapsedWidth, duration: 0.4 * d }, ">-0.05")
	}

	function onDocumentClick(e: MouseEvent) {
		if (!open.value || isAnimating.value) return
		if (boxRef.value && !boxRef.value.contains(e.target as Node)) closeMenu()
	}
	document.addEventListener("click", onDocumentClick, { passive: true })

	return () => {
		clearHideTimer()
		document.removeEventListener("click", onDocumentClick)
		gsap.killTweensOf([
			boxRef.value,
			mobileNavRef.value,
			indicatorRef.value,
			menuBtnRef.value,
			menuIconRef.value,
			...mobileLinkEls,
			...cornerDots,
			...centerDot,
			...edgeDots,
		])
	}
}, boxRef)
</script>
