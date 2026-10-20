export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.hook("app:mounted", () => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				document.documentElement.classList.add("theme-ready")
			})
		})
	})
})
