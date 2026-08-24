// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["@/assets/css/main.css"],

	app: {
		head: {
			charset: "utf-8",
			viewport: "width=device-width, initial-scale=1",
		},
	},

	site: {
		url: "https://www.remycanal.me",
		name: "Rémy Canal",
		description: "Rémy Canal's Portfolio — Creative Developer & Designer",
		defaultLocale: "en",
	},

	sitemap: {
		// exclude: ["/admin/**"],
	},

	robots: {
		// disallow: process.env.NODE_ENV !== "production" ? ["/"] : [],
	},

	ogImage: {
		defaults: {},
	},

	schemaOrg: {
		identity: {
			type: "Person",
			name: "Rémy Canal",
			jobTitle: ["Full-Stack Developer", "UI/UX Designer", "creative Developer"],
			url: "https://www.remycanal.me",
			image: "https://www.remycanal.me/og-image.png",
			sameAs: [
				"https://www.linkedin.com/in/remy-canal",
				"https://github.com/remycnl",
				"https://www.awwwards.com/remy.cnl",
			],
		},
	},

	vite: {
		plugins: [tailwindcss()],
		build: {
			target: "esnext",
		},
	},

	modules: ["@nuxtjs/seo", "@nuxt/image", "@nuxt/icon"],
})
