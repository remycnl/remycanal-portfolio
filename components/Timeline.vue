<script setup>
import { appearTimeline, dynamicProgressBar } from "@/plugins/gsap";

const timelineRef = ref(null);
const progressBar = ref(null);
const height = ref(0);

onMounted(() => {
	if (timelineRef.value) {
		height.value = timelineRef.value.getBoundingClientRect().height;
	}
	appearTimeline();
	dynamicProgressBar(timelineRef.value, progressBar.value);
});

const data = [
	{
		date: "2020",
		type: "certification",
		title: "Cambridge English Language Assessment",
		subtitle: "Certification Cambridge - B2 First",
		images: [
			{
				src: "/img/cambridge-logo.png",
				alt: "Cambridge Logo",
			},
		],
	},
	{
		date: "2021",
		type: "formation",
		title: "Institution Saint-Alyre | Clermont-Ferrand",
		subtitle: "General Baccalaureate",
		paragraph: [
			"Specialization in Mathematics, Physics & Chemistry, and Computer Science with Advanced Mathematics Option",
		],
		images: [
			{
				src: "/img/saint-alyre-logo.png",
				alt: "Saint-Alyre Logo",
			},
		],
	},
	{
		date: "2022",
		type: "formation",
		title: "EPITECH - European Institute of Technology | Lyon",
		subtitle: "Promo 2022-2027 - Program Grande Ecole (currently)",
		paragraph: [
			"5-Year Post-Baccalaureate Program to Become a Software Engineering Expert, recognized by the French Ministry of Higher Education at RNCP Level 7",
		],
		images: [
			{
				src: "/img/epitech-logo.png",
				alt: "Epitech Logo",
			},
		],
	},
	{
		date: "2023",
		type: "experience",
		title: "Sharewood",
		subtitle: "Front-End Developer",
		paragraph: ["Internship - July to December 2023 (6 months)"],
		images: [
			{
				src: "/img/sharewood-logo.png",
				alt: "Sharewood Logo",
			},
		],
	},
	{
		date: "2024",
		type: "experience",
		title: "Letmotiv",
		subtitle: "Full-Stack Developer",
		paragraph: ["Internship - September 2024 to March 2025 (7 months)"],
		images: [
			{
				src: "/img/letmotiv-logo.png",
				alt: "Letmotiv Logo",
			},
		],
	},
	{
		date: "2025",
		type: "experience",
		title: "Awwwards.",
		subtitle: "Young Jury (currently)",
		images: [
			{
				src: "/img/awwwards-logo.png",
				alt: "Awwwards Logo",
			},
		],
	},
	{
		date: "2025",
		type: "experience",
		title: "Musée des Confluences",
		subtitle: "Full-Stack Engineer",
		paragraph: ["Internship - April 2025 to August 2025 (5 months)"],
		images: [
			{
				src: "/img/musee-des-confluences.png",
				alt: "Musée des Confluences Logo",
			},
		],
	},
	{
		date: "2025",
		type: "formation",
		title: "Technological University Dublin",
		subtitle: "2025-2026 - Master's Degree in IT Management",
		images: [
			{
				src: "/img/TUD.png",
				alt: "TU Dublin Logo",
			},
		],
	},
];
</script>

<template>
	<div class="w-full">
		<div class="mt-40 lg:mt-96 py-20">
			<h2
				id="Timeline"
				class="text-color-saturate text-[2.5rem] md:text-[4rem] uppercase w-fit">
				Timeline
			</h2>
			<h3
				style="font-family: Share Tech Mono"
				class="mt-5 lg:mt-10 w-full lg:w-7/12 text-gray-light text-base md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
				Explore my journey, including my certifications, academic training, and
				professional experiences, showcasing my growth in software development
				and engineering.
			</h3>
		</div>

		<div ref="timelineRef" class="relative pb-20">
			<div
				v-for="(item, index) in data"
				:key="index"
				class="flex justify-start pt-10 lg:pt-20 lg:gap-10">
				<div
					class="group sticky flex flex-col z-40 items-start top-40 self-start max-w-xs lg:max-w-sm md:w-full">
					<div
						class="h-10 left-0 absolute w-10 rounded-full bg-black flex items-center justify-center">
						<div
							class="h-4 w-4 rounded-full bg-neutral-800 border border-neutral-700 p-2"></div>
					</div>
					<h5
						class="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 group-hover:text-white transition-colors duration-500">
						{{ item.date }}
					</h5>
					<h6
						class="hidden md:block text-xl md:pl-20 md:text-xl font-bold text-neutral-500 group-hover:text-white transition-colors duration-500">
						{{ item.type }}
					</h6>
				</div>

				<div class="timeline-element relative pl-20 pr-4 md:pl-4 w-full">
					<div class="gorup flex flex-row gap-x-4 items-center">
						<h5
							class="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500 group-hover:text-white transition-colors duration-500">
							{{ item.date }}
						</h5>
						<h6
							class="md:hidden text-xs -mt-2 font-bold text-neutral-500 group-hover:text-white transition-colors duration-500">
							{{ item.type }}
						</h6>
					</div>
					<div class="mb-8 flex flex-col gap-y-5 lg:gap-y-8">
						<div class="flex flex-col gap-y-2">
							<h3
								class="text-color-saturate text-lg md:text-2xl lg:text-3xl text-primary">
								{{ item.title }}
							</h3>
							<h4
								style="font-family: Share Tech Mono"
								class="text-white text-sm md:text-lg lg:text-xl">
								{{ item.subtitle }}
							</h4>
						</div>
						<div
							class="font-['Share_Tech_Mono'] text-gray-light text-sm md:text-lg flex flex-col gap-y-4">
							<p v-for="(paragraph, idx) in item.paragraph" :key="idx">
								{{ paragraph }}
							</p>
						</div>
						<div
							class="group overflow-hidden bg-gray-dark text-primary border border-primary shadow-around shadow-black-dark w-full lg:w-2/3 2xl:w-1/3 h-40 lg:h-56 2xl:h-60 rounded-3xl flex justify-center items-center p-5 lg:p-10">
							<NuxtImg
								v-for="(img, imgIdx) in item.images"
								:key="imgIdx"
								:src="'https://www.remycanal.me' + img.src"
								:alt="img.alt"
								:title="img.alt"
								preset="portfolioImage"
								loading="lazy"
								class="object-contain h-full w-full group-hover:scale-[1.15] transition-transform duration-500" />
						</div>
					</div>
				</div>
			</div>

			<div
				:style="{ height: height + 'px' }"
				class="absolute left-[1.20rem] top-0 overflow-hidden w-[2px] bg-gradient-to-b from-transparent via-neutral-700 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] hover:saturate-200 transition-all duration-500">
				<div
					ref="progressBar"
					class="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-primary via-secondary to-transparent rounded-full"></div>
			</div>
		</div>
	</div>
</template>
