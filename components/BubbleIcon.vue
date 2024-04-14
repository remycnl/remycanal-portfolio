<script setup>
defineProps({
	text: {
		type: String,
		default: null,
	},
	color: {
		type: String,
		default: null,
	},
	icon: {
		type: String,
		default: null,
	},
	iconColor: {
		type: String,
		default: null,
	},
	pathIcon: {
		type: String,
		default: null,
	},
	isSVG: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<div class="relative w-20 h-20 md:w-28 md:h-28 text-center">
		<div
			class="w-full h-full rounded-full bg-black border-2 md:border-3 border-gray-light border-opacity-5 flex justify-center items-center">
			<img
				v-if="isSVG"
				:src="pathIcon"
				:alt="text"
				class="w-10 h-10 md:w-14 md:h-14" />
			<Icon
				v-else
				:name="icon"
				:color="iconColor"
				class="w-10 h-10 md:w-14 md:h-14" />
		</div>
		<div
			:style="{ 'border-color': color }"
			class="absolute top-0 left-0 w-full h-full rounded-full border-t-2 md:border-t-3 opacity-50 hover:opacity-100 transition duration-500 spin"></div>
		<div class="mt-2 text-gray-light whitespace-nowrap">{{ text }}</div>
	</div>
</template>

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
