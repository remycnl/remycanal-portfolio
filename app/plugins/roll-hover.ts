import type { Directive } from "vue"
import type { GsapInstance } from "@/composables/useGsap"

export interface RollHoverOptions {
	duration?: number
	ease?: string
}

interface RollHoverInstance {
	onEnter: () => void
	onLeave: () => void
}

const instances = new WeakMap<HTMLElement, RollHoverInstance>()

function buildRoll(el: HTMLElement) {
	const text = el.textContent?.trim() ?? ""

	el.textContent = ""
	el.style.position = "relative"
	el.style.display = "inline-block"
	el.style.overflow = "hidden"
	el.style.verticalAlign = "top"
	el.style.whiteSpace = "nowrap"

	const track = document.createElement("span")
	track.style.display = "flex"
	track.style.flexDirection = "column"

	const duplicate = document.createElement("span")
	duplicate.textContent = text
	duplicate.style.display = "block"
	duplicate.setAttribute("aria-hidden", "true")

	const original = document.createElement("span")
	original.textContent = text
	original.style.display = "block"

	track.append(duplicate, original)
	el.append(track)

	const lineHeight = original.getBoundingClientRect().height
	el.style.height = `${lineHeight}px`

	return { track, lineHeight }
}

export default defineNuxtPlugin({
	name: "roll-hover",
	setup(nuxtApp) {
		const rollHover: Directive<HTMLElement, RollHoverOptions | undefined> = {
			getSSRProps: () => ({}),
			mounted(el, binding) {
				if (!import.meta.client) return

				const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches
				if (!isDesktop) return

				const gsap = nuxtApp.$gsap as GsapInstance
				const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

				const duration = reduceMotion ? 0 : (binding.value?.duration ?? 0.55)
				const ease = reduceMotion ? "none" : (binding.value?.ease ?? "back.out(1.2)")

				const { track, lineHeight } = buildRoll(el)

				gsap.set(track, { y: -lineHeight, force3D: true })

				let isHovering = false

				const timeline = gsap.timeline({
					paused: true,
					onStart: () => {
						track.style.willChange = "transform"
					},
					onComplete: () => {
						track.style.willChange = "auto"
						if (!isHovering) timeline.pause(0)
					},
				})

				timeline.to(track, { y: 0, duration, ease })

				const onEnter = () => {
					isHovering = true
					if (!timeline.isActive()) timeline.play(0)
				}

				const onLeave = () => {
					isHovering = false
					if (!timeline.isActive()) timeline.pause(0)
				}

				el.addEventListener("mouseenter", onEnter)
				el.addEventListener("mouseleave", onLeave)

				instances.set(el, { onEnter, onLeave })
			},
			unmounted(el) {
				if (!import.meta.client) return

				const instance = instances.get(el)
				if (!instance) return

				el.removeEventListener("mouseenter", instance.onEnter)
				el.removeEventListener("mouseleave", instance.onLeave)
				instances.delete(el)
			},
		}

		nuxtApp.vueApp.directive("roll-hover", rollHover)
	},
})
