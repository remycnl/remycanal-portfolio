<template>
	<div
		class="group hover-scale-effect rounded-[2rem] clickable cursor-none z-50 w-96 h-[40rem] relative">
		<!-- First div with image and gradient filter -->
		<div
			class="absolute top-0 left-0 w-full h-full rounded-[inherit] overflow-hidden border-3 border-gray-dark shadow-around shadow-black">
			<img
				:src="img"
				:alt="`Mockup - ${title}`"
				class="absolute top-0 left-0 scale-110 group-hover:scale-100 transition-transform duration-500 w-full h-full object-cover" />
			<div class=" project-card-gradient"></div>
			<h3 class="font-bold absolute top-10 left-10 z-50 w-fit mr-10 text-black">
				{{ title }}
			</h3>
			<p class="absolute bottom-48 left-10 z-50 mr-10 w-fit text-white">
				{{ description }}
			</p>
			<a
				:href="link"
				target="_blank"
				rel="noopener noreferrer"
				class="absolute bottom-10 right-10 z-50 cursor-none border border-gray-light bg-gray-light w-fit text-black px-4 py-2 rounded-full hover:bg-black hover:text-gray-light transition-all duration-300">
				Visit {{ type }}
			</a>
		</div>
		<!-- Second div with logo -->
		<div class="z-20 absolute top-40 left-10 w-fit h-auto">
			<NuxtImg
				:src="logo"
				:alt="`Logo - ${title}`"
				format="webp"
				class="logo-img -ml-0.5 w-40 h-auto object-contain scale-50 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-500" />
		</div>
		<!-- Technologies section -->
		<div class="absolute bottom-28 mr-10 left-10 flex flex-wrap gap-2 z-50">
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
.project-card-gradient {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
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
	z-index: 10;
	pointer-events: none; /* Ensures the gradient doesn't interfere with interactions */
}

.logo-img {
	filter: drop-shadow(0 0 10px var(--black));
}

.techno-badge {
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 0.875rem;
	white-space: nowrap;
	display: inline-block;
}
</style>
