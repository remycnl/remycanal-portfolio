import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	devtools: {
		enabled: true,

		timeline: {
			enabled: true,
		},
	},

	app: {
		head: {
			titleTemplate: "%s",
		},
	},

	nitro: {
		prerender: {
			routes: ["/"],
			failOnError: false,
		},
		preset: "vercel",
	},

	vite: {
		build: {
			sourcemap: false,
			rollupOptions: {
				output: {
					sourcemap: false,
				},
			},
		},
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ["fsevents"],
		},
	},

	ssr: true,

	css: [
		"@/assets/css/main.css",
		"@/assets/css/button.css",
		"@/assets/css/mouseEffect.css",
		"@/assets/css/backToTopButton.css",
		"@/assets/css/scrollBar.css",
		"@/assets/css/cursor.css",
		"@/assets/css/changeColorButton.css",
		"@/assets/css/transition.css",
		"@/assets/css/project.css",
		"@/assets/css/bento.css",
		"@/assets/css/checkbox.css",
		"@/assets/css/loader.css",
		"@/assets/css/clipboard.css",
	],

	modules: [
		[
			"@nuxtjs/google-fonts",
			{
				families: {
					Orbitron: true,
					"Share Tech Mono": true,
					Schoolbell: true,
				},
			},
		],
		"@nuxt/image",
		"@nuxt/icon",
		"@nuxtjs/seo",
		"@nuxtjs/partytown",
	],

	icon: {
		provider: "server",
		fallbackToApi: true,
		collections: [
			"fa6-brands",
			"fluent-emoji-high-contrast",
			"formkit",
			"game-icons",
			"ic",
			"logos",
			"material-symbols",
			"mingcute",
			"skill-icons",
			"teenyicons",
			"uil",
			"vscode-icons",
		],
	},

	image: {
		provider: "ipx",
		domains: ["www.remycanal.me"],
		format: ["webp"],
		quality: 80,
		presets: {
			portfolioImage: {
				modifiers: {
					format: "webp",
					quality: 80,
				},
			},
		},
		ipx: {
			maxAge: 60 * 60 * 24 * 365, // 1 an
		},
	},

	site: {
		url: "https://www.remycanal.me",
		name: "Rémy Canal | Web Developer • Portfolio",
		description:
			"Discover the portfolio of Rémy Canal, a French web developer from Lyon, specializing in front-end development.",
	},

	seo: {
		canonicalQueryWhitelist: ["search"],
	},

	plugins: [
		{ src: "@/plugins/gsap.js", mode: "client" },
		{ src: "@/plugins/global.js", mode: "client" },
	],

	compatibilityDate: "2024-07-04",
});
