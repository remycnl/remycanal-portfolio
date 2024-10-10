<template>
	<ButtonBackToTop />
	<div
		class="bg-gradient-to-b lg:rounded-t-[4rem] overflow-hidden shadow-around shadow-black from-black via-primary to-black">
		<div class="bg-dot-primary lg:mx-20 2xl:mx-0 hover:brightness-100">
			<section id="section-1" class="container mx-4 lg:mx-auto pt-28 lg:pt-40 pb-48">
				<AboutMe
					:selectedColor="selectedColor"
					@update-color="updateSelectedColor" />
				<Bento />
			</section>
			<div class="container mx-auto px-4 lg:px-0 lg:mt-56">
				<section id="section-2">
					<Skills :selectedColor="selectedColor" />
				</section>
				<section id="section-3">
					<Timeline />
				</section>
				<section id="section-4">
					<Projects />
				</section>
				<section id="section-5">
					<ContactForm />
				</section>
			</div>
		</div>
	</div>
</template>

<script setup>
import { customCursor, appearStart } from "@/plugins/gsap";
import { mouseEffect } from "@/plugins/global.js";

const selectedColor = ref("purple");

const updateSelectedColor = (newColor) => {
	selectedColor.value = newColor;
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
});

const updateFavicon = (color) => {
	const faviconName = `favicon-${color}.ico`;
	let link = document.querySelector("link[rel*='icon']");
	if (!link) {
		link = document.createElement("link");
		link.rel = "shortcut icon";
		document.head.appendChild(link);
	}
	link.type = "image/x-icon";
	link.href = `/${faviconName}`;
};
</script>
