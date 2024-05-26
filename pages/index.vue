<script setup lang="ts">
const titre = ref("Rémy Canal | Portfolio - Web Developer");
const inactiveTitle = ref("I miss you !!!");

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
	<!-- ABOUT ME -->
	<div class="bg-gradient-to-b from-black via-primary to-black">
		<div class="lg:mx-20 2xl:mx-0 hover:brightness-100">
			<div class="container mx-auto px-4 lg:px-0 pt-28 lg:pt-40 pb-48">
				<div
					class="flex flex-col lg:flex-row justify-between items-center gap-y-10">
					<img
						src="~/assets/img/avatar.png"
						alt="Rémy Canal"
						class="icon-select-event gradient-img w-5/6 md:w-1/2 lg:w-4/12 h-auto z-40" />
					<div
						class="flex flex-col justify-center text-center w-full lg:w-7/12 md:text-start md:gap-y-14 z-50">
						<h1
							class="-mt-36 md:-mt-24 lg:-mt-0 mx-0 md:mx-10 lg:mx-0 flex flex-col md:flex-row items-center gap-x-5 gap-y-14 md:gap-y-3 font-bold">
							<span class="text-gradient -ml-14 md:-ml-0 text-[6rem] md:text-[5rem] lg:text-[4rem] 2xl:text-[6rem] leading-[5.5rem] lg:leading-none 2xl:leading-[6.4rem]"
								>Rémy <span class="ml-28 md:ml-16">Canal</span></span
							>
							<span class="text-gradient text-[3rem] md:text-[5rem] lg:text-[4rem] 2xl:text-[6rem] leading-[5.4rem] lg:leading-none 2xl:leading-[6.4rem]"
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
					</div>
				</div>
				<div
					class="flex flex-wrap lg:flex-row justify-center md:justify-evenly lg:justify-between 2xl:justify-center gap-7 mt-20 lg:mt-26 -mb-20">
					<ValueCard
						text1="Simplicity"
						text2="Sophistication"
						subText="For a smooth user's experience and clean codebase."
						icon="noto:rocket" />
					<ValueCard
						text1="Innovative"
						text2="Meticulous"
						subText="Engineered with creativity and attention to detail."
						:isIcon="false"
						pathIcon="/img/brackets.png" />
					<ValueCard
						text1="Autonomous"
						text2="Listening"
						subText="Independently developed with a focus on user feedback."
						:isIcon="false"
						pathIcon="/img/handshake.png" />
					<ValueCard
						text1="Open-minded"
						text2="Passionate"
						subText="Crafted with an open heart and driven by passion."
						:isIcon="false"
						pathIcon="/img/Statue-Of-Liberty.png" />
				</div>
			</div>
			<div class="container mx-auto px-4 lg:px-0 py-20">
				<!-- SKILLS -->
				<h2 id="skills" class="text-gradient uppercase w-fit">Skills</h2>
				<div
					class="flex flex-col lg:flex-row lg:justify-between items-center gap-40 2xl:gap-x-60 gap-y-20 my-20">
					<div
						class="p-20 lg:p-40 bg-black border-2 text-center border-gray-semi rounded-3xl">
						<p class="text-white text-2xl">Ici prendra place</p>
						<p class="text-white text-2xl mt-10">un élément 3D !</p>
						<p class="text-white text-2xl mt-10">(un ordi maybe)</p>
					</div>
					<div
						class="flex lg:grid lg:w-3/5 2xl:w-2/5 flex-wrap grid-cols-4 justify-center gap-10 gap-y-16 md:gap-20 md:gap-y-16">
						<BubbleIcon
							text="Html"
							color="#f1662a"
							icon="vscode-icons:file-type-html" />
						<BubbleIcon
							text="JavaScript"
							color="#f0db4f"
							icon="skill-icons:javascript" />
						<BubbleIcon
							text="CSS"
							color="#248cc8"
							icon="vscode-icons:file-type-css" />
						<BubbleIcon
							text="Tailwind"
							color="#45bbbd"
							icon="logos:tailwindcss-icon" />
						<BubbleIcon text="Sass" color="#cd6799" icon="logos:sass" />
						<BubbleIcon text="Nuxt" color="#67dd82" icon="logos:nuxt-icon" />
						<BubbleIcon text="Vue" color="#51b883" icon="logos:vue" />
						<BubbleIcon text="Laravel" color="#f24423" icon="logos:laravel" />
						<BubbleIcon
							text="Wordpress"
							color="white"
							icon="fa6-brands:wordpress"
							iconColor="white" />
						<BubbleIcon
							text="Elementor"
							color="#932c3c"
							:isSVG="true"
							pathIcon="/img/elementor.svg" />
						<BubbleIcon
							text="Swiper"
							color="#0a7efa"
							:isSVG="true"
							pathIcon="/img/swiper.svg" />
						<BubbleIcon
							text="Strapi"
							color="#556afa"
							icon="logos:strapi-icon" />
						<BubbleIcon text="PHP" color="#6181B6" icon="logos:php" />
						<BubbleIcon text="Python" color="#FFD141" icon="logos:python" />
						<BubbleIcon
							class="hidden md:block"
							text="C"
							color="#273393"
							:isSVG="true"
							pathIcon="/img/c.png" />
						<BubbleIcon
							text="Canva"
							color="#00C4CC"
							:isSVG="true"
							pathIcon="/img/canva.png" />
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
