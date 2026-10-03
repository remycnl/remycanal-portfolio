import { readThemeColor, withAlpha } from "@/utils/theme/readThemeColor"

export interface BadgeColors {
	cardBg: string
	accentColor: string
	nameColor: string
	roleColor: string
	metaColor: string
	footerBg: string
	footerText: string
}

export interface BadgeData {
	name: string
	roleType: string
	eventCode: string
	barcodeCode: string
	date: string
	location: string
	venue: string
	address: string
	website: string
	email: string
	linkedin: string
	company: string
	tagline: string
	colors: BadgeColors
}

const themeWhite = readThemeColor("--color-white", "oklch(0.9672 0 0)")
const themeLime = readThemeColor("--color-lime", "oklch(0.928 0.2202 125)")

export const defaultBadgeData: BadgeData = {
	name: "Your Name",
	roleType: "ATTENDEE",
	eventCode: "EVT-01",
	barcodeCode: "YOURNAME00000000",
	date: "JAN 1 2027",
	location: "PARIS, FR",
	venue: "Venue Name",
	address: "1 Example Street",
	website: "yourdomain.com",
	email: "you@yourdomain.com",
	linkedin: "https://www.linkedin.com/in/example",
	company: "Your Company",
	tagline: "A short tagline goes here",
	colors: {
		cardBg: "#000000",
		footerBg: "#000000",
		accentColor: themeLime,
		nameColor: themeWhite,
		roleColor: withAlpha(themeWhite, 0.78),
		metaColor: withAlpha(themeWhite, 0.55),
		footerText: withAlpha(themeWhite, 0.85),
	},
}
