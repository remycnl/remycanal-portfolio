<template>
	<div
		class="header pointer-events-none container mx-auto px-4 lg:px-0 lg:pl-4 2xl:pl-20">
		<div
			class="px-1 toolbar lg:hidden flex justify-between items-center pointer-events-auto">
			<a href="#" @click="ancreToSection($event, 'top')">
				<img src="~/assets/img/logo.png" alt="Rémy Canal" class="hover:saturate-200 hover:translate-x-2 transition-all duration-500 w-12 h-auto" />
			</a>
			<div class="flex items-center justify-center">
				<div class="md:cursor-pointer hover:saturate-200 transition-all transform-gpu duration-500" @click="toggleDropdown">
					<div class="first-line w-6 h-1 rounded-full bg-gradient-to-l from-secondary-purple to-secondary-pink mb-1.5"></div>
					<div class="second-line w-6 h-1 rounded-full bg-gradient-to-l from-secondary-purple to-secondary-pink mb-1.5"></div>
					<div class="third-line w-6 h-1 rounded-full bg-gradient-to-l from-secondary-purple to-secondary-pink mb-1.5"></div>
				</div>
			</div>
		</div>
		<div class="dropdown-animation -mt-16 lg:-mt-0 set-dropdown-menu transform-gpu">
			<div :class="headerClasses" class="overflow-y-auto lg:overflow-hidden max-h-[97vh] lg-custom-width">
				<a href="#" id="logo-zoom" @click="executeFunctionsMenu($event, 'top')">
					<img
						src="~/assets/img/logo.png"
						alt="Rémy Canal"
						class="hover-scale-effect hover:saturate-200 hover:translate-x-2 transition-all duration-500 w-20 lg:w-14 h-auto mt-4 lg:mt-0 pointer-events-auto" />
				</a>
				<div
				class="flex flex-col lg:flex-row gap-x-20 gap-y-10 text-white uppercase items-center">
					<span v-for="(menu, index) in menus" :key="index" :id="'text-menu-' + index" class="magnet pointer-events-auto">
						<a @click="executeFunctionsMenu($event, 'top'); applyGradientText(index); applyZoomEffect(index)"
							href="#"
							class="menu-sm transition-all duration-300 ease-in-out text-xl hover-scale-effect">
							{{ menu }}
						</a>
					</span>
					<a @click="executeFunctionsMenu($event, 'top'); applyGradientText(4)" href="#"
					class="hover-scale-effect btn pointer-events-auto group relative p-5 border-none rounded-[0.8em] bg-gradient-to-r from-secondary-purple to-secondary-pink cursor-pointer isolate">
						<span class="text-black-dark group-hover:text-white transition-colors duration-500 text-xl">Contact me</span>
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

<script setup>
import { toggleDropdown, applyZoomEffect } from '~/plugins/gsap';
import { magnetEffect } from '~/plugins/global.js';

let isScreenSM = ref(true);
let scrolled = ref(false);
const menus = ['About me', 'Skills', 'Experience', 'Portfolio'];

const headerClasses = computed(() => ({
    "w-full": true,
    "flex": true,
    "flex-col": true,
    "lg:flex-row": true,
    "gap-y-20": true,
    "justify-between": true,
    "items-center": true,
    "p-4": true,
    "border": true,
    "border-transparent": scrolled.value,
    "!border-gray-semi": !scrolled.value || isScreenSM.value,
    "rounded-3xl": true,
    "bg-black-dark": !scrolled.value || isScreenSM.value,
    "lg:bg-opacity-90": true,
    "bg-opacity-95": true,
    "transition-all": true,
    "duration-500": true,
}));

const handleScroll = () => {
    isScreenSM.value = window.innerWidth < 1024;
    scrolled.value = window.scrollY < 100;
};

const executeFunctionsMenu = (event, targetId) => {
    event.preventDefault();

    if (window.innerWidth < 1024) {
        toggleDropdown();

        setTimeout(() => {
            ancreToSection(event, targetId);
        }, 500);
    } else {
        ancreToSection(event, targetId);
    }
};

const ancreToSection = (event, targetId) => {
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
};

const applyGradientText = (index) => {
    const textMenus = document.querySelectorAll("[id^='text-menu']");

    textMenus.forEach((menu, idx) => {
        if (index === 4) {
            menu.classList.remove('text-gradient');
        } else if (idx === index) {
            menu.classList.add('text-gradient');
        } else {
            menu.classList.remove('text-gradient');
        }
    });
};

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    magnetEffect();
    applyGradientText(0);
});

onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
});

const toggleDropdownMenu = () => {
    toggleDropdown();
};

const applyZoomEffectMenu = (index) => {
    applyZoomEffect(index);
};
</script>


<style scoped>
    @media (min-width: 1024px) {
        .lg-custom-width {
            width: calc(100vw - 2rem);
        }
    }
	@media (min-width: 1536px) {
        .lg-custom-width {
            width: calc(100vw - 10rem);
        }
    }
</style>
