import type Lenis from "lenis"

declare module "#app" {
	interface NuxtApp {
		$lenis: Lenis
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$lenis: Lenis
	}
}

export {}
