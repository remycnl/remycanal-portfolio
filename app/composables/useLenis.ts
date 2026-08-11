import type Lenis from "lenis"

export function useLenis() {
	const { $lenis } = useNuxtApp()
	return $lenis as Lenis | undefined
}
