<script setup>
import { stickySkills, animationStarsCardSkill } from "@/plugins/gsap";

defineProps(["selectedColor"]);

const skills = [
	{
		text: "HTML",
		color: "#f1662a",
		icon: "i-vscode-icons:file-type-html",
		stars: 4,
		description:
			"Proficiency in HTML for structuring and organizing web content in a semantic way.",
	},
	{
		text: "JavaScript",
		color: "#f0db4f",
		icon: "i-skill-icons:javascript",
		stars: 4,
		description:
			"Advanced skills in JavaScript for frontend and backend development, DOM manipulation, and creating dynamic interactions.",
	},
	{
		text: "CSS",
		color: "#248cc8",
		icon: "i-vscode-icons:file-type-css",
		stars: 4,
		description:
			"Expertise in CSS for designing and styling user interfaces, using advanced layout techniques.",
	},
	{
		text: "Tailwind",
		color: "#45bbbd",
		icon: "i-logos:tailwindcss-icon",
		stars: 5,
		description:
			"Extensive experience with Tailwind CSS for rapid and efficient development, using utility-first classes to style components.",
	},
	{
		text: "Sass",
		color: "#cd6799",
		icon: "i-logos:sass",
		stars: 3,
		description:
			"Modular CSS with variables and mixins for reusable and maintainable code.",
	},
	{
		text: "Nuxt",
		color: "#67dd82",
		icon: "i-logos:nuxt-icon",
		stars: 4,
		description:
			"In-depth knowledge of Nuxt.js for building universal Vue.js applications, with routing, server-side rendering (SSR), and static site generation.",
	},
	{
		text: "Vue",
		color: "#51b883",
		icon: "i-logos:vue",
		stars: 4,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "Next",
		color: "#ffffff",
		icon: "i-logos:nextjs-icon",
		stars: 3,
		description:
			"Building high-performance React applications with SSR and SSG for fast, optimized rendering.",
	},
	{
		text: "React",
		color: "#00D8FF",
		icon: "i-skill-icons:react-dark",
		stars: 3,
		description:
			"Creating dynamic, reactive UIs with components and effective state management.",
	},
	// {
	// 	text: "React Native",
	// 	color: "#F4F2ED",
	// 	icon: "i-skill-icons:react-light",
	// 	stars: 2,
	// 	description:
	// 		"Developing cross-platform mobile apps with React for native performance.",
	// },
	{
		text: "Laravel",
		color: "#f24423",
		icon: "i-logos:laravel",
		stars: 3,
		description:
			"Skills in Laravel for rapid development of robust PHP web applications.",
	},
	{
		text: "WordPress",
		color: "#D0D4DB",
		iconColor: "#D0D4DB",
		icon: "i-fa6-brands:wordpress",
		stars: 3,
		description:
			"Experience with WordPress for creating dynamic websites, with custom themes, plugins, and effective content management.",
	},
	{
		text: "Elementor",
		color: "#932c3c",
		withPath: true,
		pathIcon: "/img/elementor.svg",
		stars: 3,
		description:
			"Advanced use of Elementor for designing highly customizable WordPress pages, with drag-and-drop tools and visual configuration.",
	},
	{
		text: "Swiper",
		color: "#0a7efa",
		withPath: true,
		pathIcon: "/img/swiper.svg",
		stars: 4,
		description:
			"Implementation of Swiper.js for interactive image carousels and galleries, with advanced customization options.",
	},
	{
		text: "Strapi",
		color: "#556afa",
		icon: "i-logos:strapi-icon",
		stars: 4,
		description:
			"Development of headless CMS applications with Strapi for managing and distributing digital content.",
	},
	{
		text: "Prisma",
		color: "#D1D1D1",
		withPath: true,
		pathIcon: "/img/prisma.svg",
		stars: 3,
		description:
			"Use of Prisma ORM for database access and management, with type-safe queries and automatic migrations.",
	},
	{
		text: "Node",
        color: "#65B549",
        icon: "i-logos:nodejs-icon-alt",
        stars: 2,
        description:
            "Experience with Node.js for backend development, event-driven architectures, and asynchronous programming.",
	},
	{
		text: "MySQL",
		color: "#02768F",
        icon: "i-vscode-icons:file-type-mysql",
        stars: 2,
        description:
			"Skills in MySQL for relational database management, data storage, and querying.",
	},
	{
		text: "MongoDB",
        color: "#13914F",
        icon: "i-skill-icons:mongodb",
        stars: 2,
        description:
            "Skills in MongoDB for NoSQL database management, data storage, and querying.",
	},
	{
		text: "PostgreSQL",
		color: "#346891",
		icon: "i-logos:postgresql",
        stars: 2,
        description:
			"Skills in PostgreSQL for relational database management, data storage, and querying.",
	},
	{
		text: "PHP",
		color: "#6181B6",
		icon: "i-logos:php",
		stars: 2,
		description:
			"Skills in PHP for backend development, data manipulation, and integration with relational databases.",
	},
	{
		text: "Python",
		color: "#FFD141",
		icon: "i-logos:python",
		stars: 3,
		description:
			"Use of Python for web application development and data analysis.",
	},
	{
		text: "GitHub",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/github.png",
		stars: 3,
		description:
			"Advanced use of GitHub for version control, collaboration on projects, and continuous deployment.",
	},
	{
		text: "GSAP",
		color: "#14D74B",
		withPath: true,
		pathIcon: "/img/gsap.png",
		stars: 4,
		description:
			"Proficiency in GreenSock Animation Platform (GSAP) for creating smooth and interactive animations in web applications.",
	},
	{
		text: "Figma",
		color: "#F24E1E",
		icon: "i-logos:figma",
		stars: 3,
		description:
			"Use of Figma for designing user interfaces, prototyping, and creating interactive design systems.",
	},
	{
		text: "Vercel",
		color: "#FFFFFF",
		icon: "i-skill-icons:vercel-light",
        stars: 4,
        description:
			"Deployment of web applications with Vercel for fast, secure, and scalable hosting.",
	},
	{
		text: "C",
		color: "#273393",
		withPath: true,
		pathIcon: "/img/c.png",
		stars: 4,
		description:
			"Programming skills in C for system development, low-level programming, and creating robust and performant applications.",
	},
	{
		text: "Canva",
		color: "#00C4CC",
		withPath: true,
		pathIcon: "/img/canva.png",
		stars: 4,
		description:
			"Use of Canva for creating professional graphic designs, including illustrations, infographics, and visual presentations.",
	},
	{
		text: "ChatGPT",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/chatgpt.png",
		stars: 5,
		description:
			"Mastering ChatGPT enables me to code more efficiently and quickly by crafting precise prompts, serving as a valuable coding companion.",
	},
	{
		text: "but still human...",
		color: "#FEC47C",
		withPath: true,
		isGif: true,
		pathIcon: "/img/wolf.gif",
		stars: 5,
		description:
			"In addition to the mentioned technologies, adaptability and quick learning of new technologies and tools to meet specific project requirements.",
	},
];

const currentSkill = ref(skills[skills.length - 1]);
const isUpdating = ref(false);
const lastSkillIndex = ref(null);

const isDesktop = () => {
	return window.innerWidth >= 1024;
};

const fillCardSkills = (index) => {
	isUpdating.value = true;
	setTimeout(() => {
		if (lastSkillIndex.value !== null && lastSkillIndex.value === index) {
			currentSkill.value = skills[skills.length - 1];
			lastSkillIndex.value = null;
		} else {
			currentSkill.value = skills[index];
			lastSkillIndex.value = index;
		}
		isUpdating.value = false;
	}, 300);
};

const animStarsRotation = () => {
	setTimeout(() => {
		animationStarsCardSkill();
	}, 300);
};

const finishUpdate = () => {
	if (isUpdating.value) {
		isUpdating.value = false;
	}
};

onMounted(() => {
	if (isDesktop) {
		stickySkills();
	}

	window.addEventListener("resize", () => {
		if (isDesktop()) {
			stickySkills();
		}
	});
});
</script>

<template>
	<h2
		id="Skills"
		class="text-color-saturate text-[2.5rem] md:text-[4rem] uppercase w-fit">
		Skills
	</h2>
	<h3
		style="font-family: Share Tech Mono"
		class="mt-5 w-full lg:w-7/12 lg:mt-10 text-gray-light text-base md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
		From front-end frameworks to back-end systems, I have honed my skills in a
		wide range of technologies, enabling me to build efficient and scalable web
		applications. Below is a curated list of tools and technologies that are
		part of my developer toolkit.
	</h3>
	<div
		class="flex flex-col lg:flex-row lg:justify-evenly lg:pt-28 2xl:pt-40 items-center lg:items-start gap-40 lg:gap-x-20 2xl:gap-x-60 gap-y-20 my-20">
		<div
			id="skill-card"
			class="bg-gray-dark h-[24rem] md:h-[27rem] lg:h-[30rem] 2xl:h-[27rem] w-11/12 md:w-4/6 lg:w-3/6 2xl:w-2/5 shadow-around border text-center border-primary rounded-3xl flex flex-row justify-between">
			<div
				class="flex justify-center rounded-tl-[1.35rem] rounded-br-[1.35rem] bg-primary w-[12%] md:w-[9%] h-fit">
				<div
					:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
					@transitionend="finishUpdate"
					class="flex flex-col my-10 transition-opacity duration-300">
					<div
						v-for="star in currentSkill.stars"
						:key="'filled-' + star"
						class="star star-card">
						<Icon
							name="i-teenyicons:star-small-solid"
							ssr="true"
							mode="svg"
							class="w-8 md:w-9 h-8 md:h-9"
							style="color: #1f293b" />
					</div>
					<div
						v-for="star in 5 - currentSkill.stars"
						:key="'empty-' + star"
						class="star star-card">
						<Icon
							name="i-teenyicons:star-small-outline"
							ssr="true"
							mode="svg"
							class="w-8 md:w-9 h-8 md:h-9"
							style="color: #1f293b" />
					</div>
				</div>
			</div>
			<div
				:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
				@transitionend="finishUpdate"
				class="flex flex-col items-center w-[88%] h-full py-4 px-8 transition-opacity duration-300">
				<NuxtImg
					v-if="currentSkill.withPath"
					:src="'https://www.remycanal.me' + currentSkill.pathIcon"
					:alt="currentSkill.text + ' icon'"
					:title="currentSkill.text + ' icon'"
					data-nosnippet
					:format="currentSkill.isGif ? 'gif' : 'webp'"
					:class="{
						'icon-select-event': true,
						'w-auto': true,
						'h-16': !currentSkill.isGif,
						'md:h-24': !currentSkill.isGif,
						'h-24': currentSkill.isGif,
						'md:h-36': currentSkill.isGif,
					}"
					loading="lazy"
					class="my-10" />
				<div v-else class="w-16 md:w-24 h-16 md:h-24 my-10">
					<Icon
						:name="currentSkill.icon || ''"
						class="w-full h-full"
						ssr="true"
						mode="svg"
						style="color: var(--color-white)" />
				</div>
				<div class="text-color-saturate">
					<h3
						v-if="currentSkill.text !== 'but still human...'"
						class="pb-5 text-3xl lg:text-[2rem] font-bold">
						{{ currentSkill.text }}
					</h3>
					<p class="font-['Share_Tech_Mono'] pb-10 text-sm md:text-lg font-bold w-full">
						{{ currentSkill.description }}
					</p>
				</div>
			</div>
		</div>
		<div
			id="container-skills"
			class="relative grid lg:w-4/5 2xl:w-3/5 grid-cols-3 md:grid-cols-4 pt-28 md:pt-60 lg:pt-0 gap-y-7 gap-x-2 md:gap-x-20 lg:gap-x-0 2xl:gap-x-20 md:gap-y-12">
			<NuxtImg
				:src="`https://www.remycanal.me/img/details-skills-${selectedColor}.png`"
				preset="portfolioImage"
				loading="lazy"
				alt="Click on bubbles to see details (mobile)"
				title="Click on bubbles to see details (mobile)"
				class="hover:saturate-200 transition-all duration-500 absolute scale-50 2xl:scale-[.4] top-[-8rem] md:top-[-10rem] lg:top-[-23rem] 2xl:top-[-30.5rem] right-[30%] md:right-[45%] lg:right-[35%] 2xl:right-[40%] 3xl:right-[60%] z-10" />
			<NuxtImg
				:src="`https://www.remycanal.me/img/stars-info-${selectedColor}.png`"
				preset="portfolioImage"
				loading="lazy"
				alt="Stars = Proficiency level"
				title="Stars = Proficiency level"
				class="hover:saturate-200 transition-all duration-500 absolute scale-50 2xl:scale-[.4] top-[-8rem] md:top-[-10rem] lg:top-[-24rem] 2xl:top-[-30.5rem] left-[30%] md:left-[35%] lg:left-[30%] z-10" />
			<BubbleIcon
				v-for="(skill, index) in skills"
				class="rounded-full lg:scale-90 2xl:scale-100"
				:key="index"
				:index="index"
				:text="skill.text"
				:color="skill.color"
				:iconColor="skill.iconColor"
				:icon="skill.icon"
				:stars="skill.stars"
				:withPath="skill.withPath"
				:pathIcon="skill.pathIcon"
				:isGif="skill.isGif"
				@click="fillCardSkills(index), animStarsRotation()" />
		</div>
	</div>
</template>
