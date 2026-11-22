import type { SiteTheme } from "@/types/theme"

export const DEFAULT_SITE_THEME: SiteTheme = "violet"

/**
 * The theme currently displayed by the site: background, loop, footer and scrollbar all follow it.
 * It is kept in step with the visible page, with a delay, by `useSiteThemeSync()` (called from
 * app.vue), so that it changes once the page transition has revealed the new page.
 */
export function useSiteTheme() {
	const visibleRoute = useVisibleRoute()

	return useState<SiteTheme>(
		"site-theme",
		() => visibleRoute.value.meta.footerTheme ?? DEFAULT_SITE_THEME
	)
}
