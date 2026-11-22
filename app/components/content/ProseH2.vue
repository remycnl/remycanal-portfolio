<script lang="ts" setup>
import { useOverlayReveal } from "@/composables/useOverlayReveal"

defineProps<{ id?: string }>()

const reveal = useOverlayReveal()
</script>

<template>
	<h2 :id="id" v-text-reveal="reveal"><slot /></h2>
</template>
