import type { SiteTheme } from "@/types/theme"

/** Lets the page transition reveal the new page before the whole site changes colour. */
const THEME_SWITCH_DELAY_MS = 1000

/**
 * Keeps the site theme in step with the visible page. Call it once, from `app.vue`: it owns the
 * `data-theme` attribute on <html> and the delayed switch, and everything that follows the theme
 * (background, loop, footer, scrollbar) simply reads `useSiteTheme()`.
 *
 * Each page picks its theme with `definePageMeta({ footerTheme: "lime" })`. An overlay keeps the
 * theme of the page behind it, exactly as if the visitor had not left it.
 */
export function useSiteThemeSync() {
	const visibleRoute = useVisibleRoute()
	const siteTheme = useSiteTheme()

	const routeTheme = computed<SiteTheme>(
		() => visibleRoute.value.meta.footerTheme ?? DEFAULT_SITE_THEME
	)

	// `data-theme` on <html> drives the page background and every themed variable.
	useHead({
		htmlAttrs: { "data-theme": siteTheme },
	})

	let themeTimeout: ReturnType<typeof setTimeout> | undefined

	// Watches the theme, not the path: opening or closing an overlay changes nothing.
	watch(routeTheme, (theme) => {
		clearTimeout(themeTimeout)
		themeTimeout = setTimeout(() => {
			siteTheme.value = theme
		}, THEME_SWITCH_DELAY_MS)
	})

	onScopeDispose(() => clearTimeout(themeTimeout))
}
