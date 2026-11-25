<script lang="ts" setup>
type Status = "idle" | "loading" | "success" | "error"
type TextFieldName = "name" | "email" | "subject"

interface TextField {
	name: TextFieldName
	label: string
	type: "text" | "email"
	placeholder: string
	autocomplete: string
	maxlength: number
	/** Spans the full row on ≥ sm. */
	wide?: boolean
}

const MESSAGE_MIN = 10
const MESSAGE_MAX = 5000

const FIELDS: readonly TextField[] = [
	{
		name: "name",
		label: "Name",
		type: "text",
		placeholder: "What should I call you?",
		autocomplete: "name",
		maxlength: 100,
	},
	{
		name: "email",
		label: "Email",
		type: "email",
		placeholder: "Where can I reach you?",
		autocomplete: "email",
		maxlength: 200,
	},
	{
		name: "subject",
		label: "Subject",
		type: "text",
		placeholder: "What's on your mind?",
		autocomplete: "off",
		maxlength: 150,
		wide: true,
	},
]

/**
 * Champs blancs sur le violet ; le focus est un anneau blanc détaché (offset) pour rester visible.
 * `box-fit` rogne le texte à la hauteur des capitales : le padding (--fit-x / --fit-y) est donc
 * identique autour du texte et du placeholder.
 */
const FIELD_CLASS =
	"font-vg5000 box-fit w-full rounded-lg bg-white text-base text-black [--fit-x:1em] [--fit-y:1.1em] placeholder:text-gray-dark/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

const ERROR_DEFAULT =
	"Your message didn't go through. Check your connection and try again."

/** Server status code → message shown to the visitor. */
const ERROR_MESSAGES: Partial<Record<number, string>> = {
	400: "Something looks off in the form. Check your fields and try again.",
	429: "Too many attempts. Please wait a few minutes and try again.",
}

const createForm = () => ({ name: "", email: "", subject: "", message: "", website: "" })

const form = reactive(createForm())
const consent = ref(false)
const status = ref<Status>("idle")
const sentName = ref("")
const errorMessage = ref(ERROR_DEFAULT)

const isLoading = computed(() => status.value === "loading")

async function submit() {
	if (isLoading.value) return

	status.value = "loading"

	try {
		await $fetch("/api/contact", {
			method: "POST",
			body: { ...form },
			// Without a timeout, a hanging request would leave the button on "Sending…" forever.
			timeout: 15_000,
		})
		sentName.value = form.name.trim().split(/\s+/)[0] ?? ""
		Object.assign(form, createForm())
		consent.value = false
		status.value = "success"
	} catch (error) {
		const code = (error as { statusCode?: number }).statusCode ?? 0

		errorMessage.value = ERROR_MESSAGES[code] ?? ERROR_DEFAULT
		status.value = "error"
	}
}

/** Moves focus to the new content so screen-reader and keyboard users follow the swap. */
function onAfterEnter(el: Element) {
	el.querySelector<HTMLElement>(status.value === "success" ? "h2" : "input")?.focus()
}
</script>

<template>
	<div>
		<Transition
			mode="out-in"
			enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
			enter-from-class="translate-y-2 opacity-0"
			leave-active-class="transition duration-200 motion-reduce:transition-none"
			leave-to-class="opacity-0"
			@after-enter="onAfterEnter"
		>
			<!-- Success -->
			<div
				v-if="status === 'success'"
				key="success"
				class="flex flex-col items-start gap-4"
			>
				<h2
					v-text-reveal="{ immediate: true, theme: 'black-light' }"
					tabindex="-1"
					class="font-lineal text-4xl text-white outline-none sm:text-5xl"
				>
					Message sent!
				</h2>

				<p
					v-text-reveal="{ immediate: true, theme: 'black-light', delay: 0.15 }"
					class="font-vg5000 text-sm text-white/70"
				>
					Thanks{{ sentName ? ` ${sentName}` : "" }}, I'll get back to you by email as
					soon as possible.
				</p>

				<button
					type="button"
					class="font-vg5000 text-sm text-white/70 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
					@click="status = 'idle'"
				>
					Send another message
				</button>
			</div>

			<!-- Form -->
			<form
				v-else
				key="form"
				aria-label="Contact form"
				:aria-busy="isLoading"
				class="flex flex-col gap-8"
				@submit.prevent="submit"
			>
				<div class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
					<label
						v-for="field in FIELDS"
						:key="field.name"
						:class="{ 'sm:col-span-2': field.wide }"
						class="flex flex-col gap-2"
					>
						<span class="font-vg5000 text-sm text-white/70">{{ field.label }}</span>
						<input
							v-model="form[field.name]"
							:type="field.type"
							:name="field.name"
							:autocomplete="field.autocomplete"
							:placeholder="field.placeholder"
							:maxlength="field.maxlength"
							:class="FIELD_CLASS"
							required
						/>
					</label>

					<label class="flex flex-col gap-2 sm:col-span-2">
						<span class="font-vg5000 text-sm text-white/70">Message</span>
						<!-- Multi-line: the tight fit line-height is overridden so the lines stay readable. -->
						<textarea
							v-model="form.message"
							name="message"
							placeholder="Sell me your dream!"
							rows="8"
							:minlength="MESSAGE_MIN"
							:maxlength="MESSAGE_MAX"
							:class="[FIELD_CLASS, 'min-h-48 resize-y [--leading-fit:1.5]']"
							required
						/>
					</label>
				</div>

				<!-- Honeypot: invisible to people and assistive tech, bots fill it -->
				<div class="absolute left-[-9999px]" aria-hidden="true" inert>
					<input
						v-model="form.website"
						type="text"
						name="website"
						tabindex="-1"
						autocomplete="off"
					/>
				</div>

				<div
					class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between"
				>
					<label
						class="font-vg5000 flex max-w-xs cursor-pointer items-start gap-3 text-xs leading-snug text-white/70"
					>
						<span class="relative mt-px flex size-5 shrink-0">
							<!-- Case : contour blanc translucide ; cochée → fond blanc + coche violette -->
							<input
								v-model="consent"
								type="checkbox"
								name="consent"
								class="peer size-full cursor-pointer appearance-none rounded-sm border border-white/50 bg-transparent transition-colors checked:border-white checked:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
								required
							/>
							<svg
								class="text-violet pointer-events-none absolute inset-0 m-auto size-3 opacity-0 transition-opacity peer-checked:opacity-100 motion-reduce:transition-none"
								viewBox="0 0 12 12"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M2 6.5 4.75 9 10 3"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</span>
						I agree to the use of my personal data to process my inquiry.
					</label>

					<!-- aria-disabled (not disabled) keeps the button focusable and its hover state intact -->
					<UiAnimatedButton
						type="submit"
						theme="white-violet"
						:nuxtlink="false"
						:label="isLoading ? 'Sending…' : 'Send message'"
						:aria-disabled="isLoading"
						class="self-end aria-disabled:cursor-wait aria-disabled:opacity-60 sm:self-auto"
					/>
				</div>

				<p v-if="status === 'error'" role="alert" class="font-vg5000 text-sm text-white">
					{{ errorMessage }}
				</p>
			</form>
		</Transition>
	</div>
</template>