<script setup>
import { animationFooter } from "@/plugins/gsap";

const primaryColor = ref("purple");

onMounted(() => {
	if (typeof animationFooter === "function") {
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
</script>

<template>
	<div
		class="lg:rounded-b-[4rem] z-30 overflow-hidden shadow-around shadow-black bottom-0 text-white bg-black">
		<div class="bg-dot-primary hover:brightness-100">
			<div
				class="container mx-auto px-4 lg:px-0 pt-40 pb-10 lg:pb-32 flex flex-col items-center gap-y-20 md:gap-y-20 lg:gap-y-32 ">
				<img
					:src="`/img/logo-${primaryColor}.png`"
					alt="Rémy Canal"
					class="change-img-color hover:saturate-200 transition-all duration-500 w-40 lg:w-48 2xl:w-60 h-auto" />
				<div
					class="flex flex-col gap-y-3 justify-center text-center text-gray-light text-2xl md:text-3xl lg:text-4xl tracking-wide">
					<div class="active:scale-95 transition-all duration-75">
						<a
							href="#"
							class="menu-line-animation hover-scale-effect clickable cursor-none text-base lg:text-lg">
							About me
						</a>
					</div>
					<div class="active:scale-95 transition-all duration-75">
						<a
							href="#"
							class="menu-line-animation hover-scale-effect clickable cursor-none text-base lg:text-lg">
							Skills
						</a>
					</div>
					<div class="active:scale-95 transition-all duration-75">
						<a
							href="#"
							class="menu-line-animation hover-scale-effect active:scale-95 transition-all duration-75 clickable cursor-none text-base lg:text-lg">
							Timeline
						</a>
					</div>
					<div class="active:scale-95 transition-all duration-75">
						<a
							href="#"
							class="menu-line-animation hover-scale-effect clickable cursor-none text-base lg:text-lg">
							Projects
						</a>
					</div>
					<div class="active:scale-95 transition-all duration-75">
						<a
							href="#"
							class="menu-line-animation hover-scale-effect clickable cursor-none text-base lg:text-lg">
							Contact me
						</a>
					</div>
				</div>
				<div class="flex justify-center gap-x-5 md:gap-x-10">
					<a
						href="tel:+330619258299"
						class="hover-scale-effect clickable cursor-none active:scale-90 transition-all duration-100">
						<div
							class="flex justify-center items-center group z-10 bg-primary rounded-full border border-secondary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary w-[3.75rem] h-[3.75rem] lg:w-[4.5rem] lg:h-[4.5rem]">
							<Icon
								name="uil:phone"
								color="var(--white)"
								class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
						</div>
					</a>
					<a
						href="mailto:remy.canal@epitech.eu"
						class="hover-scale-effect clickable cursor-none active:scale-90 transition-all duration-100">
						<div
							class="flex justify-center items-center group z-10 bg-primary rounded-full border border-secondary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary w-[3.75rem] h-[3.75rem] lg:w-[4.5rem] lg:h-[4.5rem]">
							<Icon
								name="material-symbols:mail-outline-rounded"
								color="var(--white)"
								class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
						</div>
					</a>
					<a
						href="https://github.com/remycnl"
						target="_blank"
						rel="noopener noreferrer"
						class="hover-scale-effect clickable cursor-none active:scale-90 transition-all duration-100">
						<div
							class="flex justify-center items-center group z-10 bg-primary rounded-full border border-secondary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary w-[3.75rem] h-[3.75rem] lg:w-[4.5rem] lg:h-[4.5rem]">
							<Icon
								name="uil:github"
								color="var(--white)"
								class="w-6 h-6 lg:w-8 lg:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
						</div>
					</a>
					<a
						href="https://www.linkedin.com/in/remy-canal"
						target="_blank"
						rel="noopener noreferrer"
						class="hover-scale-effect clickable cursor-none active:scale-90 transition-all duration-100">
						<div
							class="flex justify-center items-center group z-10 bg-primary rounded-full border border-secondary hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary w-[3.75rem] h-[3.75rem] lg:w-[4.5rem] lg:h-[4.5rem]">
							<Icon
								name="uil:linkedin"
								color="var(--white)"
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
	</div>
</template>
