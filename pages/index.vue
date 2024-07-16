<script setup lang="ts">
const activeTitle = ref("Rémy Canal - Portfolio | Web Developer");
const inactiveTitle = ref("I miss you !!!");

useSeoMeta({
	title: activeTitle,
	ogTitle: "Rémy Canal - Portfolio | Web Developer Portfolio",
	description:
		"I am a french web developer based in Lyon and this is my portfolio where I expose my projects and experiences.",
	ogDescription: "This is my amazing site, let me tell you all about it.",
	ogImage: "~/assets/img/avatar.png",
});

useServerSeoMeta({
	robots: "index, follow",
});

interface Skill {
	text: string;
	color: string;
	iconColor?: string;
	icon?: string;
	withPath?: boolean;
	pathIcon?: string;
	isGif?: boolean;
	stars: number;
	description: string;
}

const skills: Skill[] = [
	{
		text: "HTML",
		color: "#f1662a",
		icon: "vscode-icons:file-type-html",
		stars: 4,
		description:
			"Proficiency in HTML for structuring and organizing web content in a semantic way.",
	},
	{
		text: "JavaScript",
		color: "#f0db4f",
		icon: "skill-icons:javascript",
		stars: 4,
		description:
			"Advanced skills in JavaScript for frontend and backend development, DOM manipulation, and creating dynamic interactions.",
	},
	{
		text: "CSS",
		color: "#248cc8",
		icon: "vscode-icons:file-type-css",
		stars: 4,
		description:
			"Expertise in CSS for designing and styling user interfaces, using Flexbox, Grid, and advanced layout techniques.",
	},
	{
		text: "Tailwind",
		color: "#45bbbd",
		icon: "logos:tailwindcss-icon",
		stars: 5,
		description:
			"Extensive experience with Tailwind CSS for rapid and efficient development, using utility-first classes to style components.",
	},
	{
		text: "Sass",
		color: "#cd6799",
		icon: "logos:sass",
		stars: 3,
		description:
			"Advanced use of Sass for creating modular, reusable, and maintainable CSS stylesheets, with features like variables, mixins, and imports.",
	},
	{
		text: "Nuxt",
		color: "#67dd82",
		icon: "logos:nuxt-icon",
		stars: 4,
		description:
			"In-depth knowledge of Nuxt.js for building universal Vue.js applications, with routing, server-side rendering (SSR), and static site generation.",
	},
	{
		text: "Vue",
		color: "#51b883",
		icon: "logos:vue",
		stars: 4,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "Laravel",
		color: "#f24423",
		icon: "logos:laravel",
		stars: 3,
		description:
			"Skills in Laravel for rapid development of robust PHP web applications, with MVC architecture, database migrations, and RESTful APIs.",
	},
	{
		text: "WordPress",
		color: "white",
		iconColor: "white",
		icon: "fa6-brands:wordpress",
		stars: 3,
		description:
			"Experience with WordPress for creating dynamic websites and blogs, with custom themes, plugins, and effective content management.",
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
			"Implementation of Swiper.js for interactive image carousels and galleries, with advanced customization options and multi-touch support.",
	},
	{
		text: "Strapi",
		color: "#556afa",
		icon: "logos:strapi-icon",
		stars: 4,
		description:
			"Development of headless CMS applications with Strapi, creating RESTful and GraphQL APIs for managing and distributing digital content.",
	},
	{
		text: "PHP",
		color: "#6181B6",
		icon: "logos:php",
		stars: 2,
		description:
			"Skills in PHP for backend development, data manipulation, and integration with relational databases.",
	},
	{
		text: "Python",
		color: "#FFD141",
		icon: "logos:python",
		stars: 3,
		description:
			"Use of Python for web application development, task automation, and data analysis, with frameworks like Django and Flask.",
	},
	{
		text: "GitHub",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/github.png",
		stars: 3,
		description:
			"Advanced use of GitHub for version control, collaboration on open-source projects, and continuous deployment.",
	},
	{
		text: "GSAP",
		color: "#14D74B",
		withPath: true,
		pathIcon: "/img/gsap.png",
		stars: 4,
		description:
			"Proficiency in GreenSock Animation Platform (GSAP) for creating fluid and interactive animations in web applications.",
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
		stars: 3,
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
			"Experience with ChatGPT for integrating conversational artificial intelligence into web applications, enhancing user engagement and automating responses.",
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

const currentSkill = ref<Skill>(skills[19]);
const isUpdating = ref(false);
const lastSkillIndex = ref<number | null>(null);

const fillCardSkills = (index: number) => {
	isUpdating.value = true;

	setTimeout(() => {
		if (lastSkillIndex.value !== null && lastSkillIndex.value === index) {
			currentSkill.value = skills[19];
			lastSkillIndex.value = null;
		} else {
			currentSkill.value = skills[index];
			lastSkillIndex.value = index;
		}
		isUpdating.value = false;
	}, 300); // Durée de la transition d'opacité
};

const finishUpdate = () => {
	if (isUpdating.value) {
		isUpdating.value = false;
	}
};

onMounted(() => {
	if (process.client) {
		document.addEventListener("visibilitychange", function () {
			if (document.visibilityState === "hidden") {
				document.title = inactiveTitle.value;
			} else {
				document.title = activeTitle.value;
			}
		});
	}

	updateFavicon('purple');

	const backToTopButton = document.querySelector(".back-to-top");
	if (backToTopButton) {
		backToTopButton.addEventListener("click", function () {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		});
	}

	window.addEventListener("scroll", function () {
		const button = document.querySelector(".back-to-top") as HTMLElement;
		if (button && window.innerWidth >= 1024) {
			if (window.scrollY > 100) {
				button.classList.add("pointer-events-auto");
				button.classList.remove("opacity-0");
				button.classList.add("opacity-100");
			} else {
				button.classList.remove("opacity-100");
				button.classList.add("opacity-0");
				button.classList.remove("pointer-events-auto");
			}
		}
	});
});

interface ColorOption {
	primary: string;
	secondary: string;
	transparent: string;
	family: string;
}

const checkboxes = ref<boolean[]>([
	true,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
]);

const colorOptions = ref<ColorOption[]>([
	{
		primary: "#6C34CC",
		secondary: "#301563",
		transparent: "#6C34CC4F",
		family: "purple",
	},
	{
		primary: "#DD314E",
		secondary: "#6A1625",
		transparent: "#DD314E4F",
		family: "red",
	},
	{
		primary: "#FF3FAF",
		secondary: "#5D0C34",
		transparent: "#FF3FAF4F",
		family: "pink",
	},
	{
		primary: "#DD5F31",
		secondary: "#742F17",
		transparent: "#DD5F314F",
		family: "orange",
	},
	{
		primary: "#E9C925",
		secondary: "#7D6B10",
		transparent: "#E9C9254F",
		family: "yellow",
	},
	{
		primary: "#67D13D",
		secondary: "#2C5F14",
		transparent: "#67D13D4F",
		family: "green",
	},
	{
		primary: "#31BEDD",
		secondary: "#147C8C",
		transparent: "#31BEDD4F",
		family: "cyan",
	},
	{
		primary: "#32A1DA",
		secondary: "#0A3890",
		transparent: "#32A1DA4F",
		family: "blue",
	},
	{
		primary: "#868686",
		secondary: "#424242",
		transparent: "#8686864F",
		family: "gray",
	},
]);

const selectedColor = ref<string>(colorOptions.value[0].family);

const updateCheckbox = (
	index: number,
	primaryColor: string,
	secondaryColor: string,
	primaryColorTransparent: string,
	selectedFamily: string
) => {
	checkboxes.value = checkboxes.value.map(
		(_unused: unknown, i: number) => i === index
	);
	document.documentElement.style.setProperty("--primary-color", primaryColor);
	document.documentElement.style.setProperty(
		"--secondary-color",
		secondaryColor
	);
	document.documentElement.style.setProperty(
		"--primary-color-transparent",
		primaryColorTransparent
	);
	selectedColor.value = selectedFamily;

	const families: string[] = colorOptions.value.map(
		(color: ColorOption) => color.family
	);

	const elements = document.querySelectorAll(".change-img-color");
	elements.forEach((element) => {
		families.forEach((family: string) => {
			element.classList.remove(family);
		});
		element.classList.add(selectedFamily);
	});
};

const updateFavicon = (color: string) => {
	const faviconName = `favicon-${color}.ico`;
	let link = document.querySelector(
		"link[rel*='icon']"
	) as HTMLLinkElement | null;
	if (!link) {
		link = document.createElement("link") as HTMLLinkElement;
		link.rel = "shortcut icon";
		document.head.appendChild(link);
	}
	link.type = "image/x-icon";
	link.href = `/${faviconName}`;
};
</script>

<template>
	<div class="hidden lg:block">
		<div class="flex justify-center">
			<button
				class="clickable mix-darken cursor-none active:scale-95 text-white flex items-center justify-center fixed z-[100] tracking-widest rounded-full overflow-hidden origin-center shadow-around hover:bg-secondary bg-black opacity-0 pointer-events-none back-to-top hover-scale-effect lg:ml-[140vh] 2xl:ml-[176vh] lg:mt-[70vh] transition-all duration-500">
				<svg class="svgIcon" viewBox="0 0 384 512">
					<path
						d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
				</svg>
			</button>
		</div>
	</div>
	<!-- ABOUT ME -->
	<div
		class="bg-gradient-to-b lg:rounded-t-[4rem] overflow-hidden shadow-around shadow-black from-black via-primary to-black">
		<div class="lg:mx-20 2xl:mx-0 hover:brightness-100">
			<div class="container mx-auto px-4 lg:px-0 pt-28 lg:pt-40 pb-48">
				<div
					class="flex flex-col lg:flex-row justify-between items-center gap-y-10">
					<NuxtImg
						src="/img/avatar.png"
						format="webp"
						alt="Rémy Canal"
						class="icon-select-event gradient-img w-5/6 md:w-1/2 lg:w-4/12 h-auto z-40" />
					<div
						class="flex flex-col justify-center text-center w-full lg:w-7/12 lg:text-start lg:gap-y-14 z-50">
						<h1
							class="-mt-36 md:-mt-20 lg:-mt-0 flex flex-col lg:flex-row items-center md:tracking-widest lg:tracking-normal gap-x-5 gap-y-14 lg:gap-y-3 font-bold">
							<span
								class="text-color-saturate -ml-14 md:-ml-0 text-[5.5rem] md:text-[5rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-[5.5rem] md:leading-[6rem] lg:leading-none 2xl:leading-[5.8rem]"
								>Rémy <span class="ml-28 md:ml-16">Canal</span></span
							>
							<span
								class="text-color-saturate text-[2.2rem] md:text-[3rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-[5rem] lg:leading-none 2xl:leading-[5.8rem]"
								>Web <span class="lg:ml-16">Developer</span></span
							>
						</h1>
						<h4
							style="font-family: Share Tech Mono"
							class="text-white text-lg 2xl:text-2xl mx-4 md:mx-0 lg:text-justify">
							I'm a student at Epitech, on my way to becoming a software
							engineer specialized in crafting outstanding and full digital
							experiences. Based in Lyon, France, I ensure responsive design,
							SEO optimization, and most importantly, prioritize user
							satisfaction above all else.
						</h4>
						<div
							class="flex flex-col-reverse gap-10 2xl:flex-row mt-10 mb-7 lg:mb-0 justify-center items-center lg:items-end 2xl:items-center lg:justify-between">
							<button
								class="group relative hover-scale-effect clickable cursor-none w-fit items-center gap-x-4 py-4 flex justify-between px-5 text-white change-color-button rounded-full tracking-widest overflow-hidden origin-center shadow-around hover:bg-secondary-dark bg-black transition-all duration-500">
								<div>
									<Icon
										name="material-symbols:format-color-fill-rounded"
										color="white"
										class="w-5 h-auto group-hover:opacity-0 icon-fill-color -ml-1 mb-1 transition-all duration-300" />
								</div>
								<div class="cursor-none flex gap-x-4">
									<label
										v-for="(color, index) in colorOptions"
										:key="index"
										class="cyberpunk-checkbox-label opacity-0 group-hover:opacity-100">
										<input
											type="checkbox"
											class="cursor-none"
											:class="`color-${index + 1} cyberpunk-checkbox`"
											v-model="checkboxes[index]"
											@change="
												updateCheckbox(
													index,
													color.primary,
													color.secondary,
													color.transparent,
													color.family
												);
												updateFavicon(color.family);
											" />
									</label>
								</div>
							</button>
							<a
								href="/doc/Rémy Canal - curriculum vitae.pdf"
								target="_blank"
								download
								class="hover-scale-effect clickable mix-darken cursor-none button group w-fit flex items-center border-none relative py-3.5 pl-4 pr-16 p-1.5 text-white text-xl tracking-widest rounded-2xl bg-secondary">
								Download CV
								<Icon
									name="material-symbols:download-rounded"
									color="var(--primary-color)"
									class="absolute group-active:scale-95 p-1 flex items-center justify-center w-[2.2em] h-[2.2em] rounded-xl bg-white" />
							</a>
						</div>
					</div>
				</div>
				<div
					class="flex flex-wrap lg:flex-row justify-center md:justify-evenly lg:justify-between 2xl:justify-center gap-7 mt-20 lg:mt-26 -mb-20">
					<ValueCard
						text1="Simplicity"
						text2="Sophistication"
						subText="For a smooth user's experience and clean codebase"
						pathIcon="/img/rocket.png" />
					<ValueCard
						text1="Innovative"
						text2="Meticulous"
						subText="Engineered with creativity and attention to detail"
						pathIcon="/img/brackets.png" />
					<ValueCard
						text1="Autonomous"
						text2="Listening"
						subText="Independently developed with a focus on user feedback"
						pathIcon="/img/handshake.png" />
					<ValueCard
						text1="Open-minded"
						text2="Passionate"
						subText="Crafted with an open heart and driven by passion"
						pathIcon="/img/Statue-Of-Liberty.png" />
				</div>
			</div>
			<div class="container mx-auto px-4 lg:px-0 py-20">
				<!-- SKILLS -->
				<h2
					id="skills"
					class="text-color-saturate text-[3rem] md:text-[4rem] uppercase w-fit">
					Skills
				</h2>
				<div
					class="flex flex-col lg:flex-row lg:justify-evenly lg:pt-28 2xl:pt-40 items-center gap-40 2xl:gap-x-60 gap-y-20 my-20">
					<div
						class="bg-gray-dark h-[24rem] md:h-[27rem] lg:h-[30rem] 2xl:h-[27rem] w-11/12 md:w-4/6 lg:w-3/6 2xl:w-2/5 shadow-around border-[1px] text-center border-secondary rounded-3xl flex flex-row justify-between">
						<div
							class="flex justify-center rounded-tl-[1.35rem] rounded-br-[1.35rem] bg-secondary w-[12%] md:w-[9%] h-fit">
							<div
								:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
								@transitionend="finishUpdate"
								class="flex flex-col my-10 transition-opacity duration-300">
								<div
									v-for="index in currentSkill.stars"
									:key="'filled-' + index">
									<Icon
										name="teenyicons:star-small-solid"
										class="w-auto h-8 md:h-9"
										color="#1f293b" />
								</div>
								<div
									v-for="index in 5 - currentSkill.stars"
									:key="'empty-' + index">
									<Icon
										name="teenyicons:star-small-outline"
										class="w-auto h-8 md:h-9"
										color="#1f293b" />
								</div>
							</div>
						</div>
						<div
							:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
							@transitionend="finishUpdate"
							class="flex flex-col items-center w-[88%] h-full py-4 px-8 transition-opacity duration-300">
							<NuxtImg
								v-if="currentSkill.withPath"
								:src="currentSkill.pathIcon"
								:alt="currentSkill.text"
								:class="{
									'icon-select-event': true,
									'w-fit': true,
									'h-16': !currentSkill.isGif,
									'md:h-24': !currentSkill.isGif,
									'h-24': currentSkill.isGif,
									'md:h-36': currentSkill.isGif,
								}"
								class="my-10" />
							<Icon
								v-else
								:name="currentSkill.icon || ''"
								class="w-auto h-16 md:h-24 my-10"
								color="white" />
							<div class="text-color-saturate">
								<h3
									v-if="currentSkill.text !== 'but still human...'"
									class="pb-5 font-bold">
									{{ currentSkill.text }}
								</h3>
								<p class="pb-10 text-sm md:text-lg font-bold w-full">
									{{ currentSkill.description }}
								</p>
							</div>
						</div>
					</div>
					<div
						class="relative flex lg:grid lg:w-4/5 2xl:w-3/5 flex-wrap grid-cols-4 justify-center pt-28 md:pt-60 lg:pt-0 gap-10 gap-y-7 md:gap-x-20 md:gap-y-12">
						<NuxtImg
							:src="`/img/details-skills-${selectedColor}.png`"
							format="webp"
							alt="Click on bubbles to see details"
							class="hover:saturate-200 transition-all duration-500 hidden lg:block absolute scale-50 bottom-[68%] 2xl:bottom-[55%] right-[78%] 2xl:right-[70%] z-10" />
						<NuxtImg
							:src="`/img/mobile-details-skills-${selectedColor}.png`"
							format="webp"
							alt="Click on bubbles to see details (mobile)"
							class="hover:saturate-200 transition-all duration-500 lg:hidden absolute scale-50 bottom-[80%] md:bottom-[65%] right-[30%] md:right-[22%] z-10" />
						<NuxtImg
							:src="`/img/stars-info-${selectedColor}.png`"
							format="webp"
							alt="Stars = Proficiency level"
							class="hover:saturate-200 transition-all duration-500 absolute scale-50 bottom-[81%] md:bottom-[67%] lg:bottom-[85%] 2xl:bottom-[75%] left-[30%] md:left-[40%] lg:left-[30%] z-10" />
						<BubbleIcon
							v-for="(skill, index) in skills"
							class="rounded-full"
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
							@click="fillCardSkills(index)" />
					</div>
				</div>
				<div class="text-3xl text-white font-bold">
					<img :src="`/img/logo-${selectedColor}.png`" alt="Rémy Canal" />
					<img :src="`/img/logo-${selectedColor}.png`" alt="Rémy Canal" />
					<img :src="`/img/logo-${selectedColor}.png`" alt="Rémy Canal" />
				</div>
			</div>
		</div>
	</div>
</template>
