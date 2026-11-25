<script setup lang="ts">
/**
 * <UiScrollProgress> — règle graduée de progression par sections.
 *
 * - Desktop (≥ 64rem) : pill verticale, fixée à droite, centrée verticalement.
 * - Mobile / tablette : pill horizontale, fixée en bas, centrée.
 *
 * Fonctionnement
 * - La position (en "sections", ex. 1.4) est calculée depuis le scroll, puis
 *   lissée par un ressort doux. Le ticker GSAP ne tourne que pendant le mouvement.
 * - Le fisheye des graduations est 100 % CSS : le JS n'écrit que quelques
 *   variables (--pos, --r, --shift, --fade-a, --fade-b) sur le conteneur.
 * - Si la règle dépasse la taille max, elle défile : la zone active reste
 *   centrée. Le fondu des bords n'apparaît que du côté où il reste du contenu.
 * - L'apparition / disparition est une transition CSS (compositor, sans JS).
 *
 * Usage :
 *   <UiScrollProgress ref="progress" :sections="[{ id, label }, …]" v-model:active="activeId" />
 *   progress.value?.scrollToId('intro')
 */
import type Lenis from "lenis"

const props = defineProps<{
	sections: { id: string; label: string }[]
}>()

const active = defineModel<string>("active")

const { gsap } = useGsap()
const lenis = useNuxtApp().$lenis as Lenis | undefined

/** Un titre est "atteint" quand il arrive à sectionOffset() du haut, + REACH_BIAS. */
const REACH_BIAS = 8
/** Largeur max (px) du fondu sur les bords de la règle. */
const FADE = 20
/** La pill apparaît une fois ce ratio de viewport scrollé (le hero est passé). */
const SHOW_AFTER = 0.45

const sectionOffset = () =>
	Math.round(Math.min(120, Math.max(80, window.innerHeight * 0.11)))

const root = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const shown = ref(false)
const overflowing = ref(false)

/** Petits traits entre deux numéros (toujours ≥ 5) : 7 si peu de sections, sinon 5. */
const ticksBetween = computed(() => (props.sections.length <= 4 ? 7 : 5))
const stride = computed(() => ticksBetween.value + 1)

const items = computed(() => {
	const n = props.sections.length
	if (!n) return []
	const total = (n - 1) * stride.value + 1
	return Array.from({ length: total }, (_, k) => ({
		k,
		index: k % stride.value === 0 ? k / stride.value : -1,
	}))
})

const pad = (n: number) => String(n).padStart(2, "0")

/* ───────── État (hors réactivité : mis à jour à chaque frame) ───────── */
let reach: number[] = []
let maxScroll = 0
let step = 14
let padStart = 0
let contentLen = 0
let viewLen = 0
let isOverflow = false

let target = 0
let x = 0
let v = 0
let lastPos = 0
let lastShift = 0
let dirty = true
let ticking = false
let reduced = false
let resizeObserver: ResizeObserver | null = null
let measureRaf = 0

const currentScroll = () => (lenis ? lenis.scroll : window.scrollY)

/* ───────── Mesures ───────── */
function measure() {
	maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
	const offset = sectionOffset()

	const r = props.sections.map(({ id }) => {
		const el = document.getElementById(id)
		return el
			? el.getBoundingClientRect().top + window.scrollY - offset - REACH_BIAS
			: Number.NaN
	})

	if (!r.length || maxScroll <= 0 || r.some(Number.isNaN)) {
		reach = []
	} else {
		// Les derniers titres peuvent être impossibles à atteindre (fin de page) :
		// on les répartit sur la dernière portion de scroll pour que chacun
		// reste atteignable et que la progression reste monotone.
		const n = r.length
		const j = r.findIndex((value) => value > maxScroll - 2)
		if (j !== -1) {
			const base = j > 0 ? r[j - 1]! : 0
			for (let k = j; k < n; k++) {
				r[k] = base + ((maxScroll - base) * (k - j + 1)) / (n - j)
			}
		}
		reach = r
	}

	// Métriques de la règle (utilisées pour la faire défiler si elle dépasse la taille max).
	const first = track.value?.querySelector<HTMLElement>(".sp-item")
	if (first && viewport.value && track.value) {
		const vertical = window.matchMedia("(min-width: 64rem)").matches
		const style = getComputedStyle(track.value)
		step = (vertical ? first.offsetHeight : first.offsetWidth) || 14
		padStart = parseFloat(vertical ? style.paddingTop : style.paddingLeft) || 0
		contentLen = vertical ? viewport.value.scrollHeight : viewport.value.scrollWidth
		viewLen = vertical ? viewport.value.clientHeight : viewport.value.clientWidth
		isOverflow = contentLen > viewLen + 1
		overflowing.value = isOverflow
	}

	dirty = true
}

function computeTarget(y: number) {
	const n = reach.length
	if (!n || y <= reach[0]!) return 0
	for (let i = 0; i < n - 1; i++) {
		if (y < reach[i + 1]!) {
			return i + (y - reach[i]!) / Math.max(1, reach[i + 1]! - reach[i]!)
		}
	}
	return n - 1
}

/* ───────── Scroll → cible ───────── */
function onScroll() {
	const y = currentScroll()
	target = computeTarget(y)
	shown.value = y > window.innerHeight * SHOW_AFTER

	const i = Math.min(props.sections.length - 1, Math.floor(target + 0.001))
	const id = props.sections[i]?.id
	if (id && id !== active.value) active.value = id

	wake()
}

/* ───────── Ticker : ne tourne que pendant le mouvement ───────── */
function wake() {
	if (ticking) return
	ticking = true
	gsap.ticker.add(tick)
}

function sleep() {
	if (!ticking) return
	ticking = false
	gsap.ticker.remove(tick)
}

function tick(_time: number, deltaMs: number) {
	const el = root.value
	if (!el) return

	const dt = Math.min(deltaMs / 1000, 1 / 30)

	if (reduced) {
		x = target
		v = 0
	} else {
		// Ressort légèrement sous-amorti : suit la cible sans à-coup.
		const k = 120
		const c = 2 * 0.85 * Math.sqrt(k)
		v += ((target - x) * k - v * c) * dt
		x += v * dt
	}

	const settled = Math.abs(target - x) < 5e-4 && Math.abs(v) < 5e-4
	if (settled) {
		x = target
		v = 0
	}

	const pos = x * stride.value

	// La règle défile quand elle dépasse la taille max : la zone active reste centrée.
	let shift = 0
	let fadeA = 0
	let fadeB = 0
	if (isOverflow) {
		const maxShift = contentLen - viewLen
		shift = Math.min(
			Math.max(padStart + pos * step + step / 2 - viewLen / 2, 0),
			maxShift
		)
		// Fondu uniquement du côté où il reste du contenu : jamais sur le premier/dernier numéro.
		fadeA = Math.min(shift, FADE)
		fadeB = Math.min(maxShift - shift, FADE)
	}

	if (dirty || Math.abs(pos - lastPos) >= 1e-4 || Math.abs(shift - lastShift) >= 0.05) {
		dirty = false
		lastPos = pos
		lastShift = shift

		// Le champ de magnification s'élargit un peu avec la vitesse.
		const radius = 3 + Math.min(Math.abs(v) * 1.2, 2.5)

		el.style.setProperty("--pos", pos.toFixed(4))
		el.style.setProperty("--r", radius.toFixed(3))
		el.style.setProperty("--shift", shift.toFixed(2))
		el.style.setProperty("--fade-a", `${fadeA.toFixed(1)}px`)
		el.style.setProperty("--fade-b", `${fadeB.toFixed(1)}px`)
	}

	if (settled) sleep()
}

/* ───────── Navigation ───────── */
function scrollToId(id: string, options: { immediate?: boolean; hash?: boolean } = {}) {
	const { immediate = false, hash = true } = options
	const i = props.sections.findIndex((s) => s.id === id)
	if (i < 0) return

	// `reach` est rafraîchi via ResizeObserver + rAF : il a donc toujours une frame de retard
	// après un changement de layout (menu mobile qui se ferme, polices, images…).
	// On remesure ici, de façon synchrone, pour viser la position réelle au moment du clic.
	measure()

	if (hash) history.replaceState(null, "", `#${id}`)

	const instant = immediate || reduced

	if (!reach.length) {
		document.getElementById(id)?.scrollIntoView({ behavior: instant ? "auto" : "smooth" })
		return
	}

	const y = Math.min(reach[i]! + REACH_BIAS, maxScroll)

	if (lenis) {
		const distance = Math.abs(y - currentScroll())
		lenis.scrollTo(y, {
			immediate: instant,
			duration: Math.min(2, 0.8 + distance / 3000),
			easing: (t: number) => 1 - Math.pow(1 - t, 4),
		})
	} else {
		window.scrollTo({ top: y, behavior: instant ? "auto" : "smooth" })
	}
}

defineExpose({ scrollToId })

/* ───────── Cycle de vie ───────── */
function scheduleMeasure() {
	cancelAnimationFrame(measureRaf)
	measureRaf = requestAnimationFrame(() => {
		measure()
		onScroll()
	})
}

watch(
	() => props.sections,
	async () => {
		await nextTick()
		scheduleMeasure()
	}
)

onMounted(() => {
	reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

	measure()
	x = target = computeTarget(currentScroll()) // pas d'animation au chargement

	if (lenis) lenis.on("scroll", onScroll)
	else window.addEventListener("scroll", onScroll, { passive: true })

	window.addEventListener("resize", scheduleMeasure, { passive: true })
	// La hauteur du contenu peut changer (polices, images, accordéons…).
	resizeObserver = new ResizeObserver(scheduleMeasure)
	resizeObserver.observe(document.body)

	onScroll()
})

onBeforeUnmount(() => {
	sleep()
	if (lenis) lenis.off("scroll", onScroll)
	else window.removeEventListener("scroll", onScroll)
	window.removeEventListener("resize", scheduleMeasure)
	resizeObserver?.disconnect()
	cancelAnimationFrame(measureRaf)
})
</script>

<template>
	<nav ref="root" class="sp" :class="{ 'is-shown': shown }" aria-label="Sections">
		<div class="sp-pill">
			<div ref="viewport" class="sp-viewport" :class="{ 'is-overflowing': overflowing }">
				<div ref="track" class="sp-track">
					<template v-for="item in items" :key="item.k">
						<button
							v-if="item.index >= 0"
							type="button"
							class="sp-item sp-label"
							:style="{ '--k': item.k }"
							:aria-label="`Go to ${sections[item.index]!.label}`"
							:aria-current="active === sections[item.index]!.id ? 'true' : undefined"
							@click="scrollToId(sections[item.index]!.id)"
						>
							<span class="sp-num">{{ pad(item.index + 1) }}</span>
						</button>

						<span v-else class="sp-item" :style="{ '--k': item.k }" aria-hidden="true">
							<span class="sp-tick" />
						</span>
					</template>
				</div>
			</div>
		</div>
	</nav>
</template>

<style scoped>
/* ───────── Position : mobile = bas, horizontal ───────── */
.sp {
	position: fixed;
	z-index: 50;
	inset-inline: 0;
	margin-inline: auto;
	inline-size: max-content;
	max-inline-size: calc(100vw - 2 * var(--spacing-edge));
	bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);

	/* Caché : invisible, hors de l'arbre d'accessibilité et non cliquable. */
	opacity: 0;
	visibility: hidden;
	translate: 0 1.5rem;
	transition:
		opacity 0.4s ease,
		translate 0.5s cubic-bezier(0.4, 0, 1, 1),
		visibility 0s linear 0.5s;
}
.sp.is-shown {
	opacity: 1;
	visibility: visible;
	translate: 0 0;
	transition:
		opacity 0.6s ease,
		translate 0.9s cubic-bezier(0.16, 1, 0.3, 1),
		visibility 0s;
}

.sp-pill {
	padding: 0.55rem 1.1rem;
	border-radius: 999px;
	background: var(--color-black);
	color: var(--color-white);
}

/* Taille max : au-delà, la règle défile (voir --shift). */
.sp-viewport {
	overflow: hidden;
	inline-size: max-content;
	max-inline-size: min(22rem, calc(100vw - 2 * var(--spacing-edge) - 2.2rem));
}
.sp-viewport.is-overflowing {
	--mask: linear-gradient(
		to right,
		transparent,
		#000 var(--fade-a, 0px),
		#000 calc(100% - var(--fade-b, 0px)),
		transparent
	);
	-webkit-mask-image: var(--mask);
	mask-image: var(--mask);
}

.sp-track {
	--step: 0.75rem;
	display: flex;
	flex-direction: row;
	align-items: center;
	inline-size: max-content;
	padding-inline: 0.25rem;
	translate: calc(var(--shift, 0) * -1px) 0;
	will-change: translate;
}

/* ───────── Items + fisheye (100 % CSS, piloté par --pos / --r) ───────── */
.sp-item {
	--d: abs(var(--k) - var(--pos, 0));
	--t: clamp(0, 1 - var(--d) / var(--r, 3), 1);
	--f: calc(var(--t) * var(--t) * (3 - 2 * var(--t)));

	display: grid;
	place-items: center;
	flex: none;
	inline-size: var(--step);
	block-size: 1.75rem;
}

.sp-tick {
	display: block;
	inline-size: 1px;
	block-size: calc(0.35rem + var(--f) * 1.1rem);
	border-radius: 1px;
	background: color-mix(
		in oklch,
		var(--color-white) calc(22% + var(--f) * 78%),
		transparent
	);
}

.sp-label {
	padding: 0;
	border: 0;
	background: none;
	cursor: pointer;
}
.sp-num {
	display: block;
	font-family: var(--font-vg5000);
	font-size: 0.75rem;
	line-height: 1;
	white-space: nowrap;
	color: color-mix(
		in oklch,
		var(--color-white) calc(var(--f) * 100%),
		var(--color-gray-dark)
	);
	transition: color 0.2s ease;
}
@media (hover: hover) {
	.sp-label:hover .sp-num {
		color: var(--color-white);
	}
}
.sp-label:focus-visible {
	outline: 2px solid var(--color-white);
	outline-offset: 2px;
	border-radius: 4px;
}

/* ───────── Desktop : droite, vertical ───────── */
@media (min-width: 64rem) {
	.sp {
		inset-inline: auto var(--spacing-edge);
		margin-inline: 0;
		top: 50%;
		bottom: auto;
		translate: 1.25rem -50%;
	}
	.sp.is-shown {
		translate: 0 -50%;
	}

	.sp-pill {
		padding: 1.1rem 0.5rem;
		inline-size: 3rem;
	}

	.sp-viewport {
		inline-size: 100%;
		max-inline-size: none;
		max-block-size: min(60svh, 26rem);
	}
	.sp-viewport.is-overflowing {
		--mask: linear-gradient(
			to bottom,
			transparent,
			#000 var(--fade-a, 0px),
			#000 calc(100% - var(--fade-b, 0px)),
			transparent
		);
	}

	.sp-track {
		--step: 1rem;
		flex-direction: column;
		inline-size: 100%;
		padding-inline: 0;
		padding-block: 0.25rem;
		translate: 0 calc(var(--shift, 0) * -1px);
	}

	.sp-item {
		inline-size: 100%;
		block-size: var(--step);
	}

	.sp-tick {
		inline-size: calc(0.35rem + var(--f) * 1.1rem);
		block-size: 1px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.sp,
	.sp.is-shown {
		transition:
			opacity 0.2s ease,
			visibility 0s;
	}
	.sp-track {
		will-change: auto;
	}
}
</style>