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

const BLEED_EM = 0.4

const instances = new WeakMap<HTMLElement, RollHoverInstance>()

function createRow(text: string, hidden: boolean) {
	const row = document.createElement("span")

	row.textContent = text
	row.style.display = "block"
	row.style.gridArea = "1 / 1"
	row.style.paddingBlock = `${BLEED_EM}em`
	row.style.marginBlock = `-${BLEED_EM}em`
	row.style.setProperty("text-box", "inherit")

	if (hidden) row.setAttribute("aria-hidden", "true")

	return row
}

function buildRoll(el: HTMLElement) {
	const text = el.textContent?.trim() ?? ""

	el.textContent = ""
	el.style.position = "relative"
	el.style.display = "inline-grid"
	el.style.verticalAlign = "top"
	el.style.whiteSpace = "nowrap"
	el.style.clipPath = `inset(-${BLEED_EM}em -0.05em)`

	const duplicate = createRow(text, true)
	const original = createRow(text, false)

	el.append(duplicate, original)

	return { original, duplicate }
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

				const { original, duplicate } = buildRoll(el)

				gsap.set(original, { yPercent: 0, force3D: true })
				gsap.set(duplicate, { yPercent: -100, force3D: true })

				let isHovering = false

				const timeline = gsap.timeline({
					paused: true,
					onStart: () => {
						original.style.willChange = "transform"
						duplicate.style.willChange = "transform"
					},
					onComplete: () => {
						original.style.willChange = "auto"
						duplicate.style.willChange = "auto"
						if (!isHovering) timeline.pause(0)
					},
				})

				timeline
					.to(original, { yPercent: 100, duration, ease }, 0)
					.to(duplicate, { yPercent: 0, duration, ease }, 0)

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