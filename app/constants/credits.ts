export type CreditItem = { name: string; url?: string; note?: string }

// Tout est modifiable ici. Une entrée sans `url` s'affiche sans lien.
export const CREDITS = {
	year: `2024-${new Date().getFullYear()}`,

	typefaces: [
		{
			name: "Lineal",
			url: "https://velvetyne.fr/fonts/lineal/",
			note: "by Velvetyne Type Foundry",
		}, // ajoute auteur / fonderie / lien
		{
			name: "VG5000",
			url: "https://velvetyne.fr/fonts/vg5000/",
			note: "by Velvetyne Type Foundry",
		},
	] as CreditItem[],

	tools: [
		{ name: "Blender", url: "https://www.blender.org" },
		{ name: "Figma", url: "https://www.figma.com" },
	] as CreditItem[],

	stack: [
		{ name: "Nuxt", url: "https://nuxt.com" },
		{ name: "Vue", url: "https://vuejs.org" },
		{ name: "Tailwind CSS", url: "https://tailwindcss.com" },
		{ name: "Three.js", url: "https://threejs.org" },
		{ name: "GSAP", url: "https://gsap.com" },
		{ name: "Lenis", url: "https://lenis.dev" },
		{ name: "Resend", url: "https://resend.com" },
		{ name: "Vercel", url: "https://vercel.com" },
	] as CreditItem[],

	// Si tu es dans cette liste : une grande source d'inspiration. Ex. { name: "Nom", url: "https://..." }
	inspirations: [
		{ name: "Eduard Bodak", url: "https://www.eduardbodak.com/" },
		{ name: "Elaine Yu", url: "https://www.elaineyu.design/" },
		{ name: "Andrea Da Silva", url: "https://adasilv2.framer.website/" },
		{ name: "Alvin Leung", url: "https://alvinn.design/" },
	] as CreditItem[],

	// Projets clients cités (avec leur accord). Ex. { name: "Client", url: "https://...", note: "Design & dev, 2026" }
	clients: [
		{ name: "Client", url: "https://...", note: "Design & dev, 2026" },
		{ name: "Client", url: "https://...", note: "Design & dev, 2026" },
	] as CreditItem[],
}
