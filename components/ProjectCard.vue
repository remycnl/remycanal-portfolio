<template>
	<div class="group relative z-50 w-96 h-[40rem] rounded-[2rem] overflow-hidden border-3 border-gray-dark shadow-around shadow-black">
		<!-- Conteneur pour l'image et le dégradé -->
		<div class="relative w-full h-full overflow-hidden rounded-[inherit]">
			<img
				:src="img"
				:alt="`Mockup - ${title}`"
				class="absolute rounded-[inherit] top-0 left-0 w-full h-full object-cover transform transition-transform duration-500 scale-110 group-hover:scale-100" />
		</div>
		<div class="gradient-overlay absolute top-0 left-0 w-full h-full pointer-events-none"></div>
		<!-- Contenu de la carte -->
		<h4 class="absolute bottom-[15.5rem] left-10 z-50 w-fit mr-10 text-white">
			{{ title }}
		</h4>
		<p class="absolute bottom-48 left-10 z-50 mr-10 w-fit text-white">
			{{ description }}
		</p>
		<a
			:href="link"
			target="_blank"
			rel="noopener noreferrer"
			class="visit-button flex justify-center items-center gap-x-2 absolute bottom-10 right-10 z-50 cursor-none bg-[#b2bfd430] w-fit text-gray-light px-4 py-2 rounded-[12px] hover:bg-[#b0bbcd46] active:scale-90 transition-all duration-500">
			<Icon
				name="formkit:linkexternal"
				color="inherit"
				class="visit-button-icon w-fit h-fit transition-transform transform-gpu duration-300" />
			Visit {{ type }}
		</a>
		<!-- Second div avec logo -->
		<div class="absolute top-16 left-10 z-20 w-fit h-auto">
			<NuxtImg
				:src="logo"
				:alt="`Logo - ${title}`"
				format="webp"
				class="logo-img w-auto h-48 object-contain transform transition-all duration-500 scale-50 group-hover:scale-100 opacity-0 group-hover:opacity-100" />
		</div>
		<!-- Technologies section -->
		<div class="absolute bottom-28 left-10 mr-10 z-50 flex flex-wrap gap-2">
			<span
				v-for="(techno, index) in technos"
				:key="index"
				class="techno-badge text-gray-light bg-gray-dark">
				{{ techno }}
			</span>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	id: Number,
	title: String,
	description: String,
	link: String,
	img: String,
	logo: String,
	type: String,
	date: String,
	technos: {
		type: Array,
		default: () => [],
	},
});
</script>

<style scoped>
.gradient-overlay {
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0) 0%,
		rgba(0, 0, 0, 0.6) 40%,
		rgba(0, 0, 0, 0.75) 50%,
		rgba(0, 0, 0, 0.85) 60%,
		rgba(0, 0, 0, 0.9) 70%,
		rgba(0, 0, 0, 0.93) 80%,
		rgba(0, 0, 0, 0.95) 90%,
		rgba(0, 0, 0, 1) 100%
	);
}

.techno-badge {
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 0.875rem;
	white-space: nowrap;
	display: inline-block;
}

.visit-button:hover .visit-button-icon {
	transform: scale(1.25);
}
</style>
