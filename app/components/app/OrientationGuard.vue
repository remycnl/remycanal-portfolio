<script setup lang="ts">
const isLandscapePhone = ref(false)

function check() {
	// screen.* décrit l'appareil, pas le viewport : le clavier virtuel ne le change pas
	const type = screen.orientation?.type
	const legacy = (window as Window & { orientation?: number }).orientation // iOS < 16.4

	let landscape: boolean
	if (type) landscape = type.startsWith("landscape")
	else if (typeof legacy === "number") landscape = Math.abs(legacy) === 90
	else landscape = screen.width > screen.height

	// Téléphone uniquement (pas tablette ni desktop), indépendant du viewport
	const isPhone =
		Math.min(screen.width, screen.height) <= 600 &&
		window.matchMedia("(pointer: coarse)").matches

	isLandscapePhone.value = landscape && isPhone
}

onMounted(() => {
	check()
	screen.orientation?.addEventListener("change", check)
	window.addEventListener("orientationchange", check)
	window.addEventListener("resize", check)
})

onBeforeUnmount(() => {
	screen.orientation?.removeEventListener("change", check)
	window.removeEventListener("orientationchange", check)
	window.removeEventListener("resize", check)
})
</script>

<template>
	<div
		v-if="isLandscapePhone"
		class="bg-grid-black pointer-events-auto fixed inset-0 z-9999 flex h-dvh w-dvw touch-none flex-col items-center justify-center gap-5 overscroll-contain bg-black px-8 text-center"
		role="alertdialog"
		aria-modal="true"
		aria-labelledby="orientation-guard-title"
		aria-describedby="orientation-guard-desc"
	>
		<span class="bg-lime absolute top-3 left-3 h-2 w-2" aria-hidden="true" />

		<svg
			class="orientation-guard-phone text-lime h-12 w-12 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect x="7" y="2" width="10" height="20" rx="2" />
			<path d="M11 18h2" />
		</svg>

		<p
			id="orientation-guard-title"
			class="font-vg5000 text-lime text-fit text-[10px] tracking-[0.25em] uppercase"
		>
			(<span class="text-white">rotate</span>)
		</p>

		<p
			id="orientation-guard-desc"
			class="font-lineal-bold text-fit max-w-xs text-xl text-white"
		>
			For a better experience, please rotate your device to portrait.
		</p>
	</div>
</template>

<style scoped>
/* inchangé */
.orientation-guard-phone {
	animation: orientation-guard-rotate 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

@keyframes orientation-guard-rotate {
	0%,
	15% {
		transform: rotate(-90deg);
	}
	55%,
	100% {
		transform: rotate(0deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.orientation-guard-phone {
		animation: none;
	}
}
</style>
