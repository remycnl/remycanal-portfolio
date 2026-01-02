<script setup>
const props = defineProps(["selectedColor"]);
const emit = defineEmits(["update-color"]);

const handleUpdateColor = (newColor) => {
	emit("update-color", newColor);
};
</script>

<template>
	<div
		id="About me"
		class="flex flex-col lg:flex-row justify-between items-center lg:items-start 2xl:items-center gap-y-10">
		<NuxtImg
			id="avatar"
			src="/img/avatar.png"
			preset="portfolioImage"
			title="Rémy Canal's avatar"
			alt="Rémy Canal's avatar"
			quality="80"
			class="opacity-0 icon-select-event gradient-img w-full md:w-2/3 lg:w-5/12 h-auto z-40" />
		<div
			class="flex flex-col justify-center text-center w-full lg:w-7/12 lg:text-start lg:gap-y-14 z-50">
			<h1
				class="-mt-25 md:-mt-30 lg:mt-0 flex flex-col lg:flex-row items-center md:tracking-widest lg:tracking-normal gap-x-5 gap-y-14 lg:gap-y-3 font-bold">
				<span
					class="text-color-saturate -ml-14 md:ml-0 text-[5.5rem] md:text-[6rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-22 md:leading-26 lg:leading-none 2xl:leading-[5.8rem]"
					><div
						class="text-shadow firstname-about-me opacity-0 md:mr-20 lg:mr-0">
						Rémy
					</div>
					<div
						class="text-shadow lastname-about-me opacity-0 ml-28 md:ml-20 lg:ml-16">
						Canal
					</div></span
				>
				<span
					class="text-color-saturate flex flex-row lg:flex-col gap-x-5 text-[2.2rem] md:text-[3rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-20 lg:leading-none 2xl:leading-[5.8rem]"
					><div class="web opacity-0 text-shadow">Web</div>
					<div class="developer opacity-0 lg:ml-16 text-shadow">
						Developer
					</div></span
				>
			</h1>
			<h3
				style="font-family: Share Tech Mono"
				class="about-me-paragraph opacity-0 text-white text-base md:text-lg 2xl:text-2xl mx-4 md:mx-0">
				I'm a student at Epitech and member of the Awwwards Young Jury, on my way to becoming a software engineer
				specialized in crafting outstanding and full digital experiences. Based
				in Lyon, France, I ensure responsive design, SEO optimization, and most
				importantly, prioritize user satisfaction above all else.
			</h3>
			<div
				class="flex flex-col-reverse gap-10 2xl:flex-row mt-10 mb-7 lg:mb-0 justify-center items-center lg:items-end 2xl:items-center lg:justify-between">
				<ToggleColorsButton
					:selectedColor="selectedColor"
					@update-color="handleUpdateColor" />
				<div id="download-cv" class="opacity-0">
					<a
						class="cssbutton transition-colors shadow-around shadow-black duration-1000 hover-scale-effect clickable mix-darken cursor-pointer lg:cursor-none text-white text-xl tracking-widest"
						href="/doc/remy-canal-cv.pdf"
						target="_blank"
						rel="noopener noreferrer">
						<span class="font-semibold text-[#FFFFFF]"> View CV </span>
						<div class="icon">
							<Icon
								name="i-gravity-ui:eyes-look-left"
								ssr="true"
								mode="svg"
								style="color: var(--color-primary)"
								class="w-8 h-8 transition-all duration-1000" />
						</div>
					</a>
				</div>
			</div>
		</div>
	</div>
</template>
