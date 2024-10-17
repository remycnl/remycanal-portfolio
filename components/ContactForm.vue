<template>
	<div
		class="relative w-full pb-40 flex flex-col lg:flex-row gap-20 items-start justify-between">
		<div
			id="container-contact"
			class="relative lg:py-8 w-full lg:w-1/2 flex flex-col justify-start items-start">
			<h2
				id="Contact me"
				class="text-color-saturate text-[2rem] md:text-[3rem] 2xl:text-[3.5rem] font-bold text-secondary md:mb-1 text-start">
				Just say Hello !
			</h2>
			<h3
				class="text-[1.2rem] md:text-[1.5rem] -mt-5 md:-mt-2 lg:-mt-0 text-gray-light mb-5 lg:mb-10 text-start md:tracking-widest">
				Let me know more about you
			</h3>

			<!-- Formulaire avec autocomplete désactivé -->
			<form
				@submit.prevent="submitForm"
				autocomplete="off"
				class="space-y-6 2xl:space-y-10">
				<!-- Première ligne de champs (prénom et nom de famille) -->
				<div
					class="flex flex-col md:flex-row justify-between items-center gap-y-6 md:gap-x-6 2xl:gap-x-10">
					<input
						id="firstname"
						type="text"
						v-model="form.firstname"
						class="hover-scale-effect tracking-wider clickable cursor-pointer lg:cursor-none shadow-around shadow-black w-full md:w-1/2 px-4 py-4 bg-gray-dark rounded-lg focus:outline-none caret-secondary focus:ring-2 focus:ring-secondary text-white"
						placeholder="Firstname*"
						autocomplete="off"
						required />
					<input
						id="lastname"
						type="text"
						v-model="form.lastname"
						class="hover-scale-effect tracking-wider clickable cursor-pointer lg:cursor-none shadow-around shadow-black w-full md:w-1/2 px-4 py-4 bg-gray-dark rounded-lg focus:outline-none caret-secondary focus:ring-2 focus:ring-secondary text-white"
						placeholder="Lastname*"
						autocomplete="off"
						required />
				</div>

				<!-- Deuxième ligne de champs (email et entreprise) -->
				<div
					class="flex flex-col md:flex-row justify-between items-center gap-y-6 md:gap-x-6 2xl:gap-x-10">
					<input
						id="email"
						type="email"
						v-model="form.email"
						class="hover-scale-effect tracking-wider clickable cursor-pointer lg:cursor-none shadow-around shadow-black w-full md:w-1/2 px-4 py-4 bg-gray-dark rounded-lg focus:outline-none caret-secondary focus:ring-2 focus:ring-secondary text-white"
						placeholder="Email*"
						autocomplete="off"
						required />
					<input
						id="company"
						type="text"
						v-model="form.company"
						class="hover-scale-effect tracking-wider clickable cursor-pointer lg:cursor-none shadow-around shadow-black w-full md:w-1/2 px-4 py-4 bg-gray-dark rounded-lg focus:outline-none caret-secondary focus:ring-2 focus:ring-secondary text-white"
						placeholder="Company"
						autocomplete="off" />
				</div>

				<!-- Champ de texte pour le message -->
				<div>
					<textarea
						id="message"
						v-model="form.message"
						class="hover-scale-effect tracking-wider clickable cursor-pointer lg:cursor-none shadow-around shadow-black w-full h-32 px-4 py-4 bg-gray-dark rounded-lg focus:outline-none caret-secondary focus:ring-2 focus:ring-secondary text-white"
						placeholder="Message*"
						autocomplete="off"
						required></textarea>
				</div>

				<!-- RGPD Checkbox -->
				<div class="flex flex-row justify-start items-start gap-x-3">
					<div
						class="cntr hover-scale-effect clickable rounded-[10px] shadow-around shadow-black">
						<input
							v-model="form.rgpdConsent"
							class="hidden-xs-up cursor-pointer lg:cursor-none"
							id="cbx"
							type="checkbox"
							checked="" />
						<label class="cbx" for="cbx"></label>
					</div>
					<label
						for="cbx"
						style="font-family: Share Tech Mono"
						class="hover-scale-effect clickable cursor-pointer lg:cursor-none ml-2 text-sm md:text-base text-white">
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
					<div
						v-if="showConsentError"
						class="w-full flex justify-start md:justify-end">
						<div class="flex flex-col gap-2 w-fit">
							<div
								class="flex shadow-around shadow-black w-full p-2 h-fit rounded-lg bg-[#232531]">
								<div class="flex gap-2">
									<div
										class="text-yellow-600 bg-white/5 backdrop-blur-xl h-fit p-1 rounded-lg">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class="w-9 h-9">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"></path>
										</svg>
									</div>
									<div>
										<p class="text-white text-base">Please accept the terms</p>
										<p class="text-gray-500 text-sm">
											You must agree to the data processing terms before
											submitting.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Transition>

				<!-- Bouton d'envoi du formulaire -->
				<div class="flex justify-end">
					<button
						type="submit"
						class="cssbutton transition-colors shadow-around shadow-black duration-[1s] hover-scale-effect clickable mix-darken cursor-pointer lg:cursor-none text-white text-xl tracking-widest">
						<span class="text-shadow"> Send </span>
						<div class="icon">
							<Icon
								name="i-mingcute:send-plane-line"
								ssr="true"
								mode="svg"
								style="color: var(--primary-color)"
								class="w-[2.2em] h-[2.2em] transition-all duration-[1s]" />
						</div>
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
					class="z-[100] absolute h-full w-full top-0 left-0 rounded-2xl flex items-end md:items-center justify-center border-2 border-gray-semi bg-primary">
					<!-- Loader pendant l'envoi -->
					<div
						v-if="!isMessageSent && !isError"
						class="dot-spinner mb-40 md:mb-0">
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
					<Transition
						name="fade-reverse-scale"
						@before-enter="beforeEnter"
						@enter="enter"
						@leave="leave">
						<div
							v-if="isError"
							class="flex flex-col justify-center items-center gap-y-10">
							<NuxtImg
								src="/img/error.gif"
								format="gif"
								alt="Error!"
								class="w-[15rem] h-auto" />
							<div
								class="font-bold text-red-600 text-[2rem] md:text-[3rem] mb-40 md:mb-0">
								Failed to Send Message!
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</div>
		<div
			id="contact"
			class="relative p-4 md:p-10 2xl:p-14 w-full rounded-2xl bg-secondary-dark group shadow-around shadow-black lg:w-fit flex flex-col gap-y-2.5 justify-start items-start">
			<h2
				class="text-[1.7rem] md:text-[2rem] lg:text-[3.5rem] leading-[1.7rem] md:leading-[2rem] lg:leading-[3.5rem] font-bold text-gray-light group-hover:text-white transition-colors duration-500 mb-5 text-start">
				Get in touch
			</h2>
			<div
				class="w-full flex flex-row justify-start md:justify-center lg:justify-start items-center gap-x-2.5 text-[#435166] hover:text-white transition-colors duration-500">
				<div
					class="notif flex flex-row w-full md:w-[22rem] p-2.5 rounded-xl justify-start items-center gap-x-2.5 md:gap-x-4 bg-black">
					<div
						class="p-1 flex items-center justify-center rounded-lg bg-secondary-dark">
						<Icon
							name="i-material-symbols:alternate-email"
							ssr="true"
							mode="svg"
							style="color: var(--primary-color)"
							class="w-12 h-12 md:w-14 md:h-14" />
					</div>
					<div class="w-full flex flex-col items-start">
						<div class="w-full flex flex-row justify-between items-center">
							<h3
								style="font-family: Share Tech Mono"
								class="whitespace-nowrap text-lg md:text-2xl text-gray-light font-bold">
								By email
							</h3>
							<p
								class="time text-xs md:text-sm text-gray-light whitespace-nowrap">
								Now
							</p>
						</div>
						<h4
							ref="emailText"
							style="font-family: Share Tech Mono"
							class="whitespace-nowrap text-sm md:text-base tracking-tight md:tracking-wider">
							hello@remycanal.me
						</h4>
					</div>
				</div>
				<div class="copy">
					<div
						@click="copyToClipboard('emailText')"
						class="hover-scale-effect clickable flex justify-center items-center border-2 border-black rounded-xl bg-black transition-all duration-100 active:border-gray-semi">
						<label
							class="container-clipboard cursor-pointer lg:cursor-none p-4 md:p-5">
							<input type="checkbox" v-model="copiedEmail" />
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard">
								<path
									d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"></path>
							</svg>
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard-check">
								<path
									d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM305 273L177 401c-9.4 9.4-24.6 9.4-33.9 0L79 337c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L271 239c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
							</svg>
						</label>
					</div>
				</div>
			</div>
			<div
				class="w-full flex flex-row justify-start md:justify-center lg:justify-start items-center gap-x-2.5 text-[#435166] hover:text-white transition-colors duration-500">
				<div
					class="notif flex flex-row w-full md:w-[22rem] p-2.5 rounded-xl justify-start items-center gap-x-2.5 md:gap-x-4 bg-black">
					<div
						class="p-1 flex items-center justify-center rounded-lg bg-secondary-dark">
						<Icon
							name="i-ic:outline-local-phone"
							ssr="true"
							mode="svg"
							style="color: var(--primary-color)"
							class="w-12 h-12 md:w-14 md:h-14" />
					</div>
					<div class="w-full flex flex-col items-start">
						<div class="w-full flex flex-row justify-between items-center">
							<h3
								style="font-family: Share Tech Mono"
								class="whitespace-nowrap text-lg md:text-2xl text-gray-light font-bold">
								By phone
							</h3>
							<p
								class="time text-xs md:text-sm text-gray-light whitespace-nowrap">
								Now
							</p>
						</div>
						<h4
							ref="phoneText"
							style="font-family: Share Tech Mono"
							class="whitespace-nowrap text-sm md:text-base tracking-tight md:tracking-wider">
							+33 (0)6 19 25 82 99
						</h4>
					</div>
				</div>
				<div class="copy">
					<div
						@click="copyToClipboard('phoneText')"
						class="hover-scale-effect clickable flex justify-center items-center border-2 border-black rounded-xl bg-black transition-all duration-100 active:border-gray-semi">
						<label
							class="container-clipboard cursor-pointer lg:cursor-none p-4 md:p-5">
							<input checked="" type="checkbox" v-model="copiedPhone" />
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard">
								<path
									d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"></path>
							</svg>
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard-check">
								<path
									d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM305 273L177 401c-9.4 9.4-24.6 9.4-33.9 0L79 337c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L271 239c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
							</svg>
						</label>
					</div>
				</div>
			</div>
			<div
				class="w-full flex flex-row justify-start md:justify-center lg:justify-start items-center gap-x-2.5 text-[#435166] hover:text-white transition-colors duration-500">
				<div
					class="notif flex flex-row w-full md:w-[22rem] p-2.5 rounded-xl justify-start items-center gap-x-2.5 md:gap-x-4 bg-black">
					<div
						class="p-1 flex items-center justify-center rounded-lg bg-secondary-dark">
						<Icon
							name="i-material-symbols:location-on-outline"
							ssr="true"
							mode="svg"
							style="color: var(--primary-color)"
							class="w-12 h-12 md:w-14 md:h-14" />
					</div>
					<div class="w-full flex flex-col items-start">
						<div class="w-full flex flex-row justify-between items-center">
							<h3
								style="font-family: Share Tech Mono"
								class="whitespace-nowrap text-lg md:text-2xl text-gray-light font-bold">
								My adress
							</h3>
							<p
								class="time text-xs md:text-sm text-gray-light whitespace-nowrap">
								Now
							</p>
						</div>
						<h4
							ref="locationText"
							style="font-family: Share Tech Mono"
							class="whitespace-nowrap text-sm md:text-base tracking-tight md:tracking-wider">
							69007 Lyon, France
						</h4>
					</div>
				</div>
				<div class="copy">
					<div
						@click="copyToClipboard('locationText')"
						class="hover-scale-effect clickable flex justify-center items-center border-2 border-black rounded-xl bg-black transition-all duration-100 active:border-gray-semi">
						<label
							class="container-clipboard cursor-pointer lg:cursor-none p-4 md:p-5">
							<input checked="" type="checkbox" v-model="copiedLocation" />
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard">
								<path
									d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"></path>
							</svg>
							<svg
								viewBox="0 0 384 512"
								height="1em"
								xmlns="http://www.w3.org/2000/svg"
								class="clipboard-check">
								<path
									d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM305 273L177 401c-9.4 9.4-24.6 9.4-33.9 0L79 337c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L271 239c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
							</svg>
						</label>
					</div>
				</div>
			</div>
			<Transition
				name="fade-reverse-scale"
				@before-enter="beforeEnter"
				@enter="enter"
				@leave="leave">
				<div
					v-if="showCopyPopup"
					style="font-family: Share Tech Mono"
					class="absolute -bottom-24 right-0 bg-secondary text-white p-4 rounded-lg shadow-lg">
					{{ copySuccessMessage }}
					<div
						class="h-2 timed-popup bg-white rounded-full mt-2"
						:style="{ width: progressBarWidth + '%' }"></div>
				</div>
			</Transition>
		</div>
	</div>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { stickyContact, appearContact } from "@/plugins/gsap.js";

onMounted(() => {
	stickyContact();
	appearContact();
});

const form = reactive({
	firstname: "",
	lastname: "",
	email: "",
	company: "",
	message: "",
	rgpdConsent: false,
});

const showPopup = ref(false);
const isMessageSent = ref(false);
const isError = ref(false);
const showConsentError = ref(false);
const copySuccessMessage = ref("");
const showCopyPopup = ref(false);
const progressBarWidth = ref(100);

const submitForm = async () => {
	if (!form.rgpdConsent) {
		showConsentError.value = true;
		return;
	}

	showConsentError.value = false;
	showPopup.value = true;
	isError.value = false;

	const formData = {
		firstname: form.firstname,
		lastname: form.lastname,
		email: form.email,
		company: form.company,
		message: form.message,
	};

	try {
		const response = await fetch("https://www.remycanal.me/api/send-emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		});

		const result = await response.json();

		if (result.status === "success") {
			isMessageSent.value = true;
		} else {
			isError.value = true;
			console.error("Erreur lors de l'envoi:", result.message);
		}
	} catch (error) {
		console.error("Erreur lors de la requête:", error);
		isError.value = true;
	}

	setTimeout(() => {
		showPopup.value = false;
		isMessageSent.value = false;
		isError.value = false;
	}, 2000);
};

watch(
	() => form.rgpdConsent,
	(newValue) => {
		if (newValue) {
			showConsentError.value = false;
		}
	}
);

// Références pour chaque élément à copier
const emailText = ref(null);
const phoneText = ref(null);
const locationText = ref(null);

// Variables réactives pour gérer les états de copie
const copiedEmail = ref(false);
const copiedPhone = ref(false);
const copiedLocation = ref(false);

// Fonction pour copier le contenu dans le presse-papier
function copyToClipboard(refName) {
	let textToCopy = "";
	if (refName === "emailText") {
		textToCopy = emailText.value.innerText;
	} else if (refName === "phoneText") {
		textToCopy = phoneText.value.innerText;
	} else if (refName === "locationText") {
		textToCopy = locationText.value.innerText;
	}

	// Copier le texte dans le presse-papier
	navigator.clipboard.writeText(textToCopy).then(() => {
		if (refName === "emailText") {
			copiedEmail.value = true;
			copySuccessMessage.value = "Email adress copied!";
			showCopyPopup.value = true;
			startProgressBar();
			setTimeout(() => {
				showCopyPopup.value = false;
				copiedEmail.value = false;
			}, 2000);
			copiedPhone.value = false;
			copiedLocation.value = false;
		} else if (refName === "phoneText") {
			copiedEmail.value = false;
			copiedPhone.value = true;
			copySuccessMessage.value = "Phone number copied!";
			showCopyPopup.value = true;
			startProgressBar();
			setTimeout(() => {
				showCopyPopup.value = false;
				copiedPhone.value = false;
			}, 2000);
			copiedLocation.value = false;
		} else if (refName === "locationText") {
			copiedEmail.value = false;
			copiedPhone.value = false;
			copiedLocation.value = true;
			copySuccessMessage.value = "Location copied!";
			showCopyPopup.value = true;
			startProgressBar();
			setTimeout(() => {
				showCopyPopup.value = false;
				copiedLocation.value = false;
			}, 2000);
		}
	});
}

function startProgressBar() {
	progressBarWidth.value = 100;
	const duration = 2000;
	const startTime = performance.now();

	const animate = (currentTime) => {
		const elapsed = currentTime - startTime;
		const progress = Math.max(0, 100 - (elapsed / duration) * 100);
		progressBarWidth.value = progress;

		if (elapsed < duration) {
			requestAnimationFrame(animate);
		} else {
			progressBarWidth.value = 0;
			showCopyPopup.value = false;
		}
	};

	requestAnimationFrame(animate);
}
</script>

<style scoped>
.timed-popup {
	height: 0.5rem;
	transition: width 0.1s linear;
}
</style>
