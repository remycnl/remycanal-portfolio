<script setup lang="ts">
import type { PDFDocumentLoadingTask, PDFPageProxy } from "pdfjs-dist"

const { src, label, active } = defineProps<{
	src: string
	/** Alt de l'image, ou nom du document. */
	label: string
	/** Charge l'aperçu : le panneau est ouvert ou sur le point de l'être (survol, focus). */
	active: boolean
}>()

const IMAGE_EXTENSIONS = new Set(["AVIF", "GIF", "JPEG", "JPG", "PNG", "SVG", "WEBP"])

/** Hauteur CSS maximale de la vignette (sm:h-40) : sert à dimensionner son rendu PDF. */
const PREVIEW_HEIGHT = 160

/** Un PDF mesure ses pages en points (1/72 pouce) ; le CSS en pixels (1/96 pouce). */
const CSS_PX_PER_POINT = 96 / 72

const extension = fileExtension(src)
const kind =
	extension === "PDF"
		? "pdf"
		: extension && IMAGE_EXTENSIONS.has(extension)
			? "image"
			: "file"

const frame = useTemplateRef<HTMLElement>("frame")
const thumbImage = useTemplateRef<HTMLImageElement>("thumbImage")
const thumbCanvas = useTemplateRef<HTMLCanvasElement>("thumbCanvas")

const ready = ref(false)
const failed = ref(false)

/** Largeur d'origine du fichier en pixels CSS : celle de la page pour un PDF (une image la donne elle-même). */
let pdfWidth = 0

let disposed = false

/* ------------------------------ Rendu du PDF ------------------------------ */

/** Copie `source` dans `target`, pixel pour pixel (redimensionner `target` l'efface, d'où la copie en une fois). */
function paint(target: HTMLCanvasElement, source: HTMLCanvasElement) {
	target.width = source.width
	target.height = source.height
	target.getContext("2d")?.drawImage(source, 0, 0)
}

/*
 * pdf.js se charge à la demande, jamais dans le bundle initial, et son worker traite le fichier hors
 * du thread principal. Le document n'est chargé qu'une fois et gardé jusqu'au démontage : la vignette,
 * puis la version nette de l'agrandissement, réutilisent la même page sans retélécharger ni
 * réanalyser le fichier.
 */
let pdfTask: PDFDocumentLoadingTask | undefined
let pdfPage: Promise<PDFPageProxy> | undefined

function loadFirstPage() {
	pdfPage ??= (async () => {
		const [pdfjs, worker] = await Promise.all([
			import("pdfjs-dist"),
			import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
		])

		pdfjs.GlobalWorkerOptions.workerSrc = worker.default

		const task = pdfjs.getDocument({ url: src })

		pdfTask = task

		const pdf = await task.promise

		return pdf.getPage(1)
	})()

	return pdfPage
}

/**
 * Rend la première page d'un PDF sur un canvas hors écran, à la hauteur CSS demandée (×DPR,
 * plafonné à 2). Renvoie ce canvas et la largeur d'origine de la page en pixels CSS.
 * Le canvas prend le ratio réel de la page (portrait, paysage, peu importe).
 */
async function renderFirstPage(cssHeight: number) {
	const page = await loadFirstPage()
	const base = page.getViewport({ scale: 1 })
	const viewport = page.getViewport({
		scale: (cssHeight * Math.min(window.devicePixelRatio, 2)) / base.height,
	})

	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d")

	if (!context) {
		throw new Error("2D canvas context unavailable")
	}

	canvas.width = Math.round(viewport.width)
	canvas.height = Math.round(viewport.height)

	await page.render({ canvasContext: context, canvas, viewport } as Parameters<
		typeof page.render
	>[0]).promise

	return { canvas, width: base.width * CSS_PX_PER_POINT }
}

let requested = false

async function renderThumbnail() {
	requested = true

	try {
		const { canvas, width } = await renderFirstPage(PREVIEW_HEIGHT)
		const target = thumbCanvas.value

		pdfWidth = width

		if (target) {
			paint(target, canvas)
		}

		ready.value = Boolean(target)
	} catch (error) {
		failed.value = true

		if (import.meta.dev) {
			console.error(`[ResumeCvPreview] Could not render ${src}`, error)
		}
	}
}

watch(
	() => active,
	(isActive) => {
		if (isActive && kind === "pdf" && !requested) {
			void renderThumbnail()
		}
	},
	{ immediate: true }
)

/* ----------------------------- Agrandissement ----------------------------- */

/*
 * Au clic, la vignette « décolle » et s'agrandit jusqu'au centre de l'écran, puis revient à sa place
 * à la fermeture (FLIP). Tout passe par `transform` et `opacity`, animés par le compositeur :
 * aucun layout, aucun flou d'arrière-plan, aucun lag.
 * <dialog> + showModal() : l'élément vit dans le « top layer », donc au-dessus de tout (même du
 * `isolate z-10` du CV et des `overflow-hidden` du panneau), avec le focus piégé, le reste de la
 * page inerte et Échap géré nativement.
 *
 * Exactitude des tailles :
 * - l'animation part du rectangle réel de l'image / du canvas (pas du cadre, bordure comprise) ;
 * - Lenis est figé avant la mesure : la page ne glisse plus entre la mesure et l'animation ;
 * - la courbe n'a aucun dépassement : la taille ne dépasse jamais la taille finale ;
 * - la taille finale ne dépasse jamais celle du fichier d'origine.
 */
const EASE_OPEN = "cubic-bezier(.16,1,.3,1)"
const EASE_CLOSE = "cubic-bezier(.65,0,.35,1)"
const OPEN_DURATION = 600
const CLOSE_DURATION = 380

const dialog = useTemplateRef<HTMLDialogElement>("dialog")
const stage = useTemplateRef<HTMLElement>("stage")
const zoomCanvas = useTemplateRef<HTMLCanvasElement>("zoomCanvas")

const expanded = ref(false)
const shown = ref(false)
// La vignette d'origine s'efface pendant que sa copie agrandie la remplace.
const covered = ref(false)

let ratio = 1
let size = { width: 0, height: 0 }
let closing = false

const zoomable = computed(() => kind !== "file" && ready.value && !failed.value)

const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Rectangle réel du média affiché dans la vignette (sans la bordure du cadre). */
function mediaRect() {
	const media = kind === "pdf" ? thumbCanvas.value : thumbImage.value

	return (media ?? frame.value)?.getBoundingClientRect()
}

/** Ratio réel du média affiché dans la vignette. */
function measureRatio(fallback = 1) {
	const canvas = thumbCanvas.value
	const image = thumbImage.value

	if (kind === "pdf" && canvas) {
		return canvas.width / canvas.height
	}

	if (image?.naturalWidth) {
		return image.naturalWidth / image.naturalHeight
	}

	return fallback
}

/** Zone d'affichage de l'aperçu : le <dialog> plein écran, tel qu'il est vraiment peint. */
function viewportBox() {
	return (
		dialog.value?.getBoundingClientRect() ??
		new DOMRect(
			0,
			0,
			document.documentElement.clientWidth,
			document.documentElement.clientHeight
		)
	)
}

/** La plus grande taille qui tienne à l'écran avec le ratio du fichier, sans jamais dépasser sa taille d'origine. */
function fit() {
	const view = viewportBox()
	const original = kind === "image" ? (thumbImage.value?.naturalWidth ?? 0) : pdfWidth

	let width = Math.min(view.width * 0.92, view.height * 0.8 * ratio)

	if (original && width > original) {
		width = original
	}

	return { width: Math.round(width), height: Math.round(width / ratio) }
}

function applySize() {
	size = fit()

	const box = stage.value

	if (box) {
		box.style.width = `${size.width}px`
		box.style.height = `${size.height}px`
	}
}

/** Transform qui ramène la boîte agrandie (centrée dans l'écran) exactement sur le rectangle `rect`. */
function flipTo(rect: DOMRect) {
	const view = viewportBox()
	const dx = rect.left + rect.width / 2 - (view.left + view.width / 2)
	const dy = rect.top + rect.height / 2 - (view.top + view.height / 2)

	return `translate(${dx}px, ${dy}px) scale(${rect.width / size.width})`
}

/* ---------------------------- Version nette (PDF) --------------------------- */

/*
 * Agrandi, le PDF a besoin de bien plus de pixels que la vignette. Le rendre seulement à l'ouverture
 * laissait voir la vignette étirée (donc floue) le temps du calcul. On le prépare donc d'avance, au
 * repos, dès que la vignette est prête : l'ouverture n'a plus qu'à le coller. Si la fenêtre a trop
 * changé de taille entre-temps, l'ouverture colle d'abord la version déjà prête, puis en rend une
 * nouvelle à la bonne taille.
 */
let sharp: HTMLCanvasElement | undefined
/** Hauteur CSS pour laquelle `sharp` a été rendu. */
let sharpHeight = 0
let sharpRunning = false

function sharpen(cssHeight: number) {
	// Une version rendue au moins à 95 % de la taille voulue suffit.
	if (sharpRunning || (sharp && sharpHeight >= cssHeight * 0.95)) {
		return
	}

	sharpRunning = true

	void renderFirstPage(cssHeight)
		.then(({ canvas }) => {
			sharp = canvas
			sharpHeight = cssHeight

			// L'aperçu a pu s'ouvrir pendant le rendu : on remplace alors les pixels d'un seul coup.
			if (zoomCanvas.value && expanded.value) {
				paint(zoomCanvas.value, canvas)
			}
		})
		.catch((error) => {
			if (import.meta.dev) {
				console.error(`[ResumeCvPreview] Could not sharpen ${src}`, error)
			}
		})
		.finally(() => {
			sharpRunning = false
		})
}

watch(ready, (isReady) => {
	if (!isReady || kind !== "pdf") {
		return
	}

	const prepare = () => {
		if (disposed) {
			return
		}

		ratio = measureRatio()
		sharpen(fit().height)
	}

	if ("requestIdleCallback" in window) {
		window.requestIdleCallback(prepare, { timeout: 1500 })
	} else {
		setTimeout(prepare, 300)
	}
})

async function expand() {
	if (expanded.value) {
		return
	}

	// Lenis fige la page tout de suite : la vignette ne bouge plus entre la mesure et l'animation.
	const lenis = useNuxtApp().$lenis

	lenis?.stop()

	const from = mediaRect()
	const canvas = thumbCanvas.value

	if (!from) {
		lenis?.start()
		return
	}

	ratio = measureRatio(from.width / from.height)

	expanded.value = true
	await nextTick()

	const box = stage.value
	const modal = dialog.value

	if (!box || !modal) {
		expanded.value = false
		lenis?.start()
		return
	}

	// Ouvrir d'abord : la taille se calcule sur la vraie zone peinte du <dialog>. Tout ce qui suit
	// se fait dans la même tâche, avant le premier rendu : rien n'est jamais vu à une taille intermédiaire.
	modal.showModal()
	applySize()

	if (kind === "pdf" && zoomCanvas.value) {
		// La version nette est prête d'avance dans la plupart des cas ; sinon la vignette fait patienter.
		const source = sharp ?? canvas

		if (source) {
			paint(zoomCanvas.value, source)
		}
	}

	covered.value = true
	shown.value = true
	window.addEventListener("resize", applySize)

	if (!prefersReducedMotion()) {
		box.animate([{ transform: flipTo(from) }, { transform: "none" }], {
			duration: OPEN_DURATION,
			easing: EASE_OPEN,
		})
	}

	if (kind === "pdf") {
		// Ne fait rien si la version préparée a déjà la bonne taille.
		sharpen(size.height)
	}
}

async function collapse() {
	const box = stage.value
	const to = mediaRect()

	if (!expanded.value || closing) {
		return
	}

	closing = true
	shown.value = false

	if (box && to && !prefersReducedMotion()) {
		// Part de l'état courant : fermer en plein milieu de l'ouverture ne produit aucun saut.
		const current = getComputedStyle(box).transform

		for (const animation of box.getAnimations()) {
			animation.cancel()
		}

		try {
			await box.animate([{ transform: current }, { transform: flipTo(to) }], {
				duration: CLOSE_DURATION,
				easing: EASE_CLOSE,
				fill: "forwards",
			}).finished
		} catch {
			// Animation annulée (démontage) : on ferme quand même.
		}
	}

	covered.value = false
	dialog.value?.close()
	expanded.value = false
	window.removeEventListener("resize", applySize)
	useNuxtApp().$lenis?.start()
	closing = false
}

/** Clic sur la vignette : agrandit si possible, sinon le lien s'ouvre normalement. */
function activate(event: Event) {
	if (!zoomable.value) {
		return
	}

	event.preventDefault()
	void expand()
}

onBeforeUnmount(() => {
	disposed = true
	void pdfTask?.destroy()

	if (expanded.value) {
		window.removeEventListener("resize", applySize)
		useNuxtApp().$lenis?.start()
	}
})
</script>

<template>
	<!--
		Vignette. Toujours le même <a> : changer de balise en cours de route (<a> → <button>) ferait
		remonter tout le sous-arbre et perdre le canvas déjà peint. Une fois l'aperçu prêt, le clic
		est intercepté pour agrandir ; sinon le lien vers le fichier s'ouvre normalement.
	-->
	<a
		:href="src"
		target="_blank"
		rel="noopener"
		:aria-label="zoomable ? `Enlarge ${label}` : label"
		class="flex flex-col items-start gap-1.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4"
		:class="zoomable && 'cursor-zoom-in'"
		@click="activate"
	>
		<!--
			Hauteur fixe, largeur selon le ratio du fichier. Avant chargement : un gabarit portrait en
			gris très clair (et non en blanc), pour qu'on voie que l'aperçu arrive.
		-->
		<span
			ref="frame"
			class="border-gray-dark/50 shadow-frame block h-32 overflow-hidden rounded-lg border sm:h-40"
			:class="[
				ready ? 'bg-white' : 'bg-gray-dark/5',
				kind !== 'file' && !ready && 'aspect-3/4',
				covered && 'opacity-0',
			]"
		>
			<img
				v-if="kind === 'image'"
				ref="thumbImage"
				:src="active ? src : undefined"
				:alt="label"
				decoding="async"
				class="block h-full w-auto transition-opacity duration-300 motion-reduce:transition-none"
				:class="ready ? 'opacity-100' : 'opacity-0'"
				@load="ready = true"
			/>

			<canvas
				v-else-if="kind === 'pdf' && !failed"
				ref="thumbCanvas"
				width="3"
				height="4"
				class="block h-full w-auto transition-opacity duration-300 motion-reduce:transition-none"
				:class="ready ? 'opacity-100' : 'opacity-0'"
			/>

			<!-- Format sans aperçu possible (ou PDF illisible) : une tuile avec l'extension. -->
			<span
				v-else
				class="font-vg5000 text-gray-dark/60 grid aspect-square h-full place-items-center text-sm"
			>
				{{ extension ?? "FILE" }}
			</span>
		</span>

		<span
			v-if="kind !== 'image'"
			class="text-gray-dark/60 w-0 min-w-full truncate text-xs sm:text-sm"
		>
			{{ label }}
		</span>
	</a>

	<!--
		Aperçu agrandi. Frère de la vignette (jamais dedans : un <dialog> et ses boutons ne peuvent pas
		être imbriqués dans un lien). Un clic n'importe où, la croix ou Échap ferment.
		Pas de `display` ici : le <dialog> reste masqué tant qu'il n'est pas ouvert.
	-->
	<dialog
		v-if="expanded"
		ref="dialog"
		:aria-label="label"
		class="fixed inset-0 m-0 size-full max-h-none max-w-none touch-none overflow-hidden overscroll-contain bg-transparent p-0 text-white backdrop:bg-transparent"
		@cancel.prevent="collapse"
		@click="collapse"
	>
		<!-- `starting:` : le fondu joue tout seul à l'apparition, rien à orchestrer en JS. -->
		<div
			class="absolute inset-0 bg-black/85 transition-opacity duration-300 ease-out starting:opacity-0 motion-reduce:transition-none"
			:class="shown ? 'opacity-100' : 'opacity-0'"
		/>

		<figure
			ref="stage"
			class="absolute inset-0 m-auto overflow-hidden rounded-lg bg-white shadow-2xl"
		>
			<img v-if="kind === 'image'" :src :alt="label" class="block size-full object-contain" />
			<canvas v-else ref="zoomCanvas" class="block size-full" />
		</figure>

		<button
			type="button"
			autofocus
			aria-label="Close preview"
			class="font-vg5000 absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-2xl text-white transition duration-300 ease-out hover:bg-white/20 starting:opacity-0 motion-reduce:transition-none"
			:class="shown ? 'opacity-100 delay-200' : 'opacity-0'"
			@click="collapse"
		>
			<span aria-hidden="true" class="text-fit-x block rotate-45">+</span>
		</button>

		<p
			class="font-vg5000 absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-4 px-4 text-xs tracking-[0.14em] text-white/80 uppercase transition duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
			:class="shown ? 'opacity-100 delay-200' : 'opacity-0'"
		>
			<span class="truncate">{{ label }}</span>
			<a
				:href="src"
				target="_blank"
				rel="noopener"
				class="shrink-0 underline underline-offset-4 hover:text-white"
				@click.stop
			>
				Open file
			</a>
		</p>
	</dialog>
</template>