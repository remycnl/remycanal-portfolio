/**
 * The page transition has fully covered the screen: from the end of the cover to the start of the
 * reveal. What must change out of sight (scroll, scrollbar theme...) changes at that moment.
 */
export function usePageCovered() {
	return useState<boolean>("page-covered", () => false)
}
