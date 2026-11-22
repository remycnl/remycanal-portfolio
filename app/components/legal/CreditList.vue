<script setup lang="ts">
import type { CreditItem } from "@/constants/credits"

defineProps<{ items: CreditItem[] }>()
</script>

<template>
	<ul>
		<li v-for="item in items" :key="item.name">
			<a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{
				item.name
			}}</a>
			<template v-else>{{ item.name }}</template>
			<template v-if="item.note"> – {{ item.note }}</template>
		</li>
	</ul>
</template>
