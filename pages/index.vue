<script setup lang="ts">
const titre = ref("Rémy Canal | Portfolio - Web Developer");
const inactiveTitle = ref("I miss you !!!");

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
		description: "HTML Description",
	},
	{
		text: "JavaScript",
		color: "#f0db4f",
		icon: "skill-icons:javascript",
		stars: 4,
		description: "JavaScript Description",
	},
	{
		text: "CSS",
		color: "#248cc8",
		icon: "vscode-icons:file-type-css",
		stars: 4,
		description: "CSS Description",
	},
	{
		text: "Tailwind",
		color: "#45bbbd",
		icon: "logos:tailwindcss-icon",
		stars: 5,
		description: "Tailwind Description",
	},
	{
		text: "Sass",
		color: "#cd6799",
		icon: "logos:sass",
		stars: 3,
		description: "Sass Description",
	},
	{
		text: "Nuxt",
		color: "#67dd82",
		icon: "logos:nuxt-icon",
		stars: 4,
		description: "Nuxt Description",
	},
	{
		text: "Vue",
		color: "#51b883",
		icon: "logos:vue",
		stars: 4,
		description: "Vue Description",
	},
	{
		text: "Laravel",
		color: "#f24423",
		icon: "logos:laravel",
		stars: 3,
		description: "Laravel Description",
	},
	{
		text: "Wordpress",
		color: "white",
		iconColor: "white",
		icon: "fa6-brands:wordpress",
		stars: 3,
		description: "Wordpress Description",
	},
	{
		text: "Elementor",
		color: "#932c3c",
		withPath: true,
		pathIcon: "/img/elementor.svg",
		stars: 3,
		description: "Elementor Description",
	},
	{
		text: "Swiper",
		color: "#0a7efa",
		withPath: true,
		pathIcon: "/img/swiper.svg",
		stars: 4,
		description: "Swiper Description",
	},
	{
		text: "Strapi",
		color: "#556afa",
		icon: "logos:strapi-icon",
		stars: 4,
		description: "Strapi Description",
	},
	{
		text: "PHP",
		color: "#6181B6",
		icon: "logos:php",
		stars: 2,
		description: "PHP Description",
	},
	{
		text: "Python",
		color: "#FFD141",
		icon: "logos:python",
		stars: 3,
		description: "Python Description",
	},
	{
		text: "GitHub",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/github.png",
		stars: 3,
		description: "GitHub Description",
	},
	{
		text: "GSAP",
		color: "#14D74B",
		withPath: true,
		pathIcon: "/img/gsap.png",
		stars: 4,
		description: "GSAP Description",
	},
	{
		text: "C",
		color: "#273393",
		withPath: true,
		pathIcon: "/img/c.png",
		stars: 4,
		description: "C Description",
	},
	{
		text: "Canva",
		color: "#00C4CC",
		withPath: true,
		pathIcon: "/img/canva.png",
		stars: 3,
		description: "Canva Description",
	},
	{
		text: "ChatGPT",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/chatgpt.png",
		stars: 5,
		description: "ChatGPT Description",
	},
	{
		text: "but still human...",
		color: "#FEC47C",
		withPath: true,
		isGif: true,
		pathIcon: "/img/wolf.gif",
		stars: 0,
		description: "Human Description",
	},
];

const currentSkill = ref<Skill>(skills[0]);
const isUpdating = ref(false);

const fillCardSkills = (skill: Skill) => {
	isUpdating.value = true;
	setTimeout(() => {
		currentSkill.value = skill;
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
				document.title = titre.value;
			}
		});
	}

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

useSeoMeta({
	title: titre,
	ogTitle: "Rémy Canal | Web Developer Portfolio",
	description:
		"I am a french web developer based in Lyon and this is my portfolio where I expose my projects and experiences.",
	ogDescription: "This is my amazing site, let me tell you all about it.",
	ogImage: "~/assets/img/avatar.png",
});
</script>

<template>
	<div class="hidden lg:block">
		<div class="flex justify-center">
			<button
				class="cursor-pointer text-white flex items-center justify-center fixed z-[100] font-mono rounded-full overflow-hidden origin-center shadow-around hover:bg-secondary-purple bg-black opacity-0 pointer-events-none back-to-top hover-scale-effect lg:ml-[140vh] 2xl:ml-[176vh] lg:mt-[80vh] transition-all duration-500">
				<svg class="svgIcon" viewBox="0 0 384 512">
					<path
						d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
				</svg>
			</button>
		</div>
	</div>
	<!-- ABOUT ME -->
	<div class="bg-gradient-to-b from-black via-primary to-black">
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
						class="flex flex-col justify-center text-center w-full lg:w-7/12 md:text-start md:gap-y-14 z-50">
						<h1
							class="-mt-36 md:-mt-24 lg:-mt-0 mx-0 md:mx-10 lg:mx-0 flex flex-col md:flex-row items-center gap-x-5 gap-y-14 md:gap-y-3 font-bold">
							<span
								class="text-gradient -ml-14 md:-ml-0 text-[6rem] md:text-[5rem] lg:text-[4rem] 2xl:text-[6rem] leading-[5.5rem] lg:leading-none 2xl:leading-[6.4rem]"
								>Rémy <span class="ml-28 md:ml-16">Canal</span></span
							>
							<span
								class="text-gradient text-[3rem] md:text-[5rem] lg:text-[4rem] 2xl:text-[6rem] leading-[5.4rem] lg:leading-none 2xl:leading-[6.4rem]"
								>Web <span class="md:ml-16">Developer</span></span
							>
						</h1>
						<h4
							style="font-family: RocknRoll One"
							class="text-white text-xl 2xl:text-3xl mx-4 md:mx-0 md:text-justify">
							I'm a student at Epitech, on my way to becoming a software
							engineer specialized in crafting outstanding and full digital
							experiences. Based in Lyon, France, I ensure responsive design,
							SEO optimization, and most importantly, prioritize user
							satisfaction above all else.
						</h4>
						<div class="flex mt-10 mb-7 lg:mb-0 justify-center lg:justify-end">
							<a
								href="/doc/Rémy Canal - curriculum vitae.pdf"
								target="_blank"
								download
								class="hover-scale-effect button group hover:saturate-200 transition-all duration-500 w-fit flex items-center border-none relative py-3.5 pl-4 pr-16 p-1.5 text-white text-xl tracking-widest rounded-2xl bg-gradient-to-r from-secondary-purple to-secondary-pink">
								Download CV
								<Icon
									name="material-symbols:download-rounded"
									color="#E178FB"
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
						subText="For a smooth user's experience and clean codebase."
						pathIcon="/img/rocket.png" />
					<ValueCard
						text1="Innovative"
						text2="Meticulous"
						subText="Engineered with creativity and attention to detail."
						pathIcon="/img/brackets.png" />
					<ValueCard
						text1="Autonomous"
						text2="Listening"
						subText="Independently developed with a focus on user feedback."
						pathIcon="/img/handshake.png" />
					<ValueCard
						text1="Open-minded"
						text2="Passionate"
						subText="Crafted with an open heart and driven by passion."
						pathIcon="/img/Statue-Of-Liberty.png" />
				</div>
			</div>
			<div class="container mx-auto px-4 lg:px-0 py-20">
				<!-- SKILLS -->
				<h2 id="skills" class="text-gradient uppercase w-fit">Skills</h2>
				<div
					class="flex flex-col lg:flex-row lg:justify-evenly lg:pt-28 2xl:pt-40 items-center gap-40 2xl:gap-x-60 gap-y-20 my-20">
					<div
						class="bg-gray-dark w-5/6 md:w-4/6 lg:w-3/6 2xl:w-2/5 shadow-around border-[1px] text-center border-secondary-purple rounded-3xl flex flex-row justify-between">
						<div
							class="flex justify-center rounded-tl-[1.35rem] rounded-br-[1.35rem] bg-secondary-purple w-[12%] md:w-[9%] h-full">
							<div
								:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
								@transitionend="finishUpdate"
								class="flex flex-col my-10 transition-opacity duration-300">
								<div
									v-for="index in currentSkill.stars"
									:key="'filled-' + index">
									<Icon
										name="teenyicons:star-small-solid"
										class="w-auto h-8 md:h-10"
										color="#1f293b" />
								</div>
								<div
									v-for="index in 5 - currentSkill.stars"
									:key="'empty-' + index">
									<Icon
										name="teenyicons:star-small-outline"
										class="w-auto h-8 md:h-10"
										color="#1f293b" />
								</div>
							</div>
						</div>
						<div
							:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
							@transitionend="finishUpdate"
							class="flex flex-col w-[88%] h-full p-4 transition-opacity duration-300">
							<Icon
								:name="currentSkill.icon"
								class="w-auto h-16 my-10"
								color="white" />
							<p class="pb-10 font-mono text-gradient text-xl font-bold w-full">
								{{ currentSkill.description }}
							</p>
						</div>
					</div>
					<div
						class="relative flex lg:grid lg:w-4/5 2xl:w-3/5 flex-wrap grid-cols-4 justify-center pt-28 md:pt-60 lg:pt-0 gap-10 gap-y-7 md:gap-x-20 md:gap-y-12">
						<NuxtImg
							src="/img/details-skills.png"
							format="webp"
							alt="Click on bubbles to see details"
							class="hidden lg:block absolute scale-50 bottom-[68%] 2xl:bottom-[55%] right-[78%] 2xl:right-[70%] z-10" />
						<NuxtImg
							src="/img/mobile-details-skills.png"
							format="webp"
							alt="Click on bubbles to see details (mobile)"
							class="lg:hidden absolute scale-50 bottom-[80%] md:bottom-[65%] right-[30%] md:right-[22%] z-10" />
						<NuxtImg
							src="/img/stars-info.png"
							format="webp"
							alt="Stars = Proficiency level"
							class="absolute scale-50 bottom-[81%] md:bottom-[67%] lg:bottom-[85%] 2xl:bottom-[75%] left-[30%] md:left-[40%] lg:left-[30%] z-10" />
						<BubbleIcon
							v-for="(skill, index) in skills"
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
							@click="fillCardSkills(skill)" />
					</div>
				</div>
				<div class="text-3xl text-white font-bold">
					<img src="~/assets/img/logo.png" alt="Rémy Canal" />
					<img src="~/assets/img/logo.png" alt="Rémy Canal" />
					<img src="~/assets/img/logo.png" alt="Rémy Canal" />
				</div>
			</div>
		</div>
	</div>
</template>
