import type { ResumeCollectionItem } from "@nuxt/content"

const resumeSectionIds = [
	"about",
	"experience",
	"education",
	"projects",
	"skills",
	"honors",
	"languages",
] as const satisfies readonly (keyof ResumeCollectionItem)[]

export type ResumeSectionId = (typeof resumeSectionIds)[number]

export const resumeSectionLabels: Record<ResumeSectionId, string> = {
	about: "À propos",
	experience: "Expérience",
	education: "Formation",
	projects: "Projets",
	skills: "Compétences",
	honors: "Distinctions",
	languages: "Langues",
}

export function useResumeSections(resume: MaybeRefOrGetter<ResumeCollectionItem | null | undefined>) {
	return computed(() => {
		const value = toValue(resume)
		if (!value) return []
		return resumeSectionIds
			.filter((id) => value[id].length > 0)
			.map((id) => ({ id, label: resumeSectionLabels[id] }))
	})
}