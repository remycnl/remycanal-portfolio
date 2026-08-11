import { gsap as gsapGlobal } from "gsap"
type GsapType = typeof gsapGlobal

export interface HorizontalLoopConfig {
	speed?: number
	paused?: boolean
	repeat?: number
	paddingRight?: number
	reversed?: boolean
	snap?: number | boolean
}

/**
 * Helper officiel GreenSock — anime un groupe d'éléments en boucle infinie
 * et parfaitement fluide le long de l'axe x, sans saut visible, responsive.
 * https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop/
 */
export function horizontalLoop(
	gsap: GsapType,
	items: HTMLElement[],
	config: HorizontalLoopConfig = {}
) {
	let tl = gsap.timeline({
		repeat: config.repeat,
		paused: config.paused,
		defaults: { ease: "none" },
		onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
	}) as gsap.core.Timeline & {
		next: (vars?: gsap.TweenVars) => gsap.core.Tween
		previous: (vars?: gsap.TweenVars) => gsap.core.Tween
		current: () => number
		toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween
		times: number[]
	}

	const length = items.length
	if (length === 0) return tl
	const startX = (items[0] as HTMLElement).offsetLeft
	const times: number[] = []
	const widths: number[] = []
	const xPercents: number[] = []
	let curIndex = 0
	const pixelsPerSecond = (config.speed || 1) * 100
	const snap =
		config.snap === false
			? (v: number) => v
			: gsap.utils.snap((config.snap as number) || 1)

	let totalWidth: number
	let curX: number,
		distanceToStart: number,
		distanceToLoop: number,
		item: HTMLElement,
		i: number

	gsap.set(items, {
		xPercent: (i: number, el: HTMLElement) => {
			const w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string))
			xPercents[i] = snap(
				(parseFloat(gsap.getProperty(el, "x", "px") as string) / w) * 100 +
					(gsap.getProperty(el, "xPercent") as number)
			)
			return xPercents[i]
		},
	})
	gsap.set(items, { x: 0 })

	const last = items[length - 1] as HTMLElement
	totalWidth =
		last.offsetLeft +
		(xPercents[length - 1]! / 100) * widths[length - 1]! -
		startX +
		last.offsetWidth * (gsap.getProperty(last, "scaleX") as number) +
		(parseFloat(String(config.paddingRight)) || 0)

	for (i = 0; i < length; i++) {
		item = items[i] as HTMLElement
		curX = (xPercents[i]! / 100) * widths[i]!
		distanceToStart = item.offsetLeft + curX - startX
		distanceToLoop =
			distanceToStart + widths[i]! * (gsap.getProperty(item, "scaleX") as number)

		tl.to(
			item,
			{
				xPercent: snap(((curX - distanceToLoop) / widths[i]!) * 100),
				duration: distanceToLoop / pixelsPerSecond,
			},
			0
		)
			.fromTo(
				item,
				{
					xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]!) * 100),
				},
				{
					xPercent: xPercents[i],
					duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
					immediateRender: false,
				},
				distanceToLoop / pixelsPerSecond
			)
			.add("label" + i, distanceToStart / pixelsPerSecond)

		times[i] = distanceToStart / pixelsPerSecond
	}

	function toIndex(index: number, vars: gsap.TweenVars = {}) {
		if (Math.abs(index - curIndex) > length / 2) {
			index += index > curIndex ? -length : length
		}
		const newIndex = gsap.utils.wrap(0, length, index)
		let time = times[newIndex] as number | undefined
		if (time === undefined) time = 0
		if (time > tl.time() !== index > curIndex) {
			vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) }
			time += tl.duration() * (index > curIndex ? 1 : -1)
		}
		curIndex = newIndex
		vars.overwrite = true
		return tl.tweenTo(time, vars as any)
	}

	tl.next = (vars) => toIndex(curIndex + 1, vars)
	tl.previous = (vars) => toIndex(curIndex - 1, vars)
	tl.current = () => curIndex
	tl.toIndex = (index, vars) => toIndex(index, vars)
	tl.times = times
	tl.progress(1, true).progress(0, true)

	if (config.reversed) {
		tl.vars.onReverseComplete?.()
		tl.reverse()
	}

	return tl
}
