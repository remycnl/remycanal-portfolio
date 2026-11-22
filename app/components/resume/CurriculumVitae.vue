<script setup lang="ts">
import { CHARACTER_SLOT_CLASSES } from "@/constants/character"

const MASCOT = "/stickers/characterFull_lime.svg"

const { heroReady, cvReady } = useResumeCharacterState()

// La bande du personnage n'existe qu'à partir de `lg` : on n'y monte la scène 3D que sur un
// pointeur desktop (jamais de WebGL caché ou inutile sur mobile / tactile, le sticker reste le repli).
const isDesktopPointer = useDesktopPointer()

// La scène 3D du CV n'est montée qu'une fois celle du hero prête, puis à l'idle : jamais deux
// initialisations WebGL en même temps au chargement, et le sticker reste le repli si WebGL échoue.
const mountCharacter = ref(false)

let cancelIdle: (() => void) | null = null

watch(
	heroReady,
	(ready) => {
		if (!ready || mountCharacter.value || cancelIdle) {
			return
		}

		const idleWindow = window as unknown as {
			requestIdleCallback?: (
				callback: () => void,
				options?: { timeout: number }
			) => number
			cancelIdleCallback?: (handle: number) => void
		}

		const mount = () => {
			cancelIdle = null
			mountCharacter.value = true
		}

		if (typeof idleWindow.requestIdleCallback === "function") {
			const handle = idleWindow.requestIdleCallback(mount, { timeout: 1500 })

			cancelIdle = () => idleWindow.cancelIdleCallback?.(handle)
		} else {
			const handle = window.setTimeout(mount, 1)

			cancelIdle = () => window.clearTimeout(handle)
		}
	},
	{ immediate: true }
)

onBeforeUnmount(() => {
	cancelIdle?.()
	cancelIdle = null
})

// Mois courant, partagé SSR → client : il sert aux durées des postes en cours. Remis à jour au
// montage pour qu'une page générée statiquement ne reste pas figée sur le mois du build.
const today = useState("resume-today", () => currentMonth())

onMounted(() => {
	today.value = currentMonth()
})

// À garder en dernier : tout ce qui précède s'exécute avant l'attente de la requête.
const { data } = await useAsyncData("resume-cv", () => queryCollection("resume").first())

if (!data.value) {
	throw createError({
		statusCode: 404,
		statusMessage: "curriculum.yml not found",
		fatal: true,
	})
}

// Nuxt Content type les champs à `.default()` comme optionnels, et TypeScript perd le narrowing
// d'un `v-if` à l'intérieur des slots. On normalise donc une fois ici : le template reçoit des
// valeurs toujours définies, et les périodes arrivent déjà formatées.
const resume = computed(() => {
	const cv = data.value

	return {
		name: cv?.name ?? "",
		headline: cv?.headline ?? "",
		linkedin: cv?.linkedin ?? "",
		email: cv?.email ?? "",
		education: cv?.education ?? [],
		experience: (cv?.experience ?? []).map((job) => ({
			...job,
			period: describePeriod(job.period, today.value),
		})),
		toolbox: {
			featured: cv?.toolbox.featured ?? [],
			more: cv?.toolbox.more ?? [],
		},
		awards: cv?.awards ?? [],
		languages: cv?.languages ?? "",
	}
})
</script>

<template>
	<div
		data-character-section="cv"
		class="relative isolate z-10 grid min-h-screen w-full grid-cols-[minmax(0,1fr)] [--cv-frame:3rem] [--cv-gap:0.75rem] sm:[--cv-frame:3.5rem] sm:[--cv-gap:1.5rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]"
	>
		<!--
			Pas de commentaire avant la racine <div> : Vue en ferait un fragment en dev (NUXT_E4004).
			Racine positionnée, avec un z-index au-dessus du hero sticky : le CV glisse par-dessus lui
			(rideau) et l'opacité des fonds (cellules blanches + grises) le masque entièrement.

			Desktop (lg) : une rangée de grille par section ; chaque cellule blanche et chaque cellule gris
			clair porte `section-p-xy`, donc le titre sticky et la première ligne du contenu démarrent à la
			même hauteur. Mobile : une seule colonne, chaque section est un bloc gris (voir <ResumeCvSection>).
			--cv-frame / --cv-gap : taille des cadres de logos et écart logo → texte, lus par les sous-composants.
		-->

		<!--
			Bande du personnage, desktop uniquement : sortie du flux (`absolute`) pour que les cellules
			portent les fonds, mais même rôle qu'avant. `flow-root` : la marge négative du slot ne remonte
			pas à la bande. `overflow-clip` : la bande clippe le slot tant qu'il dépasse au-dessus d'elle,
			sans devenir un conteneur de défilement (le sticky reste intact). Peinte au-dessus des cellules,
			elle laisse passer les clics (`pointer-events-none`) ; le slot les reprend (`pointer-events-auto`).
			Slot : même boîte que celui du hero, sticky sur la même ligne. --cv-pin-top et --cv-above sont
			calés par <ResumeCvCharacter>. L'opacité globale se règle avec --cv-character-opacity (0.5).
		-->
		<div
			class="pointer-events-none absolute inset-y-0 left-0 hidden w-1/4 overflow-clip lg:flow-root"
		>
			<div
				data-character-slot="cv"
				class="mb-section pointer-events-auto sticky top-(--cv-pin-top,60svh) mx-auto -mt-(--cv-above,40svh) opacity-(--cv-character-opacity,0.5)"
				:class="CHARACTER_SLOT_CLASSES"
			>
				<img
					:src="MASCOT"
					alt=""
					width="160"
					height="340"
					loading="lazy"
					decoding="async"
					class="block size-full object-contain transition-opacity duration-300 motion-reduce:transition-none"
					:class="cvReady ? 'opacity-0' : 'opacity-100'"
				/>

				<ResumeCvCharacter v-if="mountCharacter && isDesktopPointer" />
			</div>
		</div>

		<header class="bg-gray-light section-p-xy lg:contents">
			<div class="lg:section-p-xy mb-10 lg:mb-0 lg:bg-white">
				<p v-text-reveal class="flex flex-col text-base sm:text-xl">
					<span>{{ resume.name }}</span>
					<span>{{ resume.headline }}</span>
				</p>

				<!-- Le lien est inline-grid une fois la directive posée : aucune classe `display` ici, elle se battrait avec. -->
				<p class="mt-1 text-base sm:text-xl">
					<a
						v-roll-hover
						:href="resume.linkedin"
						target="_blank"
						rel="noopener"
						class="text-gray-dark/60 hover:text-gray-dark underline underline-offset-4 transition-colors motion-reduce:transition-none"
					>
						LinkedIn
					</a>
				</p>
			</div>

			<div class="lg:section-p-xy lg:bg-gray-light">
				<h1
					v-text-reveal
					class="font-lineal-black text-[clamp(2.5rem,11.5vw,6.5rem)] leading-none tracking-[-0.01em] uppercase lg:text-[clamp(3.5rem,7.4vw,9rem)]"
				>
					My Resume
				</h1>
			</div>
		</header>

		<ResumeCvSection v-if="resume.education.length" title="Education">
			<ul class="flex flex-col gap-8 sm:gap-12">
				<li v-for="item in resume.education" :key="item.logo">
					<ResumeCvEntry
						:logo="item.logo"
						:background="item.background"
						:description="item.description"
						:images="item.images"
						:documents="item.documents"
					>
						<template #title>
							<strong class="font-lineal-medium">{{ item.degree }}</strong>
							<template v-if="item.program">
								<span aria-hidden="true" class="font-vg5000">|</span>
								<span>{{ item.program }}</span>
							</template>
						</template>

						<template #meta>
							<span>{{ item.school }}</span>
							<span aria-hidden="true" class="font-vg5000 text-[0.7em]">•</span>
							<span>{{ item.country }}</span>
						</template>
					</ResumeCvEntry>
				</li>
			</ul>
		</ResumeCvSection>

		<ResumeCvSection v-if="resume.experience.length" title="Experience">
			<ul class="flex flex-col gap-8 sm:gap-12">
				<li v-for="job in resume.experience" :key="job.logo">
					<ResumeCvEntry
						:logo="job.logo"
						:background="job.background"
						:description="job.description"
						:images="job.images"
						:documents="job.documents"
					>
						<template #title>
							<span>{{ job.role }}</span>
							<span class="font-vg5000 text-[0.8em]">@</span>
							<strong class="font-lineal-medium">{{ job.company }}</strong>
						</template>

						<template #meta>
							<span
								>{{ job.period.start }} - <em v-if="!job.period.end">Now</em
								><template v-else>{{ job.period.end }}</template></span
							>
							<span aria-hidden="true" class="font-vg5000 text-[0.7em]">•</span>
							<span>{{ job.period.duration }}</span>
							<template v-if="job.location">
								<span aria-hidden="true" class="font-vg5000">|</span>
								<span>{{ job.location }}</span>
							</template>
						</template>
					</ResumeCvEntry>
				</li>
			</ul>
		</ResumeCvSection>

		<ResumeCvSection title="Toolbox">
			<ResumeCvToolbox :featured="resume.toolbox.featured" :more="resume.toolbox.more" />
		</ResumeCvSection>

		<ResumeCvSection v-if="resume.awards.length" title="Awards">
			<ul class="flex flex-col gap-8 sm:gap-12">
				<li v-for="award in resume.awards" :key="award.title + award.date">
					<ResumeCvEntry
						:description="award.description"
						:images="award.images"
						:documents="award.documents"
					>
						<template #title>
							<strong class="font-lineal-medium">{{ award.title }}</strong>
							<span class="font-vg5000 text-[0.8em]">@</span>
							<span>{{ award.issuer }}</span>
						</template>

						<template #meta>
							<span>{{ formatMonth(award.date, "long") }}</span>
						</template>
					</ResumeCvEntry>
				</li>
			</ul>
		</ResumeCvSection>

		<ResumeCvSection v-if="resume.languages" title="Languages">
			<p class="text-gray-dark/60 text-sm italic sm:text-xl">{{ resume.languages }}</p>
		</ResumeCvSection>

		<!-- Sans titre : la cellule blanche reste vide, la bande continue jusqu'en bas. -->
		<ResumeCvSection>
			<UiAnimatedButton label="Have a spot for me on your team?" to="/contact" />
		</ResumeCvSection>
	</div>
</template>
