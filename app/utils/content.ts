export function formatPostDate(date: string | Date) {
	const d = new Date(date)
	const pad = (n: number) => String(n).padStart(2, "0")
	return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`
}
