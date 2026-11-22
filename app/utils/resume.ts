export interface ResumePeriod {
	start: string
	end?: string | null
}

export interface ResumeImage {
	src: string
	alt: string
}

export interface ResumeDocument {
	label: string
	href: string
}

export interface ResumeTool {
	name: string
	logo: string
	background?: string
}

/* ---------------------------------- Dates --------------------------------- */

/** "2025-10" → nombre de mois depuis l'an 0 : sert uniquement à soustraire deux mois. */
const toMonthIndex = (month: string) => {
	const [year = 0, m = 1] = month.split("-").map(Number)

	return year * 12 + (m - 1)
}

/** Mois courant au format `YYYY-MM`. */
export const currentMonth = (date = new Date()) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

/** "2025-10" → "Oct 2025" ; avec `long` : "2026-03" → "March 2026". */
export const formatMonth = (month: string, style: "short" | "long" = "short") => {
	const [year = 0, m = 1] = month.split("-").map(Number)

	return new Intl.DateTimeFormat("en-US", {
		month: style,
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, m - 1, 1)))
}

/**
 * Durée d'une période en comptant le mois de début ET le mois de fin, comme LinkedIn :
 * Sep 2024 → Feb 2025 = "6 mos", Oct 2025 → Nov 2026 = "1 yr 2 mos".
 * Sans `end`, la période court jusqu'à `today` (`YYYY-MM`).
 */
export const formatDuration = (period: ResumePeriod, today: string) => {
	const total = toMonthIndex(period.end ?? today) - toMonthIndex(period.start) + 1

	if (total < 1) {
		return ""
	}

	const years = Math.floor(total / 12)
	const months = total % 12

	return [
		years > 0 ? `${years} ${years > 1 ? "yrs" : "yr"}` : "",
		months > 0 ? `${months} ${months > 1 ? "mos" : "mo"}` : "",
	]
		.filter(Boolean)
		.join(" ")
}

/** Période prête à afficher : `end` vaut `null` tant que le poste est en cours (« Now »). */
export const describePeriod = (period: ResumePeriod, today: string) => ({
	start: formatMonth(period.start),
	end: period.end ? formatMonth(period.end) : null,
	duration: formatDuration(period, today),
})

/* --------------------------------- Fichiers -------------------------------- */

/** "/resume/documents/diploma.pdf?v=2" → "PDF" ; `null` si le chemin n'a pas d'extension. */
export const fileExtension = (href: string) => {
	const { pathname } = new URL(href, "https://placeholder.invalid")

	return /\.([a-z0-9]{2,5})$/i.exec(pathname)?.[1]?.toUpperCase() ?? null
}

/* ----------------------------- Cadre d'un logo ----------------------------- */

const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i

/** En dessous, le fond est assez sombre pour qu'une bordure plus foncée disparaisse : on l'éclaircit. */
const DARK_LUMINANCE = 0.15

/** Canal sRGB (0-255) d'un hex à six chiffres → valeur linéaire, étape de la luminance WCAG. */
const linearChannel = (digits: string, offset: number) => {
	const value = Number.parseInt(digits.slice(offset, offset + 2), 16) / 255

	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const relativeLuminance = (hex: string) => {
	const digits = hex.slice(1)
	const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits

	return (
		0.2126 * linearChannel(full, 0) +
		0.7152 * linearChannel(full, 2) +
		0.0722 * linearChannel(full, 4)
	)
}

/**
 * Style en ligne d'un cadre de logo. La bordure se déduit du fond : une teinte plus foncée de la
 * même couleur, ou plus claire quand le fond est déjà sombre. Sans fond valide : `undefined`,
 * le cadre reste blanc avec sa bordure `gray-dark/50`.
 */
export const logoFrameStyle = (background?: string) => {
	if (!background || !HEX.test(background)) {
		return undefined
	}

	const border =
		relativeLuminance(background) < DARK_LUMINANCE
			? `color-mix(in srgb, ${background}, white 28%)`
			: `color-mix(in srgb, ${background}, black 22%)`

	return { backgroundColor: background, borderColor: border }
}
