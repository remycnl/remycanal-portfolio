<template>
	<ResumeRow>
		<template #aside>
			<span v-if="meta">{{ meta }}</span>
			<span v-if="location">{{ location }}</span>
		</template>

		<div class="text-black flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<h3
					class="text-2xl leading-tight tracking-tight [font-weight:var(--lineal-weight-bold)] md:text-3xl"
				>
					<component
						:is="href ? 'a' : 'span'"
						:href="href"
						:target="href ? '_blank' : undefined"
						:rel="href ? 'noopener noreferrer' : undefined"
						:class="href ? 'group inline-flex items-start gap-2' : undefined"
					>
						{{ title }}
						<span
							v-if="href"
							class="inline-block transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
							aria-hidden="true"
						>
							↗
						</span>
					</component>
				</h3>
				<p v-if="subtitle" class="text-black-light text-lg">{{ subtitle }}</p>
			</div>
			<p v-if="description" class="text-black-light max-w-prose leading-relaxed">
				{{ description }}
			</p>
			<ul
				v-if="highlights?.length"
				class="text-black-light flex max-w-prose list-disc flex-col gap-1 pl-5 leading-relaxed marker:text-black"
			>
				<li v-for="highlight in highlights" :key="highlight">{{ highlight }}</li>
			</ul>
			<ResumeTagList v-if="tags?.length" :tags="tags" />
		</div>
	</ResumeRow>
</template>

<script lang="ts" setup>
interface ResumeTimelineItemProps {
	/** Primary heading: role, school, project or award name */
	title: string
	/** Secondary line such as company, degree or issuer */
	subtitle?: string
	/** External link attached to the title */
	href?: string
	/** Date range or duration line */
	meta?: string
	/** Location shown under the meta line */
	location?: string
	/** Free-form summary paragraph */
	description?: string
	/** Bullet points listed under the description */
	highlights?: readonly string[]
	/** Skill labels displayed at the bottom */
	tags?: readonly string[]
}

defineProps<ResumeTimelineItemProps>()
</script>