import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
import { SplitText } from "gsap/SplitText"

export default defineNuxtPlugin({
	name: "gsap",
	setup() {
		gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, SplitText)
		ScrollTrigger.config({ ignoreMobileResize: true })

		return {
			provide: { gsap, ScrollTrigger, Draggable, SplitText },
		}
	},
})