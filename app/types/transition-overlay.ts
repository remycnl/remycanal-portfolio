export type Breakpoint = "mobile" | "desktop"

export type SweepDirection = "auto" | "left" | "right" | "top" | "bottom"

export type ResponsiveSweepDirection =
	SweepDirection | Record<Breakpoint, Exclude<SweepDirection, "auto">>
