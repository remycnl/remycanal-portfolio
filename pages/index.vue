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

const isDesktop = () => {
	return window.innerWidth >= 1024;
};

const route = useRoute();

watch(route, () => {
	if (isDesktop()) {
		applyEffects();
	}
});

onMounted(() => {
	updateFavicon("purple");
	appearStart();

	if (isDesktop()) {
		applyEffects();
	}

	window.addEventListener("resize", () => {
		if (isDesktop()) {
			applyEffects();
		}
	});
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
	link.href = `https://www.remycanal.me/${faviconName}`;
};
</script>

<template>
	<ButtonBackToTop />
	<div
		class="bg-linear-to-b lg:rounded-t-[4rem] overflow-hidden shadow-around shadow-black from-black via-blue-dark to-black">
		<div class="lg:mx-20 2xl:mx-0 hover:brightness-100">
			<section
				id="section-1"
				class="container mx-auto px-4 lg:px-0 pt-28 lg:pt-40 pb-48">
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
