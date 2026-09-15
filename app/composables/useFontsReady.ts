import type { Ref } from "vue"

export function useFontsReady(): Ref<boolean> {
	return useState<boolean>("app-fonts-ready", () => false)
}
