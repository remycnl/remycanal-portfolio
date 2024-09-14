<template>
	<div
		class="w-full mb-40 flex flex-col lg:flex-row gap-20 items-start justify-between">
		<div
			class="relative rounded-lg p-8 w-full lg:w-1/2 flex flex-col justify-start items-start">
			<h2
				class="text-[1.7rem] md:text-[2rem] lg:text-[3.5rem] font-bold text-secondary md:mb-1 text-start">
				Just say Hello !
			</h2>
			<h3
				class="text-[0.9rem] lg:text-[1.5rem] -mt-5 md:-mt-6 lg:-mt-0 text-gray-light mb-5 lg:mb-10 text-start md:tracking-widest">
				Let me know more about you
			</h3>

			<!-- Formulaire avec autocomplete désactivé -->
			<form
				@submit.prevent="submitForm"
				autocomplete="off"
				class="space-y-6 lg:space-y-10">
				<!-- Première ligne de champs (prénom et nom de famille) -->
				<div
					class="flex flex-col lg:flex-row justify-between items-center gap-y-6 gap-x-10">
					<input
						id="firstname"
						type="text"
						v-model="form.firstname"
						class="hover-scale-effect clickable cursor-none w-full lg:w-1/2 px-4 py-4 bg-gray-light bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
						placeholder="Firstname*"
						autocomplete="off"
						required />
					<input
						id="lastname"
						type="text"
						v-model="form.lastname"
						class="hover-scale-effect clickable cursor-none w-full lg:w-1/2 px-4 py-4 bg-gray-light bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
						placeholder="Lastname*"
						autocomplete="off"
						required />
				</div>

				<!-- Deuxième ligne de champs (email et entreprise) -->
				<div
					class="flex flex-col lg:flex-row justify-between items-center gap-y-6 gap-x-10">
					<input
						id="email"
						type="email"
						v-model="form.email"
						class="hover-scale-effect clickable cursor-none w-full lg:w-1/2 px-4 py-4 bg-gray-light bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
						placeholder="Email*"
						autocomplete="off"
						required />
					<input
						id="company"
						type="text"
						v-model="form.company"
						class="hover-scale-effect clickable cursor-none w-full lg:w-1/2 px-4 py-4 bg-gray-light bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
						placeholder="Company"
						autocomplete="off" />
				</div>

				<!-- Champ de texte pour le message -->
				<div>
					<textarea
						id="message"
						v-model="form.message"
						class="hover-scale-effect clickable cursor-none w-full h-32 px-4 py-4 bg-gray-light bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
						placeholder="Message*"
						autocomplete="off"
						required></textarea>
				</div>

				<!-- RGPD Checkbox -->
				<div class="flex flex-row justify-start items-start gap-x-3">
					<div class="checkbox-wrapper">
						<div class="cbx hover-scale-effect clickable">
							<input
								v-model="form.rgpdConsent"
								type="checkbox"
								class="cursor-none"
								id="cbx-12" />
							<label for="cbx-12"></label>
							<svg fill="none" viewBox="0 0 15 14" height="14" width="15">
								<path d="M2 8.36364L6.23077 12L13 2"></path>
							</svg>
						</div>

						<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<filter id="goo-12">
									<feGaussianBlur
										result="blur"
										stdDeviation="4"
										in="SourceGraphic"></feGaussianBlur>
									<feColorMatrix
										result="goo-12"
										values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
										mode="matrix"
										in="blur"></feColorMatrix>
									<feBlend in2="goo-12" in="SourceGraphic"></feBlend>
								</filter>
							</defs>
						</svg>
					</div>
					<label
						for="cbx-12"
						style="font-family: Share Tech Mono"
						class="hover-scale-effect clickable cursor-none ml-2 text-sm md:text-base text-white">
						I consent to the use of my personal data for the purpose of
						responding to my inquiry.
					</label>
				</div>

				<!-- Message d'erreur pour consentement RGPD -->
				<Transition
					name="fade-reverse-scale"
					@before-enter="beforeEnter"
					@enter="enter"
					@leave="leave">
					<div v-if="showConsentError" class="w-full flex justify-end">
						<div
							class="w-fit flex flex-row gap-x-3 justify-center items-start md:items-center lg:items-start 2xl:items-center bg-yellow-100 rounded-lg py-5 px-7">
							<div>
								<Icon
									name="lucide:message-circle-warning"
									color="#eab308"
									class="w-8 h-8" />
							</div>
							<div
								style="font-family: Share Tech Mono"
								class="font-bold text-yellow-500 text-sm lg:text-lg">
								You must agree to the data processing terms before submitting.
							</div>
						</div>
					</div>
				</Transition>

				<!-- Bouton d'envoi du formulaire -->
				<div class="flex justify-end">
					<button
						type="submit"
						class="hover-scale-effect clickable mix-darken cursor-none button group w-fit flex items-center border-none relative py-3.5 pl-4 pr-16 p-1.5 text-white text-xl tracking-widest rounded-2xl bg-secondary">
						Send
						<Icon
							name="mingcute:send-plane-line"
							color="var(--primary-color)"
							class="absolute group-active:scale-95 p-1 flex items-center justify-center w-[2.2em] h-[2.2em] rounded-xl bg-white" />
					</button>
				</div>
			</form>

			<!-- Popup modale avec loader et message envoyé -->
			<Transition
				name="fade-reverse-scale"
				@before-enter="beforeEnter"
				@enter="enter"
				@leave="leave">
				<div
					v-if="showPopup"
					class="z-20 absolute h-full w-full top-0 left-0 rounded-2xl flex items-end md:items-center justify-center border-2 border-gray-semi bg-primary">
					<!-- Loader pendant l'envoi -->
					<div v-if="!isMessageSent" class="dot-spinner mb-40 md:mb-0">
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
						<div class="dot-spinner__dot"></div>
					</div>
					<!-- Message de confirmation après l'envoi -->
					<Transition
						name="fade-reverse-scale"
						@before-enter="beforeEnter"
						@enter="enter"
						@leave="leave">
						<div
							v-if="isMessageSent"
							class="flex flex-col justify-center items-center">
							<NuxtImg
								src="/img/messageSent.gif"
								format="gif"
								alt="Message Sent!"
								class="w-[30rem] h-auto" />
							<div
								class="font-bold text-secondary text-[2rem] md:text-[3rem] mb-40 md:mb-0">
								Message Sent!
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</div>
	</div>
</template>

<script setup>
import { reactive, ref, watch } from "vue";

// Définir l'état du formulaire réactif
const form = reactive({
	firstname: "", // Prénom
	lastname: "", // Nom de famille
	email: "", // Email
	company: "", // Entreprise
	message: "", // Message
	rgpdConsent: false, // Consentement RGPD
});

// Variables pour gérer la popup et le loader
const showPopup = ref(false); // Affiche la popup
const isMessageSent = ref(false); // Message envoyé ou non

// Variable pour afficher ou non l'erreur de consentement
const showConsentError = ref(false);

// Fonction pour soumettre le formulaire
const submitForm = async () => {
	if (!form.rgpdConsent) {
		showConsentError.value = true; // Afficher l'erreur si consentement non coché
		return;
	}

	showConsentError.value = false; // Masquer l'erreur si tout est bon
	showPopup.value = true; // Afficher la popup avec loader

	// Simuler l'envoi avec un délai
	await simulateFormSubmission();

	// Afficher le message de confirmation après l'envoi
	isMessageSent.value = true;

	// Attendre une demi-seconde (500 ms) avant de cacher la popup
	setTimeout(() => {
		showPopup.value = false;
		isMessageSent.value = false;
	}, 2000); // Délai de 500 ms
};

// Simuler l'envoi du formulaire avec un délai (par exemple 2 secondes)
const simulateFormSubmission = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 2000); // Délai de 2 secondes pour simuler l'envoi
	});
};

// Watch pour surveiller les changements dans la case RGPD
watch(
	() => form.rgpdConsent,
	(newValue) => {
		if (newValue) {
			showConsentError.value = false; // Si la case est cochée, masquer l'erreur
		}
	}
);
</script>

<style scoped>
.dot-spinner {
	--uib-size: 10rem;
	--uib-speed: 0.9s;
	--uib-color: var(--primary-color);
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	height: var(--uib-size);
	width: var(--uib-size);
}

.dot-spinner__dot {
	position: absolute;
	top: 0;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	height: 100%;
	width: 100%;
}

.dot-spinner__dot::before {
	content: "";
	height: 20%;
	width: 20%;
	border-radius: 50%;
	background-color: var(--uib-color);
	transform: scale(0);
	opacity: 0.5;
	animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
	box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
}

.dot-spinner__dot:nth-child(2) {
	transform: rotate(45deg);
}

.dot-spinner__dot:nth-child(2)::before {
	animation-delay: calc(var(--uib-speed) * -0.875);
}

.dot-spinner__dot:nth-child(3) {
	transform: rotate(90deg);
}

.dot-spinner__dot:nth-child(3)::before {
	animation-delay: calc(var(--uib-speed) * -0.75);
}

.dot-spinner__dot:nth-child(4) {
	transform: rotate(135deg);
}

.dot-spinner__dot:nth-child(4)::before {
	animation-delay: calc(var(--uib-speed) * -0.625);
}

.dot-spinner__dot:nth-child(5) {
	transform: rotate(180deg);
}

.dot-spinner__dot:nth-child(5)::before {
	animation-delay: calc(var(--uib-speed) * -0.5);
}

.dot-spinner__dot:nth-child(6) {
	transform: rotate(225deg);
}

.dot-spinner__dot:nth-child(6)::before {
	animation-delay: calc(var(--uib-speed) * -0.375);
}

.dot-spinner__dot:nth-child(7) {
	transform: rotate(270deg);
}

.dot-spinner__dot:nth-child(7)::before {
	animation-delay: calc(var(--uib-speed) * -0.25);
}

.dot-spinner__dot:nth-child(8) {
	transform: rotate(315deg);
}

.dot-spinner__dot:nth-child(8)::before {
	animation-delay: calc(var(--uib-speed) * -0.125);
}

@keyframes pulse0112 {
	0%,
	100% {
		transform: scale(0);
		opacity: 0.5;
	}

	50% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.checkbox-wrapper {
	position: relative;
}

.checkbox-wrapper > svg {
	position: absolute;
	top: -130%;
	left: -170%;
	width: 110px;
	pointer-events: none;
}

.checkbox-wrapper * {
	box-sizing: border-box;
}

.checkbox-wrapper input[type="checkbox"] {
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	-webkit-tap-highlight-color: transparent;
	margin: 0;
}

.checkbox-wrapper input[type="checkbox"]:focus {
	outline: 0;
}

.checkbox-wrapper .cbx {
	width: 24px;
	height: 24px;
	top: calc(100px - 12px);
	left: calc(100px - 12px);
}

.checkbox-wrapper .cbx input {
	position: absolute;
	top: 0;
	left: 0;
	width: 24px;
	height: 24px;
	border: 2px solid var(--white);
	border-radius: 50%;
}

.checkbox-wrapper .cbx label {
	width: 24px;
	height: 24px;
	background: none;
	border-radius: 50%;
	position: absolute;
	top: 0;
	left: 0;
	transform: trasnlate3d(0, 0, 0);
	pointer-events: none;
}

.checkbox-wrapper .cbx svg {
	position: absolute;
	top: 5px;
	left: 4px;
	z-index: 1;
	pointer-events: none;
}

.checkbox-wrapper .cbx svg path {
	stroke: var(--white);
	stroke-width: 3;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-dasharray: 19;
	stroke-dashoffset: 19;
	transition: stroke-dashoffset 0.3s ease;
	transition-delay: 0.2s;
}

.checkbox-wrapper .cbx input:checked + label {
	animation: splash 0.6s ease forwards;
}

.checkbox-wrapper .cbx input:checked + label + svg path {
	stroke-dashoffset: 0;
}

@-moz-keyframes splash {
	40% {
		background: var(--primary-color);
		box-shadow: 0 -18px 0 -8px var(--primary-color),
			16px -8px 0 -8px var(--primary-color),
			16px 8px 0 -8px var(--primary-color), 0 18px 0 -8px var(--primary-color),
			-16px 8px 0 -8px var(--primary-color),
			-16px -8px 0 -8px var(--primary-color);
	}

	100% {
		background: var(--primary-color);
		box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent,
			32px 16px 0 -10px transparent, 0 36px 0 -10px transparent,
			-32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
	}
}

@-webkit-keyframes splash {
	40% {
		background: var(--primary-color);
		box-shadow: 0 -18px 0 -8px var(--primary-color),
			16px -8px 0 -8px var(--primary-color),
			16px 8px 0 -8px var(--primary-color), 0 18px 0 -8px var(--primary-color),
			-16px 8px 0 -8px var(--primary-color),
			-16px -8px 0 -8px var(--primary-color);
	}

	100% {
		background: var(--primary-color);
		box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent,
			32px 16px 0 -10px transparent, 0 36px 0 -10px transparent,
			-32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
	}
}

@-o-keyframes splash {
	40% {
		background: var(--primary-color);
		box-shadow: 0 -18px 0 -8px var(--primary-color),
			16px -8px 0 -8px var(--primary-color),
			16px 8px 0 -8px var(--primary-color), 0 18px 0 -8px var(--primary-color),
			-16px 8px 0 -8px var(--primary-color),
			-16px -8px 0 -8px var(--primary-color);
	}

	100% {
		background: var(--primary-color);
		box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent,
			32px 16px 0 -10px transparent, 0 36px 0 -10px transparent,
			-32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
	}
}

@keyframes splash {
	40% {
		background: var(--primary-color);
		box-shadow: 0 -18px 0 -8px var(--primary-color),
			16px -8px 0 -8px var(--primary-color),
			16px 8px 0 -8px var(--primary-color), 0 18px 0 -8px var(--primary-color),
			-16px 8px 0 -8px var(--primary-color),
			-16px -8px 0 -8px var(--primary-color);
	}

	100% {
		background: var(--primary-color);
		box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent,
			32px 16px 0 -10px transparent, 0 36px 0 -10px transparent,
			-32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
	}
}
</style>
