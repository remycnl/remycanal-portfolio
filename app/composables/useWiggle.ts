import type { Ref } from "vue"

export interface UseWiggleOptions {
	pressScale?: number
	pressRotation?: number
}

export function useWiggle(
	target: Ref<HTMLElement | null>,
	options: UseWiggleOptions = {}
) {
	const { useGsapContext } = useGsap()
	const { pressScale = 0.78, pressRotation = 8 } = options

	let handleEnter: () => gsap.core.Timeline | undefined = () => undefined
	let handleLeave = () => {}
	let handlePress: () => gsap.core.Timeline | undefined = () => undefined

	useGsapContext(
		({ gsap }) => {
			if (target.value)
				gsap.set(target.value, { transformOrigin: "50% 50%", force3D: true })

			let wiggleTl: ReturnType<typeof gsap.timeline> | null = null

			handleEnter = () => {
				const el = target.value
				if (!el) return undefined
				wiggleTl?.kill()
				wiggleTl = gsap
					.timeline()
					.to(el, { rotation: -10, duration: 0.09, ease: "power1.out" })
					.to(el, { rotation: 9, duration: 0.11, ease: "power1.inOut" })
					.to(el, { rotation: -6, duration: 0.11, ease: "power1.inOut" })
					.to(el, { rotation: 4, duration: 0.1, ease: "power1.inOut" })
					.to(el, { rotation: 0, duration: 0.16, ease: "power2.out" })
				// Timeline retournée : GSAP 3 la rend "thenable", ce qui permet
				// à l'appelant de faire `await wiggle()` pour attendre sa fin
				// réelle plutôt que de deviner sa durée avec un setTimeout.
				return wiggleTl
			}

			handleLeave = () => {
				const el = target.value
				if (!el) return
				wiggleTl?.kill()
				gsap.to(el, { rotation: 0, duration: 0.2, ease: "power2.out" })
			}

			handlePress = () => {
				const el = target.value
				if (!el) return undefined
				wiggleTl?.kill()
				gsap.killTweensOf(el)
				const pressTl = gsap
					.timeline()
					.to(el, {
						scale: pressScale,
						rotation: `-=${pressRotation}`,
						duration: 0.09,
						ease: "power2.in",
					})
					.to(el, { scale: 1, rotation: 0, duration: 0.45, ease: "elastic.out(1, 0.45)" })
				return pressTl
			}

			return () => {
				wiggleTl?.kill()
				if (target.value) gsap.killTweensOf(target.value)
			}
		},
		target as unknown as Ref<Element | null>
	)

	return {
		onWiggleEnter: () => handleEnter(),
		onWiggleLeave: () => handleLeave(),
		onWigglePress: () => handlePress(),
		wiggle: () => handleEnter(),
	}
}
