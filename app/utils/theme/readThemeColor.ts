/**
 * Lit une couleur définie par Tailwind (bloc `@theme`, ex. `--color-lime`) directement sur `:root`,
 * pour que le badge 3D reste en phase si le thème change, sans dupliquer les valeurs en dur.
 * `fallback` est utilisé côté serveur (pas de `document`) et si la variable n'est pas encore posée.
 */
export function readThemeColor(color: string | undefined, fallback: string): string {
	if (typeof document === "undefined" || !color) return fallback

	const variable = color.replace(/^var\((.+)\)$/, "$1").trim()

	if (!variable.startsWith("--")) {
		return color
	}

	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(variable)
		.trim()

	return value || fallback
}
/**
 * Ajoute (ou remplace) le canal alpha d'une couleur CSS Color 4 (`oklch(...)`, `rgb(...)`, etc.)
 * via la syntaxe `/ alpha%`, supportée par ces mêmes navigateurs. `alpha` est une fraction 0–1,
 * comme `ctx.globalAlpha`, pour rester cohérent avec le reste du code de dessin.
 */
export function withAlpha(color: string, alpha: number): string {
	const withoutAlpha = color.replace(/\s*\/\s*[\d.]+%?\s*\)$/, ")") // retire un alpha déjà présent
	return withoutAlpha.replace(/\)\s*$/, ` / ${Math.round(alpha * 100)}%)`)
}
