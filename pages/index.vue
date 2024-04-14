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
				titre = "Titre alternatif lorsque l'onglet n'est pas actif";
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
	<div class="top-0 bg-black h-fit">
		<div class="container mx-auto px-4 pt-52 lg:pt-80 pb-48">
			<div
				class="flex flex-col lg:flex-row justify-between items-center gap-x-80 gap-y-10">
				<img
					src="~/assets/img/avatar.png"
					alt="Rémy Canal"
					class="gradient-img select-none w-3/4 lg:w-max" />
				<div
					class="flex flex-col justify-center text-center lg:text-start gap-y-14 text-white text-2xl">
					<div
						class="flex flex-col lg:flex-row items-center gap-x-5 text-gradient text-4xl font-bold">
						<span class="uppercase">Rémy Canal</span>
						<span class="hidden lg:block">|</span
						><span class="lg:hidden">-</span> <span>Web Developer</span>
					</div>
					&ldquo; I am a budding alchemist of code based in Lyon, France,
					studying at Epitech. My digital laboratory is a playground where I
					turn lines of code into unique web experiences. Creativity,
					innovation, and passion for technology are my magical ingredients.
					Ready to explore together the frontiers of creativity and technology ?
					&rdquo;
				</div>
			</div>
			<div class="hidden lg:block">
				<div class="flex justify-center mt-36 -mb-28">
					<div class="scrolldown" >
						<div class="chevrons">
							<div class="chevrondown"></div>
							<div class="chevrondown"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="bg-gradient-to-b from-black ... h-20"></div>
	<div class="container mx-auto px-4">
		<!-- SKILLS -->
		<h2 id="skills" class="text-gradient uppercase">Skills</h2>
		<div
			class="flex flex-wrap justify-center md:justify-start gap-10 gap-y-20 md:gap-20">
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
		</div>
		<h1 class="text-3xl text-white font-bold">
			<img src="~/assets/img/logo.png" alt="Rémy Canal" />
			<img src="~/assets/img/logo.png" alt="Rémy Canal" />
			<img src="~/assets/img/logo.png" alt="Rémy Canal" />
		</h1>
	</div>
</template>
