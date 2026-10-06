<template>
	<header class="text-black flex min-h-[85svh] flex-col justify-between gap-16 pb-12">
		<div class="font-vg5000 flex items-center justify-between gap-4 text-xs uppercase">
			<div class="flex items-center gap-4">
				<img
					v-if="avatar"
					:src="avatar"
					:alt="name"
					width="56"
					height="56"
					class="size-14 rounded-full object-cover"
				/>
				<span>{{ location }}</span>
			</div>
			<p v-if="availability" class="flex items-center gap-2">
				<span class="bg-lime-dark size-2 rounded-full" aria-hidden="true" />
				{{ availability }}
			</p>
		</div>

		<div class="flex flex-col gap-8">
			<h1
				class="-ml-[0.05em] text-[clamp(4rem,17vw,20rem)] leading-[0.82] tracking-tighter [font-weight:var(--lineal-weight-black)]"
			>
				{{ name }}
			</h1>
			<p class="max-w-4xl text-[clamp(1.25rem,2.4vw,2.5rem)] leading-tight tracking-tight">
				{{ headline }}
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-x-8 gap-y-4">
			<ResumeLinkButton :href="`mailto:${email}`">Me contacter</ResumeLinkButton>
			<ResumeLinkButton v-if="cv" :href="cv" variant="secondary" download>
				Télécharger le CV
			</ResumeLinkButton>
			<ResumeLinkButton
				v-for="link in links"
				:key="link.url"
				:href="link.url"
				variant="secondary"
				external
			>
				{{ link.label }}
			</ResumeLinkButton>
		</div>
	</header>
</template>

<script lang="ts" setup>
interface ResumeProfileLink {
	/** Visible link label */
	label: string
	/** Absolute URL */
	url: string
}

interface ResumeProfileProps {
	/** Full display name */
	name: string
	/** Professional headline shown under the name */
	headline: string
	/** Free-form location line */
	location: string
	/** Short availability status */
	availability?: string
	/** Public path of the avatar image */
	avatar?: string
	/** Public path of the downloadable CV file */
	cv?: string
	/** Contact email address */
	email: string
	/** External profile links */
	links: readonly ResumeProfileLink[]
}

defineProps<ResumeProfileProps>()
</script>