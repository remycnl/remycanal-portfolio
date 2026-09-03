import linealVF from "@/assets/fonts/LinealVF.woff2?url"
import vg5000Regular from "@/assets/fonts/VG5000-Regular.woff2?url"

export interface AppFontDefinition {
	family: string
	url: string
	loadDescriptor: string
}

export const APP_FONTS: AppFontDefinition[] = [
	{
		family: "Lineal",
		url: linealVF,
		loadDescriptor: '400 16px "Lineal"',
	},
	{
		family: "VG5000",
		url: vg5000Regular,
		loadDescriptor: '400 16px "VG5000"',
	},
]

export const APP_FONT_PRELOAD_LINKS = APP_FONTS.map((font) => ({
	rel: "preload" as const,
	href: font.url,
	as: "font" as const,
	type: "font/woff2" as const,
	crossorigin: "anonymous" as const,
	fetchpriority: "high" as const,
}))
