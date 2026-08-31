<template>
	<div
		class="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden bg-black"
		role="status"
		aria-live="polite"
		aria-label="Chargement"
	>
		<!-- Main loading composition -->
		<div
			ref="trackRef"
			class="p-edge pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
		>
			<div class="relative w-full">
				<!-- TOP LEFT -->
				<div
					class="absolute bottom-full left-0 mb-4 flex flex-col gap-1 font-sans text-[7px] leading-none tracking-[0.14em] text-white/40 uppercase sm:mb-5 sm:text-[9px] sm:tracking-[0.16em]"
				>
					<div class="flex items-center gap-2 whitespace-nowrap">
						<span class="text-white/90"> Rémy Canal </span>

						<span class="h-px w-2 shrink-0 bg-white/25 sm:w-3" />

						<span> Creative Developer </span>
					</div>

					<span class="whitespace-nowrap text-white/30">
						Web Development · UI/UX Design
					</span>
				</div>

				<!-- TOP RIGHT -->
				<div
					class="absolute right-0 bottom-full mb-4 flex flex-col items-end gap-1 text-right font-sans text-[7px] leading-none tracking-[0.14em] text-white/30 uppercase sm:mb-5 sm:text-[9px] sm:tracking-[0.16em]"
				>
					<span class="text-white/55"> Freelance </span>

					<span class="whitespace-nowrap"> From concept to screen </span>
				</div>

				<!-- LOADING / YEAR ROW -->
				<div
					class="mb-2 flex w-full items-center justify-between font-sans text-[7px] leading-none tracking-[0.22em] text-white/30 uppercase sm:text-[8px]"
				>
					<div class="flex items-center gap-2">
						<span class="h-0.75 w-0.75 shrink-0 rounded-full bg-white/60" />

						<span> Loading </span>
					</div>

					<span>
						{{ currentYear }}
					</span>
				</div>

				<!-- COUNTER -->
				<span
					ref="counterRef"
					class="font-vg5000 inline-block w-[4ch] text-[2rem] leading-none text-white tabular-nums transition-opacity duration-200 will-change-transform sm:text-[3rem] md:text-[4rem]"
					:class="isFontsReady ? 'opacity-100' : 'opacity-0'"
				>
					0%
				</span>

				<!-- BOTTOM ROW -->
				<div
					class="absolute top-full right-0 left-0 mt-4 flex items-center justify-between font-sans text-[7px] leading-none tracking-[0.16em] text-white/25 uppercase sm:mt-5 sm:text-[8px]"
				>
					<!-- LEFT -->
					<div class="flex items-center gap-3">
						<span> Portfolio </span>

						<span class="h-px w-2 shrink-0 bg-white/15 sm:w-8" />

						<span> Digital Craft </span>
					</div>

					<!-- RIGHT -->
					<div class="flex items-center gap-3 text-right">
						<span> France </span>

						<span class="h-px w-2 shrink-0 bg-white/15 sm:w-8" />

						<span class="whitespace-nowrap"> Available for work </span>
					</div>
				</div>

				<!-- EDITORIAL LINE -->
				<div
					class="pointer-events-none absolute top-full right-0 left-0 mt-10 h-px bg-white/[0.07] sm:mt-12"
				>
					<span class="absolute top-0 left-0 h-px w-8 bg-white/25 sm:w-12" />

					<span class="absolute top-0 right-0 h-px w-8 bg-white/15 sm:w-12" />
				</div>
			</div>
		</div>

		<!-- CENTER AXIS -->
		<div
			class="pointer-events-none absolute top-[calc(50%+4.5rem)] left-1/2 hidden h-7 w-px -translate-x-1/2 bg-white/8 sm:block"
		/>

		<!-- CORNER METADATA -->
		<div
			class="p-edge pointer-events-none absolute inset-x-0 bottom-0 flex justify-between font-sans text-[7px] leading-none tracking-[0.2em] text-white/15 uppercase"
		>
			<span> RC — 002 </span>

			<span> © {{ currentYear }} </span>
		</div>
	</div>
</template>

<script setup lang="ts">
const { bind } = useLoadingProgress()
const isFontsReady = useFontsReady()

const currentYear = new Date().getFullYear()

const trackRef = shallowRef<HTMLElement | null>(null)
const counterRef = shallowRef<HTMLElement | null>(null)

let unbind: (() => void) | undefined

onMounted(() => {
	if (trackRef.value && counterRef.value) {
		unbind = bind(trackRef.value, counterRef.value)
	}
})

onUnmounted(() => {
	unbind?.()
})
</script>
