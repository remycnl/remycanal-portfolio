<template>
	<span class="scramble-text">
		<span
			v-for="(letter, index) in displayedText"
			:key="index"
			class="letter"
			:class="isFinalText ? 'text-white' : 'text-secondary'"
		>
			{{ letter === " " ? "\u00A0" : letter }}
		</span>
	</span>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
	text: {
		type: String,
		default: "",
	},
	frames: {
		type: Number,
		default: 30,
	},
});

const displayedText = ref([]);
const isFinalText = ref(false);

const chars =
	"!<>-_\\/[]{}—=+*^?#1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Cette fonction gère le scrambling du texte
function scrambleText(newText) {
	if (!newText) return;

	const totalFrames = props.frames;
	const scrambleDuration = 300;
	const frameInterval = scrambleDuration / totalFrames;

	let frame = 0;
	const startTime = Date.now();
	isFinalText.value = false;

	// Initialisation avec des caractères aléatoires
	displayedText.value = Array.from(newText).map(
		() => chars[Math.floor(Math.random() * chars.length)]
	);

	const interval = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min(elapsed / scrambleDuration, 1);

		displayedText.value = Array.from(newText).map((char, i) => {
			if (char === " ") return "\u00A0"; // Gère les espaces
			// Remplace progressivement les lettres aléatoires par les vraies
			return elapsed < scrambleDuration &&
				frame % totalFrames < Math.floor(totalFrames * progress)
				? chars[Math.floor(Math.random() * chars.length)]
				: newText[i];
		});

		frame++;

		if (elapsed >= scrambleDuration) {
			clearInterval(interval); // Arrête l'intervalle une fois l'animation terminée
			displayedText.value = Array.from(newText); // Affiche le texte final
			isFinalText.value = true;
		}
	}, frameInterval);
}

let previousText = ref("");

watch(
	() => props.text,
	(newText) => {
		displayedText.value = [];
		isFinalText.value = false;
		previousText.value = newText;
		setTimeout(() => scrambleText(newText), 0);
	},
	{ immediate: true }
);
</script>

<style scoped>
.scramble-text {
	display: inline-block;
	font-family: "Orbitron", sans-serif;
}

.letter {
	display: inline-block;
	transition: color 0.5s ease, opacity 0.3s ease, transform 0.3s ease;
}
</style>
