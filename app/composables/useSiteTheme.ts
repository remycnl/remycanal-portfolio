import type { SiteTheme } from "@/types/theme"

export const DEFAULT_SITE_THEME: SiteTheme = "violet"

/**
 * The theme currently displayed by the site: background, footer and scrollbar all follow it. It
 * takes the theme of the visible page, with the delay set by the footer wrapper so that it changes
 * once the page transition has revealed the new page.
 */
export function useSiteTheme() {
	const visibleRoute = useVisibleRoute()

	return useState<SiteTheme>(
		"site-theme",
		() => visibleRoute.value.meta.footerTheme ?? DEFAULT_SITE_THEME
	)
}
