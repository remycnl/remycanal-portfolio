<script setup lang="ts">
import type { BadgeProps } from "@/components/ui/Badge.vue"
import type { ResumeTool } from "@/utils/resume"

const { featured, more } = defineProps<{
	featured: ResumeTool[]
	more: ResumeTool[]
}>()

// Passer à `true` pour afficher toute la toolbox dès l'arrivée sur la page.
const open = ref(false)
const listId = useId()

// Une seule liste : les icônes du reste se placent à la suite des premières, dans le même flex-wrap.
// `rank` : rang dans le reste (sert au décalage d'entrée), `null` pour les icônes toujours visibles.
const tools = computed(() => [
	...featured.map((tool) => ({ ...tool, rank: null })),
	...more.map((tool, rank) => ({ ...tool, rank })),
])

// Entrée des icônes du reste : fondu + montée, décalées de 25 ms. `starting:` joue la transition
// au moment où l'icône passe de `hidden` à visible : du CSS pur, rien n'est animé en JS.
const REVEAL =
	"transition duration-300 delay-(--d) starting:translate-y-2 starting:opacity-0"

const isDesktopPointer = useDesktopPointer()
const tappable = computed(() => !isDesktopPointer.value)

/*
 * Desktop : le <UiBadge> suit le pointeur et affiche le nom de l'icône survolée. Il reste affiché
 * d'une icône à la suivante (court délai avant de se cacher) : le texte glisse d'un nom à l'autre.
 */
const HIDE_DELAY = 120

const label = ref("")
const hovering = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | undefined

function show(name: string) {
	if (!isDesktopPointer.value) {
		return
	}

	clearTimeout(hideTimer)
	label.value = name
	hovering.value = true
}

function hide() {
	hideTimer = setTimeout(() => {
		hovering.value = false
	}, HIDE_DELAY)
}

onBeforeUnmount(() => clearTimeout(hideTimer))

// Même libellé pour idle, press et drag : le clic garde son effet d'écrasement sans changer le texte.
const badge = computed<BadgeProps>(() => ({
	active: hovering.value,
	labels: { idle: label.value, press: label.value, drag: label.value },
}))

/*
 * Tactile / petit écran : pas de survol, donc pas de badge. Toucher une icône affiche son nom juste
 * au-dessus d'elle ; la retoucher le masque, en toucher une autre le déplace.
 */
const selected = ref<string | null>(null)

function select(name: string) {
	selected.value = selected.value === name ? null : name
}

// Replier la liste ne doit pas laisser un nom flotter sur une icône qui vient de disparaître.
watch(open, (isOpen) => {
	if (!isOpen && more.some((tool) => tool.name === selected.value)) {
		selected.value = null
	}
})

// Le nom est centré sur l'icône ; près d'un bord de l'écran, on le décale pour qu'il reste entier.
const EDGE_MARGIN = 12

function placeLabel(element: unknown) {
	if (!(element instanceof HTMLElement)) {
		return
	}

	const { left, right } = element.getBoundingClientRect()
	const shift =
		Math.max(EDGE_MARGIN - left, 0) -
		Math.max(right - (window.innerWidth - EDGE_MARGIN), 0)

	element.style.marginLeft = `${shift}px`
}
</script>

<template>
	<div>
		<ul
			:id="listId"
			class="flex max-w-[calc(var(--cv-frame,3.5rem)*8+10.5rem)] flex-wrap gap-3 sm:gap-4 lg:gap-6"
		>
			<li
				v-for="tool in tools"
				:key="tool.name"
				class="relative"
				:class="tool.rank !== null && (open ? REVEAL : 'hidden')"
				:style="tool.rank !== null ? { '--d': `${tool.rank * 25}ms` } : undefined"
				@pointerenter="show(tool.name)"
				@pointerleave="hide"
			>
				<component
					:is="tappable ? 'button' : 'span'"
					:type="tappable ? 'button' : undefined"
					:aria-pressed="tappable ? selected === tool.name : undefined"
					class="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
					:class="tappable && 'cursor-pointer'"
					@click="tappable && select(tool.name)"
				>
					<ResumeCvLogo :src="tool.logo" :alt="tool.name" :background="tool.background" />
				</component>

				<span
					v-if="selected === tool.name"
					:ref="placeLabel"
					aria-hidden="true"
					class="box-fit bg-lime font-vg5000 absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-xs border border-gray-dark/50 text-xs tracking-[0.14em] whitespace-nowrap text-black uppercase transition duration-200 [--fit-x:1.25em] starting:translate-y-1 starting:opacity-0"
				>
					{{ tool.name }}
				</span>
			</li>
		</ul>

		<!-- Sous la liste : quand elle s'allonge, le bouton descend avec elle. -->
		<button
			v-if="more.length"
			type="button"
			class="font-vg5000 text-gray-dark/60 hover:text-gray-dark mt-6 flex cursor-pointer items-center gap-2 text-xs transition-colors motion-reduce:transition-none sm:text-sm"
			:aria-expanded="open"
			:aria-controls="listId"
			@click="open = !open"
		>
			<span
				aria-hidden="true"
				class="inline-grid size-[1.5em] shrink-0 place-items-center text-lg"
			>
				<span
					class="text-fit-x block transition-transform duration-300 ease-out motion-reduce:transition-none"
					:class="open && 'rotate-45'"
					>+</span
				>
			</span>

			<span class="text-fit-x">{{ open ? "See less" : "See all my skills…" }}</span>
		</button>

		<Teleport v-if="isDesktopPointer" to="body">
			<LazyUiBadge v-bind="badge" />
		</Teleport>
	</div>
</template>
