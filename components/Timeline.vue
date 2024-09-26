<template>
	<div class="w-full">
		<div class="py-20">
			<h2
				id="timeline"
				class="text-color-saturate text-[3rem] md:text-[4rem] uppercase w-fit">
				Timeline
			</h2>
			<h3
				style="font-family: Share Tech Mono"
				class="mt-5 lg:mt-10 text-gray-light text-lg md:text-xl lg:text-[1.3rem] hover:text-white transition-colors duration-500">
				Explore my journey, including my certifications, academic training, and
				professional experiences, showcasing my growth in software development
				and engineering.
			</h3>
		</div>

		<div ref="timelineRef" class="relative pb-20">
			<div
				v-for="(item, index) in data"
				:key="index"
				class="flex justify-start pt-10 md:pt-40 md:gap-10">
				<div
					class="sticky flex flex-col z-40 items-start top-40 self-start max-w-xs lg:max-w-sm md:w-full">
					<div
						class="h-10 left-[0.08rem] absolute w-10 rounded-full bg-black flex items-center justify-center">
						<div
							class="h-4 w-4 rounded-full bg-neutral-800 border border-neutral-700 p-2"></div>
					</div>
					<h3
						class="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500">
						{{ item.date }}
					</h3>
					<h4
						class="hidden md:block text-xl md:pl-20 md:text-xl font-bold text-neutral-500">
						{{ item.type }}
					</h4>
				</div>

				<div class="relative pl-20 pr-4 md:pl-4 w-full">
					<div class="flex flex-row gap-x-4 items-center">
						<h3
							class="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500">
							{{ item.date }}
						</h3>
						<h4
							class="md:hidden text-xs -mt-2 font-bold text-neutral-500">
							{{ item.type }}
						</h4>
					</div>
					<div class="mb-8 flex flex-col gap-y-5 lg:gap-y-8">
						<div class="flex flex-col gap-y-2">
							<h3 class="text-lg md:text-2xl lg:text-3xl text-secondary">
								{{ item.title }}
							</h3>
							<h4
								style="font-family: Share Tech Mono"
								class="text-white text-sm md:text-lg lg:text-xl">
								{{ item.subtitle }}
							</h4>
						</div>
						<div
							class="text-gray-light text-sm md:text-lg flex flex-col gap-y-4">
							<p v-for="(paragraph, idx) in item.paragraph" :key="idx">
								{{ paragraph }}
							</p>
						</div>
						<div
							class="group overflow-hidden bg-gray-dark text-secondary border border-secondary shadow-around shadow-black-dark w-full lg:w-1/3 h-40 lg:h-60 rounded-[1.5rem] flex justify-center items-center p-5 lg:p-10">
							<img
								v-for="(img, imgIdx) in item.images"
								:key="imgIdx"
								:src="img.src"
								:alt="img.alt"
								class="object-contain h-full w-full group-hover:scale-[1.15] transition-transform duration-500" />
						</div>
					</div>
				</div>
			</div>

			<div
				:style="{ height: height + 'px' }"
				class="absolute left-[1.20rem] top-0 overflow-hidden w-[2px] bg-gradient-to-b from-transparent via-neutral-700 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]">
				<div
					ref="progressBar"
					class="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-secondary via-secondary-dark to-transparent rounded-full"></div>
			</div>
		</div>
	</div>
</template>

<script setup>
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({
	data: {
		type: Array,
		required: true,
	},
});

const timelineRef = ref(null);
const progressBar = ref(null);
const height = ref(0);

onMounted(() => {
	if (timelineRef.value) {
		height.value = timelineRef.value.getBoundingClientRect().height;
	}

	if (progressBar.value && timelineRef.value) {
		gsap.to(progressBar.value, {
			height: "100%",
			ease: "none",
			scrollTrigger: {
				trigger: timelineRef.value,
				start: "top 50%",
				end: "bottom 50%",
				scrub: true,
			},
		});
	}
});
</script>
