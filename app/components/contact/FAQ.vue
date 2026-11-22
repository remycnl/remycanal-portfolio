<script lang="ts" setup>
interface FaqItem {
	question: string
	answer: string
}

// TODO: remplace par tes vraies questions / réponses
const ITEMS: readonly FaqItem[] = [
	{
		question: "Do you take on freelance projects?",
		answer: "Your answer here.",
	},
	{
		question: "How long does a project usually take?",
		answer: "Your answer here.",
	},
]

/** Lettres du badge : chacune roule avec un léger décalage (effet "compteur"). */
const OPEN_CHARS = Array.from("Open")
const CLOSE_CHARS = Array.from("Close")
const ROLL_STAGGER_MS = 28

const { gsap } = useGsap()
const uid = useId()

/** Une seule question ouverte à la fois : en ouvrir une ferme les autres. */
const openIndex = ref<number | null>(null)

let ticking = false
let settleUntil = 0

function toggle(index: number) {
	openIndex.value = openIndex.value === index ? null : index
	// Les panneaux s'animent (~300 ms) : la pastille suit les lignes qui se déplacent.
	settleUntil = performance.now() + 500
	wake()
}

/** Classes de la question : l'ouverte reste en blanc, les autres passent en blanc translucide. */
function questionClass(index: number) {
	if (openIndex.value === null) return "text-white"
	return openIndex.value === index ? "text-white" : "text-white/70 hover:text-white"
}

/* ───────── Pastille blanche qui glisse au survol (desktop uniquement) ─────────
   Un seul élément suit la ligne survolée avec deux ressorts : le bord d'attaque part
   vite, le bord de fuite le rattrape (effet "liquide"). Elle lit la position réelle
   du badge à chaque frame, donc elle suit aussi les lignes qui bougent pendant
   l'ouverture / la fermeture d'un panneau. Sur tactile : pas de survol, les badges
   sont blancs en permanence (voir le CSS). */
const canHover = ref(false)
const hoverIndex = ref<number | null>(null)
const listEl = ref<HTMLElement | null>(null)
const indicatorEl = ref<HTMLElement | null>(null)
const badgeEls: (HTMLElement | null)[] = []

function setBadge(el: unknown, index: number) {
	badgeEls[index] = el instanceof HTMLElement ? el : null
}

interface Edge {
	x: number
	v: number
}
const top: Edge = { x: 0, v: 0 }
const bottom: Edge = { x: 0, v: 0 }
let left = 0
let width = 0
let placed = false
let reduced = false
let lastLeave = 0
let hoverQuery: MediaQueryList | null = null

const LEAD = { k: 260, z: 0.78 }
const TRAIL = { k: 110, z: 0.85 }

function step(edge: Edge, target: number, p: { k: number; z: number }, dt: number) {
	const c = 2 * p.z * Math.sqrt(p.k)
	edge.v += ((target - edge.x) * p.k - edge.v * c) * dt
	edge.x += edge.v * dt
}

function wake() {
	if (ticking || !canHover.value) return
	ticking = true
	gsap.ticker.add(tick)
}

function sleep() {
	if (!ticking) return
	ticking = false
	gsap.ticker.remove(tick)
}

function tick(_time: number, deltaMs: number) {
	const indicator = indicatorEl.value
	const list = listEl.value
	if (!indicator || !list) return sleep()

	const badge = hoverIndex.value === null ? null : badgeEls[hoverIndex.value]
	let settled = true

	if (badge) {
		const dt = Math.min(deltaMs / 1000, 1 / 30)
		const l = list.getBoundingClientRect()
		const b = badge.getBoundingClientRect()
		const targetTop = b.top - l.top
		const targetBottom = targetTop + b.height

		left = b.left - l.left
		width = b.width

		if (!placed || reduced) {
			top.x = targetTop
			bottom.x = targetBottom
			top.v = bottom.v = 0
			placed = true
		} else {
			// Le bord qui va dans le sens du déplacement est le plus raide.
			const goingDown = (targetTop + targetBottom) / 2 > (top.x + bottom.x) / 2
			step(top, targetTop, goingDown ? TRAIL : LEAD, dt)
			step(bottom, targetBottom, goingDown ? LEAD : TRAIL, dt)
		}

		settled =
			Math.abs(targetTop - top.x) < 0.05 &&
			Math.abs(targetBottom - bottom.x) < 0.05 &&
			Math.abs(top.v) < 0.05 &&
			Math.abs(bottom.v) < 0.05

		indicator.style.translate = `${left.toFixed(2)}px ${top.x.toFixed(2)}px`
		indicator.style.width = `${width.toFixed(2)}px`
		indicator.style.height = `${Math.max(0, bottom.x - top.x).toFixed(2)}px`
	}

	if (settled && performance.now() > settleUntil) sleep()
}

function onPointerEnter(event: PointerEvent, index: number) {
	if (!canHover.value || event.pointerType === "touch") return
	enter(index)
}

function enter(index: number) {
	// Si la pastille était masquée depuis un moment, elle apparaît directement sur la ligne.
	if (hoverIndex.value === null && performance.now() - lastLeave > 250) placed = false
	hoverIndex.value = index
	wake()
}

function leave() {
	if (hoverIndex.value === null) return
	hoverIndex.value = null
	lastLeave = performance.now()
}

/** Navigation clavier : la pastille accompagne le focus visible. */
function onFocusIn(event: FocusEvent, index: number) {
	if ((event.target as HTMLElement).matches(":focus-visible")) enter(index)
}
function onFocusOut(event: FocusEvent) {
	const item = event.currentTarget as HTMLElement
	if (!item.contains(event.relatedTarget as Node | null)) leave()
}

function onHoverChange() {
	canHover.value = hoverQuery?.matches ?? false
	if (!canHover.value) {
		leave()
		sleep()
	}
}

function onResize() {
	if (hoverIndex.value !== null) wake()
}

onMounted(() => {
	reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
	hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
	canHover.value = hoverQuery.matches
	hoverQuery.addEventListener("change", onHoverChange)
	window.addEventListener("resize", onResize, { passive: true })
})

onBeforeUnmount(() => {
	sleep()
	hoverQuery?.removeEventListener("change", onHoverChange)
	window.removeEventListener("resize", onResize)
})
</script>

<template>
	<section :aria-labelledby="`${uid}-title`">
		<h2
			v-text-reveal="{ immediate: true, theme: 'black-light' }"
			:id="`${uid}-title`"
			class="font-vg5000 text-base text-white/70"
		>
			A few answers to questions you might have&nbsp;:
		</h2>

		<ul ref="listEl" class="relative isolate mt-5 flex flex-col" @pointerleave="leave">
			<!-- Pastille blanche partagée : positionnée en JS, derrière le texte (-z-10 dans le contexte isolé). -->
			<span
				v-if="canHover"
				ref="indicatorEl"
				aria-hidden="true"
				class="pointer-events-none absolute top-0 left-0 -z-10 h-0 w-0 rounded-md bg-white transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none"
				:class="hoverIndex !== null ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
			/>

			<li
				v-for="(item, index) in ITEMS"
				:key="item.question"
				@pointerenter="onPointerEnter($event, index)"
				@focusin="onFocusIn($event, index)"
				@focusout="onFocusOut"
			>
				<h3>
					<button
						v-text-reveal="{ immediate: true, theme: 'black-light', singlePhrase: true }"
						:id="`${uid}-trigger-${index}`"
						type="button"
						:aria-expanded="openIndex === index"
						:aria-controls="`${uid}-panel-${index}`"
						class="font-vg5000 flex w-full cursor-pointer items-center gap-4 rounded-md py-3 text-left text-base transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
						:class="questionClass(index)"
						@click="toggle(index)"
					>
						<span class="w-6 shrink-0 text-white/70 tabular-nums" aria-hidden="true">
							{{ String(index + 1).padStart(2, "0") }}
						</span>

						<span class="flex-1">{{ item.question }}</span>

						<!-- Badge : « Open » sort par le haut pendant que « Close » monte, lettre par lettre.
						     Les deux mots se superposent (même cellule de grille), le conteneur masque le débordement. -->
						<span
							:ref="(el) => setBadge(el, index)"
							class="faq-badge shrink-0 rounded-md px-3 py-1 text-xs transition-colors duration-300 motion-reduce:transition-none"
							:data-hover="hoverIndex === index"
							aria-hidden="true"
						>
							<span class="grid h-5 overflow-hidden">
								<span class="col-start-1 row-start-1 flex justify-center">
									<span
										v-for="(char, i) in OPEN_CHARS"
										:key="i"
										class="inline-block h-5 leading-5 transition-transform duration-650 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
										:class="openIndex === index ? '-translate-y-full' : 'translate-y-0'"
										:style="{ transitionDelay: `${i * ROLL_STAGGER_MS}ms` }"
									>
										{{ char }}
									</span>
								</span>

								<span class="col-start-1 row-start-1 flex justify-center">
									<span
										v-for="(char, i) in CLOSE_CHARS"
										:key="i"
										class="inline-block h-5 leading-5 transition-transform duration-650 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
										:class="openIndex === index ? 'translate-y-0' : 'translate-y-full'"
										:style="{ transitionDelay: `${i * ROLL_STAGGER_MS}ms` }"
									>
										{{ char }}
									</span>
								</span>
							</span>
						</span>
					</button>
				</h3>

				<!-- 0fr → 1fr anime jusqu'à la vraie hauteur du contenu, sans mesure en JS -->
				<div
					:id="`${uid}-panel-${index}`"
					role="region"
					:aria-labelledby="`${uid}-trigger-${index}`"
					:inert="openIndex !== index || undefined"
					:class="openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
					class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
				>
					<div class="overflow-hidden">
						<p
							class="font-vg5000 pt-1 pb-4 pl-10 text-sm text-white/80 transition-[opacity,translate] duration-300 motion-reduce:transition-none"
							:class="
								openIndex === index
									? 'translate-y-0 opacity-100 delay-100'
									: '-translate-y-1 opacity-0'
							"
						>
							{{ item.answer }}
						</p>
					</div>
				</div>
			</li>
		</ul>
	</section>
</template>

<style scoped>
/* Tactile (pas de survol) : pastille blanche en permanence, texte violet.
   Desktop (survol + pointeur précis) : pas de fond, texte en blanc translucide (70 %) comme les index ;
   le fond blanc n'existe qu'au survol (pastille glissante en JS) et le texte passe alors en violet.
   Gardé en CSS : il faut combiner media query + état, ce qu'un utilitaire seul exprime mal. */
.faq-badge {
	background-color: var(--color-white);
	color: var(--color-violet);
}

@media (hover: hover) and (pointer: fine) {
	.faq-badge {
		background-color: transparent;
		color: color-mix(in oklch, var(--color-white) 70%, transparent);
	}
	.faq-badge[data-hover="true"] {
		color: var(--color-violet);
	}
}
</style>
