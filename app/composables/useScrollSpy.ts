const ACTIVATION_RATIO = 0.3
const BOTTOM_TOLERANCE = 2

export function useScrollSpy(ids: MaybeRefOrGetter<readonly string[]>) {
	const activeId = ref<string | null>(toValue(ids)[0] ?? null)
	let frame = 0

	const resolve = () => {
		frame = 0
		const list = toValue(ids)
		const threshold = window.innerHeight * ACTIVATION_RATIO
		const atBottom =
			window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_TOLERANCE
		let current = list[0] ?? null

		for (const id of list) {
			const element = document.getElementById(id)
			if (element && element.getBoundingClientRect().top <= threshold) current = id
		}

		activeId.value = atBottom ? (list.at(-1) ?? current) : current
	}

	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(resolve)
	}

	onMounted(() => {
		window.addEventListener("scroll", schedule, { passive: true })
		window.addEventListener("resize", schedule, { passive: true })
		resolve()
	})

	onBeforeUnmount(() => {
		window.removeEventListener("scroll", schedule)
		window.removeEventListener("resize", schedule)
		cancelAnimationFrame(frame)
		frame = 0
	})

	return { activeId }
}