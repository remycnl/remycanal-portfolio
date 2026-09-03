<!-- app/pages/about.vue -->
<script lang="ts" setup>
definePageMeta({
	transitionBase: "var(--color-black)",
	transitionAccent: "var(--color-lime)",
	transitionDirection: { desktop: "right", mobile: "bottom" },
})

interface StackCardData {
	id: string
	bg: string
	text: string
	eyebrow: string
	title: string
	body: string
}

const cards: StackCardData[] = [
	{
		id: "hero",
		bg: "bg-lime",
		text: "text-black",
		eyebrow: "Bonjour",
		title: "Je suis Rémy,\ndéveloppeur & designer",
		body: "Je conçois et développe des produits web sur mesure, du prototype à la mise en prod — frontend, backend, et le design qui va avec.",
	},
	{
		id: "approche",
		bg: "bg-gray-light",
		text: "text-black",
		eyebrow: "Approche",
		title: "Minimalisme,\npas paresse",
		body: "Chaque interface part d'une intention claire. Pas de composants gratuits, pas d'esthétique générique : juste ce qui sert le contenu.",
	},
	{
		id: "stack",
		bg: "bg-violet",
		text: "text-white",
		eyebrow: "Stack",
		title: "Next.js, NestJS,\nTailwind",
		body: "Next.js et NestJS côté code, PostgreSQL et Prisma côté données, Docker pour le déploiement — hébergé sur mon propre VPS.",
	},
	{
		id: "clients",
		bg: "bg-black",
		text: "text-white",
		eyebrow: "Clients",
		title: "Musée des Confluences\net indépendants",
		body: "Des institutions culturelles aux projets perso, j'adapte le niveau d'exigence technique au besoin réel du projet.",
	},
	{
		id: "contact",
		bg: "bg-white",
		text: "text-black",
		eyebrow: "Contact",
		title: "Un projet\nen tête ?",
		body: "Écris-moi, on en discute. Je réponds toujours, même si ce n'est pas pour dire oui.",
	},
]
</script>

<template>
	<main class="about-stack relative">
		<AboutStackCard
			v-for="(card, index) in cards"
			:key="card.id"
			:bg="card.bg"
			:text="card.text"
			:eyebrow="card.eyebrow"
			:title="card.title"
			:body="card.body"
			:index="index"
			:total="cards.length"
			:stacked="index < cards.length - 1"
		/>
	</main>
</template>

<style>
/* Volontairement NON scoped : le `wrapper` que crée useStackSection est un
   <div> créé côté client via document.createElement, donc il ne porte
   jamais l'attribut data-v-xxxxx du CSS scopé Vue — une règle scoped ne
   l'atteindrait jamais. On cadre la fuite globale via .about-stack.

   Le wrapper prend systématiquement la place exacte de la <section>
   d'origine (insertBefore juste avant, puis déplacement dedans), donc il
   devient le Nᵉ enfant direct de <main>, dans le même ordre que `cards` —
   d'où le ciblage par nth-child. La 5ᵉ carte (contact, stacked=false)
   reste une <section> nue, jamais enveloppée : pas de règle nécessaire. */
.about-stack > div:nth-child(1) {
	background-color: var(--color-black);
}
.about-stack > div:nth-child(2) {
	background-color: var(--color-lime);
}
.about-stack > div:nth-child(3) {
	background-color: var(--color-gray-light);
}
.about-stack > div:nth-child(4) {
	background-color: var(--color-violet);
}
</style>
