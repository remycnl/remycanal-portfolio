<script setup lang="ts">
let titre = "Rémy Canal | Web Developer Portfolio";

// Méthode mounted() de Nuxt.js
const mounted = () => {
	// Vérifie que nous sommes dans un environnement de navigateur (côté client)
	if (process.client) {
		// Ajoute un gestionnaire d'événements pour écouter les changements de visibilité de la page
		document.addEventListener("visibilitychange", function () {
			// Vérifie si la page est visible ou non
			if (document.visibilityState === "hidden") {
				// Change la valeur de la variable titre lorsque l'onglet n'est pas actif
				titre = "I miss you ! 😢";
			} else {
				// Restaure la valeur originale de la variable titre lorsque l'onglet redevient actif
				titre = "Rémy Canal | Web Developer Portfolio";
			}
		});
	}
};

// Appeler la méthode mounted() lorsque le composant est monté
mounted();

useSeoMeta({
	title: titre,
	ogTitle: "Rémy Canal | Web Developer Portfolio",
	description:
		"I am a french web developer based in Lyon and this is my portfolio where I expose my projects and experiences.",
	ogDescription: "This is my amazing site, let me tell you all about it.",
	ogImage: "~/assets/img/logo.png",
});
</script>

<template>
	<!-- ABOUT ME -->
	<div class="bg-gradient-to-b from-black via-primary to-black">
		<div class="container mx-auto px-4 pt-32 lg:pt-60 pb-48">
			<div
				class="flex flex-col lg:flex-row justify-between items-center gap-x-80 gap-y-10">
				<img
					src="~/assets/img/avatar.png"
					alt="Rémy Canal"
					class="icon-select-event gradient-img w-3/4 lg:w-max z-50" />
				<div
					class="flex flex-col justify-center text-center md:text-start gap-y-14 text-white text-2xl">
					<h1
						class="-mt-16 lg:-mt-0 mx-0 md:mx-10 lg:mx-0 flex flex-col md:flex-row items-center gap-x-5 gap-y-3 font-bold">
						<span class="text-gradient -ml-14 md:-ml-0">Rémy <span class="ml-28 md:ml-16">Canal</span></span>
						<span class="text-gradient text-[2.3rem] md:text-[5rem]">Web <span class="md:ml-16">Developer</span></span>
					</h1>
					I'm a student at Epitech, on my way to becoming a software engineer specialized in crafting outstanding and full digital experiences. Based in Lyon, France, I ensure responsive design, SEO optimization, and most importantly, prioritize user satisfaction above all else.
				</div>
			</div>
			<div class="flex flex-wrap justify-center md:justify-evenly lg:justify-between gap-7 mt-20 lg:mt-40 -mb-20">
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
	<div class="container mx-auto px-4 py-20">
		<!-- SKILLS -->
		<h2 id="skills" class="text-gradient uppercase">Skills</h2>
		<div class="flex flex-col lg:flex-row lg:justify-between items-center gap-x-60 gap-y-20 my-20">
			<div class="p-20 lg:p-40 bg-black border-2 text-center border-gray-semi rounded-3xl">
				<p class="text-white text-2xl">Ici prendra place</p>
				<p class="text-white text-2xl mt-10">un élément 3D !</p>
				<p class="text-white text-2xl mt-10">(un ordi maybe)</p>
			</div>
			<div
				class="flex lg:grid lg:w-2/5 flex-wrap grid-cols-4 justify-center gap-10 gap-y-20 md:gap-20">
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
				<BubbleIcon
					text="Sass"
					color="#cd6799"
					icon="logos:sass" />
				<BubbleIcon
					text="Nuxt"
					color="#67dd82"
					icon="logos:nuxt-icon" />
				<BubbleIcon
					text="Vue"
					color="#51b883"
					icon="logos:vue" />
				<BubbleIcon
					text="Laravel"
					color="#f24423"
					icon="logos:laravel" />
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
				<BubbleIcon
					text="PHP"
					color="#6181B6"
					icon="logos:php" />
				<BubbleIcon
					text="Python"
					color="#FFD141"
					icon="logos:python" />
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
</template>
