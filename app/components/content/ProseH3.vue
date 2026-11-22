<script lang="ts" setup>
defineProps<{ id?: string }>()
</script>

<template>
	<h3 :id="id"><slot /></h3>
</template>
