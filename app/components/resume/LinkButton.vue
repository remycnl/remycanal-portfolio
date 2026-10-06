<template>
	<a
		:href="href"
		:target="external ? '_blank' : undefined"
		:rel="external ? 'noopener noreferrer' : undefined"
		:download="download ? '' : undefined"
		class="font-vg5000 inline-flex items-center gap-2 text-sm uppercase"
		:class="variants[variant]"
	>
		<slot />
		<span v-if="external" aria-hidden="true">↗</span>
	</a>
</template>

<script lang="ts" setup>
interface ResumeLinkButtonProps {
	/** Destination URL, including mailto: links */
	href: string
	/** Visual style of the link */
	variant?: "primary" | "secondary"
	/** Opens the link in a new tab with safe rel attributes */
	external?: boolean
	/** Marks the link as a file download */
	download?: boolean
}

const { variant = "primary" } = defineProps<ResumeLinkButtonProps>()

const variants = {
	primary:
		"bg-black text-white rounded-full px-6 py-3 transition-transform duration-200 hover:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:scale-100",
	secondary:
		"text-black relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-black after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none",
} as const
</script>