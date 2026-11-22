<template>
	<!-- `loopStyle` définit --loop-height ici : la loop et le footer, tous deux enfants de ce
	     conteneur, lisent la même valeur. -->
	<div class="flex min-h-screen flex-col" :style="loopStyle">
		<LayoutAppHeader />
		<main class="relative z-10 flex-1">
			<slot />
		</main>

		<!-- Dans le flux, juste sous le contenu : elle défile avec la page, contrairement au footer
		     qui est fixe. Frère de <main> (et non enfant) pour rester collée au footer même quand
		     la page est plus courte que l'écran. -->
		<UiInfiniteHorizontalLoop
			class="z-50"
			:ref="loopRef"
			text="REMY CANAL"
			default-direction="right"
			:item-class="loopTheme.item"
			:bg="loopTheme.bg"
			:repeat-count="4"
			:base-speed="1"
			fit
			fit-padding="0.2em"
		/>

		<LayoutAppFooter />
	</div>
</template>

<script setup lang="ts">
import type { SiteTheme } from "@/types/theme"

const { loopRef, loopStyle } = useLoopHeight()

const LOOP_ITEM_BASE =
	"uppercase font-lineal-heavy text-[16vw] pr-[3vw] [word-spacing:0.1em]"

const LOOP_THEMES: Record<SiteTheme, { item: string; bg: string }> = {
	lime: { item: `${LOOP_ITEM_BASE} text-lime-dark`, bg: "var(--color-lime)" },
	violet: { item: `${LOOP_ITEM_BASE} text-violet-dark`, bg: "var(--color-violet)" },
}

// Le thème est partagé avec le footer, le fond et la scrollbar : `useSiteThemeSync()` (app.vue)
// le change, avec son délai, la loop se contente de le suivre.
const siteTheme = useSiteTheme()
const loopTheme = computed(() => LOOP_THEMES[siteTheme.value])
</script>
