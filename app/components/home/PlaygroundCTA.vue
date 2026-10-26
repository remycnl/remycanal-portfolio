<template>
	<div
		class="section-p-xy relative flex w-full items-center justify-center overflow-x-clip"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-gray-dark)_0_4px,transparent_4px_9px)] opacity-50"
		/>

		<!--
			Une seule font-size sur le lien pilote tout (texte, indentation, gaps, flèches) :
			tout le reste est en `em`, donc plus aucun breakpoint md: à maintenir.
			Chaque ligne est en `text-fit` : sa boîte fait exactement la cap-height, donc
			`gap` / `items-center` / `size-cap` s'alignent sur les capitales et plus sur le line-height.
		-->
		<NuxtLink
			v-text-reveal="{ childStagger: 0.15, theme: 'violet' }"
			:to="TARGET"
			class="group relative z-10 inline-flex w-fit flex-col items-start gap-[0.2em] text-[clamp(1.75rem,8.5vw,4.5rem)] text-black"
			@pointerenter="onEnter"
			@pointerleave="onLeave"
			@pointerdown="onPress"
			@pointercancel="onRelease"
			@focus="onFocus"
			@blur="onLeave"
			@click.capture="onClick"
		>
			<span
				ref="leadRef"
				data-text-reveal-block
				class="font-lineal-heavy text-fit tracking-tight will-change-transform"
			>
				And a few
			</span>

			<!-- clip-path en em : laisse dépasser ascendantes/descendantes (le "g") en haut et en bas -->
			<span
				ref="rowRef"
				class="relative ml-[0.8em] flex items-center gap-[0.5em] [clip-path:inset(-0.5em_0)]"
			>
				<span
					ref="textRef"
					data-text-reveal-block
					class="font-lineal-heavy text-fit tracking-tight will-change-transform"
				>
					more things...
				</span>

				<!-- Flèche au repos (à droite) : cachée pendant `idle`, fondu après le démarrage du texte.
					 La transition n'existe que dans l'état `playing`, sinon le passage à `idle` serait lui aussi animé.
					 Le slot fait 1cap de haut (mesuré avec la police du texte, donc aligné sur les capitales)
					 et prend la largeur du glyphe : rien ne déborde, donc rien n'est rogné par le clip-path du row.
					 La flèche d'entrée a exactement le même slot, d'où un `shift` identique. -->
				<span
					ref="arrowOutRef"
					aria-hidden="true"
					class="font-lineal-heavy grid h-[1cap] shrink-0 place-items-center will-change-transform group-data-[text-reveal=idle]:opacity-0 group-data-[text-reveal=playing]:transition-opacity group-data-[text-reveal=playing]:delay-500 group-data-[text-reveal=playing]:duration-500"
				>
					<span class="font-vg5000 text-violet text-fit text-[1.25em]">→</span>
				</span>

				<!-- Flèche qui arrive par la gauche au hover : même slot 1cap, calé sur le haut de la ligne -->
				<span
					aria-hidden="true"
					class="font-lineal-heavy pointer-events-none absolute top-0 left-0 h-[1cap]"
				>
					<!-- Wrapper dédié au rebond : jamais en conflit avec l'entrée/sortie de la flèche -->
					<span
						ref="bounceRef"
						class="grid h-full place-items-center will-change-transform"
					>
						<span
							ref="arrowInRef"
							class="font-vg5000 text-violet text-fit invisible text-[1.25em] will-change-transform"
						>
							→
						</span>
					</span>
				</span>
			</span>
		</NuxtLink>
	</div>
</template>

<script setup lang="ts">
type Tl = gsap.core.Timeline

const TARGET = "/playground"

const leadRef = ref<HTMLElement | null>(null)
const rowRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const arrowOutRef = ref<HTMLElement | null>(null)
const arrowInRef = ref<HTMLElement | null>(null)
const bounceRef = ref<HTMLElement | null>(null)

const { useGsapContext } = useGsap()

let enter: (() => void) | null = null
let leave: (() => void) | null = null
let press: (() => void) | null = null
let release: (() => void) | null = null
let click: ((go: () => void) => boolean) | null = null

useGsapContext(({ gsap }) => {
	const lead = leadRef.value
	const row = rowRef.value
	const text = textRef.value
	const arrowOut = arrowOutRef.value
	const arrowIn = arrowInRef.value
	const bounceEl = bounceRef.value
	if (!lead || !row || !text || !arrowOut || !arrowIn || !bounceEl) return
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

	// Le lien porte data-text-reveal (idle → playing → done), posé par la directive
	const link = row.parentElement as HTMLElement
	const isIdle = () => link.dataset.textReveal === "idle"

	const violet = getComputedStyle(arrowIn).color
	const ink = getComputedStyle(text).color
	const gap = () => parseFloat(getComputedStyle(row).columnGap) || 0
	// Le slot de flèche épouse la largeur du glyphe : le décalage reste juste à toutes les tailles
	const shift = () => arrowOut.offsetWidth + gap()
	// Décalage de la ligne du haut proportionnel à la font-size (avant : 14px fixes)
	const leadShift = () => parseFloat(getComputedStyle(lead).fontSize) * 0.25

	let hovered = false
	let pressed = false
	let clicked = false
	let bounce: Tl | null = null
	let navCall: ReturnType<typeof gsap.delayedCall> | null = null

	// État initial : la flèche d'entrée attend hors du clip, à gauche
	gsap.set(arrowIn, { xPercent: -200, autoAlpha: 1 })

	const toViolet = () =>
		gsap.to(text, { color: violet, duration: 0.2, ease: "power2.out", overwrite: "auto" })

	const toInk = () =>
		gsap.to(text, { color: ink, duration: 0.3, ease: "power2.out", overwrite: "auto" })

	const stopBounce = () => {
		bounce?.kill()
		bounce = null
	}

	// Rebond "Tailwind" : 1s en boucle, sans pause, sans pic ni élastique.
	const startBounce = () => {
		stopBounce()
		const d = gap() * 0.6
		bounce = gsap
			.timeline({ repeat: -1 })
			.to(bounceEl, { x: d, duration: 0.5, ease: "power3.in" })
			.to(bounceEl, { x: 0, duration: 0.5, ease: "power2.out" })
	}

	enter = () => {
		// Pas de hover tant que le texte n'a pas commencé à se révéler
		if (hovered || clicked || isIdle()) return
		hovered = true

		gsap.to(arrowOut, { xPercent: 200, duration: 0.5, ease: "expo.out", overwrite: true })
		gsap.to(text, {
			x: shift,
			duration: 0.9,
			delay: 0.04,
			ease: "expo.out",
			overwrite: true,
		})
		gsap.to(lead, { x: leadShift, duration: 0.9, delay: 0.1, ease: "expo.out", overwrite: true })
		gsap.to(arrowIn, {
			xPercent: 0,
			duration: 0.9,
			delay: 0.08,
			ease: "back.out(1.2)",
			overwrite: true,
			// Le rebond démarre une fois la flèche posée, et seulement si on survole encore
			onComplete: () => {
				if (hovered && !clicked) startBounce()
			},
		})
	}

	leave = () => {
		if (!hovered || clicked) return
		hovered = false
		pressed = false
		stopBounce()

		gsap.to(bounceEl, { x: 0, duration: 0.25, ease: "power3.out", overwrite: true })
		gsap.to(arrowIn, {
			xPercent: -200,
			duration: 0.55,
			ease: "expo.out",
			overwrite: true,
		})
		gsap.to(text, {
			x: 0,
			color: ink,
			duration: 0.9,
			delay: 0.04,
			ease: "expo.out",
			overwrite: true,
		})
		gsap.to(lead, { x: 0, duration: 0.9, delay: 0.04, ease: "expo.out", overwrite: true })
		gsap.to(arrowOut, {
			xPercent: 0,
			duration: 1,
			delay: 0.1,
			ease: "back.out(1.4)",
			overwrite: true,
		})
	}

	// Appui : le texte passe en violet, rien d'autre ne bouge
	press = () => {
		if (clicked) return
		pressed = true
		toViolet()
	}

	// Appui annulé (pointercancel, cmd+click...) : le texte reprend sa couleur
	release = () => {
		if (!pressed || clicked) return
		pressed = false
		toInk()
	}

	// Click : le texte reste violet, la navigation part juste après
	click = (go) => {
		if (clicked) return false
		clicked = true
		toViolet()
		navCall = gsap.delayedCall(0.3, go)
		return true
	}

	return () => {
		stopBounce()
		navCall?.kill()
		gsap.killTweensOf([arrowIn, arrowOut, bounceEl, text, lead])
		enter = leave = press = release = click = null
	}
})

function onEnter(e: PointerEvent) {
	if (e.pointerType !== "touch") enter?.()
}

function onFocus(e: FocusEvent) {
	if ((e.target as HTMLElement).matches(":focus-visible")) enter?.()
}

function onLeave() {
	leave?.()
}

function onPress(e: PointerEvent) {
	if (e.button === 0) press?.()
}

function onRelease() {
	release?.()
}

function onClick(e: MouseEvent) {
	// cmd/ctrl/shift/alt + click : navigation native (nouvel onglet), sans délai
	if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
		release?.()
		return
	}
	if (click?.(() => navigateTo(TARGET))) {
		e.preventDefault()
		e.stopImmediatePropagation()
	}
}
</script>