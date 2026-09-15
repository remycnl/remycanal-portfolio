import type { MaybeRef } from "vue"

interface HoverPopOptions {
	rotate?: number
	scale?: number
	y?: number
	duration?: number
}

export function useHoverPop(
	trigger: MaybeRef<HTMLElement | null>,
	target: MaybeRef<HTMLElement | null>,
	options: HoverPopOptions = {}
) {
	const { useGsapContext } = useGsap()

	const { rotate = -6, scale = 0.25, y = 24, duration = 0.6 } = options

	useGsapContext(({ gsap }) => {
		const triggerEl = unref(trigger)
		const targetEl = unref(target)

		if (!triggerEl || !targetEl) return

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			gsap.set(targetEl, { opacity: 1, scale: 1, rotation: 0, y: 0 })
			return
		}

		gsap.set(targetEl, {
			opacity: 0,
			scale,
			y,
			rotation: rotate * 5,
			transformOrigin: "50% 100%",
			force3D: true,
			pointerEvents: "none",
		})

		const tween = gsap.to(targetEl, {
			opacity: 1,
			scale: 1,
			y: 0,
			rotation: rotate,
			duration,
			ease: "elastic.out(1, 0.6)",
			paused: true,
			onStart: () => (targetEl.style.willChange = "transform, opacity"),
			onComplete: () => (targetEl.style.willChange = "auto"),
			onReverseComplete: () => (targetEl.style.willChange = "auto"),
		})

		const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches
		let isOpen = false

		const open = () => {
			isOpen = true
			tween.play()
		}

		const close = () => {
			isOpen = false
			tween.reverse()
		}

		const handleClick = (event: MouseEvent) => {
			event.stopPropagation()
			isOpen ? close() : open()
		}

		const handleOutsideClick = (event: MouseEvent) => {
			if (isOpen && !triggerEl.contains(event.target as Node)) close()
		}

		if (canHover) {
			triggerEl.addEventListener("pointerenter", open)
			triggerEl.addEventListener("pointerleave", close)
		} else {
			triggerEl.addEventListener("click", handleClick)
			document.addEventListener("click", handleOutsideClick)
		}

		return () => {
			if (canHover) {
				triggerEl.removeEventListener("pointerenter", open)
				triggerEl.removeEventListener("pointerleave", close)
			} else {
				triggerEl.removeEventListener("click", handleClick)
				document.removeEventListener("click", handleOutsideClick)
			}
			tween.kill()
			gsap.set(targetEl, {
				clearProps: "opacity,scale,rotation,y,transformOrigin,willChange,pointerEvents",
			})
		}
	}, target as any)
}
