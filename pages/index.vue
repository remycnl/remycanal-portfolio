<template>
	<div class="hidden lg:block">
		<div class="flex justify-center">
			<button
				class="clickable mix-darken cursor-none active:scale-95 text-white flex items-center justify-center fixed z-[100] tracking-widest rounded-full overflow-hidden origin-center shadow-around hover:bg-secondary bg-black opacity-0 pointer-events-none back-to-top hover-scale-effect lg:ml-[140vh] 2xl:ml-[176vh] lg:mt-[70vh] transition-all duration-500">
				<svg class="svgIcon" viewBox="0 0 384 512">
					<path
						d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
				</svg>
			</button>
		</div>
	</div>
	<!-- ABOUT ME -->
	<div
		class="bg-gradient-to-b lg:rounded-t-[4rem] overflow-hidden shadow-around shadow-black from-black via-primary to-black">
		<div class="bg-dot-primary lg:mx-20 2xl:mx-0 hover:brightness-100">
			<div class="container mx-auto px-4 lg:px-0 pt-28 lg:pt-40 pb-48">
				<div
					class="flex flex-col lg:flex-row justify-between items-center gap-y-10">
					<NuxtImg
						id="avatar"
						src="/img/avatar.png"
						format="webp"
						alt="Rémy Canal"
						class="opacity-0 icon-select-event gradient-img w-5/6 md:w-1/2 lg:w-4/12 h-auto z-40" />
					<div
						class="flex flex-col justify-center text-center w-full lg:w-7/12 lg:text-start lg:gap-y-14 z-50">
						<h1
							class="-mt-36 md:-mt-40 lg:-mt-0 flex flex-col lg:flex-row items-center md:tracking-widest lg:tracking-normal gap-x-5 gap-y-14 lg:gap-y-3 font-bold">
							<span
								class="text-color-saturate -ml-14 md:-ml-0 text-[5.5rem] md:text-[6rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-[5.5rem] md:leading-[6.5rem] lg:leading-none 2xl:leading-[5.8rem]"
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
								class="text-color-saturate flex flex-row lg:flex-col gap-x-5 text-[2.2rem] md:text-[3rem] lg:text-[3.5rem] 2xl:text-[5rem] leading-[5rem] lg:leading-none 2xl:leading-[5.8rem]"
								><div class="web md:opacity-0 text-shadow">Web</div>
								<div class="developer md:opacity-0 lg:ml-16 text-shadow">
									Developer
								</div></span
							>
						</h1>
						<h4
							style="font-family: Share Tech Mono"
							class="about-me-paragraph md:opacity-0 text-white text-lg 2xl:text-2xl mx-4 md:mx-0">
							I'm a student at Epitech, on my way to becoming a software
							engineer specialized in crafting outstanding and full digital
							experiences. Based in Lyon, France, I ensure responsive design,
							SEO optimization, and most importantly, prioritize user
							satisfaction above all else.
						</h4>
						<div
							class="flex flex-col-reverse gap-10 2xl:flex-row mt-10 mb-7 lg:mb-0 justify-center items-center lg:items-end 2xl:items-center lg:justify-between">
							<div id="color-button" class="lg:opacity-0">
								<button
									@click="toggleColors"
									class="group circle-container relative hover-scale-effect clickable cursor-none w-fit lg:w-[50px] h-fit lg:h-[50px] items-center gap-x-4 py-4 mt-16 lg:mt-0 flex justify-center lg:justify-between px-5 text-white change-color-button rounded-full tracking-widest origin-center shadow-around hover:bg-secondary-dark bg-black transition-all duration-500">
									<div>
										<Icon
											name="material-symbols:format-color-fill-rounded"
											color="var(--white)"
											class="w-5 h-auto group-hover:lg:opacity-0 lg:-ml-1 mb-1 transition-all duration-300" />
									</div>
									<div
										class="absolute lg:pointer-events-none group-hover:lg:pointer-events-auto lg:relative cursor-none flex justify-center items-center gap-x-4">
										<label
											v-for="(color, index) in colorOptions"
											:key="index"
											class="absolute cursor-none lg:relative cyberpunk-checkbox-label pointer-events-none group-hover:lg:pointer-events-auto opacity-0 lg:group-hover:opacity-100 group-hover:delay-[0.1s] group-hover:lg:delay-[0.3s]">
											<input
												type="checkbox"
												class="cursor-none"
												:class="`color-${index + 1} cyberpunk-checkbox`"
												v-model="checkboxes[index]"
												@change="
													updateCheckbox(
														index,
														color.primary,
														color.secondary,
														color.transparent,
														color.family
													);
													updateFavicon(color.family);
												" />
										</label>
									</div>
								</button>
							</div>
							<div id="download-cv" class="md:opacity-0">
								<a
									href="/doc/Rémy Canal - curriculum vitae.pdf"
									target="_blank"
									download
									class="hover-scale-effect clickable mix-darken cursor-none button group w-fit flex items-center border-none relative py-3.5 pl-4 pr-16 p-1.5 text-white text-xl tracking-widest rounded-2xl bg-secondary">
									Download CV
									<Icon
										name="material-symbols:download-rounded"
										color="var(--primary-color)"
										class="absolute group-active:scale-95 p-1 flex items-center justify-center w-[2.2em] h-[2.2em] rounded-xl bg-white" />
								</a>
							</div>
						</div>
					</div>
				</div>

				<div
					class="flex flex-col gap-y-20 justify-center items-center w-full mt-20 lg:mt-32 2xl:mt-40 h-fit">
					<div class="bento grid gap-5 w-full h-full">
						<article
							id="experience-nbr"
							class="article hover:saturate-200 relative overflow-hidden rounded-[1rem] shadow-around p-7 shadow-black-dark backdrop-blur-md bg-secondary-transparent transition-filter-bgcolor duration-[1s]">
							<div
								class="flex flex-row items-center gap-x-7 2xl:gap-x-10 justify-between h-full w-full font-bold text-gray-light hover:text-white transition-colors duration-500">
								<p
									id="experience"
									class="font-[Orbitron] pt-10 text-[10rem] lg:text-[8rem] 2xl:text-[15rem]">
									0
								</p>
								<div
									class="pt-24 lg:pt-20 2xl:pt-40 flex flex-col w-full h-full justify-center items-start text-[1.5rem] md:text-xl 2xl:text-3xl">
									<p class="font-[Orbitron]">years of</p>
									<p class="font-[Orbitron]">experience</p>
								</div>
							</div>
							<div
								class="absolute border-[1.25rem] border-black top-[-40%] right-[-40%] h-[80%] w-[80%] rounded-full bg-secondary transition-colors duration-[1s]"></div>
						</article>
						<article
							class="article hover:saturate-200 rounded-[1rem] shadow-around shadow-black-dark backdrop-blur-md bg-secondary transition-filter-bgcolor duration-[1s]">
							<div
								class="flex flex-col items-center justify-center h-full w-full p-5 font-bold text-primary">
								<p
									class="text-[1.5rem] lg:text-[1.2rem] 2xl:text-[1.5rem] font-[Orbitron]">
									Developer
								</p>
								<p
									class="text-[3rem] lg:text-[2rem] 2xl:text-[3rem] leading-tight uppercase text-nowrap">
									&ldquo;Full-Stack&rdquo;
								</p>
							</div>
						</article>
						<article
							class="article hover:saturate-200 rounded-[1rem] shadow-around shadow-black-dark backdrop-blur-md bg-secondary transition-filter-bgcolor duration-[1s]">
							<div
								class="flex flex-col items-center justify-center h-full w-full p-5 font-bold text-primary">
								<p class="text-[1.5rem] 2xl:text-[2rem] font-[Orbitron]">
									Student at
								</p>
								<p class="text-[3rem] 2xl:text-[4rem] leading-tight uppercase">
									{Epitech}
								</p>
							</div>
						</article>
						<article
							id="projects-nbr"
							class="article hover:saturate-200 rounded-[1rem] shadow-around shadow-black-dark backdrop-blur-md bg-secondary-transparent transition-filter-bgcolor duration-[1s]">
							<div
								class="flex flex-col items-center justify-center h-full w-full px-7 lg:p-7 font-bold text-gray-light hover:text-white transition-colors duration-500 text-3xl lg:text-xl 2xl:text-4xl">
								<div
									class="flex flex-col gap-y-1 items-start justify-center h-full w-full">
									<p class="font-[Orbitron]">Contributed</p>
									<p class="font-[Orbitron]">to</p>
								</div>
								<div
									class="flex flex-col justify-center gap-y-8 lg:gap-y-7 2xl:gap-y-10 w-full h-full items-end">
									<p
										id="projects-number"
										class="text-[6rem] lg:text-[5rem] 2xl:text-[8rem] font-[Orbitron]">
										0
									</p>
									<p class="font-[Orbitron]">websites</p>
								</div>
							</div>
						</article>
						<article
							class="article relative pb-44 md:pb-0 group overflow-hidden hover:saturate-200 rounded-[1rem] shadow-around shadow-black-dark backdrop-blur-md bg-secondary-transparent transition-filter-bgcolor duration-[1s]">
							<div
								class="w-full h-full gap-x-5 gap-y-16 flex flex-col md:flex-row justify-between items-center px-7 py-10 text-lg md:text-sm 2xl:text-lg text-secondary transition-colors duration-[1s]">
								<div
									class="md:hidden w-full h-full flex justify-center items-center">
									<p
										class="font-[Orbitron] font-bold text-sm text-center tracking-widest text-gray-light hover:text-white transition-colors duration-500">
										Some of my<span class="text-[4rem] leading-[4rem]"
											>Values</span
										>
									</p>
								</div>
								<div
									class="w-full md:w-1/4 h-full flex flex-col gap-y-16 md:gap-y-20 justify-between items-center md:items-start text-start">
									<div
										class="hover-scale-effect clickable flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
										<transition name="fade-translate-up" mode="out-in">
											<div
												v-if="!isValueHover1"
												@click="isValueHover1 = true"
												class="flex flex-row gap-x-3 justify-start items-center"
												key="icon-text">
												<Icon
													name="game-icons:small-fire"
													color="var(--primary-color)"
													class="w-14 2xl:w-20 h-auto transition-colors duration-[1s]" />
												<p class="font-[Orbitron] font-bold uppercase">
													Simplicity <br class="md:hidden" />Sophistication
												</p>
											</div>
											<p
												v-else
												@click="isValueHover1 = false"
												class="text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full"
												key="description">
												For a smooth user's experience and clean codebase
											</p>
										</transition>
									</div>
									<div
										class="hover-scale-effect clickable flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
										<transition name="fade-translate-down" mode="out-in">
											<div
												v-if="!isValueHover2"
												@click="isValueHover2 = true"
												class="flex flex-row-reverse md:flex-row gap-x-3 justify-start items-center text-end md:text-start"
												key="icon-text">
												<Icon
													name="game-icons:rocket"
													color="var(--primary-color)"
													class="w-14 2xl:w-20 h-auto transition-colors duration-[1s]" />
												<p class="font-[Orbitron] font-bold uppercase">
													Innovative <br class="md:hidden" />Meticulous
												</p>
											</div>
											<p
												v-else
												@click="isValueHover2 = false"
												class="text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full"
												key="description">
												Engineered with creativity and attention to detail
											</p>
										</transition>
									</div>
								</div>
								<div
									class="hidden w-1/3 h-full md:flex justify-center items-start">
									<p
										class="font-[Orbitron] font-bold text-sm 2xl:text-lg text-center tracking-widest text-gray-light hover:text-white transition-colors duration-500">
										Some of my<span
											class="text-[3rem] 2xl:text-[5rem] leading-[3rem] 2xl:leading-[5rem]"
											>Values</span
										>
									</p>
								</div>
								<div
									class="w-full md:w-1/4 h-full flex flex-col gap-y-16 md:gap-y-20 justify-between items-center md:items-end text-end">
									<div
										class="hover-scale-effect clickable flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
										<transition name="fade-translate-up" mode="out-in">
											<div
												class="flex flex-row-reverse md:flex-row gap-x-3 justify-end items-center text-start md:text-end"
												v-if="!isValueHover3"
												@click="isValueHover3 = true">
												<p class="font-[Orbitron] font-bold uppercase">
													Autonomous <br class="md:hidden" />Listening
												</p>
												<Icon
													name="game-icons:suckered-tentacle"
													color="var(--primary-color)"
													class="w-14 2xl:w-20 h-auto transition-colors duration-[1s]" />
											</div>
											<p
												v-else
												@click="isValueHover3 = false"
												class="text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full">
												Independently developed with a focus on user feedback
											</p>
										</transition>
									</div>
									<div
										class="hover-scale-effect clickable flex flex-col items-center h-[3.5rem] md:h-auto gap-y-3">
										<transition name="fade-translate-down" mode="out-in">
											<div
												class="flex flex-row gap-x-3 justify-end items-center"
												v-if="!isValueHover4"
												@click="isValueHover4 = true">
												<p class="font-[Orbitron] font-bold uppercase">
													Open-minded <br class="md:hidden" />Passionate
												</p>
												<Icon
													name="game-icons:techno-heart"
													color="var(--primary-color)"
													class="w-14 2xl:w-20 h-auto transition-colors duration-[1s]" />
											</div>
											<p
												v-else
												@click="isValueHover4 = false"
												class="text-center text-gray-light hover:text-white transition-colors duration-500 w-3/4 md:w-full">
												Crafted with an open heart and driven by passion
											</p>
										</transition>
									</div>
								</div>
							</div>
							<div
								style="
									bottom: calc(0px - 10rem);
									left: 50%;
									transform: translateX(-50%);
								"
								class="absolute h-[20rem] w-[17rem] 2xl:w-[30rem] rounded-full bg-secondary transition-colors duration-[1s] border-[1.25rem] border-black"></div>
						</article>
					</div>
					<div id="wanna-work-with-me">
						<div
							class="scale-100 hover:scale-105 active:scale-95 transform transition-transform duration-75 lg:duration-500">
							<a href="#" class="clickable hover-scale-effect cursor-none">
								<h3
									class="menu-line-animation text-xl md:text-3xl lg:text-[2.4rem] lg:leading-[3rem] text-white hover:tracking-widest transition-all duration-500">
									Wanna work with me ?
								</h3>
							</a>
						</div>
					</div>
				</div>
				<!-- <div
					class="flex flex-wrap lg:flex-row justify-center md:justify-evenly lg:justify-between 2xl:justify-center gap-7 mt-20 lg:mt-26 -mb-20">
					<ValueCard
						text1="Simplicity"
						text2="Sophistication"
						subText="For a smooth user's experience and clean codebase"
						pathIcon="/img/rocket.png" />
					<ValueCard
						text1="Innovative"
						text2="Meticulous"
						subText="Engineered with creativity and attention to detail"
						pathIcon="/img/brackets.png" />
					<ValueCard
						text1="Autonomous"
						text2="Listening"
						subText="Independently developed with a focus on user feedback"
						pathIcon="/img/handshake.png" />
					<ValueCard
						text1="Open-minded"
						text2="Passionate"
						subText="Crafted with an open heart and driven by passion"
						pathIcon="/img/Statue-Of-Liberty.png" />
				</div> -->
			</div>
			<div class="container mx-auto px-4 lg:mt-56 lg:px-0">
				<!-- SKILLS -->
				<h2
					id="skills"
					class="text-color-saturate text-[3rem] md:text-[4rem] uppercase w-fit">
					Skills
				</h2>
				<h3
					style="font-family: Share Tech Mono"
					class="mt-5 lg:mt-10 text-gray-light text-lg md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
					From front-end frameworks to back-end systems, I have honed my skills
					in a wide range of technologies, enabling me to build efficient and
					scalable web applications. Below is a curated list of tools and
					technologies that are part of my developer toolkit.
				</h3>
				<div
					class="flex flex-col lg:flex-row lg:justify-evenly lg:pt-28 2xl:pt-40 items-center lg:items-start gap-40 lg:gap-x-20 2xl:gap-x-60 gap-y-20 my-20">
					<div
						id="skill-card"
						class="bg-gray-dark h-[24rem] md:h-[27rem] lg:h-[30rem] 2xl:h-[27rem] w-11/12 md:w-4/6 lg:w-3/6 2xl:w-2/5 shadow-around border-[1px] text-center border-secondary rounded-3xl flex flex-row justify-between">
						<div
							class="flex justify-center rounded-tl-[1.35rem] rounded-br-[1.35rem] bg-secondary w-[12%] md:w-[9%] h-fit">
							<div
								:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
								@transitionend="finishUpdate"
								class="flex flex-col my-10 transition-opacity duration-300">
								<div
									v-for="star in currentSkill.stars"
									:key="'filled-' + star"
									class="star star-card">
									<Icon
										name="teenyicons:star-small-solid"
										class="w-auto h-8 md:h-9"
										color="#1f293b" />
								</div>
								<div
									v-for="star in 5 - currentSkill.stars"
									:key="'empty-' + star"
									class="star star-card">
									<Icon
										name="teenyicons:star-small-outline"
										class="w-auto h-8 md:h-9"
										color="#1f293b" />
								</div>
							</div>
						</div>
						<div
							:class="{ 'opacity-0': isUpdating, 'opacity-100': !isUpdating }"
							@transitionend="finishUpdate"
							class="flex flex-col items-center w-[88%] h-full py-4 px-8 transition-opacity duration-300">
							<NuxtImg
								v-if="currentSkill.withPath"
								:src="currentSkill.pathIcon"
								:alt="currentSkill.text"
								:class="{
									'icon-select-event': true,
									'w-auto': true,
									'h-16': !currentSkill.isGif,
									'md:h-24': !currentSkill.isGif,
									'h-24': currentSkill.isGif,
									'md:h-36': currentSkill.isGif,
								}"
								class="my-10" />
							<div v-else class="w-auto h-16 md:h-24 my-10">
								<Icon
									:name="currentSkill.icon || ''"
									class="w-full h-full"
									size="16rem"
									color="var(--white)" />
							</div>
							<div class="text-color-saturate">
								<h3
									v-if="currentSkill.text !== 'but still human...'"
									class="pb-5 text-3xl lg:text-[2rem] font-bold">
									{{ currentSkill.text }}
								</h3>
								<p class="pb-10 text-sm md:text-lg font-bold w-full">
									{{ currentSkill.description }}
								</p>
							</div>
						</div>
					</div>
					<div
						id="container-skills"
						class="relative flex lg:grid lg:w-4/5 2xl:w-3/5 flex-wrap grid-cols-4 justify-center items-start pt-28 md:pt-60 lg:pt-0 gap-10 gap-y-7 md:gap-x-20 md:gap-y-12">
						<NuxtImg
							:src="`/img/details-skills-${selectedColor}.png`"
							format="webp"
							alt="Click on bubbles to see details (mobile)"
							class="hover:saturate-200 transition-all duration-500 absolute scale-50 2xl:scale-[.4] top-[-8rem] md:top-[-15rem] lg:top-[-21rem] 2xl:top-[-30.5rem] right-[30%] md:right-[10%] lg:right-[40%] z-10" />
						<NuxtImg
							:src="`/img/stars-info-${selectedColor}.png`"
							format="webp"
							alt="Stars = Proficiency level"
							class="hover:saturate-200 transition-all duration-500 absolute scale-50 2xl:scale-[.4] top-[-8rem] md:top-[-15rem] lg:top-[-22rem] 2xl:top-[-30.5rem] left-[30%] md:left-[30%] lg:left-[30%] z-10" />
						<BubbleIcon
							v-for="(skill, index) in skills"
							class="rounded-full lg:scale-90 2xl:scale-100"
							:key="index"
							:index="index"
							:text="skill.text"
							:color="skill.color"
							:iconColor="skill.iconColor"
							:icon="skill.icon"
							:stars="skill.stars"
							:withPath="skill.withPath"
							:pathIcon="skill.pathIcon"
							:isGif="skill.isGif"
							@click="fillCardSkills(index), animStarsRotation()" />
					</div>
				</div>
				<Timeline :data="timelineData" />
				<!-- PROJECTS -->
				<div
					class="relative overflow-visible projects-container my-60 lg:my-96">
					<h2
						id="projects"
						class="text-color-saturate text-[3rem] md:text-[4rem] uppercase w-fit">
						Projects
					</h2>
					<h3
						style="font-family: Share Tech Mono"
						class="mt-5 lg:mt-10 text-gray-light text-lg md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
						Throughout my journey as a developer, I've worked on a variety of
						projects that demonstrate my technical skills and problem-solving
						abilities. Below is a selection of projects that showcase my
						expertise in modern development practices, design patterns, and
						coding efficiency.
					</h3>
					<!-- Mobile -->
					<div class="lg:hidden relative mt-10">
						<Icon
							name="game-icons:wind-slap"
							color="var(--secondary-color)"
							class="absolute top-0 left-[-15%] w-[50rem] opacity-30 h-auto transition-all duration-300" />
						<div v-for="project in projects" :key="project.slug">
							<div
								class="cards-project-mobile group flex mt-10 flex-col items-center bg-gray-dark text-secondary border border-secondary shadow-around shadow-black-dark w-full h-[35rem] rounded-[1.5rem]">
								<div
									class="w-[90%] h-[3rem] mt-5 flex flex-row justify-between items-center">
									<p
										class="font-[Orbitron] text-secondary font-bold tracking-widest text-sm">
										{{ project.date }}
									</p>
									<p
										class="font-[Orbitron] text-secondary font-bold tracking-widest text-sm">
										{{ project.title }}
									</p>
								</div>
								<div
									class="relative my-5 rounded-[1.5rem] w-[90%] h-[20rem] overflow-hidden">
									<img
										:src="project.img"
										:alt="`Mockup - ${project.img}`"
										class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
								</div>
								<p class="text-gray-light w-[86%]">
									{{ project.description }}
								</p>
								<div class="flex flex-wrap w-[86%] gap-3 my-5">
									<span
										v-for="(tech, index) in project.technos"
										:key="tech"
										:style="{ transitionDelay: `${index * 100}ms` }"
										class="bg-secondary-transparent font-bold tracking-widest text-secondary py-1.5 px-2 rounded-full text-xs">
										{{ tech }}
									</span>
								</div>
								<div
									class="flex flex-row justify-end items-center w-[90%] mt-4 mb-7">
									<NuxtLink
										:to="project.link"
										target="_blank"
										class="focus:scale-90 transition-transform duration-75 flex rounded-xl text-white bg-secondary p-3 flex-row gap-2 items-center">
										Visit {{ project.type }}
										<Icon
											name="formkit:linkexternal"
											color="var(--white)"
											class="w-5 h-auto" />
									</NuxtLink>
								</div>
							</div>
						</div>
					</div>
					<!-- Desktop -->
					<div
						class="hidden lg:flex relative overflow-visible mt-40 justify-between gap-x-20 2xl:gap-x-28 items-start">
						<Icon
							name="game-icons:wind-slap"
							color="var(--secondary-color)"
							class="absolute top-0 left-[-15%] 2xl:left-[-40%] w-[50rem] 2xl:w-[70rem] opacity-30 h-auto transition-all duration-300" />
						<div
							class="relative overflow-visible container-project opacity-0 bg-gray-dark text-secondary border border-secondary shadow-around shadow-black-dark w-1/2 h-[35rem] rounded-[1.5rem]">
							<Transition name="fade">
								<div
									v-show="hoveredProject"
									class="flex flex-col items-center w-full h-full">
									<div
										class="w-[90%] h-[3rem] mt-5 flex flex-row justify-between items-center">
										<ScrambleText
											v-show="hoveredProject"
											:text="
												projects.find(
													(project) => project.slug === hoveredProject
												)?.date
											"
											:frames="20" />
										<ScrambleText
											v-show="hoveredProject"
											:text="
												projects.find(
													(project) => project.slug === hoveredProject
												)?.title
											"
											:frames="20" />
									</div>
									<div
										class="relative image-animation-container my-5 rounded-[1.5rem] w-[90%] h-[20rem] border-2 border-gray-semi overflow-hidden"></div>
									<div
										class="flex flex-wrap w-[90%] gap-3 my-5"
										v-show="hoveredProject">
										<TransitionGroup name="tag">
											<span
												v-for="(tech, index) in projects.find(
													(project) => project.slug === hoveredProject
												)?.technos"
												:key="tech"
												:style="{ transitionDelay: `${index * 100}ms` }"
												class="bg-secondary-transparent font-bold tracking-widest text-secondary py-1 px-3 rounded-full text-sm">
												{{ tech }}
											</span>
										</TransitionGroup>
									</div>
								</div>
							</Transition>
						</div>
						<div
							@mouseenter="showProject()"
							@mouseleave="hideProject()"
							class="relative projects-link flex flex-col w-1/2 h-fit">
							<NuxtLink
								:to="project.link"
								target="_blank"
								v-for="(project, index) in projects"
								:key="index"
								@mouseenter="showImage(project.img), startHover(project.slug)"
								@mouseleave="hideImages(), stopHover()"
								class="group relative z-30 link-type flex flex-col justify-between items-start w-full h-[4.55rem] hover:h-[6.55rem] transition-all duration-300">
								<img
									:src="project.logo"
									:alt="`Logo - ${project.logo}`"
									class="absolute top-4 right-[-10%] hover-scale-effect clickable cursor-none scale-50 group-hover:scale-100 opacity-0 group-hover:opacity-10 w-auto h-60 transition-all duration-[0.8s]" />
								<div
									class="text-secondary group hover-scale-effect clickable cursor-none w-full h-full flex flex-col justify-between items-start">
									<div
										class="w-full h-full flex flex-row justify-between items-center">
										<div
											class="flex flex-row gap-x-4 items-center justify-start">
											<h4
												class="text-gray-light text-nowrap text-[1.5rem] leading-[2rem] tracking-wider font-bold group-hover:text-secondary group-hover:tracking-widest origin-center transform transition-all duration-500 py-5">
												{{ project.title }}
											</h4>
											<Icon
												name="formkit:linkexternal"
												color="var(--primary-color)"
												class="link-type-hover w-6 h-auto mb-1 transition-all duration-300" />
										</div>
										<h5
											class="relative leading-[2rem] text-gray-light opacity-55">
											{{ project.type }}
										</h5>
									</div>
									<Transition name="fade-letter-by-letter" mode="out-in">
										<p
											v-if="isSomethingHover && hoveredProject === project.slug"
											class="text-gray-light -mt-3 pb-5">
											<LetterByLetter :text="project.description" />
										</p>
									</Transition>
								</div>
								<hr
									v-if="!project.last"
									class="w-full border-1 cursor-none border-gray-semi" />
							</NuxtLink>
						</div>
					</div>
				</div>
				<!-- Contact Form -->
				<ContactForm />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	animationCheckboxColor,
	customCursor,
	showImage,
	hideImages,
	animationStarsCardSkill,
	showProject,
	hideProject,
	stickyProject,
	apparitionMobileProjectCards,
	appearBento,
	appearStart,
	stickySkills,
} from "@/plugins/gsap";

import { mouseEffect } from "@/plugins/global.js";

const isValueHover1 = ref(false);
const isValueHover2 = ref(false);
const isValueHover3 = ref(false);
const isValueHover4 = ref(false);

interface Project {
	slug: string;
	title: string;
	description: string;
	link: string;
	img: string;
	logo: string;
	type: string;
	last?: boolean;
	date: string;
	technos?: string[];
}

const projects: Project[] = [
	{
		slug: "portfolio",
		title: "Portfolio of Rémy Canal",
		description: "Creation 'from scratch' of my portfolio.",
		link: "https://example.com/project1",
		img: "/img/mockup-portfolio-remycanal.png",
		logo: "/img/logo-blue.png",
		type: "website",
		date: "2024",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
			"Vercel",
		],
	},
	{
		slug: "sharewood",
		title: "Sharewood",
		description: "Redesign of the entire front part of the Sharewood website.",
		link: "https://sharewood.team/",
		img: "/img/mockup-sharewood.png",
		logo: "/img/logo-sharewood.png",
		type: "website",
		date: "2023",
		technos: ["Wordpress", "Elementor", "Sass", "HTML", "CSS", "JavaScript"],
	},
	{
		slug: "ecofid",
		title: "Éco-fidélité",
		description:
			"Creation of an entire website for Letmotiv’s Éco-fidélité® solution.",
		link: "https://www.eco-fidelite.com/",
		img: "/img/mockup-ecofid.png",
		logo: "/img/logo-ecofid.png",
		type: "website",
		date: "2023",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
		],
	},
	{
		slug: "odl",
		title: "Office des Lumières",
		description: "Creation and animation of a website for a notary firm.",
		link: "https://officedeslumieres.com/",
		img: "/img/mockup-odl.png",
		logo: "/img/logo-odl.png",
		type: "website",
		date: "2023",
		technos: [
			"Vue.js",
			"Nuxt.js",
			"HTML",
			"CSS",
			"JavaScript",
			"GSAP",
			"TailwindCSS",
		],
	},
	{
		slug: "lappart",
		title: "L'Appart Fitness",
		description:
			"Participation in the full redesign of the L'Appart Fitness website.",
		link: "https://www.lappartfitness.com/",
		img: "/img/mockup-lappart.png",
		logo: "/img/logo-lappart.png",
		type: "website",
		last: true,
		date: "2023",
		technos: [
			"Wordpress",
			"Elementor",
			"HTML",
			"CSS",
			"JavaScript",
			"TailwindCSS",
		],
	},
];

const isSomethingHover = ref(false);
const hoveredProject = ref<string | null>(null);

const startHover = (projectSlug: string) => {
	isSomethingHover.value = true;
	hoveredProject.value = projectSlug;
};

const stopHover = () => {
	isSomethingHover.value = false;
	hoveredProject.value = null;
};

interface Skill {
	text: string;
	color: string;
	iconColor?: string;
	icon?: string;
	withPath?: boolean;
	pathIcon?: string;
	isGif?: boolean;
	stars: number;
	description: string;
}

const skills: Skill[] = [
	{
		text: "HTML",
		color: "#f1662a",
		icon: "vscode-icons:file-type-html",
		stars: 4,
		description:
			"Proficiency in HTML for structuring and organizing web content in a semantic way.",
	},
	{
		text: "JavaScript",
		color: "#f0db4f",
		icon: "skill-icons:javascript",
		stars: 4,
		description:
			"Advanced skills in JavaScript for frontend and backend development, DOM manipulation, and creating dynamic interactions.",
	},
	{
		text: "CSS",
		color: "#248cc8",
		icon: "vscode-icons:file-type-css",
		stars: 4,
		description:
			"Expertise in CSS for designing and styling user interfaces, using Flexbox, Grid, and advanced layout techniques.",
	},
	{
		text: "Tailwind",
		color: "#45bbbd",
		icon: "logos:tailwindcss-icon",
		stars: 5,
		description:
			"Extensive experience with Tailwind CSS for rapid and efficient development, using utility-first classes to style components.",
	},
	{
		text: "Sass",
		color: "#cd6799",
		icon: "logos:sass",
		stars: 3,
		description:
			"Advanced use of Sass for creating modular, reusable, and maintainable CSS stylesheets, with features like variables, mixins, and imports.",
	},
	{
		text: "Nuxt",
		color: "#67dd82",
		icon: "logos:nuxt-icon",
		stars: 4,
		description:
			"In-depth knowledge of Nuxt.js for building universal Vue.js applications, with routing, server-side rendering (SSR), and static site generation.",
	},
	{
		text: "Vue",
		color: "#51b883",
		icon: "logos:vue",
		stars: 4,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "Next",
		color: "#000000",
		icon: "logos:nextjs-icon",
		stars: 3,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "React",
		color: "#00D8FF",
		icon: "skill-icons:react-dark",
		stars: 3,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "React Native",
		color: "#F4F2ED",
		icon: "skill-icons:react-light",
		stars: 2,
		description:
			"Proficiency in Vue.js for building interactive and reactive user interfaces, with components, directives, and efficient state management.",
	},
	{
		text: "Laravel",
		color: "#f24423",
		icon: "logos:laravel",
		stars: 3,
		description:
			"Skills in Laravel for rapid development of robust PHP web applications, with MVC architecture, database migrations, and RESTful APIs.",
	},
	{
		text: "WordPress",
		color: "#D0D4DB",
		iconColor: "#D0D4DB",
		icon: "fa6-brands:wordpress",
		stars: 3,
		description:
			"Experience with WordPress for creating dynamic websites and blogs, with custom themes, plugins, and effective content management.",
	},
	{
		text: "Elementor",
		color: "#932c3c",
		withPath: true,
		pathIcon: "/img/elementor.svg",
		stars: 3,
		description:
			"Advanced use of Elementor for designing highly customizable WordPress pages, with drag-and-drop tools and visual configuration.",
	},
	{
		text: "Swiper",
		color: "#0a7efa",
		withPath: true,
		pathIcon: "/img/swiper.svg",
		stars: 4,
		description:
			"Implementation of Swiper.js for interactive image carousels and galleries, with advanced customization options and multi-touch support.",
	},
	{
		text: "Strapi",
		color: "#556afa",
		icon: "logos:strapi-icon",
		stars: 4,
		description:
			"Development of headless CMS applications with Strapi, creating RESTful and GraphQL APIs for managing and distributing digital content.",
	},
	{
		text: "PHP",
		color: "#6181B6",
		icon: "logos:php",
		stars: 2,
		description:
			"Skills in PHP for backend development, data manipulation, and integration with relational databases.",
	},
	{
		text: "Python",
		color: "#FFD141",
		icon: "logos:python",
		stars: 3,
		description:
			"Use of Python for web application development, task automation, and data analysis, with frameworks like Django and Flask.",
	},
	{
		text: "GitHub",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/github.png",
		stars: 3,
		description:
			"Advanced use of GitHub for version control, collaboration on open-source projects, and continuous deployment.",
	},
	{
		text: "GSAP",
		color: "#14D74B",
		withPath: true,
		pathIcon: "/img/gsap.png",
		stars: 4,
		description:
			"Proficiency in GreenSock Animation Platform (GSAP) for creating fluid and interactive animations in web applications.",
	},
	{
		text: "C",
		color: "#273393",
		withPath: true,
		pathIcon: "/img/c.png",
		stars: 4,
		description:
			"Programming skills in C for system development, low-level programming, and creating robust and performant applications.",
	},
	{
		text: "Canva",
		color: "#00C4CC",
		withPath: true,
		pathIcon: "/img/canva.png",
		stars: 3,
		description:
			"Use of Canva for creating professional graphic designs, including illustrations, infographics, and visual presentations.",
	},
	{
		text: "ChatGPT",
		color: "#FFFFFF",
		withPath: true,
		pathIcon: "/img/chatgpt.png",
		stars: 5,
		description:
			"Experience with ChatGPT for integrating conversational artificial intelligence into web applications, enhancing user engagement and automating responses.",
	},
	{
		text: "but still human...",
		color: "#FEC47C",
		withPath: true,
		isGif: true,
		pathIcon: "/img/wolf.gif",
		stars: 5,
		description:
			"In addition to the mentioned technologies, adaptability and quick learning of new technologies and tools to meet specific project requirements.",
	},
];

const currentSkill = ref<Skill>(skills[skills.length - 1]);
const isUpdating = ref(false);
const lastSkillIndex = ref<number | null>(null);

const fillCardSkills = (index: number) => {
	isUpdating.value = true;
	setTimeout(() => {
		if (lastSkillIndex.value !== null && lastSkillIndex.value === index) {
			currentSkill.value = skills[skills.length - 1];
			lastSkillIndex.value = null;
		} else {
			currentSkill.value = skills[index];
			lastSkillIndex.value = index;
		}
		isUpdating.value = false;
	}, 300); // Durée de la transition d'opacité
};

const animStarsRotation = () => {
	setTimeout(() => {
		animationStarsCardSkill();
	}, 300); // Durée de la transition d'opacité
};

const finishUpdate = () => {
	if (isUpdating.value) {
		isUpdating.value = false;
	}
};

const applyEffects = () => {
	customCursor();
	mouseEffect();
};

const route = useRoute();

watch(route, () => {
	applyEffects();
});

onMounted(() => {
	updateFavicon("purple");
	appearStart();
	applyEffects();
	stickyProject();
	stickySkills();
	apparitionMobileProjectCards();
	appearBento();

	const backToTopButton = document.querySelector(".back-to-top");
	if (backToTopButton) {
		backToTopButton.addEventListener("click", function () {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		});
	}

	window.addEventListener("scroll", function () {
		const button = document.querySelector(".back-to-top") as HTMLElement;
		if (button && window.innerWidth >= 1024) {
			if (window.scrollY > 100) {
				button.classList.add("pointer-events-auto");
				button.classList.remove("opacity-0");
				button.classList.add("opacity-100");
			} else {
				button.classList.remove("opacity-100");
				button.classList.add("opacity-0");
				button.classList.remove("pointer-events-auto");
			}
		}
	});
});

interface ColorOption {
	primary: string;
	secondary: string;
	transparent: string;
	family: string;
}

const checkboxes = ref<boolean[]>([
	true,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
]);

const colorOptions = ref<ColorOption[]>([
	{
		primary: "#6C34CC",
		secondary: "#301563",
		transparent: "#6C34CC4F",
		family: "purple",
	},
	{
		primary: "#DD314E",
		secondary: "#6A1625",
		transparent: "#DD314E4F",
		family: "red",
	},
	{
		primary: "#FF3FAF",
		secondary: "#5D0C34",
		transparent: "#FF3FAF4F",
		family: "pink",
	},
	{
		primary: "#DD5F31",
		secondary: "#742F17",
		transparent: "#DD5F314F",
		family: "orange",
	},
	{
		primary: "#E9C925",
		secondary: "#7D6B10",
		transparent: "#E9C9254F",
		family: "yellow",
	},
	{
		primary: "#67D13D",
		secondary: "#2C5F14",
		transparent: "#67D13D4F",
		family: "green",
	},
	{
		primary: "#31BEDD",
		secondary: "#147C8C",
		transparent: "#31BEDD4F",
		family: "cyan",
	},
	{
		primary: "#32A1DA",
		secondary: "#0A3890",
		transparent: "#32A1DA4F",
		family: "blue",
	},
	{
		primary: "#868686",
		secondary: "#424242",
		transparent: "#8686864F",
		family: "gray",
	},
]);

const selectedColor = ref<string>(colorOptions.value[0].family);

const updateCheckbox = (
	index: number,
	primaryColor: string,
	secondaryColor: string,
	primaryColorTransparent: string,
	selectedFamily: string
) => {
	checkboxes.value = checkboxes.value.map(
		(_unused: unknown, i: number) => i === index
	);
	document.documentElement.style.setProperty("--primary-color", primaryColor);
	document.documentElement.style.setProperty(
		"--secondary-color",
		secondaryColor
	);
	document.documentElement.style.setProperty(
		"--primary-color-transparent",
		primaryColorTransparent
	);
	selectedColor.value = selectedFamily;

	const families: string[] = colorOptions.value.map(
		(color: ColorOption) => color.family
	);

	const elements = document.querySelectorAll(".change-img-color");
	elements.forEach((element) => {
		families.forEach((family: string) => {
			element.classList.remove(family);
		});
		element.classList.add(selectedFamily);
	});
};

let isOpenColorMenu = ref(false);

const toggleColors = () => {
	if (window.innerWidth < 1024) {
		// setTimeout for bug SM format
		setTimeout(() => {
			isOpenColorMenu.value = !isOpenColorMenu.value;
			animationCheckboxColor(isOpenColorMenu.value);
		}, 200);

		const button = document.querySelector(
			".change-color-button"
		) as HTMLElement;
		const checkboxs = document.querySelectorAll(".cyberpunk-checkbox-label");
		button.classList.toggle("bg-black");
		button.classList.toggle("bg-primary");
		checkboxs.forEach((checkbox) => {
			checkbox.classList.toggle("opacity-100");
			checkbox.classList.toggle("pointer-events-none");
			setTimeout(() => {
				checkbox.classList.toggle("opacity-0");
			}, 100);
		});
	}
};

const updateFavicon = (color: string) => {
	const faviconName = `favicon-${color}.ico`;
	let link = document.querySelector(
		"link[rel*='icon']"
	) as HTMLLinkElement | null;
	if (!link) {
		link = document.createElement("link") as HTMLLinkElement;
		link.rel = "shortcut icon";
		document.head.appendChild(link);
	}
	link.type = "image/x-icon";
	link.href = `/${faviconName}`;
};

const timelineData = [
	{
		date: "2020",
		type: "certification",
		title: "Cambridge English Language Assessment",
		subtitle: "Certification Cambridge - B2 First",
		images: [
			{
				src: "/img/cambridge-logo.png",
				alt: "Cambridge Logo",
			},
		],
	},
	{
		date: "2021",
		type: "formation",
		title: "Institution Saint-Alyre | Clermont-Ferrand",
		subtitle: "General Baccalaureate | Honors (AB)",
		paragraph: [
			"Specialization in Mathematics, Physics & Chemistry, and Computer Science with Advanced Mathematics Option",
		],
		images: [
			{
				src: "/img/saint-alyre-logo.png",
				alt: "Saint-Alyre Logo",
			},
		],
	},
	{
		date: "2022",
		type: "formation",
		title: "EPITECH - European Institute of Technology | Lyon",
		subtitle: "Promo 2022-2027 - Program Grande Ecole (currently)",
		paragraph: [
			"5-Year Program Post-Baccalaureate to Become an Expert in Software Engineering Recognized by the State at Level 7 on the RNCP",
		],
		images: [
			{
				src: "/img/epitech-logo.png",
				alt: "Epitech Logo",
			},
		],
	},
	{
		date: "2023",
		type: "experience",
		title: "Sharewood",
		subtitle: "Front-End Web Developer",
		paragraph: ["Internship - july to december 2023 (6 months)"],
		images: [
			{
				src: "/img/sharewood-logo.png",
				alt: "Sharewood Logo",
			},
		],
	},
	{
		date: "2024",
		type: "experience",
		title: "Letmotiv",
		subtitle: "Full-Stack Web Developer (currently)",
		paragraph: ["Internship - september 2024 to march 2025 (7 months)"],
		images: [
			{
				src: "/img/letmotiv-logo.png",
				alt: "Letmotiv Logo",
			},
		],
	},
];
</script>
