<script setup lang="ts">
const {
	src,
	alt = "",
	background,
} = defineProps<{
	src: string
	/** Vide par défaut : le texte voisin porte déjà le nom. */
	alt?: string
	/** Couleur de fond (hex) du cadre ; la bordure s'en déduit. Sans fond : blanc et `gray-dark/50`. */
	background?: string
}>()

const frameStyle = computed(() => logoFrameStyle(background))
</script>

<template>
	<!--
		Cadre carré à taille fixe, en bloc simple : pas de grille ni de flex, donc la taille naturelle du
		SVG ne peut jamais agrandir la case (c'est ce qui faisait déborder les logos). L'image remplit la
		case ; son padding (12 %) laisse l'air autour, et `object-contain` ajuste le plus grand côté du
		SVG à la zone restante en gardant son ratio, centré. Rien n'est déformé, rien n'est coupé.
	-->
	<span
		class="border-gray-dark/50 shadow-frame block size-(--cv-frame,3.5rem) shrink-0 overflow-hidden rounded-sm border bg-white"
		:style="frameStyle"
	>
		<img
			:src
			:alt
			loading="lazy"
			decoding="async"
			class="block size-full object-contain object-center p-[calc(var(--cv-frame,3.5rem)*0.12)]"
		/>
	</span>
</template>
