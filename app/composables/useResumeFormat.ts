import type { ResumeCollectionItem } from "@nuxt/content"

type ResumePeriod = ResumeCollectionItem["experience"][number]["period"]

const MONTHS_PER_YEAR = 12
const SEPARATOR = " · "

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
	month: "short",
	year: "numeric",
	timeZone: "UTC",
})

const parseMonth = (value: string) => {
	const [year = "1970", month = "01"] = value.split("-")
	return new Date(Date.UTC(Number(year), Number(month) - 1, 1))
}

const toMonthIndex = (date: Date) => date.getUTCFullYear() * MONTHS_PER_YEAR + date.getUTCMonth()

const formatDuration = (months: number) => {
	const years = Math.floor(months / MONTHS_PER_YEAR)
	const rest = months % MONTHS_PER_YEAR
	return [years > 0 ? `${years} ${years > 1 ? "ans" : "an"}` : "", rest > 0 ? `${rest} mois` : ""]
		.filter(Boolean)
		.join(" ")
}

export const joinResumeParts = (...parts: (string | undefined)[]) =>
	parts.filter(Boolean).join(SEPARATOR)

export function useResumeFormat() {
	const now = useState("resume-now", () => Date.now())

	const formatMonth = (value: string) => monthFormatter.format(parseMonth(value))

	const formatPeriod = (period: ResumePeriod) => {
		const start = parseMonth(period.start)
		const end = period.end ? parseMonth(period.end) : new Date(now.value)
		const months = Math.max(toMonthIndex(end) - toMonthIndex(start) + 1, 1)
		const range = `${monthFormatter.format(start)} – ${period.end ? monthFormatter.format(end) : "Présent"}`
		return joinResumeParts(range, formatDuration(months))
	}

	const formatYears = (period: ResumePeriod) => {
		const start = parseMonth(period.start).getUTCFullYear()
		const end = period.end ? String(parseMonth(period.end).getUTCFullYear()) : "Présent"
		return `${start} – ${end}`
	}

	return { formatMonth, formatPeriod, formatYears }
}