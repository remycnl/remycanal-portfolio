import type { ResponsiveSweepDirection } from "@/types/transition-overlay"

export {}

declare module "vue-router" {
	interface RouteMeta {
		transitionBase?: string
		transitionAccent?: string
		transitionDirection?: ResponsiveSweepDirection
	}
}
