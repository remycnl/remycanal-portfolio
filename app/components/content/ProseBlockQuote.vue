<script lang="ts" setup>
import { useOverlayReveal } from "@/composables/useOverlayReveal"

const reveal = useOverlayReveal()
</script>

<template>
	<blockquote v-text-reveal="reveal"><slot /></blockquote>
</template>
