<template>
	<div
		@click="toggleStars"
		class="relative w-20 h-20 md:w-28 md:h-28 text-center skills">
		<div
			class="z-50 w-full h-full rounded-full bg-black border-2 md:border-3 border-gray-light border-opacity-5 flex justify-center items-center">
			<img
				v-if="props.withPath"
				:id="isGif ? 'skill-bubble-gif' : 'skill-bubble-' + props.text"
				:src="props.pathIcon"
				:alt="props.text"
				:class="{
					'icon-select-event': true,
					'w-auto': true,
					'h-10': !isGif,
					'md:h-14': !isGif,
					'h-16': isGif,
					'md:h-[5.5rem]': isGif,
				}" />
			<Icon
				v-else
				:id="'skill-bubble-' + props.text"
				:name="props.icon"
				:color="props.iconColor"
				class="w-auto h-10 md:h-14" />
		</div>
		<div
			@mouseenter="handleMouseEnter"
			:style="{ 'border-color': props.color }"
			class="absolute top-0 left-0 w-full h-full rounded-full border-t-2 md:border-t-3 opacity-50 hover:opacity-100 hover:saturate-200 ease-in-out transition duration-500 spin"></div>
		<div class="mt-2 text-lg md:text-xl text-gray-light whitespace-nowrap">
			{{ props.text }}
		</div>
		<div
			v-if="!isGif"
			:class="'star-' + props.text"
			class="star absolute flex flex-row bg-black p-2 rounded-full">
			<!-- Boucle pour afficher les étoiles remplies -->
			<div
				v-for="index in stars"
				:key="'filled-' + index"
				class="flex flex-row">
				<Icon
					name="teenyicons:star-small-solid"
					class="w-auto h-5 star-pulse"
					:style="{ animationDelay: index * 0.2 + 's', 'color': props.color }" />
			</div>
			<!-- Boucle pour afficher les étoiles vides -->
			<div
				v-for="index in 5 - stars"
				:key="'empty-' + index"
				class="flex flex-row">
				<Icon
					name="teenyicons:star-small-outline"
					color="yellow"
					class="w-auto h-5 star-pulse"
					:style="{ animationDelay: (stars + index) * 0.2 + 's', 'color': props.color }" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { applyUnzoom } from "~/plugins/gsap";

const props = defineProps({
	text: String,
	color: String,
	icon: String,
	iconColor: String,
	pathIcon: String,
	withPath: Boolean,
	isGif: Boolean,
	stars: Number,
});

const handleMouseEnter = () => {
	if (typeof applyUnzoom === "function") {
		applyUnzoom(props.text, props.isGif);
	}
};

const toggleStars = () => {
	const isDesktopSize = window.innerWidth >= 1024;

	if (!isDesktopSize) {
		if (window.innerWidth >= 768) {
			const starElements = document.querySelectorAll(`.star-${props.text}`);

			if (starElements.length > 0) {
				// Vérifie si les étoiles sont déjà visibles
				const starsVisible =
					starElements[0].style.top === "-46%" ||
					starElements[0].style.top === "-64%";

				if (!starsVisible) {
					// Ferme toutes les autres étoiles
					document.querySelectorAll(".star").forEach((star) => {
						star.style.top = "";
						star.style.opacity = "";
						star.style.visibility = "";
						star.style.pointerEvents = "";
					});

					// Ouvre l'étoile cliquée
					starElements.forEach((star) => {
						star.style.top = "-46%";
						star.style.opacity = "1";
						star.style.visibility = "visible";
						star.style.pointerEvents = "auto";
					});
				} else {
					// Réinitialise les styles des étoiles si l'étoile cliquée est déjà ouverte
					starElements.forEach((star) => {
						star.style.top = "";
						star.style.opacity = "";
						star.style.visibility = "";
						star.style.pointerEvents = "";
					});
				}
			}
		} else {
			// Taille mobile
			const starElements = document.querySelectorAll(`.star-${props.text}`);

			if (starElements.length > 0) {
				// Vérifie si les étoiles sont déjà visibles
				const starsVisible =
					starElements[0].style.top === "-46%" ||
					starElements[0].style.top === "-64%";

				if (!starsVisible) {
					// Ferme toutes les autres étoiles
					document.querySelectorAll(".star").forEach((star) => {
						star.style.top = "";
						star.style.opacity = "";
						star.style.visibility = "";
						star.style.pointerEvents = "";
					});

					// Ouvre l'étoile cliquée
					starElements.forEach((star) => {
						star.style.top = "-64%";
						star.style.opacity = "1";
						star.style.visibility = "visible";
						star.style.pointerEvents = "auto";
					});
				} else {
					// Réinitialise les styles des étoiles si l'étoile cliquée est déjà ouverte
					starElements.forEach((star) => {
						star.style.top = "";
						star.style.opacity = "";
						star.style.visibility = "";
						star.style.pointerEvents = "";
					});
				}
			}
		}
	}
};
</script>

<style scoped>
.spin {
	animation: spin 3s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.star {
	top: -30%;
	left: 50%;
	transform: translateX(-50%);
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
	transition: all 0.3s;
}

@keyframes star-pulsate {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
	}
}

.star-pulse {
	animation: star-pulsate 1s infinite;
}

@media (min-width: 1024px) {
	.skills:hover .star {
		top: -46%;
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}
}
</style>
