const RESET_DELAY_MS = 1800

function legacyCopy(text: string) {
	const field = document.createElement("textarea")
	field.value = text
	field.setAttribute("readonly", "")
	field.style.position = "fixed"
	field.style.opacity = "0"
	document.body.append(field)
	field.select()

	try {
		return document.execCommand("copy")
	} catch {
		return false
	} finally {
		field.remove()
	}
}

export function useCopyToClipboard(resetDelayMs = RESET_DELAY_MS) {
	const copied = shallowRef(false)
	let timeout: ReturnType<typeof setTimeout> | undefined

	async function copy(text: string) {
		let success = false

		try {
			await navigator.clipboard.writeText(text)
			success = true
		} catch {
			success = legacyCopy(text)
		}

		if (!success) return false

		copied.value = true
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			copied.value = false
		}, resetDelayMs)

		return true
	}

	onScopeDispose(() => clearTimeout(timeout))

	return { copied, copy }
}