<script setup lang="ts">
defineProps<{ title?: string }>()

const titleId = useId()
</script>

<template>
	<section
		:aria-labelledby="title ? titleId : undefined"
		class="bg-gray-light section-p-xy lg:contents"
	>
		<!--
			Mobile : la section est un seul bloc gris (fond + padding portés par la balise), titre au-dessus
			du contenu. `lg:contents` : la balise disparaît, ses deux cellules deviennent des enfants de la
			grille du CV et partagent la même rangée, donc la même hauteur. Chacune reprend alors son fond
			et son `section-p-xy`, et le titre, sticky dans sa cellule, reste collé en haut tant que la
			section défile avant de repartir avec elle.
			`title` absent : cellule blanche vide, la bande blanche continue jusqu'en bas.
		-->
		<div class="lg:section-p-xy lg:bg-white">
			<h2
				v-if="title"
				:id="titleId"
				v-text-reveal
				class="font-lineal-black uppercase mb-6 w-fit text-3xl sm:text-4xl"
			>
				{{ title }}
			</h2>
		</div>

		<div class="lg:section-p-xy lg:bg-gray-light">
			<slot />
		</div>
	</section>
</template>
