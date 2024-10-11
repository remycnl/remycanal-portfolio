<template>
	<div class="relative overflow-visible projects-container my-60 lg:my-96">
		<h2
			id="Projects"
			class="text-color-saturate text-[3rem] md:text-[4rem] uppercase w-fit">
			Projects
		</h2>
		<h3
			style="font-family: Share Tech Mono"
			class="mt-5 lg:mt-10 w-full lg:w-7/12 text-gray-light text-lg md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
			Throughout my journey as a developer, I've worked on a variety of projects
			that demonstrate my technical skills and problem-solving abilities. Below
			is a selection of projects that showcase my expertise in modern
			development practices, design patterns, and coding efficiency.
		</h3>
		<!-- Mobile -->
		<div class="lg:hidden relative mt-10">
			<Icon
				name="i-game-icons:wind-slap"
				style="color: var(--secondary-color)"
				class="absolute top-0 left-[-15%] w-[50rem] opacity-30 h-[50rem] transition-all duration-300" />
			<div v-for="project in projects" :key="project.slug">
				<div
					class="cards-project-mobile group flex mt-10 flex-col items-center bg-gray-dark text-secondary border border-secondary shadow-around shadow-black-dark w-full h-[35rem] rounded-[1.5rem]">
					<div
						class="w-[90%] h-[3rem] mt-5 flex flex-row justify-between items-center">
						<p
							class="font-[Orbitron] text-secondary font-bold tracking-widest text-sm">
							{{ project.date }}
						</p>
						<p
							class="font-[Orbitron] text-secondary font-bold tracking-widest text-sm">
							{{ project.title }}
						</p>
					</div>
					<div
						class="relative my-5 rounded-[1.5rem] w-[90%] h-[20rem] overflow-hidden">
						<NuxtImg
							:src="project.img"
							:alt="`Mockup - ${project.img}`"
							format="webp"
							class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
					</div>
					<p class="text-gray-light w-[86%]">
						{{ project.description }}
					</p>
					<div class="flex flex-wrap w-[86%] gap-3 my-5">
						<span
							v-for="(tech, index) in project.technos"
							:key="tech"
							:style="{ transitionDelay: `${index * 100}ms` }"
							class="bg-secondary-transparent font-bold tracking-widest text-secondary py-1.5 px-2 rounded-full text-xs">
							{{ tech }}
						</span>
					</div>
					<div class="flex flex-row justify-end items-center w-[90%] mt-4 mb-7">
						<NuxtLink
							:to="project.link"
							target="_blank"
							class="focus:scale-90 transition-transform duration-75 flex rounded-xl text-white bg-secondary p-3 flex-row gap-2 items-center">
							Visit {{ project.type }}
							<Icon
								name="i-formkit:linkexternal"
								style="color: var(--white)"
								class="w-5 h-5" />
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
		<!-- Desktop -->
		<div
			class="hidden lg:flex relative overflow-visible mt-40 justify-between gap-x-20 2xl:gap-x-28 items-start">
			<Icon
				name="i-game-icons:wind-slap"
				style="color: var(--secondary-color)"
				class="absolute top-0 left-[-15%] 2xl:left-[-40%] w-[50rem] 2xl:w-[70rem] opacity-30 h-[50rem] 2xl:h-[70rem] transition-all duration-300" />
			<div
				class="relative overflow-visible container-project opacity-0 bg-gray-dark text-secondary border border-secondary shadow-around shadow-black-dark w-1/2 h-[35rem] rounded-[1.5rem]">
				<Transition name="fade">
					<div
						v-show="hoveredProject"
						class="flex flex-col items-center w-full h-full">
						<div
							class="w-[90%] h-[3rem] mt-5 flex flex-row justify-between items-center">
							<ScrambleText
								v-show="hoveredProject"
								:text="
									projects.find((project) => project.slug === hoveredProject)
										?.date
								"
								:frames="20" />
							<ScrambleText
								v-show="hoveredProject"
								:text="
									projects.find((project) => project.slug === hoveredProject)
										?.title
								"
								:frames="20" />
						</div>
						<div
							class="relative image-animation-container my-5 rounded-[1.5rem] w-[90%] h-[20rem] border-2 border-gray-semi overflow-hidden"></div>
						<div
							class="flex flex-wrap w-[90%] gap-3 my-5"
							v-show="hoveredProject">
							<TransitionGroup name="tag">
								<span
									v-for="(tech, index) in projects.find(
										(project) => project.slug === hoveredProject
									)?.technos"
									:key="tech"
									:style="{ transitionDelay: `${index * 100}ms` }"
									class="bg-secondary-transparent font-bold tracking-widest text-secondary py-1 px-3 rounded-full text-sm">
									{{ tech }}
								</span>
							</TransitionGroup>
						</div>
					</div>
				</Transition>
			</div>
			<div
				@mouseenter="showProject()"
				@mouseleave="hideProject()"
				class="relative projects-link flex flex-col w-1/2 h-fit">
				<NuxtLink
					:to="project.link"
					target="_blank"
					v-for="(project, index) in projects"
					:key="index"
					@mouseenter="showImage(project.img), startHover(project.slug)"
					@mouseleave="hideImages(), stopHover()"
					class="group relative z-30 link-type flex flex-col justify-between items-start w-full h-[4.55rem] hover:h-[6.55rem] transition-all duration-300">
					<NuxtImg
						:src="project.logo"
						:alt="`Logo - ${project.logo}`"
						format="webp"
						class="absolute top-4 right-[-10%] hover-scale-effect clickable cursor-none scale-50 group-hover:scale-100 opacity-0 group-hover:opacity-10 w-auto h-60 transition-all duration-[0.8s]" />
					<div
						class="text-secondary group hover-scale-effect clickable cursor-none w-full h-full flex flex-col justify-between items-start">
						<div
							class="w-full h-full flex flex-row justify-between items-center">
							<div class="flex flex-row gap-x-4 items-center justify-start">
								<h4
									class="text-gray-light text-nowrap text-[1.5rem] leading-[2rem] tracking-wider font-bold group-hover:text-secondary group-hover:tracking-widest origin-center transform transition-all duration-500 py-5">
									{{ project.title }}
								</h4>
								<Icon
									name="i-formkit:linkexternal"
									style="color: var(--primary-color)"
									class="link-type-hover w-6 h-6 mb-1 transition-all duration-300" />
							</div>
							<h5 class="relative leading-[2rem] text-gray-light opacity-55">
								{{ project.type }}
							</h5>
						</div>
						<Transition name="fade-letter-by-letter" mode="out-in">
							<p
								v-if="isSomethingHover && hoveredProject === project.slug"
								class="text-gray-light -mt-3 pb-5">
								<LetterByLetter :text="project.description" />
							</p>
						</Transition>
					</div>
					<hr
						v-if="!project.last"
						class="w-full border-1 cursor-none border-gray-semi" />
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	showImage,
	hideImages,
	showProject,
	hideProject,
	stickyProject,
	apparitionMobileProjectCards,
} from "@/plugins/gsap";

onMounted(() => {
	stickyProject();
	apparitionMobileProjectCards();
});

interface Project {
	slug: string;
	title: string;
	description: string;
	link: string;
	img: string;
	logo: string;
	type: string;
	last?: boolean;
	date: string;
	technos?: string[];
}

const projects: Project[] = [
	{
		slug: "portfolio",
		title: "Portfolio of Rémy Canal",
		description: "Creation 'from scratch' of my portfolio.",
		link: "https://www.remycanal.me",
		img: "/img/mockup-portfolio-remycanal.png",
		logo: "/img/logo-blue.png",
		type: "website",
		date: "2024",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
			"Vercel",
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
		date: "2023",
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
		date: "2023",
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
		description: "Participation in the creation and animation of a website for a notary firm.",
		link: "https://officedeslumieres.com/",
		img: "/img/mockup-odl.png",
		logo: "/img/logo-odl.png",
		type: "website",
		date: "2023",
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
		last: true,
		date: "2023",
		technos: [
			"Wordpress",
			"Elementor",
			"HTML",
			"CSS",
			"JavaScript",
			"TailwindCSS",
		],
	},
];

const isSomethingHover = ref(false);
const hoveredProject = ref<string | null>(null);

const startHover = (projectSlug: string) => {
	isSomethingHover.value = true;
	hoveredProject.value = projectSlug;
};

const stopHover = () => {
	isSomethingHover.value = false;
	hoveredProject.value = null;
};
</script>
