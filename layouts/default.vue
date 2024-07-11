<script setup>
import "@/assets/css/main.css";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { toggleDropdown, customCursor, animationFooterBottom } from "~/plugins/gsap";
import { mouseEffect } from '~/plugins/global.js';

onMounted(() => {
	customCursor();
    mouseEffect();
	animationFooterBottom();
});
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
					<div id="letters-bottom" class="tracking-wider font-mono s whitespace-nowrap inline-block text-xs text-black-dark uppercase w-fit">
					<!-- Ici apparaîssent les <span> des crédits -->light
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
