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

	// Génère automatiquement /sitemap.xml
	sitemap: {
		// Décommente et adapte si tu as des routes dynamiques à exclure
		// exclude: ["/admin/**"],
	},

	// Génère automatiquement /robots.txt (déplacé vers public/_robots.txt)
	robots: {
		// En dev/preview tu peux vouloir bloquer l'indexation :
		// disallow: process.env.NODE_ENV !== "production" ? ["/"] : [],
	},

	// Images Open Graph générées automatiquement (utilise le renderer takumi)
	ogImage: {
		defaults: {
			// Composant Vue utilisé comme template pour l'image OG par défaut
			// (à créer dans components/OgImage/ si tu veux un rendu custom)
		},
	},

	// Données structurées Schema.org — utile pour un meilleur rendu Google
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
	},

	modules: ["@nuxtjs/seo", "@nuxt/image", "@nuxt/icon"],
})
