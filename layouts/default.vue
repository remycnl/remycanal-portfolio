<script setup>
import "@/assets/css/main.css";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { toggleDropdown, customCursor } from "~/plugins/gsap";
import { mouseEffect } from '~/plugins/global.js';

onMounted(() => {
	customCursor();
    mouseEffect();
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
			<div id="top" class="container mx-auto lg:mx-0 z-[9999]">
				<Header class="fixed top-5" />
			</div>
			<div id="slot">
				<slot />
			</div>
			<Footer id="footer"/>
		</div>
	</div>
</template>
