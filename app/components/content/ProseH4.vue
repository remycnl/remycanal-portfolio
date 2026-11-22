<script lang="ts" setup>
defineProps<{ id?: string }>()
</script>

<template>
	<h4 :id="id"><slot /></h4>
</template>
