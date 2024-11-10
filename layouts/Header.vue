<template>
	<div
		class="header pointer-events-none container mx-auto px-4 lg:px-0 lg:pl-4 2xl:pl-10">
		<div
			class="px-1 relative toolbar lg:hidden flex justify-between items-center pointer-events-none">
			<a @click="ancreToSection($event, 'top')" href="#top" class="z-50 -mt-1">
				<NuxtImg
					:src="`https://www.remycanal.me/img/logo-${primaryColor}.png`"
					alt="Rémy Canal"
					preset="portfolioImage"
					loading="lazy"
					class="change-img-color text-shadow pointer-events-auto hover:translate-x-2 transition-all duration-500 w-12 h-auto" />
			</a>
			<div class="z-50 flex pointer-events-auto items-center justify-center">
				<div
					class="cursor-pointer lg:cursor-none hover:saturate-200 transition-all transform-gpu duration-500"
					@click="toggleDropdown">
					<div class="flex justify-end">
						<div
							class="first-line w-[1.35rem] h-[0.3rem] rounded-full bg-secondary mb-1.5"></div>
					</div>
					<div
						class="second-line w-9 h-[0.3rem] rounded-full bg-secondary mb-1.5"></div>
					<div class="flex justify-start">
						<div
							class="third-line w-[1.35rem] h-[0.3rem] rounded-full bg-secondary mb-1.5"></div>
					</div>
				</div>
			</div>
			<div
				class="-ml-4 md:-ml-12 -mt-5 z-10 backdrop-blur-lg shadow-around shadow-black bg-[#111319ad] absolute pointer-events-auto top-0 w-[120vh] left-0 h-[5.5rem]"></div>
		</div>
		<div
			:class="{ 'backdrop-blur-sm': scrolled && !isScreenSM }"
			class="relative dropdown-animation -mt-[3.25rem] lg:-mt-0 set-dropdown-menu transform-gpu">
			<div
				class="z-[99999] absolute top-10 right-10 group lg:hidden flex flex-col items-center"
				@click="toggleDropdown">
				<Icon
					name="i-fluent-emoji-high-contrast:cross-mark"
					ssr="true"
					mode="svg"
					style="color: var(--white)"
					class="w-6 h-6 md:w-8 md:h-8 hover:rotate-90 duration-300" />
			</div>
			<div
				:class="headerClasses"
				class="pointer-events-auto overflow-y-auto lg:overflow-y-visible max-h-[95vh] lg-custom-width">
				<a
					id="logo-zoom"
					@click="executeFunctionsMenu($event, 'top')"
					class="hover-scale-effect clickable cursor-pointer lg:cursor-none active:scale-105 transition-all duration-100">
					<NuxtImg
						:src="`https://www.remycanal.me/img/logo-${primaryColor}.png`"
						alt="Rémy Canal"
						preset="portfolioImage"
						loading="lazy"
						class="change-img-color text-shadow hover-scale-effect hover:translate-x-2 transition-all duration-500 w-20 lg:w-14 h-auto mt-8 lg:mt-0 pointer-events-auto" />
				</a>
				<div
					class="flex flex-col lg:flex-row tracking-widest lg:tracking-normal 2xl:tracking-widest gap-x-20 gap-y-8 text-white uppercase items-center">
					<span
						v-for="(menu, index) in menus"
						:key="index"
						:id="'text-menu-' + index"
						class="magnet pointer-events-auto">
						<a
							@click="
								executeFunctionsMenu($event, menu);
								applySaturationText(index);
								applyZoomEffect(index);
							"
							:href="'#' + menu"
							class="menu-sm text-shadow transition-all duration-300 ease-in-out text-xl hover-scale-effect clickable cursor-pointer lg:cursor-none">
							{{ menu }}
						</a>
					</span>
					<a
						@click="
							executeFunctionsMenu($event, 'Contact me');
							applySaturationText(4);
						"
						href="#Contact me"
						class="mb-10 lg:mb-0 active:scale-95 transition-all duration-75">
						<div
							class="hover-scale-effect clickable cursor-pointer lg:cursor-none pointer-events-auto group relative p-0.5 transition-all duration-300 lg:ease-in border-none rounded-xl bg-secondary isolate">
							<div
								class="p-4 bg-black-dark bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 lg:ease-in rounded-xl">
								<h2
									class="text-black font-bold group-hover:font-normal group-hover:text-white transition-all duration-300 lg:ease-in text-xl">
									Contact me
								</h2>
							</div>
						</div>
					</a>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import {
	toggleDropdown,
	applyZoomEffect,
	applySaturationTextOnScroll,
} from "@/plugins/gsap";
import { magnetEffect } from "@/plugins/global.js";

let isScreenSM = ref(false);
let scrolled = ref(false);
const menus = ["About me", "Skills", "Timeline", "Projects"];

const headerClasses = computed(() => ({
	"w-full": true,
	flex: true,
	"flex-col": true,
	"lg:flex-row": true,
	"gap-y-10": true,
	"justify-between": true,
	"items-center": true,
	"p-4": true,
	border: true,
	"border-transparent": !scrolled.value,
	"!border-gray-semi": scrolled.value || isScreenSM.value,
	"rounded-3xl": true,
	"shadow-around": scrolled.value,
	"shadow-black-dark": scrolled.value,
	"bg-black-dark": scrolled.value || isScreenSM.value,
	"lg:bg-opacity-90": true,
	"bg-opacity-95": true,
	"transition-all": true,
	"duration-500": true,
}));

const handleScroll = () => {
	isScreenSM.value = window.innerWidth < 1024;
	scrolled.value = window.scrollY > 100;
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

const applySaturationText = (index) => {
	const textMenus = document.querySelectorAll("[id^='text-menu']");

	textMenus.forEach((menu, idx) => {
		if (index === 4) {
			menu.classList.remove("text-color-saturate");
		} else if (idx === index) {
			menu.classList.add("text-color-saturate");
		} else {
			menu.classList.remove("text-color-saturate");
		}
	});
};

const primaryColor = ref("purple");

onMounted(() => {
	const mediaQuery = window.matchMedia("(min-width: 768px)");
	window.addEventListener("scroll", handleScroll);
	handleScroll();
	if (mediaQuery.matches) {
		magnetEffect();
		applySaturationTextOnScroll();
		applySaturationText(0);
	}

	window.addEventListener("resize", () => {
		if (mediaQuery.matches) {
			magnetEffect();
			applySaturationTextOnScroll();
			applySaturationText(0);
		}
	});

	const updatePrimaryColor = () => {
		const element = document.querySelector(".change-img-color");
		if (element) {
			if (element.classList.contains("purple")) {
				primaryColor.value = "purple";
			} else if (element.classList.contains("orange")) {
				primaryColor.value = "orange";
			} else if (element.classList.contains("green")) {
				primaryColor.value = "green";
			} else if (element.classList.contains("cyan")) {
				primaryColor.value = "cyan";
			} else if (element.classList.contains("pink")) {
				primaryColor.value = "pink";
			} else if (element.classList.contains("red")) {
				primaryColor.value = "red";
			} else if (element.classList.contains("gray")) {
				primaryColor.value = "gray";
			} else if (element.classList.contains("yellow")) {
				primaryColor.value = "yellow";
			} else if (element.classList.contains("blue")) {
				primaryColor.value = "blue";
			}
		}
	};

	updatePrimaryColor();

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "class"
			) {
				updatePrimaryColor();
			}
		});
	});

	const elementToObserve = document.querySelector(".change-img-color");
	if (elementToObserve) {
		observer.observe(elementToObserve, {
			attributes: true,
		});
	}

	onUnmounted(() => {
		observer.disconnect();
	});
});

onBeforeUnmount(() => {
	window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
@media (min-width: 1024px) {
	.lg-custom-width {
		width: calc(100vw - 6rem);
	}
}
@media (min-width: 1536px) {
	.lg-custom-width {
		width: calc(100vw - 10rem);
	}
}
</style>
