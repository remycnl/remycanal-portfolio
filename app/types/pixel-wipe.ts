export type Breakpoint = "mobile" | "desktop"

export type PixelWipeDirection = "auto" | "left" | "right" | "top" | "bottom" | "corners"

export type ResponsivePixelWipeDirection =
	PixelWipeDirection | Record<Breakpoint, Exclude<PixelWipeDirection, "auto">>

export interface PixelWipeColors {
	base: string
	accent: string
}

export type PixelWipeMode = "in" | "out"

export type ResolvedPixelWipeDirection = Exclude<PixelWipeDirection, "auto">
