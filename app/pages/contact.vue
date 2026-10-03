<template>
	<section class="relative h-svh overflow-hidden bg-black text-white">
		<LazyContactLanyardBadge
			v-if="!pageTransitionActive"
			class="z-1"
			:data="myBadgeData"
		/>
		<div
			class="p-edge pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none"
			aria-hidden="true"
		>
			<p
				class="font-lineal-heavy text-black-light text-[clamp(4.5rem,14vw,15rem)] leading-[0.76] whitespace-nowrap uppercase"
			>
				CLICK TO
				<br />
				FLIP IT !
			</p>
		</div>
		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center pl-8 md:pl-16"
		>
			<h2 class="pointer-events-auto">
				Let's make
				<br />
				something great.
			</h2>
		</div>
	</section>
</template>

<script lang="ts" setup>
import type { BadgeData } from "@/types/badge"
import { readThemeColor, withAlpha } from "@/utils/theme/readThemeColor"

const pageTransitionActive = usePageTransitionActive()

if (import.meta.client) {
	void preloadComponents("ContactLanyardBadge")
}

function formatEventCode(date: Date): string {
	const day = String(date.getDate()).padStart(2, "0")
	const month = String(date.getMonth() + 1).padStart(2, "0")
	return `${day}-${month}-${date.getFullYear()}`
}

const themeWhite = readThemeColor("--color-white", "oklch(0.9672 0 0)")
const themeLime = readThemeColor("--color-lime", "oklch(0.928 0.2202 125)")

const myBadgeData: BadgeData = {
	name: "Rémy",
	roleType: "FULL-STACK DEV / UI-UX Designer",
	eventCode: formatEventCode(new Date()),
	barcodeCode: "REMY02062004",
	date: "AVAILABLE NOW",
	location: "LYON, FRANCE",
	venue: "Open to work",
	address: "Web · Product · Design · Branding",
	website: "www.remycanal.me",
	email: "hello@remycanal.me",
	linkedin: "https://www.linkedin.com/in/remy-canal",
	company: "Rémy Canal",
	tagline: "Awwwards Young Jury Member",
	colors: {
		cardBg: "#000000",
		footerBg: "#000000",
		accentColor: themeLime,
		nameColor: themeWhite,
		roleColor: withAlpha(themeWhite, 0.78),
		metaColor: withAlpha(themeWhite, 0.55),
		footerText: withAlpha(themeWhite, 0.85),
	},
}
</script>
