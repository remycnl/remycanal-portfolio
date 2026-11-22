<script setup lang="ts">
import { CHARACTER_MODEL_URL } from "@/constants/logo"

// Précharge le personnage uniquement sur cette page, et le relâche quand on la quitte.
// Optionnel : la scène du hero est montée tout de suite et charge déjà ses assets à l'idle.
useLogoScenePreload(CHARACTER_MODEL_URL, { keepAlive: false })
</script>

<template>
	<div class="min-h-screen">
		<!--
			Racine unique, sans commentaire avant elle (Nuxt avertit sinon : NUXT_E4004). Elle
			contient le hero ET le CV : c'est le bloc de contenance du hero sticky.
		-->
		<ResumeHero />
		<ResumeCurriculumVitae />
	</div>
</template>
