// app/composables/useStackSection.ts
import type { MaybeRef } from "vue"

type Breakpoint = "mobile" | "tablet" | "desktop"
type Responsive<T> = T | Partial<Record<Breakpoint, T>>

interface StackSectionOptions {
	scaleTo?: Responsive<number>
	rotateTo?: Responsive<number>
	distance?: Responsive<number>
	zIndex?: Responsive<number>
	roundedClass?: Responsive<string>
	id?: string
}

const QUERIES: Record<Breakpoint, string> = {
	mobile: "(max-width: 767px)",
	tablet: "(min-width: 768px) and (max-width: 1023px)",
	desktop: "(min-width: 1024px)",
}

function resolve<T>(value: Responsive<T> | undefined, bp: Breakpoint, fallback: T): T {
	if (value === undefined) return fallback
	if (typeof value !== "object" || value === null) return value as T
	const map = value as Partial<Record<Breakpoint, T>>
	return map[bp] ?? map.desktop ?? map.tablet ?? map.mobile ?? fallback
}

let autoId = 0

export function useStackSection(
	target: MaybeRef<HTMLElement | null>,
	options: StackSectionOptions = {}
) {
	const { useGsapContext } = useGsap()
	const baseId = options.id ?? `stack-section-${autoId++}`

	useGsapContext(({ gsap, ScrollTrigger }) => {
		const el = unref(target)
		if (!el || !el.parentElement) return

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches
		if (prefersReducedMotion) return

		const mm = gsap.matchMedia()

		mm.add(QUERIES, (context) => {
			const bp = (["mobile", "tablet", "desktop"] as Breakpoint[]).find(
				(key) => (context.conditions as Record<string, boolean>)[key]
			)!

			const scaleTo = resolve(options.scaleTo, bp, 0.85)
			const rotateTo = resolve(options.rotateTo, bp, -6)
			const distancePx = resolve(options.distance, bp, window.innerHeight)
			const zIndex = resolve(options.zIndex, bp, 0)
			const roundedClass = resolve<string | undefined>(
				options.roundedClass,
				bp,
				undefined
			)

			const wrapper = document.createElement("div")
			wrapper.style.position = "relative"
			wrapper.style.overflowX = "clip"
			wrapper.style.overflowY = "visible"

			el.parentElement!.insertBefore(wrapper, el)
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
				const naturalHeight = el!.offsetHeight
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
				id: `${baseId}-${bp}`,
				trigger: wrapper,
				start: "top top",
				end: () => `+=${distancePx}`,
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
		})

		return () => mm.revert()
	}, target as any)
}
