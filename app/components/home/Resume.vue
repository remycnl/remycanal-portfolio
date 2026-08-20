<template>
	<section ref="sectionRoot" class="section-p-xy relative">
		<div
			class="border-gray-dark/50 grid grid-cols-1 border-t border-l sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[minmax(300px,auto)_minmax(300px,auto)_minmax(260px,auto)_minmax(200px,auto)]"
		>
			<!-- INTRO -->
			<div
				ref="zoneIntro"
				class="p-edge bg-grid-black border-gray-dark/50 relative flex min-h-70 flex-col justify-end overflow-hidden border-r border-b bg-black sm:col-span-2 sm:min-h-80 lg:col-span-3 lg:row-span-2 lg:min-h-0"
			>
				<span class="bg-lime absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<UiGridBeams theme="black" />

				<div class="relative z-10 ml-auto max-w-[85%] space-y-2 text-right sm:max-w-[65%]">
					<p class="font-vg5000 text-lime text-xs tracking-[0.3em] uppercase">
						Previously on
					</p>
					<h2
						class="font-lineal-bold text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl"
					>
						Rémy Canal
					</h2>
					<p class="font-lineal-light text-lg text-white/70 sm:text-xl lg:text-2xl">
						Here&apos;s what happened.
					</p>
				</div>
			</div>

			<!-- Chapitre 01 -->
			<div
				ref="zoneChapter01"
				:data-active="activeCards.has('chapter01')"
				class="p-edge border-gray-dark/50 group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b bg-white lg:col-span-2 lg:cursor-default"
				@click="toggleCard('chapter01')"
			>
				<span class="bg-lime border border-lime-dark/35 absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/beginning.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale select-none transition-transform duration-700 group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div
						class="absolute inset-0 bg-radial from-white/20 to-white/80"
					/>
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 text-shadow-sm text-shadow-lime bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-right bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-4xl leading-none tabular-nums text-black transition-[background-size] duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-1 lg:order-2 lg:text-5xl"
						>01</span
					>
					<span
						class="font-vg5000 bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-2 lg:order-1 lg:pt-1"
						>2021</span
					>
				</div>
				<div class="relative z-10 space-y-1">
					<h3 class="font-lineal-bold text-2xl text-black uppercase lg:text-3xl">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-200 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>The beginning.</span
						>
					</h3>
					<p class="font-lineal-light text-sm text-black/60">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-300 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>My first line of code...</span
						>
					</p>
				</div>
			</div>

			<!-- vide — chat — top-right (desktop uniquement) -->
			<div
				ref="zoneEmpty1"
				class="border-gray-dark/50 bg-lime hidden items-center justify-center border-r border-b lg:flex"
			/>

			<!-- vide — chat (desktop uniquement) -->
			<div
				ref="zoneEmpty2"
				class="border-gray-dark/50 hidden items-center justify-center border-r border-b lg:flex"
			/>

			<!-- Chapitre 02 -->
			<div
				ref="zoneChapter02"
				:data-active="activeCards.has('chapter02')"
				class="p-edge border-gray-dark/50 group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b bg-white lg:col-span-2 lg:cursor-default"
				@click="toggleCard('chapter02')"
			>
				<span class="bg-lime absolute border border-lime-dark/35 top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/epitech.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center transition-transform grayscale select-none duration-700 group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div
						class="absolute inset-0 bg-radial from-white/20 to-white/80"
					/>
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 text-shadow-sm text-shadow-lime bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-right bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-4xl leading-none tabular-nums text-black transition-[background-size] duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-1 lg:order-2 lg:text-5xl"
						>02</span
					>
					<span
						class="font-vg5000 bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-2 lg:order-1 lg:pt-1"
						>2022</span
					>
				</div>
				<div class="relative z-10 space-y-1">
					<h3 class="font-lineal-bold text-2xl text-black uppercase lg:text-3xl">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-200 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Epitech.</span
						>
					</h3>
					<p class="font-lineal-light text-sm text-black/60">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-300 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Learning to build. Learning to think.</span
						>
					</p>
				</div>
			</div>

			<!-- Dublin — 03 — lime -->
			<div
				ref="zoneDublin"
				:data-active="activeCards.has('dublin')"
				class="p-edge border-gray-dark/50 bg-lime group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b lg:col-span-2 lg:cursor-default"
				@click="toggleCard('dublin')"
			>
				<span class="absolute top-3 left-3 z-20 h-2 w-2 bg-black" aria-hidden="true" />

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/dublin.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover grayscale select-none object-center transition-transform duration-700 group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div
						class="absolute inset-0 bg-radial from-white/20 to-white/80"
					/>
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 text-shadow-sm text-shadow-white bg-linear-to-r from-white to-white bg-no-repeat bg-bottom-right bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-4xl leading-none tabular-nums text-black transition-[background-size] duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-1 lg:order-2 lg:text-5xl"
						>03</span
					>
					<span
						class="font-vg5000 bg-linear-to-r from-white to-white bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-2 lg:order-1 lg:pt-1"
						>2025</span
					>
				</div>
				<div class="relative z-10 space-y-1">
					<h3 class="font-lineal-bold text-2xl text-black uppercase lg:text-3xl">
						<span
							class="bg-linear-to-r from-white to-white bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-200 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Dublin, Ireland.</span
						>
					</h3>
					<p class="font-lineal-light text-sm text-black/70">
						<span
							class="bg-linear-to-r from-white to-white bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-300 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>A year abroad. A double diploma. A slightly bigger world.</span
						>
					</p>
				</div>
			</div>

			<!-- Freelance — 04 -->
			<div
				ref="zoneFreelance"
				:data-active="activeCards.has('freelance')"
				class="p-edge border-gray-dark/50 group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b bg-white lg:col-span-2 lg:cursor-default"
				@click="toggleCard('freelance')"
			>
				<span class="bg-lime border border-lime-dark/35 absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/freelance.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale select-none transition-transform duration-700 group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div
						class="absolute inset-0 bg-radial from-white/20 to-white/80"
					/>
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 bg-linear-to-r from-lime to-lime text-shadow-sm text-shadow-lime bg-no-repeat bg-bottom-right bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-4xl leading-none tabular-nums text-black transition-[background-size] duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-1 lg:order-2 lg:text-5xl"
						>04</span
					>
					<span
						class="font-vg5000 bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] order-2 lg:order-1 lg:pt-1"
						>Now</span
					>
				</div>
				<div class="relative z-10 space-y-1">
					<h3 class="font-lineal-bold text-2xl text-black uppercase lg:text-3xl">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-200 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Freelance.</span
						>
					</h3>
					<p class="font-lineal-light text-sm text-black/60">
						<span
							class="bg-linear-to-r from-lime to-lime bg-no-repeat bg-bottom-left bg-size-[0%_100%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 transition-[background-size] delay-300 duration-500 ease-out group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Turning ideas into digital experiences.</span
						>
					</p>
				</div>
			</div>

			<!-- vide — chat (desktop uniquement) -->
			<div
				ref="zoneEmpty5"
				class="border-gray-dark/50 hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<!-- vide — chat (desktop uniquement) -->
			<div
				ref="zoneEmpty3"
				class="border-gray-dark/50 hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<!-- vide — chat — lime (desktop uniquement) -->
			<div
				ref="zoneEmpty4"
				class="border-gray-dark/50 bg-lime hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<!-- Bouton — bottom-right -->
			<div
				ref="zoneCta"
				class="p-edge bg-grid-black border-gray-dark/50 relative flex min-h-55 flex-col items-center justify-center overflow-hidden border-r border-b bg-black sm:col-span-2 lg:col-span-2 lg:items-end lg:justify-end"
			>
				<span class="bg-lime absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<UiGridBeams theme="black" />

				<UiAnimatedButton
					label="See the full story"
					to="/resume"
					pill="white"
					bubble="lime"
					size="normal"
					class="relative z-10"
				/>
			</div>
		</div>
	</section>
</template>

<script lang="ts" setup>
const sectionRoot = useTemplateRef<HTMLElement>("sectionRoot")

const zoneIntro = useTemplateRef<HTMLElement>("zoneIntro")
const zoneChapter01 = useTemplateRef<HTMLElement>("zoneChapter01")
const zoneChapter02 = useTemplateRef<HTMLElement>("zoneChapter02")
const zoneDublin = useTemplateRef<HTMLElement>("zoneDublin")
const zoneFreelance = useTemplateRef<HTMLElement>("zoneFreelance")
const zoneCta = useTemplateRef<HTMLElement>("zoneCta")

const zoneEmpty1 = useTemplateRef<HTMLElement>("zoneEmpty1")
const zoneEmpty2 = useTemplateRef<HTMLElement>("zoneEmpty2")
const zoneEmpty3 = useTemplateRef<HTMLElement>("zoneEmpty3")
const zoneEmpty4 = useTemplateRef<HTMLElement>("zoneEmpty4")
const zoneEmpty5 = useTemplateRef<HTMLElement>("zoneEmpty5")

const isDesktop = ref(false)

const catDisplayHeight = computed(() => {
	if (isDesktop.value) return 80
	return Math.round(Math.min(70, Math.max(40, window.innerWidth * 0.12)))
})

let mediaQuery: MediaQueryList | null = null

const updateMediaQuery = () => {
	if (mediaQuery) isDesktop.value = mediaQuery.matches
}

// Toggle tactile : activé uniquement sur les appareils sans hover réel
// (mobile/tablette), jamais sur desktop même à écran tactile hybride.
const isTouchDevice = ref(false)
const activeCards = reactive(new Set<string>())

function toggleCard(key: string) {
	if (!isTouchDevice.value) return
	if (activeCards.has(key)) activeCards.delete(key)
	else activeCards.add(key)
}

onMounted(() => {
	mediaQuery = window.matchMedia("(min-width: 1024px)")
	updateMediaQuery()
	mediaQuery.addEventListener("change", updateMediaQuery)

	isTouchDevice.value = window.matchMedia("(hover: none) and (pointer: coarse)").matches
})

onBeforeUnmount(() => {
	mediaQuery?.removeEventListener("change", updateMediaQuery)
})

useSprite({
	spriteSrc: "/sprites/cat-black-light.png",
	totalFrames: 19,
	displayHeight: catDisplayHeight,
	speed: 250,
	textColorClass: "text-black",
	autoWander: true,
})

useCatZone({
	desktop: {
		minWidth: 1024,
		initial: zoneEmpty1,
		zones: [
			{ zone: zoneIntro, textColorClass: "text-white" },
			{ zone: zoneChapter01, textColorClass: "text-black" },
			{ zone: zoneEmpty1, textColorClass: "text-black" },
			{ zone: zoneEmpty2, textColorClass: "text-black" },
			{ zone: zoneChapter02, textColorClass: "text-black" },
			{ zone: zoneDublin, textColorClass: "text-black" },
			{ zone: zoneFreelance, textColorClass: "text-black" },
			{ zone: zoneEmpty5, textColorClass: "text-black" },
			{ zone: zoneEmpty3, textColorClass: "text-black" },
			{ zone: zoneEmpty4, textColorClass: "text-black" },
			{ zone: zoneCta, textColorClass: "text-white" },
		],
	},
	mobile: {
		maxWidth: 1023,
		initial: zoneIntro,
		zones: [
			{ zone: zoneIntro, textColorClass: "text-white" },
			{ zone: zoneChapter01, textColorClass: "text-black" },
			{ zone: zoneChapter02, textColorClass: "text-black" },
			{ zone: zoneDublin, textColorClass: "text-black" },
			{ zone: zoneFreelance, textColorClass: "text-black" },
			{ zone: zoneCta, textColorClass: "text-white" },
		],
	},
})
</script>