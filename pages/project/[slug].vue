<template>
	<div
		class="bg-gradient-to-b lg:rounded-t-[4rem] overflow-hidden shadow-around shadow-black from-black via-primary to-black">
		<div class="lg:mx-20 2xl:mx-0 hover:brightness-100">
			<div class="container mx-auto px-4 lg:px-0 pt-28 lg:pt-40 pb-48">
				<div class="flex flex-col lg:flex-row items-center justify-between">
					<div class="w-full lg:w-1/2">
						<h1 class="text-4xl lg:text-6xl font-bold text-white mb-4">
							{{ project.title }}
						</h1>
						<p class="text-lg lg:text-xl text-white mb-4">
							{{ project.description }}
						</p>
						<div class="flex flex-wrap gap-4">
							<a
								v-for="techno in project.technos"
								:key="techno"
								class="text-white bg-primary px-4 py-2 rounded-full text-sm">
								{{ techno }}
							</a>
						</div>
						<NuxtLink :to="project.link" class="hover-scale-effect clickable text-white p-2 bg-gray-semi"
							>Visit {{ project.type }}</NuxtLink
						>
					</div>
					<NuxtImg
						:src="project.img"
						format="webp"
						alt="Image du projet"
						class="icon-select-event gradient-img w-5/6 md:w-1/2 lg:w-4/12 h-auto z-40" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { customCursor } from "~/plugins/gsap";
import { mouseEffect } from "~/plugins/global.js";

interface Project {
	slug: string;
	title: string;
	description: string;
	link: string;
	img: string;
	logo: string;
	type: string;
	date: string;
	technos?: string[];
}

const route = useRoute();

const projects: Project[] = [
	{
		slug: "portfolio",
		title: "Portfolio of Rémy Canal",
		description: "Creation 'from scratch' of my portfolio.",
		link: "https://example.com/project1",
		img: "/img/mockup-portfolio-remycanal.png",
		logo: "/img/logo-blue.png",
		type: "website",
		date: "2021-09-01",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
		],
	},
	{
		slug: "sharewood",
		title: "Sharewood",
		description: "Redesign of the entire front part of the Sharewood website.",
		link: "https://sharewood.team/",
		img: "/img/mockup-sharewood.png",
		logo: "/img/logo-sharewood.png",
		type: "website",
		date: "2021-09-01",
		technos: ["Wordpress", "Elementor", "Sass", "HTML", "CSS", "JavaScript"],
	},
	{
		slug: "ecofid",
		title: "Éco-fidélité",
		description:
			"Creation of an entire website for Letmotiv’s Éco-fidélité® solution.",
		link: "https://www.eco-fidelite.com/",
		img: "/img/mockup-ecofid.png",
		logo: "/img/logo-ecofid.png",
		type: "website",
		date: "2021-09-01",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
		],
	},
	{
		slug: "odl",
		title: "Office des Lumières",
		description: "Creation and animation of a website for a notary firm.",
		link: "https://officedeslumieres.com/",
		img: "/img/mockup-odl.png",
		logo: "/img/logo-odl.png",
		type: "website",
		date: "2021-09-01",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
		],
	},
	{
		slug: "lappart",
		title: "L'Appart Fitness",
		description:
			"Participation in the full redesign of the L'Appart Fitness website.",
		link: "https://www.lappartfitness.com/",
		img: "/img/mockup-lappart.png",
		logo: "/img/logo-lappart.png",
		type: "website",
		date: "2021-09-01",
		technos: ["Wordpress", "HTML", "CSS", "JavaScript", "TailwindCSS"],
	},
];

const project = computed(() => {
	return (
		projects.find((p) => p.slug === route.params.slug) || {
			title: "Not Found",
			description: "The project you are looking for does not exist.",
			img: "/img/not-found.svg",
			link: "www.link-to-website.com",
			type: "website",
			technos: [],
		}
	);
});

const applyEffects = () => {
	customCursor();
	mouseEffect();
};

onMounted(() => {
	applyEffects();
});

watch(route, () => {
	applyEffects();
});
</script>
