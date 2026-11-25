<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type Lenis from "lenis"

const props = defineProps<{
	title: string
	/** Date affichée (ex. « March 12, 2026 »). */
	updated?: string
	/** Date de mise à jour au format ISO (YYYY-MM-DD) : <time>, JSON-LD. Déduite de `updated` si déjà ISO. */
	updatedIso?: string
	/** Meta description (≈ 120–160 caractères), unique par page. Omise si non fournie : Google génère alors son propre extrait. */
	description?: string
	/** URL canonique absolue. Par défaut : origine + chemin courant, sans query ni hash. */
	canonical?: string
	/** Image Open Graph / Twitter (URL absolue). */
	image?: string
	/** true → `noindex, follow`. Par défaut les pages légales sont indexables. */
	noindex?: boolean
}>()

/* ───────── SEO ─────────
   Tout est rendu côté serveur (SSR) : titre, description, canonical, Open Graph et JSON-LD. */
const route = useRoute()
const requestUrl = useRequestURL()

const pageUrl = computed(() => props.canonical ?? `${requestUrl.origin}${route.path}`)
const isoDate = computed(() => {
	if (props.updatedIso) return props.updatedIso
	return props.updated && /^\d{4}-\d{2}-\d{2}/.test(props.updated)
		? props.updated.slice(0, 10)
		: undefined
})

const jsonLd = computed(() => {
	const url = pageUrl.value
	const origin = requestUrl.origin
	const graph = [
		{
			"@type": "WebPage",
			"@id": `${url}#webpage`,
			url,
			name: props.title,
			...(props.description ? { description: props.description } : {}),
			...(isoDate.value ? { dateModified: isoDate.value } : {}),
			isPartOf: { "@type": "WebSite", url: origin },
			breadcrumb: { "@id": `${url}#breadcrumb` },
		},
		{
			"@type": "BreadcrumbList",
			"@id": `${url}#breadcrumb`,
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
				{ "@type": "ListItem", position: 2, name: props.title, item: url },
			],
		},
	]
	// « < » échappé : évite toute fermeture prématurée de la balise <script>.
	return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
		/</g,
		"\\u003c"
	)
})

useSeoMeta({
	title: () => props.title,
	description: () => props.description,
	robots: () =>
		props.noindex
			? "noindex, follow"
			: "index, follow, max-snippet:-1, max-image-preview:large",
	ogType: "website",
	ogTitle: () => props.title,
	ogDescription: () => props.description,
	ogUrl: () => pageUrl.value,
	ogImage: () => props.image,
	twitterCard: () => (props.image ? "summary_large_image" : "summary"),
	twitterTitle: () => props.title,
	twitterDescription: () => props.description,
	twitterImage: () => props.image,
})

useHead({
	link: [{ rel: "canonical", href: pageUrl }],
	script: [{ type: "application/ld+json", innerHTML: jsonLd }],
})

const { gsap, useGsapContext } = useGsap()
const nuxtApp = useNuxtApp()
const lenis = nuxtApp.$lenis as Lenis | undefined

const page = ref<HTMLElement | null>(null)
const sheet = ref<HTMLElement | null>(null)
const article = ref<HTMLElement | null>(null)
const tocList = ref<HTMLElement | null>(null)
const tocIndicator = ref<HTMLElement | null>(null)
const progress = ref<{
	scrollToId: (id: string, options?: { immediate?: boolean; hash?: boolean }) => void
} | null>(null)

const sections = ref<{ id: string; label: string }[]>([])
const active = ref("")
const tocOpen = ref(false)

const activeLabel = computed(
	() => sections.value.find((s) => s.id === active.value)?.label ?? "On this page"
)

/** Infos du hero, calculées côté client à partir du contenu réel. */
const readMinutes = ref(0)
const stats = computed(() => {
	const count = sections.value.length
	if (!readMinutes.value) return ""
	const parts = []
	if (count > 1) parts.push(`${count} sections`)
	parts.push(`${readMinutes.value} min read`)
	return parts.join(" · ")
})

/** Micro-textes du hero (classes Tailwind : détectées par le scanner même dans le <script>). */
const metaText = "font-vg5000 text-xs tracking-[0.02em] text-gray-dark"

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const slugify = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")

/** Cue « Scroll to read » : mène au premier titre, sans toucher à l'URL. */
function scrollToContent() {
	const first = sections.value[0]?.id
	if (first && progress.value) {
		progress.value.scrollToId(first, { hash: false })
		return
	}
	if (!sheet.value) return
	if (lenis) {
		lenis.scrollTo(sheet.value, {
			duration: reduceMotion() ? 0 : 1.4,
			easing: (t: number) => 1 - Math.pow(1 - t, 4),
		})
	} else {
		sheet.value.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" })
	}
}

/** Sommaire → section. On ferme d'abord le menu (mobile) : le scroll se calcule sur le layout final. */
async function go(id: string) {
	tocOpen.value = false
	await nextTick()
	if (progress.value) progress.value.scrollToId(id)
	else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

/* ───────── Sommaire : l'indicateur glisse (effet liquide) ───────── */
const edge = { top: 0, bottom: 0 }
let placed = false
let tocObserver: ResizeObserver | null = null

/* ───────── Numéros de section ─────────
   Ils vivent HORS des <h2> (frères, en position absolue) : le texte du titre,
   le SEO, le sommaire et l'arbre d'accessibilité ne contiennent que le titre.
   Ils restent du vrai texte, donc sélectionnables. */
const indexNodes: { heading: HTMLElement; node: HTMLElement }[] = []
let articleObserver: ResizeObserver | null = null

function layoutIndexes() {
	const root = article.value
	if (!root) return
	const origin = root.getBoundingClientRect().top + root.clientTop

	for (const { heading, node } of indexNodes) {
		const style = getComputedStyle(heading)
		const top =
			heading.getBoundingClientRect().top -
			origin +
			(parseFloat(style.borderTopWidth) || 0) +
			(parseFloat(style.paddingTop) || 0)
		node.style.top = `${top.toFixed(2)}px`
	}
}

function moveIndicator(immediate = false) {
	const indicator = tocIndicator.value
	const list = tocList.value
	const link = list?.querySelector<HTMLElement>("a.active")
	if (!indicator || !list || !link || !list.offsetHeight) {
		placed = false
		return
	}

	const top = link.offsetTop
	const bottom = top + link.offsetHeight

	const apply = () => {
		indicator.style.translate = `0 ${edge.top}px`
		indicator.style.height = `${Math.max(0, edge.bottom - edge.top)}px`
	}

	gsap.killTweensOf(edge)

	if (immediate || !placed || reduceMotion()) {
		edge.top = top
		edge.bottom = bottom
		apply()
		indicator.style.opacity = "1"
		placed = true
		return
	}

	// Le bord d'attaque part vite (léger rebond), le bord de fuite le rattrape :
	// l'indicateur s'étire puis se resserre sur la nouvelle entrée.
	const down = top > edge.top
	gsap.to(edge, {
		top,
		duration: down ? 0.85 : 0.5,
		ease: down ? "expo.out" : "back.out(1.2)",
		onUpdate: apply,
	})
	gsap.to(edge, {
		bottom,
		duration: down ? 0.5 : 0.85,
		ease: down ? "back.out(1.2)" : "expo.out",
		onUpdate: apply,
	})
}

watch(active, () => nextTick(() => moveIndicator()))
watch(sections, async () => {
	await nextTick()
	moveIndicator(true)
})
watch(tocOpen, async () => {
	await nextTick()
	moveIndicator(true)
})

/* ───────── Hero : le contenu remonte et s'efface sous la feuille ───────── */
useGsapContext(() => {
	if (reduceMotion()) return

	gsap.to(".hero-inner", {
		yPercent: -16,
		opacity: 0.1,
		ease: "none",
		scrollTrigger: {
			trigger: ".sheet",
			start: "top bottom",
			end: "top 15%",
			scrub: true,
		},
	})
}, page)

/* ───────── Mount ───────── */
const revealedHeadings: HTMLElement[] = []
type RevealDirective = {
	beforeMount?: (el: HTMLElement, binding: { value: unknown }) => void
	mounted?: (el: HTMLElement, binding: { value: unknown }) => void
	unmounted?: (el: HTMLElement) => void
}
let revealDirective: RevealDirective | undefined

onMounted(async () => {
	const headings = Array.from(
		article.value?.querySelectorAll<HTMLHeadingElement>("h2") ?? []
	)

	const used = new Set<string>()
	const list = headings.map((h, i) => {
		let id = h.id || slugify(h.textContent ?? "") || `section-${i + 1}`
		while (used.has(id)) id = `${id}-${i}`
		used.add(id)
		h.id = id
		return { id, label: (h.textContent ?? "").trim() }
	})
	active.value = list[0]?.id ?? ""
	sections.value = list

	// Numéros de section (voir plus haut) : une seule fois, jamais dans les <h2>.
	article.value?.querySelectorAll(".section-index").forEach((n) => n.remove())
	headings.forEach((heading, i) => {
		const node = document.createElement("span")
		node.className = "section-index"
		node.setAttribute("aria-hidden", "true")
		node.setAttribute("data-nosnippet", "")
		const digits = document.createElement("span")
		digits.textContent = String(i + 1).padStart(2, "0")
		node.append(digits)
		heading.before(node)
		indexNodes.push({ heading, node })
	})
	layoutIndexes()

	if (article.value) {
		articleObserver = new ResizeObserver(layoutIndexes)
		articleObserver.observe(article.value)
	}
	void document.fonts?.ready.then(layoutIndexes)

	const words = (article.value?.textContent ?? "")
		.trim()
		.split(/\s+/)
		.filter(Boolean).length
	readMinutes.value = words ? Math.max(1, Math.round(words / 200)) : 0

	// Les <h2> viennent du slot : on leur applique la directive v-text-reveal à la main.
	revealDirective = nuxtApp.vueApp.directive("text-reveal") as RevealDirective | undefined
	if (revealDirective) {
		const binding = { value: { theme: "violet-light", speed: 70 } }
		for (const h of [...headings, ...indexNodes.map(({ node }) => node)]) {
			revealDirective.beforeMount?.(h, binding)
			revealDirective.mounted?.(h, binding)
			revealedHeadings.push(h)
		}
	}

	if (tocList.value) {
		tocObserver = new ResizeObserver(() => moveIndicator(true))
		tocObserver.observe(tocList.value)
	}

	if (location.hash) {
		const id = decodeURIComponent(location.hash.slice(1))
		await nextTick()
		requestAnimationFrame(() => progress.value?.scrollToId(id, { immediate: true }))
	}
})

onBeforeUnmount(() => {
	tocObserver?.disconnect()
	articleObserver?.disconnect()
	gsap.killTweensOf(edge)
	for (const h of revealedHeadings) revealDirective?.unmounted?.(h)
})
</script>

<template>
	<main ref="page" class="legal-page text-black">
		<UiScrollProgress
			v-if="sections.length > 1"
			ref="progress"
			v-model:active="active"
			:sections="sections"
		/>

		<!-- Hero : reste en place, la feuille passe par-dessus -->
		<header
			class="px-edge sticky top-0 z-0 h-svh min-h-136 bg-white pt-28 pb-[calc(var(--spacing-edge)*2+clamp(1.5rem,4vw,3rem))]"
		>
			<div
				class="hero-inner mx-auto flex h-full max-w-7xl flex-col justify-between gap-8 will-change-[transform,opacity]"
			>
				<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
					<span class="fade" :class="metaText" style="--delay: 0.5s">Legal</span>
					<span v-if="stats" class="fade" :class="metaText" style="--delay: 0.65s">{{
						stats
					}}</span>
				</div>

				<div>
					<!-- Pas de v-text-reveal ici : le <h1> doit être visible dans le HTML serveur (LCP, SEO, sans JS). -->
					<h1
						class="hero-title font-lineal-bold max-w-[12ch] text-[clamp(3.25rem,12vw,10rem)] leading-[0.95] tracking-[-0.03em] text-balance wrap-break-word"
					>
						{{ title }}
					</h1>

					<div
						class="mt-[clamp(1.5rem,3.5vw,2.5rem)] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-black/12 pt-5"
					>
						<p v-if="updated" class="fade" :class="metaText" style="--delay: 0.9s">
							Last updated
							<time v-if="isoDate" :datetime="isoDate">{{ updated }}</time>
							<template v-else>{{ updated }}</template>
						</p>

						<button
							type="button"
							class="fade focus-visible:outline-violet inline-flex cursor-pointer items-center gap-3 rounded-xs p-0 transition-colors duration-300 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
							:class="metaText"
							style="--delay: 1.1s"
							@click="scrollToContent"
						>
							Scroll to read
							<span
								class="cue-line relative block h-9 w-px overflow-hidden bg-black/12"
								aria-hidden="true"
							/>
						</button>
					</div>
				</div>
			</div>
		</header>

		<!-- Feuille -->
		<div
			ref="sheet"
			class="sheet bg-gray-light px-edge lg:pb-section relative z-10 mt-[calc(-2*var(--spacing-edge))] rounded-t-[clamp(1.25rem,3vw,2rem)] pt-[clamp(2.5rem,7vw,6rem)] pb-[calc(var(--spacing-section)+4.5rem)] lg:pr-[calc(var(--spacing-edge)+4.5rem)]"
		>
			<div
				class="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-x-[clamp(2rem,5vw,6rem)]"
			>
				<aside
					v-if="sections.length > 1"
					class="relative lg:sticky lg:top-28 lg:col-start-1 lg:row-start-1"
					data-nosnippet
				>
					<button
						type="button"
						class="toc-toggle"
						:aria-expanded="tocOpen"
						aria-controls="legal-toc"
						@click="tocOpen = !tocOpen"
					>
						<span class="toc-toggle-text">{{ activeLabel }}</span>
						<svg
							class="toc-chevron"
							:class="{ open: tocOpen }"
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M3 6l5 5 5-5"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					<nav
						id="legal-toc"
						class="toc-nav"
						:class="{ open: tocOpen }"
						aria-label="On this page"
						data-lenis-prevent
					>
						<p class="toc-label">On this page</p>
						<div ref="tocList" class="toc-list">
							<span ref="tocIndicator" class="toc-indicator" aria-hidden="true" />
							<ol>
								<li v-for="(s, i) in sections" :key="s.id">
									<a
										:href="`#${s.id}`"
										:class="{ active: active === s.id }"
										:aria-current="active === s.id ? 'true' : undefined"
										@click.prevent="go(s.id)"
									>
										<span class="toc-num">{{ String(i + 1).padStart(2, "0") }}</span>
										<span>{{ s.label }}</span>
									</a>
								</li>
							</ol>
						</div>
					</nav>
				</aside>

				<article
					ref="article"
					class="prose font-lineal-regular text-black-light relative max-w-176 text-base leading-[1.75] lg:col-start-2 lg:row-start-1"
				>
					<slot />
				</article>
			</div>
		</div>
	</main>
</template>

<style scoped>
.legal-page {
	--line: color-mix(in oklch, var(--color-black) 12%, transparent);
	--num-w: clamp(3.25rem, 6vw, 4.5rem);
	/* Échelle du numéro par rapport au titre (1 = même taille). Ajuste finement si VG5000 paraît plus grand/petit que Lineal. */
	--index-scale: 1;
}

/* ───────── Animations ─────────
   Gardées ici : Vue (scoped) réécrit les noms de @keyframes ET leurs références dans ce bloc. */
.fade {
	animation: fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) var(--delay, 0s) both;
}
@keyframes fade-up {
	from {
		opacity: 0;
		translate: 0 0.75rem;
	}
	to {
		opacity: 1;
		translate: 0 0;
	}
}

/* Entrée par translation seule : le texte reste visible dès le premier rendu (LCP, sans JS). */
.hero-title {
	animation: title-in 1s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes title-in {
	from {
		translate: 0 0.2em;
	}
	to {
		translate: 0 0;
	}
}

/* Cue de scroll : fine ligne qui se trace en boucle. */
.cue-line::after {
	content: "";
	position: absolute;
	inset: 0;
	background: var(--color-black);
	transform-origin: top;
	transform: scaleY(0);
	animation: cue-draw 2.2s cubic-bezier(0.65, 0, 0.35, 1) 1.6s infinite;
}
@keyframes cue-draw {
	0% {
		transform: scaleY(0);
		transform-origin: top;
	}
	50% {
		transform: scaleY(1);
		transform-origin: top;
	}
	50.01% {
		transform: scaleY(1);
		transform-origin: bottom;
	}
	100% {
		transform: scaleY(0);
		transform-origin: bottom;
	}
}

/* ───────── Sommaire ───────── */
.toc-toggle {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem 1.25rem;
	border-radius: 1.25rem;
	background: var(--color-white);
	font-family: var(--font-lineal);
	font-variation-settings: "wght" var(--lineal-weight-medium);
	font-size: var(--text-base);
	text-align: left;
	cursor: pointer;
}
.toc-toggle-text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.toc-toggle:focus-visible,
.toc-nav a:focus-visible {
	outline: 2px solid var(--color-violet);
	outline-offset: 2px;
}
.toc-chevron {
	flex: none;
	transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.toc-chevron.open {
	transform: rotate(180deg);
}

/* Mobile : le menu est un dropdown en position absolue. Il recouvre le contenu au lieu de
   le pousser : ouvrir/fermer le menu ne change JAMAIS la position des titres, donc les
   ancres et la règle de droite/bas restent synchronisées. */
.toc-nav {
	display: none;
	position: absolute;
	inset-inline: 0;
	top: 100%;
	z-index: 30;
	max-height: min(50svh, 22rem);
	margin-top: 0.5rem;
	padding: 0.5rem;
	overflow-y: auto;
	overscroll-behavior: contain;
	border-radius: 1rem;
	background: var(--color-white);
	box-shadow: 0 1rem 2.5rem -1rem rgb(0 0 0 / 0.25);
}
.toc-nav.open {
	display: block;
}
.toc-label {
	display: none;
}

@media (min-width: 64rem) {
	.toc-toggle {
		display: none;
	}
	.toc-nav {
		display: block;
		position: static;
		z-index: auto;
		max-height: calc(100svh - 11rem);
		margin: 0;
		padding: 0;
		background: transparent;
		box-shadow: none;
		scrollbar-width: none;
	}
	.toc-nav::-webkit-scrollbar {
		display: none;
	}
	.toc-label {
		display: block;
		margin: 0 0 1rem 1rem;
		font-family: var(--font-vg5000);
		font-size: var(--text-sm);
		color: var(--color-gray-dark);
	}
}

.toc-list {
	position: relative;
}
.toc-indicator {
	position: absolute;
	inset-inline: 0;
	top: 0;
	height: 0;
	border-radius: 1rem;
	background: var(--color-white);
	opacity: 0;
	pointer-events: none;
	will-change: translate, height;
}
.toc-list ol {
	position: relative;
	z-index: 1;
	display: grid;
	gap: 0.125rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.toc-nav a {
	display: flex;
	gap: 1rem;
	align-items: baseline;
	padding: 0.8rem 1rem;
	border-radius: 1rem;
	font-family: var(--font-lineal);
	font-variation-settings: "wght" var(--lineal-weight-medium);
	font-size: var(--text-base);
	line-height: 1.3;
	color: var(--color-gray-dark);
	text-decoration: none;
	text-wrap: pretty;
	cursor: pointer;
	-webkit-user-select: text;
	user-select: text;
	-webkit-tap-highlight-color: transparent;
	transition: color 0.35s ease;
}
.toc-nav a > span:last-child {
	transition: translate 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.toc-num {
	flex: none;
	font-family: var(--font-vg5000);
	font-variation-settings: normal;
	font-size: var(--text-sm);
	opacity: 0.7;
	transition: opacity 0.35s ease;
}
@media (hover: hover) {
	.toc-nav a:hover {
		color: var(--color-black);
	}
	.toc-nav a:hover > span:last-child {
		translate: 0.25rem 0;
	}
}
.toc-nav a.active {
	color: var(--color-black);
}
.toc-nav a.active .toc-num {
	opacity: 1;
}

/* ───────── Prose ───────── */

/* Pas de flex ici : text-reveal découpe le texte en <span>, un conteneur flex les éclaterait.
   Le titre est décalé de --num-w ; le numéro (.section-index, frère du h2) occupe cet espace. */
.prose :deep(h2) {
	margin: clamp(3rem, 7vw, 4.5rem) 0 1.25rem;
	padding: clamp(1.5rem, 4vw, 2.5rem) 0 0 var(--num-w);
	border-top: 1px solid var(--line);
	scroll-margin-top: 6rem;
	font-family: var(--font-lineal);
	font-variation-settings: "wght" var(--lineal-weight-bold);
	font-size: var(--text-3xl);
	line-height: 1.1;
	letter-spacing: -0.02em;
	color: var(--color-black);
	text-wrap: balance;
}
.prose :deep(h2:first-child),
.prose :deep(.section-index:first-child + h2) {
	margin-top: 0;
	padding-top: 0;
	border-top: 0;
}
/* Reprend exactement la typo / line-height du h2 : la ligne de base est identique,
   puis le chiffre passe en VG5000 (inline, line-height: 0 → n'influence pas la ligne). */
.prose :deep(.section-index) {
	position: absolute;
	left: 0;
	inline-size: var(--num-w);
	font-family: var(--font-lineal);
	font-variation-settings: "wght" var(--lineal-weight-bold);
	font-size: var(--text-3xl);
	line-height: 1.1;
	letter-spacing: -0.02em;
	white-space: nowrap;
	color: var(--color-violet);
}
.prose :deep(.section-index > span) {
	font-family: var(--font-vg5000);
	font-variation-settings: normal;
	font-size: calc(1em * var(--index-scale));
	line-height: 0;
	letter-spacing: 0;
}

.prose :deep(h3) {
	margin: 2rem 0 0.5rem;
	font-family: var(--font-lineal);
	font-variation-settings: "wght" var(--lineal-weight-medium);
	font-size: var(--text-xl);
	line-height: 1.25;
	letter-spacing: -0.01em;
	color: var(--color-black);
}

.prose :deep(p),
.prose :deep(ul),
.prose :deep(ol) {
	margin: 0 0 1.25rem;
}

.prose :deep(ul),
.prose :deep(ol) {
	padding-left: 1.4rem;
}
.prose :deep(ul) {
	list-style: disc;
}
.prose :deep(ol) {
	list-style: decimal;
}
.prose :deep(li) {
	margin-bottom: 0.5rem;
	padding-left: 0.25rem;
}
.prose :deep(li::marker) {
	color: var(--color-gray-dark);
}

.prose :deep(strong) {
	font-variation-settings: "wght" var(--lineal-weight-bold);
	color: var(--color-black);
}

.prose :deep(a) {
	color: var(--color-black);
	text-decoration: underline;
	text-decoration-color: color-mix(in oklch, var(--color-black) 30%, transparent);
	text-decoration-thickness: 1px;
	text-underline-offset: 4px;
	transition: text-decoration-color 0.3s ease;
}
@media (hover: hover) {
	.prose :deep(a:hover) {
		text-decoration-color: var(--color-violet);
	}
}
.prose :deep(a:focus-visible) {
	outline: 2px solid var(--color-violet);
	outline-offset: 3px;
	border-radius: 2px;
}

.prose :deep(code) {
	padding: 0.15em 0.45em;
	border-radius: 0.4rem;
	background: var(--color-white);
	font-family: var(--font-vg5000);
	font-size: 0.85em;
	color: var(--color-black);
}

.prose :deep(blockquote) {
	margin: 2rem 0;
	padding: 0 0 0 1.25rem;
	border-left: 2px solid var(--color-violet-light);
}
.prose :deep(blockquote p:last-child) {
	margin-bottom: 0;
}

.prose :deep(hr) {
	margin: 3rem 0;
	border: 0;
	border-top: 1px solid var(--line);
}

.prose :deep(table) {
	display: block;
	max-width: 100%;
	overflow-x: auto;
	margin: 0 0 1.5rem;
	border-collapse: collapse;
	font-size: var(--text-sm);
}
.prose :deep(th),
.prose :deep(td) {
	padding: 0.75rem 1rem;
	text-align: left;
	vertical-align: top;
	border-bottom: 1px solid var(--line);
}
.prose :deep(th) {
	font-variation-settings: "wght" var(--lineal-weight-bold);
	color: var(--color-black);
	white-space: nowrap;
}

/* ───────── Motion ───────── */
@media (prefers-reduced-motion: reduce) {
	.fade,
	.hero-title,
	.cue-line::after {
		animation: none;
	}
	.cue-line::after {
		transform: scaleY(1);
	}
	.hero-inner,
	.toc-indicator {
		will-change: auto;
	}
	.toc-chevron,
	.toc-nav a,
	.toc-nav a > span:last-child,
	.toc-num,
	.prose :deep(a) {
		transition: none;
	}
}
</style>