<script setup lang="ts">
type TagTheme = "light" | "dark"

interface Props {
	tags?: readonly string[]
	/** `light` sits on a colored card and follows the state of the surrounding `group` link (black on hover, white on keyboard focus). `dark` sits on a black page. */
	theme?: TagTheme
	/** Maximum number of tags shown. All of them when omitted. */
	max?: number
	/** Renders tags as plain text instead of capsules. */
	plain?: boolean
	/** Text color used by plain tags. */
	plainColor?: "black" | "white"
}

const {
	tags = [],
	theme = "light",
	max,
	plain = false,
	plainColor = "black",
} = defineProps<Props>()

const capsules: Record<TagTheme, string> = {
	light:
		"bg-gray-light text-black-light group-hover:bg-black group-hover:text-white group-focus-visible:bg-white group-focus-visible:text-black",
	dark: "bg-black-light text-white",
}

const visible = computed(() => tags.slice(0, max))
const classes = computed(() =>
	plain
		? [
				"box-fit font-vg5000 block w-fit truncate tracking-wider uppercase",
				plainColor === "white" ? "text-white" : "text-black",
			]
		: [
				"box-fit font-vg5000 block w-fit truncate rounded-full tracking-wider uppercase transition-colors duration-300",
				capsules[theme],
			]
)
</script>

<template>
	<ul v-if="visible.length" :class="classes">
		<li v-for="(tag, i) in visible" :key="tag" class="inline">
			<span v-if="i" aria-hidden="true" class="mx-[0.7em] opacity-40">/</span>{{ tag }}
		</li>
	</ul>
</template>
