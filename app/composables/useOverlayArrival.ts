/**
 * Hand-over between two entries of the overlay: the block that leaves gives its color, the page
 * that arrives covers itself with it, then wipes it away (see LayoutOverlayCurtain).
 */
export function useOverlayArrival() {
	const color = useState<string | null>("overlay-arrival", () => null)

	return {
		/** The leaving block hands its color over. */
		announce: (value: string) => {
			color.value = value
		},
		/** The navigation failed: nobody arrives. */
		cancel: () => {
			color.value = null
		},
		/** The arriving page reads it once. */
		consume() {
			const value = color.value
			color.value = null
			return value
		},
	}
}
