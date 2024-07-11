import { gsap } from "gsap";
import { Elastic } from "gsap/all";
export { gsap };
export default defineNuxtPlugin(() => {
	return {
		toggleDropdown,
		applyZoomEffect,
		applyUnzoom,
		toggleCard,
		animationFooter,
		customCursor,
	};
});

gsap.registerPlugin(Elastic);

let isDropdownOpen = false;

export function toggleDropdown() {
	if (window.innerWidth < 1024) {
		isDropdownOpen = !isDropdownOpen;
		const slotElement = document.getElementById("slot");
		const footerElement = document.getElementById("footer");

		if (isDropdownOpen) {
			document.body.classList.add("overflow-hidden");
			gsap.to(slotElement, {
				duration: 0.8,
				filter: "blur(10px)",
				backdropFilter: "blur(10px)",
				ease: "power2.out",
			});
			gsap.to(footerElement, {
				duration: 0.8,
				filter: "blur(10px)",
				backdropFilter: "blur(10px)",
				ease: "power2.out",
			});

			gsap.to(".third-line", {
				scaleX: 0,
				transformOrigin: "left",
				duration: 0.2,
			});
			gsap.to(".second-line", {
				scaleX: 0,
				transformOrigin: "left",
				duration: 0.2,
				delay: 0.2,
			});
			gsap.to(".first-line", {
				scaleX: 0,
				transformOrigin: "left",
				duration: 0.2,
				delay: 0.4,
			});
			gsap.to(".toolbar", {
				opacity: 0,
				duration: 0.8,
				onComplete: function () {
					document
						.querySelector(".toolbar")
						.classList.remove("pointer-events-auto");
				},
			});
			gsap.to(".dropdown-animation", {
				y: "0%",
				duration: 0.8,
				ease: "easeOut",
				delay: 0.4,
			});
			gsap.to(".blur-background-menu", {
				opacity: 1,
				duration: 0.5,
				onComplete: function () {
					document
						.querySelector(".blur-background-menu")
						.classList.remove("pointer-events-none");
				},
				delay: 0.4,
			});
			gsap.to(".header", {
				onComplete: function () {
					document
						.querySelector(".header")
						.classList.remove("pointer-events-none");
				},
			});
		} else {
			document.body.classList.remove("overflow-hidden");
			gsap.to(slotElement, {
				duration: 0.8,
				filter: "blur(0px)",
				backdropFilter: "blur(0px)",
				ease: "power2.in",
			});
			gsap.to(footerElement, {
				duration: 0.8,
				filter: "blur(0px)",
				backdropFilter: "blur(0px)",
				ease: "power2.in",
			});

			gsap.to(".first-line", {
				scaleX: 1,
				transformOrigin: "left",
				duration: 0.2,
				delay: 0.3,
			});
			gsap.to(".second-line", {
				scaleX: 1,
				transformOrigin: "left",
				duration: 0.2,
				delay: 0.5,
			});
			gsap.to(".third-line", {
				scaleX: 1,
				transformOrigin: "left",
				duration: 0.2,
				delay: 0.7,
			});
			gsap.to(".toolbar", {
				opacity: 1,
				duration: 0.8,
				onComplete: function () {
					document
						.querySelector(".toolbar")
						.classList.add("pointer-events-auto");
				},
			});
			gsap.to(".dropdown-animation", {
				y: "-150%",
				duration: 0.8,
				ease: "easeIn",
				delay: 0.2,
			});
			gsap.to(".blur-background-menu", {
				opacity: 0,
				duration: 0.5,
				onComplete: function () {
					document
						.querySelector(".blur-background-menu")
						.classList.add("pointer-events-none");
				},
			});
			gsap.to(".header", {
				onComplete: function () {
					document
						.querySelector(".header")
						.classList.add("pointer-events-none");
				},
			});
		}
	}
}

export function applyZoomEffect(index) {
	const textMenu = document.querySelector(`#text-menu-${index}`);

	gsap.to(textMenu, {
		duration: 0.4,
		scale: 1.6,
		ease: "power2.inOut",
		onComplete: () => {
			gsap.to(textMenu, {
				duration: 1,
				scale: 1,
				ease: Elastic.easeOut,
			});
		},
	});
}

export function applyUnzoom(index, isGif) {
	const logo = document.querySelector(`#skill-bubble-${isGif ? "gif" : index}`);

	gsap.to(logo, {
		duration: 0.4,
		scale: 0.7,
		ease: "power2.inOut",
		onComplete: () => {
			gsap.to(logo, {
				duration: 1,
				scale: 1,
				ease: Elastic.easeOut,
			});
		},
	});
}

export function toggleCard(index) {
	const card = document.querySelector(`.card-${index}`);
	const cardText = document.querySelector(`.card-text-${index}`);

	card.classList.toggle("is-flipped");

	if (cardText.classList.contains("group-hover:text-gray-light")) {
		cardText.classList.add("group-hover:text-primary");
		cardText.classList.remove("group-hover:text-gray-light");
	} else {
		cardText.classList.add("group-hover:text-gray-light");
		cardText.classList.remove("group-hover:text-primary");
	}

	gsap.to(card, {
		duration: 0.1,
		rotationY: "+=180",
		ease: "none",
	});

	function toggleClassesAfterDelay() {
		const cardSubtext = document.querySelector(`.card-subtext-${index}`);

		if (cardSubtext.classList.contains("text-primary")) {
			cardSubtext.classList.remove("text-primary");
			cardSubtext.classList.add("text-color-saturate");
		} else {
			cardSubtext.classList.remove("text-color-saturate");
			cardSubtext.classList.add("text-primary");
		}
	}

	setTimeout(toggleClassesAfterDelay, 200);
}

export function animationFooter() {
	const lettersContainer = document.getElementById("letters");
	const alphabet =
		"▞▚▞▚▞▚▞_LANAC_YMÉR_▞▚▞▚▞▚▞_EM_YB_DETFARCDNAH_▞▚▞▚▞▚▞_DEVRESER_STHGIR_LLA_▞▚▞▚▞▚▞_4202_THGIRYPOC_©_".split(
			""
		);
	let index = 0;

	for (let i = 0; i < 4; i++) {
		generateLetters();
	}

	function createLetterSpan(letter) {
		const span = document.createElement("span");
		span.textContent = letter;

		if (lettersContainer.firstChild) {
			lettersContainer.insertBefore(span, lettersContainer.firstChild);
		} else {
			lettersContainer.appendChild(span);
		}

		return span;
	}

	function animateLetter(letter) {
		const span = createLetterSpan(letter);

		gsap.to(span, {
			x: "100%",
			repeat: -1,
			ease: "linear",
			onComplete: () => {
				span.remove();
			},
		});
	}

	function generateLetters() {
		alphabet.forEach((letter) => {
			const span = createLetterSpan(letter);
		});
	}

	function generateAndAnimateLetters() {
		animateLetter(alphabet[index]);
		index = (index + 1) % alphabet.length;
		setTimeout(generateAndAnimateLetters, 250);
	}

	generateAndAnimateLetters();
}

export function customCursor() {
	const customCursor = document.querySelector(".custom-cursor");

	// Met à jour la position du curseur personnalisé en fonction des mouvements de la souris
	document.addEventListener("mousemove", (e) => {
		gsap.to(customCursor, {
			x: e.clientX,
			y: e.clientY,
			duration: 0,
		});
	});

	// Anime le curseur lorsque la souris entre et quitte un élément cliquable
	document.querySelectorAll(".clickable").forEach((el) => {
		el.addEventListener("mouseenter", () => {
			if (el.classList.contains('mix-darken')) {
				customCursor.classList.add('mix-blend-darken');
			} else {
				customCursor.classList.add('mix-blend-lighten');
			}
			gsap.to(customCursor, {
				width: 40,
				height: 40,
				duration: 0.3,
			});
		});
		
		el.addEventListener("mouseleave", () => {
			if (el.classList.contains('mix-darken')) {
				customCursor.classList.remove('mix-blend-darken');
			} else {
				customCursor.classList.remove('mix-blend-lighten');
			}
			gsap.to(customCursor, {
				width: 20,
				height: 20,
				duration: 0.3,
			});
		});
	});
}
