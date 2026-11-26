<template>
	<section ref="sectionRoot" class="section-p-xy relative">
		<div
			class="border-gray-dark/50 grid grid-cols-1 border-t border-l sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[minmax(300px,auto)_minmax(300px,auto)_minmax(260px,auto)_minmax(200px,auto)]"
		>
			<div
				ref="zoneIntro"
				class="p-edge bg-grid-black border-gray-dark/50 @container relative flex min-h-70 flex-col justify-end overflow-hidden border-r border-b bg-black sm:col-span-2 sm:min-h-80 lg:col-span-3 lg:row-span-2 lg:min-h-0"
			>
				<span class="bg-lime absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<div class="text-lime relative z-10 mb-auto flex self-end lg:self-start">
					<span
						v-text-reveal="{ singlePhrase: true }"
						class="font-vg5000 text-fit text-[10px] tracking-[0.15em] uppercase sm:text-xs"
					>
						(<span class="text-white">resume</span>)
					</span>
				</div>

				<UiGridBeams theme="black" />

				<!-- Gros texte déstructuré, centré dans la case -->
				<div class="absolute inset-0 z-10 flex items-center justify-center">
					<h2
						v-text-reveal="{ singlePhrase: true }"
						class="font-lineal-bold flex w-fit flex-col gap-[0.3em] text-[17cqw] tracking-tighter text-white md:text-[10cqw] lg:text-[17cqw] 2xl:text-[15cqw]"
					>
						<!-- Ligne 1 : « Previously » donne la largeur de tout le bloc -->
						<span class="text-fit block">Previously</span>

						<!-- Ligne 2 : label centré dans le vide entre « on » et « Rémy » -->
						<span class="flex items-center">
							<span class="text-fit block">on</span>
							<span
								class="font-vg5000 text-fit text-gray-light block flex-1 px-[5cqw] text-center text-[9px] font-normal tracking-[0.15em] sm:text-[10px]"
							>
								Episode 01
							</span>
							<span class="text-fit block">Rémy</span>
						</span>

						<!-- Ligne 3 : label centré dans le vide à droite de « Canal » -->
						<span class="flex items-center pl-[14%]">
							<span class="text-fit block">Canal</span>
							<span
								class="font-vg5000 text-fit text-gray-light block flex-1 px-[5cqw] text-center text-[9px] font-normal tracking-[0.15em] sm:text-[10px]"
							>
								Here&apos;s what <br />happened.
							</span>
						</span>
					</h2>
				</div>
			</div>

			<div
				v-text-reveal="cardReveal"
				ref="zoneChapter01"
				:data-active="activeCards.has('chapter01')"
				class="p-edge border-gray-dark/50 group bg-gray-light relative flex min-h-55 cursor-auto flex-col justify-between overflow-hidden border-r border-b md:bg-white lg:col-span-2 lg:cursor-auto"
				@click="toggleCard('chapter01')"
			>
				<span
					class="bg-lime border-lime-dark/35 absolute top-3 left-3 z-20 h-2 w-2 border"
					aria-hidden="true"
				/>

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/beginning.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale transition-transform duration-700 select-none group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div class="absolute inset-0 bg-radial from-white/20 to-white/80" />
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 text-shadow-lime from-lime to-lime box-fit order-1 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-right bg-no-repeat text-4xl text-black tabular-nums transition-[background-size] duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] text-shadow-sm group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-2 lg:text-5xl"
						>01</span
					>
					<span
						class="font-vg5000 from-lime to-lime box-fit order-2 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-1"
						>2021</span
					>
				</div>
				<div class="relative z-10 space-y-4">
					<h3 class="font-lineal-bold text-fit text-2xl text-black uppercase lg:text-3xl">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-200 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>The beginning.</span
						>
					</h3>
					<p class="font-lineal-light text-fit text-sm text-black/60">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-300 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>My first line of code...</span
						>
					</p>
				</div>
			</div>

			<div
				ref="zoneEmpty1"
				class="border-gray-dark/50 bg-lime hidden items-center justify-center border-r border-b lg:flex"
			/>

			<div
				ref="zoneEmpty2"
				class="border-gray-dark/50 bg-gray-light hidden items-center justify-center border-r border-b lg:flex"
			/>

			<div
				v-text-reveal="cardReveal"
				ref="zoneChapter02"
				:data-active="activeCards.has('chapter02')"
				class="p-edge border-gray-dark/50 group md:bg-gray-light relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b bg-white lg:col-span-2 lg:cursor-auto lg:bg-white"
				@click="toggleCard('chapter02')"
			>
				<span
					class="bg-lime border-lime-dark/35 absolute top-3 left-3 z-20 h-2 w-2 border"
					aria-hidden="true"
				/>

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/epitech.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale transition-transform duration-700 select-none group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div class="absolute inset-0 bg-radial from-white/20 to-white/80" />
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 text-shadow-lime from-lime to-lime box-fit order-1 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-right bg-no-repeat text-4xl text-black tabular-nums transition-[background-size] duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] text-shadow-sm group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-2 lg:text-5xl"
						>02</span
					>
					<span
						class="font-vg5000 from-lime to-lime box-fit order-2 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-1"
						>2022</span
					>
				</div>
				<div class="relative z-10 space-y-4">
					<h3 class="font-lineal-bold text-fit text-2xl text-black uppercase lg:text-3xl">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-200 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Epitech.</span
						>
					</h3>
					<p class="font-lineal-light text-fit text-sm text-black/60">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-300 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Learning to build. Learning to think.</span
						>
					</p>
				</div>
			</div>

			<div
				v-text-reveal="cardRevealWhite"
				ref="zoneDublin"
				:data-active="activeCards.has('dublin')"
				class="p-edge border-gray-dark/50 bg-lime group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b lg:col-span-2 lg:cursor-auto"
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
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale transition-transform duration-700 select-none group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="absolute inset-0 bg-radial from-white/20 to-white/80" />
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 box-fit order-1 bg-linear-to-r from-white to-white [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-right bg-no-repeat text-4xl text-black tabular-nums transition-[background-size] duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] text-shadow-sm text-shadow-white group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-2 lg:text-5xl"
						>03</span
					>
					<span
						class="font-vg5000 box-fit order-2 bg-linear-to-r from-white to-white [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-1"
						>2025</span
					>
				</div>
				<div class="relative z-10 space-y-4">
					<h3 class="font-lineal-bold text-fit text-2xl text-black uppercase lg:text-3xl">
						<span
							class="box-fit bg-linear-to-r from-white to-white [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-200 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Dublin, Ireland.</span
						>
					</h3>
					<p class="font-lineal-light text-fit text-sm text-black/70">
						<span
							class="box-fit bg-linear-to-r from-white to-white [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-300 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>A year abroad. A double diploma. A slightly bigger world.</span
						>
					</p>
				</div>
			</div>

			<div
				v-text-reveal="cardReveal"
				ref="zoneFreelance"
				:data-active="activeCards.has('freelance')"
				class="p-edge border-gray-dark/50 group relative flex min-h-55 cursor-pointer flex-col justify-between overflow-hidden border-r border-b bg-white lg:col-span-2 lg:cursor-auto"
				@click="toggleCard('freelance')"
			>
				<span
					class="bg-lime border-lime-dark/35 absolute top-3 left-3 z-20 h-2 w-2 border"
					aria-hidden="true"
				/>

				<div
					class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-data-[active=true]:opacity-100"
				>
					<NuxtImg
						src="/resume/freelance.png"
						alt=""
						loading="lazy"
						decoding="async"
						sizes="400px"
						class="absolute inset-0 h-full w-full scale-100 object-cover object-center grayscale transition-transform duration-700 select-none group-hover:scale-110 group-data-[active=true]:scale-110"
					/>
					<div class="bg-lime/80 absolute inset-0 mix-blend-color" />
					<div class="absolute inset-0 bg-radial from-white/20 to-white/80" />
				</div>

				<div
					class="relative z-10 flex flex-col items-end gap-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4"
				>
					<span
						class="font-vg5000 from-lime to-lime text-shadow-lime box-fit order-1 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-right bg-no-repeat text-4xl text-black tabular-nums transition-[background-size] duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] text-shadow-sm group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-2 lg:text-5xl"
						>04</span
					>
					<span
						class="font-vg5000 from-lime to-lime box-fit order-2 bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat text-[11px] tracking-[0.2em] text-black/60 uppercase transition-[background-size] delay-100 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%] lg:order-1"
						>Now</span
					>
				</div>
				<div class="relative z-10 space-y-4">
					<h3 class="font-lineal-bold text-fit text-2xl text-black uppercase lg:text-3xl">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-200 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Freelance.</span
						>
					</h3>
					<p class="font-lineal-light text-fit text-sm text-black/60">
						<span
							class="from-lime to-lime box-fit bg-linear-to-r [box-decoration-break:clone] bg-size-[0%_100%] bg-bottom-left bg-no-repeat transition-[background-size] delay-300 duration-500 ease-out [--fit-x:0.25rem] [--fit-y:0.2rem] [-webkit-box-decoration-break:clone] group-hover:bg-size-[100%_100%] group-data-[active=true]:bg-size-[100%_100%]"
							>Turning ideas into digital experiences.</span
						>
					</p>
				</div>
			</div>

			<div
				ref="zoneEmpty5"
				class="border-gray-dark/50 bg-gray-light hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<div
				ref="zoneEmpty3"
				class="border-gray-dark/50 hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<div
				ref="zoneEmpty4"
				class="border-gray-dark/50 bg-lime hidden items-center justify-center border-r border-b lg:col-span-2 lg:flex"
			/>

			<div
				ref="zoneCta"
				class="p-edge bg-grid-black border-gray-dark/50 relative flex min-h-55 flex-col items-center justify-center overflow-hidden border-r border-b bg-black sm:col-span-2 lg:col-span-2 lg:items-end lg:justify-end"
			>
				<span class="bg-lime absolute top-3 left-3 z-20 h-2 w-2" aria-hidden="true" />

				<UiGridBeams theme="black" />

				<!-- Marquee "Resume" en bas, sans fond -->
				<div class="pointer-events-none absolute inset-x-0 bottom-0 z-0">
					<UiInfiniteHorizontalLoop
						text="Resume"
						fit
						fit-padding="0.12em"
						:repeat-count="{ mobile: 6, desktop: 8 }"
						item-class="font-lineal-heavy uppercase text-black-light text-[18vw] pr-[3vw] sm:text-[14vw] lg:text-[12vw] 2xl:text-[8vw]"
					/>
				</div>

				<UiAnimatedButton
					label="See the full story"
					to="/resume"
					pill="white"
					bubble="lime"
					text="black"
					icon="black"
					size="normal"
					class="relative z-10"
				/>
			</div>
		</div>
	</section>
</template>

<!--
	Remplace uniquement le bloc <script lang="ts" setup> de la section « Previously on Rémy Canal ».
	Le <template> ne change pas (tu peux juste supprimer l'attribut mort `ref="sectionRoot"` sur le <section>).
-->
<script lang="ts" setup>
const LG_BREAKPOINT = 1024
const CARD_CHILD_STAGGER = 0.3

const cardReveal = { childStagger: CARD_CHILD_STAGGER }
const cardRevealWhite = { ...cardReveal, theme: "white" }

/** Couleur des bulles du chat selon le fond de la case sur laquelle il se trouve. */
const ON_LIGHT = { textColorClass: "text-black" }
const ON_DARK = { textColorClass: "text-white" }

/**
 * Lignes propres à chaque case : le chat les mêle à ses répliques génériques quand il y arrive,
 * s'y repose ou y est survolé. ASCII uniquement (police pixel), courtes.
 */
const INTRO_LINES = ["Previously on this portfolio...", "Episode one. Popcorn ready?"]
const CHAPTER01_LINES = ["Where it all started.", "Hello, world!"]
const CHAPTER02_LINES = ["Learning to build.", "So. Many. Projects."]
const DUBLIN_LINES = ["Dublin! Rain included.", "A slightly bigger world."]
const FREELANCE_LINES = ["Freelance mode: on.", "Ideas in, pixels out."]
const CTA_LINES = ["Go on, press the button!", "The full story is one click away."]

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

const isTouchDevice = ref(false)
const activeCards = reactive(new Set<string>())

function toggleCard(key: string) {
	if (!isTouchDevice.value) return
	if (activeCards.has(key)) activeCards.delete(key)
	else activeCards.add(key)
}

onMounted(() => {
	isTouchDevice.value = window.matchMedia("(hover: none) and (pointer: coarse)").matches
})

/**
 * Le chat est un singleton auto-initialisé par `useCatZone` (taille responsive, vitesse, balade :
 * tout est dans les défauts de useSprite.ts). Cette section ne fait que déclarer ses cases.
 * Les cases vides n'existent qu'à partir de `lg` (elles sont `hidden` en dessous), d'où les deux groupes.
 */
useCatZone({
	desktop: {
		minWidth: LG_BREAKPOINT,
		initial: zoneEmpty1,
		zones: [
			{ zone: zoneIntro, ...ON_DARK, phrases: INTRO_LINES },
			{ zone: zoneChapter01, ...ON_LIGHT, phrases: CHAPTER01_LINES },
			{ zone: zoneEmpty1, ...ON_LIGHT },
			{ zone: zoneEmpty2, ...ON_LIGHT },
			{ zone: zoneChapter02, ...ON_LIGHT, phrases: CHAPTER02_LINES },
			{ zone: zoneDublin, ...ON_LIGHT, phrases: DUBLIN_LINES },
			{ zone: zoneFreelance, ...ON_LIGHT, phrases: FREELANCE_LINES },
			{ zone: zoneEmpty5, ...ON_LIGHT },
			{ zone: zoneEmpty3, ...ON_LIGHT },
			{ zone: zoneEmpty4, ...ON_LIGHT },
			{ zone: zoneCta, ...ON_DARK, phrases: CTA_LINES },
		],
	},
	mobile: {
		maxWidth: LG_BREAKPOINT - 1,
		initial: zoneIntro,
		zones: [
			{ zone: zoneIntro, ...ON_DARK, phrases: INTRO_LINES },
			{ zone: zoneChapter01, ...ON_LIGHT, phrases: CHAPTER01_LINES },
			{ zone: zoneChapter02, ...ON_LIGHT, phrases: CHAPTER02_LINES },
			{ zone: zoneDublin, ...ON_LIGHT, phrases: DUBLIN_LINES },
			{ zone: zoneFreelance, ...ON_LIGHT, phrases: FREELANCE_LINES },
			{ zone: zoneCta, ...ON_DARK, phrases: CTA_LINES },
		],
	},
})
</script>
