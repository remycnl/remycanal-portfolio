<template>
	<span class="scramble-text">
		<span v-for="(letter, index) in displayedText" :key="index" class="letter">
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

const chars =
	"!<>-_\\/[]{}—=+*^?#1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function scrambleText(newText) {
	if (!newText) return;

	const totalFrames = props.frames;
	const scrambleDuration = 300;
	const frameInterval = scrambleDuration / totalFrames;

	let frame = 0;
	const startTime = Date.now();

	displayedText.value = Array.from(newText).map(
		() => chars[Math.floor(Math.random() * chars.length)]
	);

	const interval = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min(elapsed / scrambleDuration, 1);

		displayedText.value = Array.from(newText).map((char, i) => {
			if (char === " ") return "\u00A0";
			return elapsed < scrambleDuration &&
				frame % totalFrames < Math.floor(totalFrames * progress)
				? chars[Math.floor(Math.random() * chars.length)]
				: newText[i];
		});

		frame++;

		if (elapsed >= scrambleDuration) {
			clearInterval(interval);
			displayedText.value = Array.from(newText);
		}
	}, frameInterval);
}

watch(
	() => props.text,
	(newText) => scrambleText(newText),
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
	transition: opacity 0.3s ease, transform 0.3s ease;
}
</style>
