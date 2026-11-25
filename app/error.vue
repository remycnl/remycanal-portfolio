<script setup lang="ts">
import type { NuxtError } from "#app"
import { LEGAL } from "@/constants/legal"

const props = defineProps<{ error: NuxtError }>()

const route = useRoute()
const router = useRouter()
const requestUrl = useRequestURL()
const isDev = import.meta.dev
const heading = useTemplateRef<HTMLElement>("heading")
const canGoBack = ref(false)
const copied = ref(false)

const MESSAGES: Record<number, { title: string; text: string }> = {
	400: {
		title: "Bad request",
		text: "The request could not be understood. Please check it and try again.",
	},
	401: {
		title: "Authentication required",
		text: "You need to be signed in to see this page.",
	},
	403: { title: "Access denied", text: "You don't have permission to view this page." },
	404: {
		title: "Page not found",
		text: "This page doesn't exist, or it has been moved or removed.",
	},
	405: { title: "Method not allowed", text: "This action isn't supported here." },
	408: {
		title: "Request timed out",
		text: "The request took too long. Please try again.",
	},
	410: { title: "Page removed", text: "This page has been permanently removed." },
	429: {
		title: "Too many requests",
		text: "You're going a bit fast. Please wait a moment and try again.",
	},
	500: {
		title: "Something went wrong",
		text: "An unexpected error occurred on my side. It isn't you.",
	},
	502: {
		title: "Bad gateway",
		text: "A service this page depends on isn't responding properly. Please try again shortly.",
	},
	503: {
		title: "Temporarily unavailable",
		text: "The website is temporarily unavailable. Please try again in a few minutes.",
	},
	504: {
		title: "Gateway timeout",
		text: "A service took too long to respond. Please try again shortly.",
	},
}

const code = computed(() => props.error.status ?? 500)

const info = computed(
	() =>
		MESSAGES[code.value] ??
		(code.value >= 500
			? MESSAGES[500]!
			: { title: "Request error", text: "This request couldn't be completed." })
)

// Réessayer n'a de sens que pour une erreur serveur, un timeout ou un rate limit
const canRetry = computed(
	() => code.value >= 500 || code.value === 408 || code.value === 429
)

const attemptedPath = computed(() => route.fullPath)
const pageUrl = computed(() => `${requestUrl.origin}${route.fullPath}`)

// Email de signalement pré-rempli (sauts de ligne CRLF, compatibles Outlook / Gmail / Apple Mail)
const reportHref = computed(() => {
	const siteName = new URL(LEGAL.url).hostname.replace(/^www\./, "")
	const subject = `[${siteName}] ${code.value} - ${info.value.title}`
	const body = [
		"Hi,",
		"",
		"I ran into an error on your website.",
		"",
		`Error: ${code.value} - ${info.value.title}`,
		`Page: ${pageUrl.value}`,
		"",
		"What I was trying to do:",
		"",
		"",
		"Thanks!",
	].join("\r\n")
	return `mailto:${LEGAL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

// Détails techniques : uniquement en développement, jamais en production
const devStack = computed(() =>
	props.error.stack ? String(props.error.stack).replace(/<[^>]+>/g, "") : ""
)

useSeoMeta({
	title: `${code.value} – ${info.value.title}`,
	description: info.value.text,
	robots: "noindex, nofollow",
})
useHead({ bodyAttrs: { class: "bg-black" } })

const goHome = () => clearError({ redirect: "/" })
const retry = () => clearError()
const goBack = () => clearError().then(() => router.back())

// Filet de sécurité si aucun client mail n'est configuré
const copyEmail = async () => {
	try {
		await navigator.clipboard.writeText(LEGAL.email)
		copied.value = true
		setTimeout(() => (copied.value = false), 2500)
	} catch {
		copied.value = false
	}
}

onMounted(() => {
	canGoBack.value = !!window.history.state?.back
	heading.value?.focus()
})
</script>

<template>
	<div
		class="relative isolate grid min-h-dvh grid-rows-[1fr_auto] overflow-hidden bg-black text-center text-white"
	>
		<!-- Logo immense en fond, ancré en bas à gauche, qui dépasse volontairement -->
		<div
			aria-hidden="true"
			class="logo-mark pointer-events-none absolute bottom-0 left-0 -z-10 aspect-square h-[clamp(28rem,105dvh,80rem)] translate-x-[-8%] translate-y-[12%]"
		/>

		<main
			class="px-edge py-section flex flex-col items-center justify-center gap-[clamp(1.5rem,4vw,3rem)]"
		>
			<p
				aria-hidden="true"
				class="font-lineal-heavy text-lime text-[clamp(7rem,30vw,24rem)] leading-[0.78] tracking-tighter"
			>
				{{ code }}
			</p>

			<div class="flex max-w-2xl flex-col items-center gap-4" role="alert">
				<h1
					ref="heading"
					tabindex="-1"
					class="font-lineal-bold leading-fit text-4xl outline-none sm:text-5xl"
				>
					{{ info.title }}
				</h1>
				<p class="text-gray-light/70 text-lg">{{ info.text }}</p>
				<p v-if="code === 404" class="font-vg5000 text-gray-light/70 text-sm break-all">
					{{ attemptedPath }}
				</p>
			</div>

			<nav
				aria-label="Error recovery"
				class="flex flex-wrap items-center justify-center gap-4"
			>
				<UiAnimatedButton
					label="Back to home"
					size="medium"
					pill="white"
					bubble="lime"
					:nuxtlink="false"
					@click="goHome"
				/>
				<UiAnimatedButton
					v-if="canRetry"
					label="Try again"
					size="medium"
					pill="white"
					bubble="lime"
					:nuxtlink="false"
					@click="retry"
				/>
				<UiAnimatedButton
					v-if="canGoBack && !canRetry"
					label="Go back"
					size="medium"
					pill="white"
					bubble="lime"
					:nuxtlink="false"
					@click="goBack"
				/>
			</nav>

			<!-- Développement uniquement -->
			<details
				v-if="isDev"
				class="font-vg5000 mx-auto h-fit w-fit max-w-full rounded-2xl border border-white/15 bg-black p-4 text-left text-sm"
				open
			>
				<summary class="cursor-pointer">Developer details</summary>
				<dl class="mt-3 grid gap-1">
					<div>
						<dt class="inline">Status:</dt>
						{{ error.status }} {{ error.statusText }}
					</div>
					<div>
						<dt class="inline">Message:</dt>
						{{ error.message }}
					</div>
					<div>
						<dt class="inline">Path:</dt>
						{{ route.fullPath }}
					</div>
				</dl>
				<pre
					v-if="devStack"
					class="mt-3 max-h-full max-w-full overflow-auto text-xs whitespace-pre-wrap"
					>{{ devStack }}</pre>
			</details>
		</main>

		<footer
			class="px-edge py-edge font-vg5000 text-gray-light/70 flex flex-col items-center gap-3 text-sm"
		>
			<p>Is this a problem on my side?</p>
			<p class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
				<a
					:href="reportHref"
					class="decoration-lime hover:text-lime focus-visible:outline-lime text-white underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					Report this problem
				</a>
				<button
					type="button"
					class="focus-visible:outline-lime underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
					@click="copyEmail"
				>
					{{ copied ? "Email copied" : "Copy email" }}
				</button>
			</p>
			<span class="sr-only" role="status">{{
				copied ? "Email address copied to clipboard" : ""
			}}</span>
		</footer>
	</div>
</template>

<style scoped>
/* Le SVG sert de masque : seule sa forme compte, la couleur vient de --color-black-light */
.logo-mark {
	background-color: var(--color-black-light);
	-webkit-mask: url("/logos/R-white.svg") no-repeat left bottom / contain;
	mask: url("/logos/R-white.svg") no-repeat left bottom / contain;
}
</style>
