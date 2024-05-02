<template>
	<div class="relative w-20 h-20 md:w-28 md:h-28 text-center">
		<div
			class="w-full h-full rounded-full bg-black border-2 md:border-3 border-gray-light border-opacity-5 flex justify-center items-center">
			<img
				v-if="props.isSVG"
				:id="'skill-bubble-' + props.text"
				:src="props.pathIcon"
				:alt="props.text"
				class="w-10 h-10 md:w-14 md:h-14" />
			<Icon
				v-else
				:id="'skill-bubble-' + props.text"
				:name="props.icon"
				:color="props.iconColor"
				class="w-10 h-10 md:w-14 md:h-14" />
		</div>
		<div
			@mouseenter="handleMouseEnter"
			:style="{ 'border-color': props.color }"
			class="absolute top-0 left-0 w-full h-full rounded-full border-t-2 md:border-t-3 opacity-50 hover:opacity-100 hover:saturate-200 ease-in-out transition duration-500 spin"></div>
		<div class="mt-2 text-lg md:text-xl text-gray-light whitespace-nowrap">
			{{ props.text }}
		</div>
	</div>
</template>

<script setup>
import { applyUnzoom } from "~/plugins/gsap";

const props = defineProps({
	text: String,
	color: String,
	icon: String,
	iconColor: String,
	pathIcon: String,
	isSVG: Boolean,
});

const handleMouseEnter = () => {
	if (typeof applyUnzoom === "function") {
		applyUnzoom(props.text);
	}
};
</script>

<style scoped>
.spin {
	animation: spin 3s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
