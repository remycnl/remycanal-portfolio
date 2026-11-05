export const workYear = (date: string) => date.slice(0, 4)

function relativeLuminance(hex: string) {
	const normalized =
		hex.length === 4
			? `#${[1, 2, 3].map((index) => hex[index]! + hex[index]).join("")}`
			: hex
	const channels = [0, 2, 4].map(
		(offset) => Number.parseInt(normalized.slice(offset + 1, offset + 3), 16) / 255
	)
	const linear = channels.map((channel) =>
		channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
	)
	return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

/** Chooses the higher-contrast text color for a project's tone background. */
export function workToneText(tone: string): "black" | "white" {
	const luminance = relativeLuminance(tone)
	const blackContrast = (luminance + 0.05) / 0.05
	const whiteContrast = 1.05 / (luminance + 0.05)
	return blackContrast >= whiteContrast ? "black" : "white"
}
