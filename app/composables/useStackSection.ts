// app/composables/useStackSection.ts
import type { MaybeRef } from "vue"

interface StackSectionOptions {
	scaleTo?: number
	rotateTo?: number
	distance?: () => number
	zIndex?: number
	id?: string
	roundedClass?: string
}

let autoId = 0

export function useStackSection(
	target: MaybeRef<HTMLElement | null>,
	options: StackSectionOptions = {}
) {
	const { useGsapContext } = useGsap()

	const {
		scaleTo = 0.85,
		rotateTo = -6,
		distance = () => window.innerHeight,
		zIndex = 0,
		id = `stack-section-${autoId++}`,
		roundedClass,
	} = options

	useGsapContext(({ gsap, ScrollTrigger }) => {
		const el = unref(target)
		if (!el || !el.parentElement) return

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		if (prefersReducedMotion) return

		const wrapper = document.createElement("div")
		wrapper.style.position = "relative"
		wrapper.style.overflowX = "clip"
		el.parentElement.insertBefore(wrapper, el)
		wrapper.appendChild(el)

		const nextSection = wrapper.nextElementSibling as HTMLElement | null

		gsap.set(el, {
			position: "sticky",
			top: 0,
			transformOrigin: "50% 50%",
			force3D: true,
			zIndex,
		})
		el.style.isolation = "isolate"

		if (roundedClass) {
			el.style.transition = "border-radius 0.2s cubic-bezier(0.65, 0, 0.35, 1)"
		}

		let prevNextStyles: { marginTop: string; zIndex: string; position: string } | null =
			null
		if (nextSection) {
			prevNextStyles = {
				marginTop: nextSection.style.marginTop,
				zIndex: nextSection.style.zIndex,
				position: nextSection.style.position,
			}
			if (getComputedStyle(nextSection).position === "static") {
				nextSection.style.position = "relative"
			}
			nextSection.style.zIndex = String(zIndex + 1)
			nextSection.style.isolation = "isolate"
		}

		function syncLayout() {
			const distancePx = distance()
			const naturalHeight = el!.getBoundingClientRect().height
			wrapper.style.height = `${naturalHeight + distancePx}px`
			if (nextSection) nextSection.style.marginTop = `-${distancePx}px`
		}
		syncLayout()

		const tween = gsap.to(el, {
			scale: scaleTo,
			rotate: rotateTo,
			ease: "none",
		})

		const st = ScrollTrigger.create({
			id,
			trigger: wrapper,
			start: "top top",
			end: () => `+=${distance()}`,
			scrub: true,
			invalidateOnRefresh: true,
			animation: tween,
			onRefreshInit: syncLayout,
			toggleClass: roundedClass ? { targets: el, className: roundedClass } : undefined,
			onToggle: (self) => {
				el!.style.willChange = self.isActive
					? `transform${roundedClass ? ",border-radius" : ""}`
					: "auto"
			},
		})

		return () => {
			st.kill()
			gsap.set(el!, {
				clearProps: "transform,willChange,zIndex,position,top",
			})
			el!.style.isolation = ""
			el!.style.transition = ""
			if (roundedClass) el!.classList.remove(roundedClass)

			if (nextSection && prevNextStyles) {
				nextSection.style.marginTop = prevNextStyles.marginTop
				nextSection.style.zIndex = prevNextStyles.zIndex
				nextSection.style.position = prevNextStyles.position
				nextSection.style.isolation = ""
			}

			wrapper.parentElement?.insertBefore(el!, wrapper)
			wrapper.remove()
		}
	}, target as any)
}
