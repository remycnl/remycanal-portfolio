<script setup>
import "@/assets/css/main.css";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import {
	toggleDropdown,
	customCursor,
	animationFooterBottom,
} from "@/plugins/gsap";
import { mouseEffect } from "@/plugins/global.js";
import { SpeedInsights } from "@vercel/speed-insights/nuxt";

const activeTitle = ref("Rémy Canal | Web Developer • Portfolio");
const inactiveTitle = ref("I miss you... 🥺");

useSeoMeta({
	title: activeTitle,
	description:
		"Discover the portfolio of Rémy Canal, a French web developer from Lyon, specializing in front-end development. Explore my projects, skills, and experiences in modern web technologies.",
	canonical: "https://www.remycanal.me",
	keywords:
		"Rémy Canal, Développeur web, Portfolio, Lyon, Développeur front-end, Développeur full-stack, Développeur mobile, Développeur Vue.js, Freelance",
	ogTitle: "Rémy Canal | Web Developer • Portfolio",
	ogDescription:
		"Discover the portfolio of Rémy Canal, a French web developer from Lyon, specializing in front-end development. Explore my projects, skills, and experiences in modern web technologies.",
	ogUrl: "https://www.remycanal.me",
	ogSiteName: "Rémy Canal | Web Developer • Portfolio",
	ogType: "website",
	ogImage: "https://www.remycanal.me/img/metaImg.png",
	ogImageAlt: "Rémy Canal Portfolio Preview",
	ogLocale: "en_US",
	twitterTitle: "Portfolio • Rémy Canal | Web Developer",
	twitterDescription:
		"Check out Rémy Canal's portfolio, a web developer from Lyon specializing in front-end development.",
	twitterImage: "https://www.remycanal.me/img/metaImg.png",
	twitterUrl: "https://www.remycanal.me",
});

useServerSeoMeta({
	robots: "index, follow",
	htmlLang: "en",
});

useHead({
	htmlAttrs: {
		lang: "en",
	},
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
		},
	],
	link: [
		{
			rel: "icon",
			type: "image/x-icon",
			href: "https://www.remycanal.me/favicon-purple.ico",
		},
		{
			rel: "apple-touch-icon",
			sizes: "180x180",
			href: "https://www.remycanal.me/img/logo-purple.png",
		},
		{
			rel: "canonical",
			href: "https://www.remycanal.me",
		},
	],
});

useSchemaOrg([
	defineWebPage({
		url: "https://www.remycanal.me",
		name: "Rémy Canal | Web Developer • Portfolio",
		description:
			"Explore the projects, skills, and expertise of Rémy Canal, a front-end web developer.",
		mainEntity: {
			"@type": "WebPageElement",
			name: "Portfolio",
		},
		breadcrumb: {
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Home",
					item: "https://www.remycanal.me",
				},
			],
		},
	}),
	defineWebSite({
		url: "https://www.remycanal.me",
		name: "Rémy Canal | Web Developer • Portfolio",
		description:
			"Portfolio showcasing the web development projects, skills, and experiences of Rémy Canal.",
		publisher: {
			"@type": "Person",
			name: "Rémy Canal",
		},
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": "https://www.remycanal.me",
		},
	}),
	definePerson({
		name: "Rémy Canal",
		jobTitle: "Web Developer",
		url: "https://www.remycanal.me",
		image: "https://www.remycanal.me/img/avatar.png",
		sameAs: [
			"https://www.linkedin.com/in/remy-canal",
			"https://github.com/remycnl",
		],
		description:
			"Web developer based in Lyon specializing in front-end development.",
		alumniOf: {
			"@type": "CollegeOrUniversity",
			name: "EPITECH Lyon",
		},
		worksFor: {
			"@type": "Organization",
			name: "Freelance",
		},
		birthDate: "2004-06-02",
		address: {
			"@type": "PostalAddress",
			addressLocality: "Lyon",
			addressCountry: "France",
		},
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "Customer Support",
			email: "hello@remycanal.me",
			telephone: "+33-6-19-25-82-99",
			availableLanguage: ["French", "English"],
			areaServed: "FR",
			serviceArea: {
				"@type": "Place",
				name: "France",
			},
		},
	}),
]);

defineOgImage({ url: 'https://www.remycanal.me/img/metaImg.png', alt: 'Rémy Canal Portfolio Preview' })

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
	setSEO();
	setCSP();
	if (isDesktop()) {
		applyEffects();
		animationFooterBottom();
	}

	if (import.meta.client) {
		console.log(`
    ******************************************
    *                                        *
    *    Appreciate scrolling through my     *
    *            portfolio! :)               *
    *                                        *
    ******************************************
    `);
	}

	window.addEventListener("resize", () => {
		if (isDesktop()) {
			applyEffects();
		}
	});
});

const setSEO = () => {
	if (import.meta.client) {
		document.addEventListener("visibilitychange", function () {
			if (document.visibilityState === "hidden") {
				document.title = inactiveTitle.value;
			} else {
				document.title = activeTitle.value;
			}
		});
	}
};

const setCSP = () => {
	const meta = document.createElement("meta");
	meta.httpEquiv = "Content-Security-Policy";
	meta.content =
		"script-src 'self' https://apis.google.com https://vercel.live";

	const existingMeta = document.head.querySelector(
		'meta[http-equiv="Content-Security-Policy"]'
	);
	if (!existingMeta) {
		document.head.appendChild(meta);
	}
};
</script>

<template>
	<div class="lg:cursor-none">
		<div
			class="hidden lg:block custom-cursor shadow-around bg-secondary rounded-full pointer-events-none z-[1000]">
			<div
				style="font-family: Share Tech Mono"
				class="text-cursor opacity-0 absolute scale-0 -top-8 left-1/2 px-2 py-1 bg-black border border-gray-dark rounded-full whitespace-nowrap text-sm text-white">
				Click to visit
			</div>
		</div>
		<div class="scroll-smooth relative max-w-screen overflow-hidden">
			<div
				@click="toggleDropdown"
				class="blur-background-menu z-[100] pointer-events-none blur-none lg:hidden opacity-0 absolute h-full w-full bg-black bg-opacity-90"></div>
			<div
				id="blob"
				class="absolute -z-0 pointer-events-none hidden lg:block"></div>
			<div
				class="bg-secondary-dark lg:p-8 lg:pt-36 overflow-hidden transition-colors duration-[1s]">
				<div id="top" class="container mx-auto lg:mx-0 z-[999]">
					<Header class="fixed top-5" />
				</div>
				<div id="slot">
					<slot />
					<SpeedInsights />
				</div>
				<Footer id="footer" />
				<div
					class="flex justify-center items-center mt-32 lg:mt-60 mb-24 lg:mb-48">
					<div
						class="z-50 group flex justify-center items-center flex-col gap-y-3 w-fit">
						<h3
							class="w-fit text-center text-gray-light group-hover:text-white transition-color duration-500 text-2xl md:text-3xl lg:text-4xl">
							&ldquo; Simplicity is the ultimate sophistication. &rdquo;
						</h3>
						<h3
							class="w-fit text-xs text-gray-light group-hover:text-white transition-color duration-500 md:text-base lg:text-lg">
							Leonardo da Vinci
						</h3>
					</div>
				</div>
				<div
					class="container-s hidden lg:flex text-start w-screen -ml-8 -mb-7 overflow-hidden select-none">
					<div
						id="letters-bottom"
						class="tracking-wider font-mono s whitespace-nowrap inline-block text-xs text-black uppercase w-fit">
						<!-- Ici apparaîssent les <span> des crédits -->
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
