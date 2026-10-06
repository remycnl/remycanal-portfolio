<template>
	<div
		v-if="resume"
		class="bg-white min-h-screen section-p-xy selection:bg-lime selection:text-black"
	>
		<ResumeProfile
			:name="resume.name"
			:headline="resume.headline"
			:location="resume.location"
			:availability="resume.availability"
			:avatar="resume.avatar"
			:cv="resume.cv"
			:email="resume.email"
			:links="resume.links"
		/>
		<ResumeNav :items="items" :active-id="activeId" />

		<ResumeSection v-if="resume.about.length" id="about" :title="resumeSectionLabels.about">
			<div class="flex flex-col gap-8">
				<p
					v-for="paragraph in resume.about"
					:key="paragraph"
					class="text-black text-[clamp(1.5rem,3vw,3rem)] leading-[1.15] tracking-tight"
				>
					{{ paragraph }}
				</p>
			</div>
		</ResumeSection>

		<ResumeSection
			v-if="resume.experience.length"
			id="experience"
			:title="resumeSectionLabels.experience"
			:count="resume.experience.length"
		>
			<ol>
				<ResumeTimelineItem
					v-for="item in resume.experience"
					:key="`${item.company}-${item.period.start}`"
					:title="item.role"
					:subtitle="joinResumeParts(item.company, item.type)"
					:meta="formatPeriod(item.period)"
					:location="item.location"
					:description="item.description"
					:highlights="item.highlights"
					:tags="item.skills"
				/>
			</ol>
		</ResumeSection>

		<ResumeSection
			v-if="resume.education.length"
			id="education"
			:title="resumeSectionLabels.education"
			:count="resume.education.length"
		>
			<ol>
				<ResumeTimelineItem
					v-for="item in resume.education"
					:key="`${item.school}-${item.period.start}`"
					:title="item.school"
					:subtitle="joinResumeParts(item.degree, item.field)"
					:meta="formatYears(item.period)"
					:description="item.description"
				/>
			</ol>
		</ResumeSection>

		<ResumeSection
			v-if="resume.projects.length"
			id="projects"
			:title="resumeSectionLabels.projects"
			:count="resume.projects.length"
		>
			<ol>
				<ResumeTimelineItem
					v-for="item in resume.projects"
					:key="item.name"
					:title="item.name"
					:href="item.url"
					:meta="item.period ? formatPeriod(item.period) : undefined"
					:description="item.description"
					:tags="item.skills"
				/>
			</ol>
		</ResumeSection>

		<ResumeSection v-if="resume.skills.length" id="skills" :title="resumeSectionLabels.skills">
			<ul>
				<ResumeRow v-for="group in resume.skills" :key="group.label">
					<template #aside>{{ group.label }}</template>
					<ResumeTagList :tags="group.items" />
				</ResumeRow>
			</ul>
		</ResumeSection>

		<ResumeSection
			v-if="resume.honors.length"
			id="honors"
			:title="resumeSectionLabels.honors"
			:count="resume.honors.length"
		>
			<ol>
				<ResumeTimelineItem
					v-for="item in resume.honors"
					:key="`${item.title}-${item.date}`"
					:title="item.title"
					:subtitle="item.issuer"
					:meta="formatMonth(item.date)"
					:description="item.description"
				/>
			</ol>
		</ResumeSection>

		<ResumeSection
			v-if="resume.languages.length"
			id="languages"
			:title="resumeSectionLabels.languages"
		>
			<ul>
				<ResumeRow v-for="language in resume.languages" :key="language.name">
					<template #aside>{{ language.level }}</template>
					<p class="text-black text-2xl tracking-tight [font-weight:var(--lineal-weight-bold)] md:text-3xl">
						{{ language.name }}
					</p>
				</ResumeRow>
			</ul>
		</ResumeSection>
	</div>
</template>

<script lang="ts" setup>
const { data: resume } = await useAsyncData("resume", () => queryCollection("resume").first())

if (!resume.value) {
	throw createError({ statusCode: 404, statusMessage: "Resume not found", fatal: true })
}

const { formatMonth, formatPeriod, formatYears } = useResumeFormat()
const items = useResumeSections(resume)
const { activeId } = useScrollSpy(() => items.value.map(({ id }) => id))

useSeoMeta({
	title: () => (resume.value ? `${resume.value.name} — ${resume.value.headline}` : "CV"),
	description: () => resume.value?.about[0] ?? resume.value?.headline,
})
</script>