<script setup lang="ts">
import type { ResumeDocument, ResumeImage } from "@/utils/resume"

const {
	logo,
	background,
	description,
	images = [],
	documents = [],
} = defineProps<{
	logo?: string
	/** Couleur de fond (hex) du cadre du logo ; la bordure s'en déduit. */
	background?: string
	/** Description, images et documents alimentent le panneau : le « + » n'existe que s'il y en a au moins un. */
	description?: string
	images?: ResumeImage[]
	documents?: ResumeDocument[]
}>()

// Images et documents partagent le même aperçu : <ResumeCvPreview> déduit le type de l'extension.
const previews = computed(() => [
	...images.map(({ src, alt }) => ({ src, label: alt })),
	...documents.map(({ href, label }) => ({ src: href, label })),
])

const expandable = computed(() => Boolean(description) || previews.value.length > 0)

const open = ref(false)
const panelId = useId()

// Les aperçus ne se chargent qu'à l'intérêt (survol, focus, ouverture) : prêts quand le panneau s'ouvre.
const warm = ref(false)

function toggle() {
	if (!expandable.value) {
		return
	}

	warm.value = true
	open.value = !open.value
}
</script>

<template>
	<div class="max-w-4xl">
		<!-- Mobile : logo et « + » en haut, alignés sur la première ligne. À partir de `sm` : centrés. -->
		<component
			:is="expandable ? 'button' : 'div'"
			:type="expandable ? 'button' : undefined"
			:aria-expanded="expandable ? open : undefined"
			:aria-controls="expandable ? panelId : undefined"
			class="group/entry flex w-full items-start gap-(--cv-gap,1.5rem) rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:items-center"
			:class="expandable && 'cursor-pointer'"
			@pointerenter="warm = true"
			@focus="warm = true"
			@click="toggle"
		>
			<ResumeCvLogo v-if="logo" :src="logo" :background />

			<span
				class="flex min-w-0 flex-1 flex-col gap-0.5 text-sm sm:gap-1 sm:text-lg lg:text-xl"
			>
				<!-- `gap-x-[0.5em]` : l'espace de chaque côté de « @ », « | » et « • » (≈ 2 espaces). -->
				<span class="flex flex-wrap items-baseline gap-x-[0.5em]">
					<slot name="title" />
				</span>
				<span
					class="text-gray-dark/60 flex flex-wrap items-baseline gap-x-[0.5em] text-xs sm:text-[1em]"
				>
					<slot name="meta" />
				</span>
			</span>

			<!--
				« + » en vg5000. Le glyphe est rogné à la hauteur d'x (`text-fit-x`) et centré dans une boîte
				carrée de 1em : la rotation se fait autour de son propre centre, sans décalage.
			-->
			<span
				v-if="expandable"
				aria-hidden="true"
				class="font-vg5000 text-gray-dark/60 group-hover/entry:text-gray-dark inline-grid size-[1em] shrink-0 place-items-center text-xl transition-colors motion-reduce:transition-none sm:text-2xl"
			>
				<span
					class="text-fit-x block transition-transform duration-300 ease-out motion-reduce:transition-none"
					:class="open && 'rotate-45'"
					>+</span
				>
			</span>
		</component>

		<!--
			Une seule animation de layout (la rangée de grille passe de 0fr à 1fr) et une seule de
			compositeur (fondu + glissement du contenu) : rien n'est animé élément par élément.
			`-mx-3 px-3` / `py-4` : de la place pour les ombres, coupées sinon par `overflow-hidden`.
			Le padding vertical est sur l'enfant : fermé, la hauteur tombe bien à 0. `inert` : rien de
			focusable ni lu quand c'est replié.
		-->
		<div
			v-if="expandable"
			:id="panelId"
			class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
			:class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
			:inert="!open"
		>
			<div class="-mx-3 min-h-0 overflow-hidden px-3">
				<div
					class="flex flex-col gap-4 py-4 transition duration-300 ease-out motion-reduce:transition-none sm:ps-[calc(var(--cv-frame,3.5rem)+var(--cv-gap,1.5rem))]"
					:class="open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'"
				>
					<p
						v-if="description"
						class="text-gray-dark/80 max-w-prose text-sm sm:text-base"
					>
						{{ description }}
					</p>

					<!-- Les aperçus se suivent dans le même flex-wrap, chacun à la taille de son fichier. -->
					<ul v-if="previews.length" class="flex flex-wrap items-start gap-3">
						<li v-for="preview in previews" :key="preview.src">
							<ResumeCvPreview v-bind="preview" :active="warm" />
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
