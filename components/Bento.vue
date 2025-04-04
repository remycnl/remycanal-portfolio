<script setup>
import { appearBento } from "@/plugins/gsap";

const isValueHover1 = ref(false);
const isValueHover2 = ref(false);
const isValueHover3 = ref(false);
const isValueHover4 = ref(false);

onMounted(() => {
	appearBento();
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
		class="flex flex-col gap-y-20 justify-center items-center w-full mt-20 lg:mt-32 2xl:mt-40 h-fit">
		<div class="bento opacity-0 grid gap-5 w-full h-full">
			<article
				id="experience-nbr"
				class="article group opacity-0 hover:saturate-200 relative overflow-hidden rounded-2xl shadow-around p-7 shadow-black-dark backdrop-blur-md bg-primary-transparent transition-filter-bgcolor duration-1000">
				<div
					class="flex flex-row items-center gap-x-7 2xl:gap-x-10 justify-between h-full w-full font-bold text-gray-light group-hover:text-white transition-colors duration-500">
					<p
						id="experience"
						class="pt-10 text-[10rem] lg:text-[8rem] 2xl:text-[15rem]">
						0
					</p>
					<div
						class="pt-24 lg:pt-20 2xl:pt-40 flex flex-col w-full h-full justify-center items-start text-[1.5rem] md:text-xl 2xl:text-3xl">
						<p>years of</p>
						<p>experience</p>
					</div>
				</div>
				<div
					class="absolute border-[1.25rem] border-black top-[-40%] right-[-40%] h-[80%] w-[80%] rounded-full bg-primary transition-colors duration-1000"></div>
			</article>
			<article
				class="article opacity-0 hover:saturate-200 rounded-2xl shadow-around shadow-black-dark backdrop-blur-md bg-primary transition-filter-bgcolor duration-1000">
				<div
					class="flex flex-col items-center justify-center h-full w-full p-5 font-bold text-blue-dark">
					<p
						class="text-[1.5rem] lg:text-[1.2rem] 2xl:text-[1.5rem]">
						Developer
					</p>
					<p
						class="font-['Share_Tech_Mono'] text-[3rem] lg:text-[2rem] 2xl:text-[3rem] leading-tight uppercase text-nowrap">
						&ldquo;Full-Stack&rdquo;
					</p>
				</div>
			</article>
			<article
				class="article opacity-0 hover:saturate-200 rounded-2xl shadow-around shadow-black-dark backdrop-blur-md bg-primary transition-filter-bgcolor duration-1000">
				<div
					class="flex flex-col items-center justify-center h-full w-full p-5 font-bold text-blue-dark">
					<p class="text-[1.5rem] 2xl:text-[2rem]">
						Student at
					</p>
					<p class="font-['Share_Tech_Mono'] text-[3rem] 2xl:text-[4rem] leading-tight uppercase">
						{Epitech}
					</p>
				</div>
			</article>
			<article
				id="projects-nbr"
				class="article group opacity-0 hover:saturate-200 rounded-2xl shadow-around shadow-black-dark backdrop-blur-md bg-primary-transparent transition-filter-bgcolor duration-1000">
				<div
					class="flex flex-col items-center justify-center h-full w-full px-7 pb-7 lg:p-7 font-bold text-gray-light group-hover:text-white transition-colors duration-500 text-3xl lg:text-xl 2xl:text-4xl">
					<div
						class="flex flex-col gap-y-1 items-start justify-center h-full w-full">
						<p>Contributed</p>
						<p>to</p>
					</div>
					<div
						class="flex flex-col justify-center w-full h-full items-end">
						<p
							id="projects-number"
							class="text-[6rem] lg:text-[5rem] 2xl:text-[8rem]">
							0
						</p>
						<p>websites</p>
					</div>
				</div>
			</article>
			<article
				class="article group opacity-0 relative pb-44 md:pb-0 group overflow-hidden hover:saturate-200 rounded-2xl shadow-around shadow-black-dark backdrop-blur-md bg-primary-transparent transition-filter-bgcolor duration-1000">
				<div
					class="w-full h-full gap-x-5 gap-y-16 flex flex-col md:flex-row justify-between items-center px-7 py-10 text-lg md:text-sm 2xl:text-lg text-primary transition-colors duration-1000">
					<div class="md:hidden w-full h-full flex justify-center items-center">
						<p
							class="font-bold text-sm text-center tracking-widest text-gray-light group-hover:text-white transition-colors duration-500">
							Some of my<span class="text-[4rem] leading-[4rem]">Values</span>
						</p>
					</div>
					<div
						class="w-full md:w-1/4 h-full flex flex-col gap-y-16 md:gap-y-20 justify-between items-center md:items-start text-start">
						<div
							class="hover-scale-effect clickable cursor-pointer flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
							<Transition name="fade-translate-up" mode="out-in">
								<div
									v-if="!isValueHover1"
									@click="isValueHover1 = !isValueHover1"
									class="flex flex-row gap-x-3 justify-start items-center"
									key="icon-text">
									<Icon
										name="i-game-icons:small-fire"
										ssr="true"
										mode="svg"
										style="color: var(--color-primary)"
										class="w-14 2xl:w-20 h-14 2xl:h-20" />
									<p class="font-bold uppercase">
										Simplicity <br class="md:hidden" />Sophistication
									</p>
								</div>
								<div
									v-else
									@click="isValueHover1 = !isValueHover1"
									class="flex justify-center">
									<p
										class="font-['Share_Tech_Mono'] text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full"
										key="description">
										For a smooth user's experience and clean codebase
									</p>
								</div>
							</Transition>
						</div>
						<div
							class="hover-scale-effect clickable cursor-pointer flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
							<Transition name="fade-translate-down" mode="out-in">
								<div
									v-if="!isValueHover2"
									@click="isValueHover2 = !isValueHover2"
									class="flex flex-row-reverse md:flex-row gap-x-3 justify-start items-center text-end md:text-start"
									key="icon-text">
									<Icon
										name="i-game-icons:rocket"
										ssr="true"
										mode="svg"
										style="color: var(--color-primary)"
										class="w-14 2xl:w-20 h-14 2xl:h-20" />
									<p class="font-bold uppercase">
										Innovative <br class="md:hidden" />Meticulous
									</p>
								</div>
								<div
									v-else
									@click="isValueHover2 = !isValueHover2"
									class="flex justify-center">
									<p
										class="font-['Share_Tech_Mono'] text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full"
										key="description">
										Engineered with creativity and attention to detail
									</p>
								</div>
							</Transition>
						</div>
					</div>
					<div class="hidden w-1/3 h-full md:flex justify-center items-start">
						<p
							class="font-bold text-sm 2xl:text-lg text-center tracking-widest text-gray-light group-hover:text-white transition-colors duration-500">
							Some of my<span
								class="text-[3rem] 2xl:text-[5rem] leading-[3rem] 2xl:leading-[5rem]"
								>Values</span
							>
						</p>
					</div>
					<div
						class="w-full md:w-1/4 h-full flex flex-col gap-y-16 md:gap-y-20 justify-between items-center md:items-end text-end">
						<div
							class="hover-scale-effect clickable cursor-pointer flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
							<Transition name="fade-translate-up" mode="out-in">
								<div
									class="flex flex-row-reverse md:flex-row gap-x-3 justify-end items-center text-start md:text-end"
									v-if="!isValueHover3"
									@click="isValueHover3 = !isValueHover3">
									<p class="font-bold uppercase">
										Autonomous <br class="md:hidden" />Listening
									</p>
									<Icon
										name="i-game-icons:suckered-tentacle"
										ssr="true"
										mode="svg"
										style="color: var(--color-primary)"
										class="w-14 2xl:w-20 h-14 2xl:h-20" />
								</div>
								<div
									v-else
									@click="isValueHover3 = !isValueHover3"
									class="flex justify-center">
									<p
										class="font-['Share_Tech_Mono'] text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full">
										Independently developed with a focus on user feedback
									</p>
								</div>
							</Transition>
						</div>
						<div
							class="hover-scale-effect clickable cursor-pointer flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
							<Transition name="fade-translate-down" mode="out-in">
								<div
									class="flex flex-row gap-x-3 justify-end items-center"
									v-if="!isValueHover4"
									@click="isValueHover4 = !isValueHover4">
									<p class="font-bold uppercase">
										Open-minded <br class="md:hidden" />Passionate
									</p>
									<Icon
										name="i-game-icons:techno-heart"
										ssr="true"
										mode="svg"
										style="color: var(--color-primary)"
										class="w-14 2xl:w-20 h-14 2xl:h-20" />
								</div>
								<div
									v-else
									@click="isValueHover4 = !isValueHover4"
									class="flex justify-center">
									<p
										class="font-['Share_Tech_Mono'] text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full">
										Crafted with an open heart and driven by passion
									</p>
								</div>
							</Transition>
						</div>
					</div>
				</div>
				<div
					style="
						bottom: calc(0px - 10rem);
						left: 50%;
						transform: translateX(-50%);
					"
					class="absolute h-[20rem] w-[17rem] 2xl:w-[30rem] rounded-full bg-primary transition-colors duration-1000 border-20 border-black"></div>
			</article>
		</div>
		<div id="wanna-work-with-me" class="opacity-0">
			<div
				class="scale-100 hover:scale-105 active:scale-95 transform transition-transform duration-75 lg:duration-500">
				<a
					@click="ancreToSection($event, 'Contact me')"
					href="#Contact me"
					class="clickable hover-scale-effect cursor-pointer lg:cursor-none">
					<h4
						class="menu-line-animation text-xl md:text-3xl lg:text-[2.4rem] lg:leading-[3rem] text-white hover:tracking-widest transition-all duration-500">
						Wanna work with me ?
					</h4>
				</a>
			</div>
		</div>
	</div>
</template>
