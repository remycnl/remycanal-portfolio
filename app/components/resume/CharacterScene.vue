<script setup lang="ts">
import { CHARACTER_MAX_PIXEL_RATIO } from "@/constants/character"
import { CHARACTER_MODEL_URL } from "@/constants/logo"

withDefaults(
	defineProps<{
		/** Met la boucle de rendu en pause (personnage masqué ou hors de sa plage visible). */
		paused?: boolean
		/** Couleur du corps : toute couleur CSS, y compris une variable (`var(--color-lime)`). */
		bodyColor?: string
		/** Couleur du visage : mêmes formats que `bodyColor`. */
		faceColor?: string
	}>(),
	{
		paused: false,
		bodyColor: "var(--color-lime)",
		faceColor: "var(--color-black-light)",
	}
)

const emit = defineEmits<{
	ready: []
}>()

/**
 * Part de la hauteur du canvas occupée par le personnage. Doit rester alignée avec
 * AppLogoScene : modèle ajusté à 2.6 unités, caméra à z = 6 avec un fov de 35°.
 */
const CHARACTER_FIT_RATIO = 2.6 / (2 * 6 * Math.tan((35 / 2) * (Math.PI / 180)))

/** Largeur / hauteur du canvas (`--logo-scene-aspect` plus bas) et du slot (sticker 160×340). */
const CANVAS_ASPECT = 1 / 1.7
const SLOT_ASPECT = 340 / 160

// Le slot délimite la boîte du personnage ; le canvas est plus grand (marge de cadrage),
// centré dessus. Tout en pourcentages du slot : aucune mesure JS.
const sceneHeight = 100 / CHARACTER_FIT_RATIO
const sceneWidth = sceneHeight * SLOT_ASPECT * CANVAS_ASPECT

// Déclencheur stable des couleurs d'AppLogoScene (la page entière : toujours actif).
const triggerEl = import.meta.client ? document.documentElement : null
</script>

<template>
	<AppLogoScene
		class="character-scene"
		:style="{ width: `${sceneWidth.toFixed(3)}%`, height: `${sceneHeight.toFixed(3)}%` }"
		:model-url="CHARACTER_MODEL_URL"
		:body-color="bodyColor"
		:face-color="faceColor"
		:trigger-el="triggerEl"
		:paused="paused"
		:max-pixel-ratio="CHARACTER_MAX_PIXEL_RATIO"
		disable-hover
		skip-intro
		@ready="emit('ready')"
	/>
</template>

<style scoped>
.character-scene {
	--logo-scene-width: 100%;
	--logo-scene-aspect: 1 / 1.7;

	position: absolute;
	top: 50%;
	left: 50%;

	translate: -50% -50%;
}

/* Décoratif : ne doit jamais capter le pointeur, y compris sur écran tactile. */
.character-scene :deep(.logo-scene) {
	pointer-events: none;
}
</style>
