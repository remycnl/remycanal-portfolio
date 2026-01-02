<script setup>
import { animationFooter } from "@/plugins/gsap";

const isNotDesktop = () => {
	return window.innerWidth < 1024;
};

const primaryColor = ref("purple");

onMounted(() => {
	if (isNotDesktop && typeof animationFooter === "function") {
		animationFooter();
	}

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
</script>

<template>
	<div
		class="lg:rounded-b-[4rem] overflow-hidden shadow-around shadow-black bottom-0 text-white bg-black">
		<div
			class="container mx-auto px-4 lg:px-0 pt-40 pb-10 lg:pb-32 flex flex-col items-center gap-y-20 md:gap-y-20 lg:gap-y-32">
			<NuxtImg
				:src="`https://www.remycanal.me/img/logo-${primaryColor}.png`"
				alt="Logo of Rémy Canal"
				title="Logo of Rémy Canal"
				preset="portfolioImage"
				loading="lazy"
				class="change-img-color text-shadow w-40 lg:w-48 2xl:w-60 h-auto" />
			<div
				class="flex flex-col gap-y-3 justify-center text-center text-gray-light text-2xl md:text-3xl lg:text-4xl tracking-wide">
				<div class="active:scale-95 transition-all duration-75">
					<a
						@click="ancreToSection($event, 'About me')"
						href="#About me"
						class="menu-line-animation hover-scale-effect clickable cursor-pointer lg:cursor-none text-base lg:text-lg">
						About me
					</a>
				</div>
				<div class="active:scale-95 transition-all duration-75">
					<a
						@click="ancreToSection($event, 'Skills')"
						href="#Skills"
						class="menu-line-animation hover-scale-effect clickable cursor-pointer lg:cursor-none text-base lg:text-lg">
						Skills
					</a>
				</div>
				<div class="active:scale-95 transition-all duration-75">
					<a
						@click="ancreToSection($event, 'Timeline')"
						href="#Timeline"
						class="menu-line-animation hover-scale-effect clickable cursor-pointer lg:cursor-none text-base lg:text-lg">
						Timeline
					</a>
				</div>
				<div class="active:scale-95 transition-all duration-75">
					<a
						@click="ancreToSection($event, 'Projects')"
						href="#Projects"
						class="menu-line-animation hover-scale-effect clickable cursor-pointer lg:cursor-none text-base lg:text-lg">
						Projects
					</a>
				</div>
				<div class="active:scale-95 transition-all duration-75">
					<a
						@click="ancreToSection($event, 'Contact me')"
						href="#Contact me"
						class="menu-line-animation hover-scale-effect clickable cursor-pointer lg:cursor-none text-base lg:text-lg">
						Contact me
					</a>
				</div>
			</div>
			<div class="flex justify-center gap-x-5 md:gap-x-10">
				<a
					href="tel:+330619258299"
					aria-label="Call Remy Canal"
					class="hover-scale-effect clickable cursor-pointer lg:cursor-none active:scale-90 transition-all duration-100">
					<div
						class="flex justify-center items-center group z-10 bg-blue-dark rounded-full border border-primary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-blue-dark w-15 h-15 lg:w-18 lg:h-18">
						<Icon
							name="i-uil:phone"
							ssr="true"
							mode="svg"
							style="color: var(--color-white)"
							class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
					</div>
				</a>

				<a
					href="mailto:hello@remycanal.me"
					aria-label="Email Remy Canal"
					class="hover-scale-effect clickable cursor-pointer lg:cursor-none active:scale-90 transition-all duration-100">
					<div
						class="flex justify-center items-center group z-10 bg-blue-dark rounded-full border border-primary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-blue-dark w-15 h-15 lg:w-18 lg:h-18">
						<Icon
							name="i-material-symbols:mail-outline-rounded"
							ssr="true"
							mode="svg"
							style="color: var(--color-white)"
							class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
					</div>
				</a>

				<a
					href="https://github.com/remycnl"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Visit Remy Canal's GitHub"
					class="hover-scale-effect clickable cursor-pointer lg:cursor-none active:scale-90 transition-all duration-100">
					<div
						class="flex justify-center items-center group z-10 bg-blue-dark rounded-full border border-primary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-blue-dark w-15 h-15 lg:w-18 lg:h-18">
						<Icon
							name="i-uil:github"
							ssr="true"
							mode="svg"
							style="color: var(--color-white)"
							class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
					</div>
				</a>

				<a
					href="https://www.linkedin.com/in/remy-canal"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Visit Remy Canal's LinkedIn"
					class="hover-scale-effect clickable cursor-pointer lg:cursor-none active:scale-90 transition-all duration-100">
					<div
						class="flex justify-center items-center group z-10 bg-blue-dark rounded-full border border-primary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-blue-dark w-15 h-15 lg:w-18 lg:h-18">
						<Icon
							name="i-uil:linkedin"
							ssr="true"
							mode="svg"
							style="color: var(--color-white)"
							class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
					</div>
				</a>
			</div>

			<div
				class="container-s lg:hidden flex text-start w-screen mt-1 md:-mt-5 -mb-9 overflow-hidden select-none">
				<div
					id="letters"
					class="tracking-wider font-mono s whitespace-nowrap inline-block text-xs text-gray-semi uppercase w-fit">
					<!-- Ici apparaîssent les <span> des crédits -->
				</div>
			</div>
		</div>
	</div>
</template>
