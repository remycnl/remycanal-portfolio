<template>
	<div
		class="header pointer-events-none lg:pointer-events-auto container mx-auto px-4">
		<div
			class="px-1 toolbar lg:hidden flex justify-between items-center pointer-events-auto">
			<a href="#top" @click="ancreToSection($event, 'top')">
				<img src="~/assets/img/logo.png" alt="Rémy Canal" class="w-12 h-auto" />
			</a>
			<div class="flex items-center justify-center">
				<div class="md:cursor-pointer" @click="toggleDropdown">
					<div class="first-line w-6 h-1 rounded-full bg-white mb-1.5"></div>
					<div class="second-line w-6 h-1 rounded-full bg-white mb-1.5"></div>
					<div class="third-line w-6 h-1 rounded-full bg-white mb-1.5"></div>
				</div>
			</div>
		</div>
		<div class="dropdown-animation -mt-16 lg:-mt-0 set-dropdown-menu">
			<div :class="headerClasses">
				<a href="#top" @click="executeFunctionsMenu">
					<img
						src="~/assets/img/logo.png"
						alt="Rémy Canal"
						class="w-20 lg:w-14 h-auto mt-4 lg:mt-0" />
				</a>
				<div
				class="flex flex-col lg:flex-row gap-x-20 gap-y-10 text-white uppercase items-center">
					<a id="text-menu" @click="executeFunctionsMenu" href="about me" class="menu-sm hover:opacity-80 transition-opacity duration-300"> About me </a>
					<a id="text-menu" @click="executeFunctionsMenu" href="skills" class="menu-sm hover:opacity-80 transition-opacity duration-300"> Skills </a>
					<a id="text-menu" @click="executeFunctionsMenu" href="experience" class="menu-sm hover:opacity-80 transition-opacity duration-300"> Experience </a>
					<a id="text-menu" @click="executeFunctionsMenu" href="portfolio" class="menu-sm hover:opacity-80 transition-opacity duration-300"> Portfolio </a>
					<a @click="executeFunctionsMenu" href="contact me"
					class="btn relative p-5 border-none rounded-[0.8em] bg-gradient-to-r from-secondary-purple to-secondary-pink cursor-pointer isolate">
						<span>Contact me</span>
						<div class="ripple-container"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span> 
							<div class="hover-ripple"></div>
						</div>
					</a>
				</div>

				<div
					class="group lg:hidden flex flex-col items-center"
					@click="toggleDropdown">
					<Icon
						name="fluent-emoji-high-contrast:cross-mark"
						color="white"
						class="w-6 h-6 md:w-8 md:h-8 hover:rotate-90 duration-300" />
					<span
						class="text-xs font-bold uppercase text-gradient opacity-0 group-hover:opacity-100 transition duration-100"
						>Exit</span
					>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { toggleDropdown as gsapToggleDropdown } from '~/plugins/gsap';
import { magnetEffect as magnetTextEffect } from '~/plugins/global.js';

export default {
	data() {
		return {
			isScreenSM: true,
			scrolled: false,
		};
	},
	computed: {
		headerClasses() {
			return {
				"w-full": true,
				"flex": true,
				"flex-col": true,
				"lg:flex-row": true,
				"gap-y-20": true,
				"justify-between": true,
				"items-center": true,
				"p-4": true,
				"border": true,
				"border-black": this.scrolled,
				"border-gray-semi": !this.scrolled || this.isScreenSM,
				"rounded-3xl": true,
				"bg-black-dark": !this.scrolled || this.isScreenSM,
				"lg:bg-opacity-90": true,
				"bg-opacity-95": true,
				"transition-all": true,
				"duration-500": true,
			};
		},
	},
	mounted() {
		this.handleScroll();
		window.addEventListener("scroll", this.handleScroll);
		this.magnetEffect();
	},
	beforeDestroy() {
		window.removeEventListener("scroll", this.handleScroll);
	},
	methods: {
		executeFunctionsMenu(event) {
			event.preventDefault();
			if (window.innerWidth < 1024) {
				gsapToggleDropdown();

				setTimeout(() => {
					this.ancreToSection(event, "top");
				}, 500);
			} else {
				this.ancreToSection(event, "top");
			}
		},
		handleScroll() {
			this.isScreenSM = window.innerWidth < 1024;

			this.scrolled = window.scrollY < 100;
		},
		ancreToSection(event, targetId) {
			event.preventDefault();

			const targetElement = document.getElementById(targetId);

			if (targetElement) {
				const viewportHeight = window.innerHeight;
				const targetOffset = targetElement.getBoundingClientRect().top;
				const scrollDistance = targetOffset - viewportHeight / 5;

				window.scrollBy({
					top: scrollDistance,
					behavior: "smooth",
				});
			}
		},
		toggleDropdown() {
			gsapToggleDropdown();
		},
		magnetEffect() {
			magnetTextEffect();
		},
	},
};
</script>
