<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
	text: {
		type: String,
		required: true,
	},
});

const splitText = computed(() => props.text.split(""));

const isActive = ref(false);

onMounted(() => {
	setTimeout(() => {
		isActive.value = true;
	}, 10);
});

function getStyle(index) {
	return {
		transitionDelay: `${index * 0.02}s`,
	};
}
</script>

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

<style scoped>
.letter {
	display: inline-block;
	opacity: 0;
	transform: translateX(20px) translateY(10px) rotate(20deg);
	transition: opacity 0.3s ease, transform 0.3s ease;
}

.letter.active {
	opacity: 1;
	transform: translateX(0) translateY(0) rotate(0deg);
}
</style>
