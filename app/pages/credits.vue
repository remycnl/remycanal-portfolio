<script setup lang="ts">
import { LEGAL } from "@/constants/legal"
import { CREDITS } from "@/constants/credits"

useSeoMeta({
	title: "Credits",
	description:
		"Credits for remycanal.me: creation, typefaces, tools, technologies, clients and inspirations.",
})
</script>

<template>
	<LegalPage title="Credits" :updated="LEGAL.updated">
		<h2>Creation</h2>
		<p>
			Design, development, 3D models, illustrations, logos, stickers and photography by
			<strong>{{ LEGAL.name }}</strong
			>.
		</p>
		<p>© {{ CREDITS.year }} {{ LEGAL.name }}. All rights reserved.</p>

		<template v-if="CREDITS.typefaces.length">
			<h2>Typefaces</h2>
			<LegalCreditList :items="CREDITS.typefaces" />
		</template>

		<template v-if="CREDITS.tools.length">
			<h2>Creative tools</h2>
			<LegalCreditList :items="CREDITS.tools" />
		</template>

		<template v-if="CREDITS.stack.length">
			<h2>Built with</h2>
			<p>
				This website relies on open-source and third-party technologies, each under its
				own licence:
			</p>
			<LegalCreditList :items="CREDITS.stack" />
		</template>

		<template v-if="CREDITS.clients.length">
			<h2>Selected clients and projects</h2>
			<LegalCreditList :items="CREDITS.clients" />
		</template>

		<template v-if="CREDITS.inspirations.length">
			<h2>Inspirations</h2>
			<p>
				If you are on this list, you have been a great source of inspiration to me, and I
				sincerely thank you.
			</p>
			<LegalCreditList :items="CREDITS.inspirations" />
		</template>

		<h2>Corrections</h2>
		<p>
			If you believe a credit is missing, inaccurate, or you would rather not be listed,
			write to
			<a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a> and I will fix it promptly.
		</p>
	</LegalPage>
</template>
