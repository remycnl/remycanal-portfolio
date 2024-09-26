<template>
	<div
		class="header pointer-events-none container mx-auto px-4 lg:px-0 lg:pl-4 2xl:pl-10">
		<div
			class="px-1 relative toolbar lg:hidden flex justify-between items-center pointer-events-none">
			<a href="#" @click="ancreToSection($event, 'top')" class="z-50 -mt-1">
				<img
					:src="`/img/logo-${primaryColor}.png`"
					alt="Rémy Canal"
					class="change-img-color text-shadow pointer-events-auto hover:saturate-200 hover:translate-x-2 transition-all duration-500 w-12 h-auto" />
			</a>
			<div class="z-50 flex pointer-events-auto items-center justify-center">
				<div
					class="cursor-none hover:saturate-200 transition-all transform-gpu duration-500"
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
			class="dropdown-animation -mt-16 lg:-mt-0 set-dropdown-menu transform-gpu">
			<div
				:class="headerClasses"
				class="pointer-events-auto overflow-y-auto lg:overflow-y-visible max-h-[97vh] lg-custom-width">
				<a
					href="#"
					id="logo-zoom"
					@click="executeFunctionsMenu($event, 'top')"
					class="hover-scale-effect clickable cursor-none active:scale-105 transition-all duration-100">
					<img
						:src="`/img/logo-${primaryColor}.png`"
						alt="Rémy Canal"
						class="change-img-color text-shadow hover-scale-effect hover:translate-x-2 transition-all duration-500 w-20 lg:w-14 h-auto mt-4 lg:mt-0 pointer-events-auto" />
				</a>
				<div
					class="flex flex-col lg:flex-row tracking-widest lg:tracking-normal 2xl:tracking-widest gap-x-20 gap-y-10 text-white uppercase items-center">
					<span
						v-for="(menu, index) in menus"
						:key="index"
						:id="'text-menu-' + index"
						class="magnet pointer-events-auto">
						<a
							@click="
								executeFunctionsMenu($event, 'top');
								applyGradientText(index);
								applyZoomEffect(index);
							"
							href="#"
							class="menu-sm text-shadow transition-all duration-300 ease-in-out text-xl hover-scale-effect clickable cursor-none">
							{{ menu }}
						</a>
					</span>
					<a
						@click="
							executeFunctionsMenu($event, 'top');
							applyGradientText(4);
						"
						href="#"
						class="active:scale-95 transition-all duration-75">
						<div
							class="hover-scale-effect clickable cursor-none pointer-events-auto group relative p-0.5 transition-all duration-300 lg:ease-in border-none rounded-xl bg-secondary isolate">
							<div
								class="p-4 bg-black-dark bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 lg:ease-in rounded-xl">
								<span
									class="text-black font-bold group-hover:font-normal group-hover:text-white transition-all duration-300 lg:ease-in text-xl">
									Contact me
								</span>
							</div>
						</div>
					</a>
				</div>

				<div
					class="group lg:hidden flex flex-col items-center pb-5"
					@click="toggleDropdown">
					<Icon
						name="fluent-emoji-high-contrast:cross-mark"
						color="var(--white)"
						class="w-6 h-6 md:w-8 md:h-8 hover:rotate-90 duration-300" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { toggleDropdown, applyZoomEffect } from "@/plugins/gsap";
import { magnetEffect } from "@/plugins/global.js";

let isScreenSM = ref(false);
let scrolled = ref(false);
const menus = ["About me", "Skills", "Timeline", "Projects"];

const headerClasses = computed(() => ({
	"w-full": true,
	flex: true,
	"flex-col": true,
	"lg:flex-row": true,
	"gap-y-20": true,
	"justify-between": true,
	"items-center": true,
	"p-4": true,
	border: true,
	"border-transparent": !scrolled.value,
	"!border-gray-semi": scrolled.value || isScreenSM.value,
	"rounded-3xl": true,
	"shadow-around": scrolled.value,
	"shadow-black-dark": scrolled.value,
	"backdrop-blur-sm": scrolled.value,
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
	window.addEventListener("scroll", handleScroll);
	handleScroll();
	magnetEffect();
	applyGradientText(0);

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
