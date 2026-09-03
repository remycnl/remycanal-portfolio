import type { gsap } from "gsap"
import type { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Draggable } from "gsap/Draggable"
import type { SplitText } from "gsap/SplitText"

declare module "#app" {
	interface NuxtApp {
		$gsap: typeof gsap
		$ScrollTrigger: typeof ScrollTrigger
		$Draggable: typeof Draggable
		$SplitText: typeof SplitText
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$gsap: typeof gsap
		$ScrollTrigger: typeof ScrollTrigger
		$Draggable: typeof Draggable
		$SplitText: typeof SplitText
	}
}

export {}
