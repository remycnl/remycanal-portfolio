const svgToDataUri = require("mini-svg-data-uri");
const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./components/**/*.{js,vue,ts}",
		"./layouts/**/*.vue",
		"./pages/**/*.vue",
		"./plugins/**/*.{js,ts}",
		"./assets/**/*.{js,ts}",
		"./error.vue",
	],
	theme: {
		extend: {
			colors: {
				black: {
					DEFAULT: "#111319",
					dark: "#020617",
				},
				white: "#D0D4DB",
				primary: "#0f172a",
				secondary: {
					DEFAULT: "var(--primary-color)",
					dark: "var(--secondary-color)",
					transparent: "var(--primary-color-transparent)",
				},
				gray: {
					light: "#8c99b0",
					semi: "#334054",
					medium: "#8c99b0a2",
					dark: "#1f293b",
				},
			},
			boxShadow: {
				around: "0 0 30px rgba(0, 0, 0, 0.5)",
			},
			borderWidth: {
				3: "3px",
			},
		},
	},
	options: {
		safelist: ['box-shadow'],
	},
	plugins: [
		addVariablesForColors,
		function ({ matchUtilities, theme }) {
			matchUtilities(
				{
					"bg-dot": (value) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
						)}")`,
					}),
				},
				{ values: flattenColorPalette(theme("backgroundColor")), type: "color" }
			);
		},
	],
};

// Function to add color variables as CSS custom properties
function addVariablesForColors({ addBase, theme }) {
	const allColors = flattenColorPalette(theme("colors"));
	const newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	);

	addBase({
		":root": newVars,
	});
}
