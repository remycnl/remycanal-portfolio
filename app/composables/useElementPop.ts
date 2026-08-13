import type { MaybeRef } from "vue"

interface PopOptions {
	rotateTo?: number
	rotateFrom?: number
	scaleFrom?: number
	yFrom?: number
	duration?: number
	delay?: number
	start?: string
	once?: boolean
	organic?: boolean
}

export function useElementPop(
	target: MaybeRef<HTMLElement | null>,
	options: PopOptions = {}
) {
	const { useGsapContext } = useGsap()

	const {
		rotateTo = 0,
		rotateFrom = rotateTo - 35,
		scaleFrom = 0.25,
		yFrom = 60,
		duration = 0.6,
		delay = 0,
		start = "top 88%",
		once = true,
		organic = true,
	} = options

	useGsapContext(({ gsap, ScrollTrigger }) => {
		const el = unref(target)
		if (!el) return

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		if (prefersReducedMotion) {
			gsap.set(el, { opacity: 1, scale: 1, rotate: rotateTo, y: 0 })
			return
		}

		const jitter = organic ? gsap.utils.random(-4, 4) : 0
		const finalRotate = rotateTo + jitter

		gsap.set(el, {
			opacity: 0,
			scale: scaleFrom,
			rotate: rotateFrom,
			y: yFrom,
			transformOrigin: "50% 50%",
			force3D: true,
		})

		const tl = gsap.timeline({
			paused: true,
			delay,
			onStart: () => (el.style.willChange = "transform, opacity"),
			onComplete: () => (el.style.willChange = "auto"),
		})

		tl.to(
			el,
			{
				opacity: 1,
				duration: duration * 0.45,
				ease: "power1.out",
				overwrite: "auto",
			},
			0
		)
			.to(
				el,
				{
					y: 0,
					scale: 1,
					duration,
					ease: "elastic.out(1, 0.55)",
					overwrite: "auto",
				},
				0
			)
			.to(
				el,
				{
					rotate: finalRotate,
					duration,
					ease: "elastic.out(1, 0.65)",
					overwrite: "auto",
				},
				0
			)

		const st = ScrollTrigger.create({
			trigger: el,
			start,
			once,
			onEnter: () => tl.play(0),
			onEnterBack: once ? undefined : () => tl.play(0),
			onLeaveBack: once ? undefined : () => tl.pause(0),
		})

		return () => {
			st.kill()
			tl.kill()
			gsap.set(el, {
				clearProps: "opacity,scale,rotate,y,transformOrigin,willChange",
			})
		}
	}, target as any)
}
