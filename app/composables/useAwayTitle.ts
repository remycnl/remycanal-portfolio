const AWAY_MESSAGES = [
	"Come back soon 👀",
	"I miss you already...",
	"Still here, waiting 🥺",
	"Psst, come back",
	"It's empty without you",
] as const

function pickRandom<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)]!
}

export function useAwayTitle(messages: readonly string[] = AWAY_MESSAGES) {
	const originalTitle = ref("")

	function handleVisibilityChange() {
		if (document.hidden) {
			originalTitle.value = document.title
			document.title = pickRandom(messages)
		} else {
			document.title = originalTitle.value
		}
	}

	onMounted(() => {
		document.addEventListener("visibilitychange", handleVisibilityChange)
	})

	onUnmounted(() => {
		document.removeEventListener("visibilitychange", handleVisibilityChange)
	})
}
