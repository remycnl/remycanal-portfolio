<!-- components/PreviouslyOn.vue -->
<template>
	<div class="section-p-xy space-y-6">
		<!-- Endroit 1 : point de départ du chat (violet) -->
		<div class="w-full p-4 h-150 rounded-3xl bg-violet">
			<div
				ref="zoneViolet"
				class="p-edge relative h-full w-1/2 rounded-xl bg-black bg-grid-black"
			>
				<UiGridBeams theme="black" />
				<h2 class="font-lineal-bold text-3xl text-white lg:text-4xl">
					Previously on <span class="text-lime">Rémy Canal</span>...
				</h2>
				<p class="font-lineal-light text-lg text-white lg:text-xl">Here's what happened.</p>
			</div>
		</div>

		<!-- Endroit 2 : le chat y saute au scroll, change de skin (lime) -->
		<div class="w-full p-4 h-150 rounded-3xl bg-lime">
			<div
				ref="zoneLime"
				class="p-edge relative h-full w-1/2 rounded-xl bg-black bg-grid-black"
			>
				<h2 class="font-lineal-bold text-3xl text-white lg:text-4xl">Next up...</h2>
				<p class="font-lineal-light text-lg text-white lg:text-xl">Deuxième étape.</p>
			</div>
		</div>

		<!-- Endroit 3 : dernier saut, skin par défaut -->
		<div class="w-full p-4 h-150 rounded-3xl bg-violet">
			<div
				ref="zoneFinal"
				class="p-edge relative ml-auto h-full w-1/2 rounded-xl bg-black bg-grid-black"
			>
				<h2 class="font-lineal-bold text-3xl text-white lg:text-4xl">The end.</h2>
				<p class="font-lineal-light text-lg text-white lg:text-xl">Dernière étape.</p>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
// useTemplateRef évite le ref() + binding manuel : il se lie tout seul
// à l'attribut ref="..." correspondant dans le template.
const zoneViolet = useTemplateRef<HTMLElement>('zoneViolet')
const zoneLime = useTemplateRef<HTMLElement>('zoneLime')
const zoneFinal = useTemplateRef<HTMLElement>('zoneFinal')

// Un seul appel à useSprite() : il crée le chat et fixe sa config de base.
// Les appels suivants ailleurs dans l'app réutiliseront cette même instance.
useSprite({
	spriteSrc: '/sprites/cat-violet.png', // skin par défaut
	totalFrames: 19,
	displayHeight: 100,
	speed: 200,
})

// useCatZone() gère montage/démontage tout seul : plus besoin d'écrire
// onMounted/onUnmounted à la main pour chaque zone.
useCatZone(zoneViolet) // pas de spriteSrc -> garde le skin par défaut (violet)
useCatZone(zoneLime, { spriteSrc: '/sprites/cat-lime.png' }) // change de couleur en y atterrissant
useCatZone(zoneFinal) // revient au skin par défaut
</script>