<script setup>
import "@/assets/css/main.css";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { toggleDropdown, customCursor, animationFooterBottom } from "~/plugins/gsap";
import { mouseEffect } from '~/plugins/global.js';

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


onMounted(() => {
	setSEO();
	setCSP();
	customCursor();
    mouseEffect();
	animationFooterBottom();
});

const setSEO = () => {
	if (process.client) {
		document.addEventListener("visibilitychange", function () {
			if (document.visibilityState === "hidden") {
				document.title = inactiveTitle.value;
			} else {
				document.title = activeTitle.value;
			}
		});
	}
};

// Configuration de la Content Security Policy (CSP)
const setCSP = () => {
	const meta = document.createElement("meta");
	meta.httpEquiv = "Content-Security-Policy";
	meta.content = "script-src 'self' https://apis.google.com";

	// Ajoute la balise meta à head seulement si elle n'existe pas déjà
	const existingMeta = document.head.querySelector(
		'meta[http-equiv="Content-Security-Policy"]'
	);
	if (!existingMeta) {
		document.head.appendChild(meta);
	}
};
</script>

<template>
	<div class="cursor-none">
		<div class="hidden lg:block custom-cursor shadow-around bg-secondary rounded-full pointer-events-none z-[1000]"></div>
		<div class="scroll-smooth relative max-w-screen overflow-hidden">
			<div id="blob" class="absolute -z-0 pointer-events-none hidden lg:block"></div>
			<div
			@click="toggleDropdown"
			class="blur-background-menu z-[100] pointer-events-none blur-none lg:hidden opacity-0 absolute h-full w-full bg-black bg-opacity-90"></div>
			<div class="bg-secondary-dark lg:p-8 lg:pt-36 overflow-hidden">
				<div id="top" class="container mx-auto lg:mx-0 z-[9999]">
					<Header class="fixed top-5" />
				</div>
				<div id="slot">
					<slot />
				</div>
				<Footer id="footer"/>
				<div class="flex justify-center items-center flex-col mt-32 lg:mt-60 mb-24 lg:mb-48 gap-y-3">
					<h4
						class="w-fit text-center text-gray-light hover:text-white transition-color duration-500 text-2xl md:text-3xl lg:text-4xl">
						&ldquo; Simplicity is the ultimate sophistication. &rdquo;
					</h4>
					<h4 class="w-fit text-xs text-gray-light hover:text-white transition-color duration-500 md:text-base lg:text-lg">Leonardo da Vinci</h4>
				</div>
				<div class="container-s hidden lg:flex text-start w-screen -ml-8 -mb-7 overflow-hidden select-none">
					<div id="letters-bottom" class="tracking-wider font-mono s whitespace-nowrap inline-block text-xs text-black uppercase w-fit">
					<!-- Ici apparaîssent les <span> des crédits -->light
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
