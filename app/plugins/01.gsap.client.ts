import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"

export default defineNuxtPlugin(() => {
	gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin)

	ScrollTrigger.config({ ignoreMobileResize: true })

	return {
		provide: { gsap, ScrollTrigger, Draggable },
	}
})
