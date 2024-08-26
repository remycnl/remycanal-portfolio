<template>
	<span class="letter-container">
		<span
			v-for="(letter, index) in splitText"
			:key="index"
			class="letter"
			:class="{ active: isActive }"
			:style="getStyle(index)">
			{{ letter === " " ? "\u00A0" : letter }}
		</span>
	</span>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
	text: {
		type: String,
		required: true,
	},
});

// Diviser le texte en un tableau de lettres
const splitText = computed(() => props.text.split(""));

// Ajouter une classe active après le montage du composant
const isActive = ref(false);

onMounted(() => {
	// Attendre un court délai pour assurer que le DOM est mis à jour, puis activer la classe
	setTimeout(() => {
		isActive.value = true;
	}, 10);
});

// Appliquer un style avec un délai d'animation pour chaque lettre
function getStyle(index) {
	return {
		transitionDelay: `${index * 0.02}s`, // Délai pour chaque lettre (0.02s par lettre)
	};
}
</script>

<style scoped>
.letter {
	display: inline-block;
	opacity: 0;
	transform: translateY(10px);
	transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Lorsque la classe active est appliquée, lancer la transition */
.letter.active {
	opacity: 1;
	transform: translateY(0);
}


</style>
