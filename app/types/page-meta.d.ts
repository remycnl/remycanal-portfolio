declare module "#app" {
	interface PageMeta {
		footerTheme?: import("@/types/theme").SiteTheme /**
		 * Marks a page as an overlay: opened from a card, it covers the page it comes from instead of
		 * replacing it. Reached directly, it is a regular page.
		 */
		overlay?: {
			/** Surface of the sheet and colours of its close button. */
			theme: "black" | "white"
			/** The section the page belongs to: where "Close" leads when it is reached directly. */
			parent: string
		}
	}
}

export {}
