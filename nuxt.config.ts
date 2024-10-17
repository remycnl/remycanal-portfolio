export default defineNuxtConfig({
	devtools: {
		enabled: true,

		timeline: {
			enabled: true,
		},
	},

	app: {
		head: {
			title: "Rémy Canal | Web Developer Portfolio",
			meta: [
				{
					name: "description",
					content:
						"Explore the portfolio of Rémy Canal, a French web developer from Lyon, specializing in front-end development. Explore my projects, skills, and experiences in modern web technologies.",
				},
				{
					property: "og:image",
					content: "https://www.remycanal.me/img/metaImg.png",
				},
			],
		},
	},

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

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},

	modules: [
		[
			"@nuxtjs/google-fonts",
			{
				families: {
					Roboto: true,
					Orbitron: true,
					"Share Tech Mono": true,
					Schoolbell: true,
				},
			},
		],
		"@nuxt/image",
		"@nuxt/icon",
	],

	icon: {
		serverBundle: {
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
	},

	image: {
		domains: ["remycanal.me"],
		presets: {
			portfolioImage: {
				modifiers: {
					format: "webp",
					quality: 80,
				},
			},
		},
	},

	plugins: [
		{ src: "@/plugins/gsap.js", mode: "client" },
		{ src: "@/plugins/global.js", mode: "client" },
		{ src: "@/plugins/vercelanalytics.client.js", mode: "client" },
	],

	compatibilityDate: "2024-07-04",
});
