<script setup>
import "@/assets/css/main.css";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { toggleDropdown as gsapToggleDropdown } from "~/plugins/gsap";

function toggleDropdown() {
	gsapToggleDropdown();
}
</script>

<template>
	<div class="scroll-smooth relative max-w-screen overflow-hidden">
		<div
			@click="toggleDropdown"
			class="blur-background-menu z-40 pointer-events-none lg:hidden opacity-0 absolute h-full w-full bg-black bg-opacity-90"></div>
		<div id="top" class="container mx-auto z-[9999]">
			<Header class="fixed top-5" />
		</div>
		<div>
			<slot />
		</div>
		<Footer />
	</div>
</template>
