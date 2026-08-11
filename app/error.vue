<template>
	<div class="flex min-h-screen flex-col">
		<LayoutAppHeader />

		<main class="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
			<p class="text-accent font-mono text-xs tracking-widest uppercase">
				Erreur {{ error?.statusCode ?? "" }}
			</p>

			<h1
				class="font-display text-platinum text-5xl font-semibold tracking-tight md:text-7xl"
			>
				{{ title }}
			</h1>

			<p class="text-chrome/70 max-w-md">
				{{ message }}
			</p>

			<button
				class="text-platinum hover:border-accent hover:text-accent mt-2 rounded-full border border-white/15 px-6 py-3 font-mono text-xs tracking-wider uppercase transition-colors"
				@click="handleClear"
			>
				Retour à l'accueil
			</button>
		</main>

		<LayoutAppFooter />
	</div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app"

const props = defineProps<{
	error: NuxtError
}>()

const title = computed(() =>
	props.error?.statusCode === 404 ? "Page introuvable" : "Une erreur est survenue"
)

const message = computed(() =>
	props.error?.statusCode === 404
		? "Cette page n'existe pas ou a été déplacée."
		: "Quelque chose s'est mal passé côté serveur. Réessaie dans un instant."
)

function handleClear() {
	clearError({ redirect: "/" })
}
</script>
