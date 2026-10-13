<template>
	<div
		ref="rootRef"
		class="fixed inset-0 z-9999 overflow-hidden"
		role="status"
		aria-live="polite"
		aria-label="Chargement"
	>
		<!-- Rideau : le bord bas du path est animé (montée + bombé) -->
		<svg
			class="pointer-events-none absolute inset-0 h-full w-full"
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path ref="curtainRef" d="M0 0 H100 V100 Q50 100 0 100 Z" fill="#000" />
		</svg>

		<div
			ref="trackRef"
			class="p-edge pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
		>
			<div class="relative w-full">
				<div
					data-out
					class="text-fit absolute bottom-full left-0 mb-4 flex flex-col gap-1.5 font-sans text-[7px] tracking-[0.14em] text-white/40 uppercase sm:mb-5 sm:text-[9px] sm:tracking-[0.16em]"
				>
					<div class="flex items-center gap-2 whitespace-nowrap">
						<span class="text-fit text-white/90"> Rémy Canal </span>

						<span class="h-px w-2 shrink-0 bg-white/25 sm:w-3" />

						<span class="text-fit"> Creative Developer </span>
					</div>

					<span class="text-fit whitespace-nowrap text-white/30">
						Web Development · UI/UX Design
					</span>
				</div>

				<div
					data-out
					class="absolute right-0 bottom-full mb-4 flex flex-col items-end gap-1.5 text-right font-sans text-[7px] tracking-[0.14em] text-white/30 uppercase sm:mb-5 sm:text-[9px] sm:tracking-[0.16em]"
				>
					<span class="text-fit text-white/55"> Freelance </span>

					<span class="text-fit whitespace-nowrap"> From concept to screen </span>
				</div>

				<div
					data-out
					class="mb-2 flex w-full items-center justify-between font-sans text-[7px] tracking-[0.22em] text-white/30 uppercase sm:text-[8px]"
				>
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-0.5">
							<span
								class="h-0.75 w-0.75 shrink-0 animate-pulse rounded-full bg-white/60 [animation-delay:-0.4s]"
							/>
							<span
								class="h-0.75 w-0.75 shrink-0 animate-pulse rounded-full bg-white/60 [animation-delay:-0.2s]"
							/>
							<span
								class="h-0.75 w-0.75 shrink-0 animate-pulse rounded-full bg-white/60"
							/>
						</div>

						<span class="text-fit"> Loading </span>
					</div>

					<span class="text-fit">
						{{ currentYear }}
					</span>
				</div>

				<!-- Le wrapper porte l'animation de sortie ; le x du compteur reste géré par le composable -->
				<div ref="counterOutRef" class="will-change-transform">
					<span
						ref="counterRef"
						class="font-vg5000 text-fit block w-[4ch] text-[2rem] text-white tabular-nums transition-opacity duration-200 will-change-[opacity] sm:text-[3rem] md:text-[4rem]"
						:class="isFontsReady ? 'opacity-100' : 'opacity-0'"
					>
						0%
					</span>
				</div>

				<div
					data-out
					class="absolute top-full right-0 left-0 mt-4 flex items-center justify-between font-sans text-[7px] tracking-[0.16em] text-white/25 uppercase sm:mt-5 sm:text-[8px]"
				>
					<div class="flex items-center gap-3">
						<span class="text-fit"> Portfolio </span>

						<span class="h-px w-2 shrink-0 bg-white/15 sm:w-8" />

						<span class="text-fit"> Digital Craft </span>
					</div>

					<div class="flex items-center gap-3 text-right">
						<span class="text-fit"> France </span>

						<span class="h-px w-2 shrink-0 bg-white/15 sm:w-8" />

						<span class="text-fit whitespace-nowrap"> Available for work </span>
					</div>
				</div>

				<div
					data-out
					class="pointer-events-none absolute top-full right-0 left-0 mt-10 h-px bg-white/[0.07] sm:mt-12"
				>
					<span class="absolute top-0 left-0 h-px w-8 bg-white/25 sm:w-12" />

					<span class="absolute top-0 right-0 h-px w-8 bg-white/15 sm:w-12" />
				</div>
			</div>
		</div>

		<div
			data-out
			class="pointer-events-none absolute top-[calc(50%+4.5rem)] left-1/2 hidden h-7 w-px -translate-x-1/2 bg-white/8 sm:block"
		/>

		<div
			data-out
			class="p-edge pointer-events-none absolute inset-x-0 bottom-0 flex justify-between font-sans text-[7px] leading-none tracking-[0.2em] text-white/15 uppercase"
		>
			<span class="text-fit"> RC — 002 </span>

			<span class="text-fit"> © {{ currentYear }} </span>
		</div>
	</div>
</template>

<script setup lang="ts">
const CURTAIN_BOW = 18
const CURTAIN_START = 0.5
const CURTAIN_DURATION = 1.3

const { bind } = useLoadingProgress()
const { isComplete, isRevealing, isRevealed } = useLoadingState()
const isFontsReady = useFontsReady()
const { $gsap } = useNuxtApp()

const currentYear = new Date().getFullYear()

const rootRef = useTemplateRef<HTMLElement>("rootRef")
const trackRef = useTemplateRef<HTMLElement>("trackRef")
const counterRef = useTemplateRef<HTMLElement>("counterRef")
const counterOutRef = useTemplateRef<HTMLElement>("counterOutRef")
const curtainRef = useTemplateRef<SVGPathElement>("curtainRef")

let unbind: (() => void) | undefined
let ctx: gsap.Context | undefined

/**
 * Dessine le rideau pour une progression p (0 = fermé, 1 = ouvert).
 * Le bord bas monte, et le centre prend du retard (bombé) en milieu de course,
 * ce qui donne l'effet de tissu tiré vers le haut.
 */
const drawCurtain = (progress: number) => {
	const edge = 100 * (1 - progress)
	const bow = Math.sin(Math.PI * progress) * CURTAIN_BOW
	curtainRef.value?.setAttribute(
		"d",
		`M0 0 H100 V${edge} Q50 ${edge + bow * 2} 0 ${edge} Z`
	)
}

const finish = () => {
	isRevealing.value = true
	isRevealed.value = true
}

const playReveal = () => {
	const root = rootRef.value
	if (!root || isRevealed.value || ctx) return

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	ctx = $gsap.context(() => {
		if (reduced) {
			isRevealing.value = true
			$gsap.to(root, { opacity: 0, duration: 0.3, onComplete: finish })
			return
		}

		const outs = $gsap.utils.toArray<HTMLElement>("[data-out]", root)
		const curtain = { progress: 0 }

		$gsap
			.timeline({ onComplete: finish })
			// Le compteur marque 100 % puis s'élève
			.to(
				counterOutRef.value,
				{ y: -60, opacity: 0, duration: 0.7, ease: "power3.in" },
				0.15
			)
			// Les labels partent en cascade vers le haut
			.to(
				outs,
				{
					y: -40,
					opacity: 0,
					duration: 0.6,
					ease: "power3.in",
					stagger: { each: 0.04, from: "start" },
				},
				0.2
			)
			// Le rideau se lève : la page devient interactive et le scroll se débloque
			.call(
				() => {
					isRevealing.value = true
					root.style.pointerEvents = "none"
				},
				[],
				CURTAIN_START
			)
			.to(
				curtain,
				{
					progress: 1,
					duration: CURTAIN_DURATION,
					ease: "expo.inOut",
					onUpdate: () => drawCurtain(curtain.progress),
				},
				CURTAIN_START
			)
	}, root)
}

watch(isComplete, (complete) => {
	if (complete) playReveal()
})

onMounted(() => {
	if (trackRef.value && counterRef.value) {
		unbind = bind(trackRef.value, counterRef.value)
	}

	// Cas où le loader est monté alors que tout est déjà prêt (HMR, reduced motion)
	if (isComplete.value) playReveal()
})

onUnmounted(() => {
	ctx?.revert()
	unbind?.()
})
</script>
