interface StackRollOptions {
	/** Element containing every `[data-stack]` window to drive */
	scope: Ref<HTMLElement | null>
	/** Active item index; each change triggers one roll */
	index: Ref<number>
	/** Roll duration in seconds */
	duration?: number
	/** GSAP ease applied to the roll */
	ease?: string
}

export function useStackRoll({
	scope,
	index,
	duration = 0.65,
	ease = "power3.out",
}: StackRollOptions) {
	const { gsap } = useGsap()

	const state = { position: 0 }
	let stacks: HTMLElement[] = []
	let tween: gsap.core.Tween | null = null

	const apply = () => {
		const value = String(state.position)
		for (const stack of stacks) stack.style.setProperty("--stack-pos", value)
	}

	onMounted(() => {
		stacks = Array.from(scope.value?.querySelectorAll<HTMLElement>("[data-stack]") ?? [])
		state.position = index.value
		apply()
	})

	watch(index, (next) => {
		tween?.kill()

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			state.position = next
			apply()
			return
		}

		tween = gsap.to(state, {
			position: next,
			duration,
			ease,
			onUpdate: apply,
		})
	})

	onUnmounted(() => {
		tween?.kill()
	})
}
