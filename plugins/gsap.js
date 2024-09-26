import { setExperienceTime, setProjectsCounter } from "@/plugins/global.js";
import { gsap } from "gsap";
import { Elastic, ScrollTrigger } from "gsap/all";
export { gsap };
export default defineNuxtPlugin(() => {
	return {
		toggleDropdown,
		applyZoomEffect,
		applyUnzoom,
		toggleCard,
		animationFooter,
		customCursor,
		animationFooterBottom,
		animationCheckboxColor,
		showImage,
		hideImages,
		animationStarsCardSkill,
		showProject,
		hideProject,
		stickyProject,
		apparitionMobileProjectCards,
		appearBento,
		appearStart,
		stickyContact,
		stickySkills,
		appearContact,
		appearTimeline,
	};
});

gsap.registerPlugin(ScrollTrigger, Elastic);

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
				transformOrigin: "center",
				duration: 0.2,
				delay: 0.2,
			});
			gsap.to(".first-line", {
				scaleX: 0,
				transformOrigin: "right",
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
				transformOrigin: "right",
				duration: 0.2,
				delay: 0.6,
			});
			gsap.to(".second-line", {
				scaleX: 1,
				transformOrigin: "center",
				duration: 0.2,
				delay: 0.8,
			});
			gsap.to(".third-line", {
				scaleX: 1,
				transformOrigin: "left",
				duration: 0.2,
				delay: 1,
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
	if (window.innerWidth < 1024) {
		const lettersContainer = document.getElementById("letters");
		const alphabet =
			"▞▚▞▚▞▚▞_LANAC_YMÉR_▞▚▞▚▞▚▞_EM_YB_DETFARCDNAH_▞▚▞▚▞▚▞_DEVRESER_STHGIR_LLA_▞▚▞▚▞▚▞_4202_THGIRYPOC_©_▞▚▞▚▞▚▞_EEFFOC_DNA_♡_HTIW_EDAM_".split(
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
}

export function animationFooterBottom() {
	if (window.innerWidth >= 1024) {
		const lettersContainer = document.getElementById("letters-bottom");
		const alphabet =
			"▞▚▞▚▞▚▞_LANAC_YMÉR_▞▚▞▚▞▚▞_EM_YB_DETFARCDNAH_▞▚▞▚▞▚▞_DEVRESER_STHGIR_LLA_▞▚▞▚▞▚▞_4202_THGIRYPOC_©_▞▚▞▚▞▚▞_EEFFOC_DNA_♡_HTIW_EDAM_".split(
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
			if (el.classList.contains("mix-darken")) {
				customCursor.classList.add("mix-blend-darken");
			} else {
				customCursor.classList.add("mix-blend-lighten");
			}
			gsap.to(customCursor, {
				width: 40,
				height: 40,
				duration: 0.3,
			});
		});

		el.addEventListener("mouseleave", () => {
			if (el.classList.contains("mix-darken")) {
				customCursor.classList.remove("mix-blend-darken");
			} else {
				customCursor.classList.remove("mix-blend-lighten");
			}
			gsap.to(customCursor, {
				width: 20,
				height: 20,
				duration: 0.3,
			});
		});
	});
}

export function animationCheckboxColor(isOpen) {
	const labels = document.querySelectorAll(".circle-container label");
	const finalRadius = 70;
	const angleStep = (2 * Math.PI) / labels.length;

	labels.forEach((label, index) => {
		const angle = index * angleStep;
		const x = finalRadius * Math.cos(angle) - label.offsetWidth / 2 + 11;
		const y = finalRadius * Math.sin(angle) - label.offsetHeight / 2 + 13;

		if (isOpen) {
			gsap.fromTo(
				label,
				{ x: 0, y: 0 },
				{ x: x, y: y, duration: 0.5, ease: "power2.out" }
			);
		} else {
			gsap.to(label, { x: 0, y: 0, duration: 0.5, ease: "power2.in" });
		}
	});
}

export function showImage(imageSrc) {
	// Create the NuxtImg element
	this.currentImage = imageSrc;
	const nuxtImg = document.createElement("img");
	nuxtImg.id = `image-${this.currentImage.replace(/[^a-zA-Z0-9]/g, "-")}`;
	nuxtImg.src = imageSrc;
	nuxtImg.alt = `Mockup - ${this.currentImage}`;
	nuxtImg.className =
		"absolute top-0 left-0 rounded-[1.5rem] w-full h-full brightness-[.7] object-fill";
	nuxtImg.style.transform = "translateY(100%)"; // Start from bottom

	// Find the container with the class 'image-animation-container'
	const container = document.querySelector(".image-animation-container");
	if (container) {
		container.appendChild(nuxtImg);
		this.imageElement = nuxtImg;

		// Animate the image to appear from bottom to top over 0.3s
		gsap.to(nuxtImg, {
			y: 0,
			duration: 0.8,
		});
	}
}

export function hideImages() {
	const imgElements = document.querySelectorAll('[id^="image-"]');
	imgElements.forEach((imgElement) => {
		gsap.to(imgElement, {
			delay: 0.7,
			onComplete: () => {
				imgElement.remove();
			},
		});
	});
	this.currentImage = null;
}

export function animationStarsCardSkill() {
	const stars = document.querySelectorAll(".star-card");

	gsap.fromTo(
		stars,
		{ scale: 0, rotate: 0, opacity: 0 },
		{
			scale: 1,
			rotate: 360,
			opacity: 1,
			stagger: 0.15,
			ease: "power2.out",
			duration: 0.5,
		}
	);
}

export function showProject() {
	const containerProject = document.querySelector(".container-project");

	gsap.set(containerProject, { x: -1500, y: 900, rotate: -30, opacity: 1 });

	gsap.to(containerProject, {
		x: 0,
		y: 0,
		rotate: 0,
		duration: 1.5,
		ease: "power2.out",
	});
}

export function hideProject() {
	const containerProject = document.querySelector(".container-project");
	gsap.to(containerProject, {
		x: -1500,
		y: 900,
		rotate: -30,
		duration: 1.5,
		ease: "power2.out",
	});
}

export function stickyProject() {
	const projects = document.querySelector(".projects-link");
	const projectCard = document.querySelector(".container-project");

	if (projects.offsetHeight > projectCard.offsetHeight) {
		gsap.to(projectCard, {
			top: () => `${projects.offsetHeight - projectCard.offsetHeight}px`,
			ease: "none",
			scrollTrigger: {
				trigger: projects,
				start: "top 30%",
				end: "bottom 80%",
				scrub: 0.5,
			},
		});
	}
}

export function apparitionMobileProjectCards() {
	const cards = document.querySelectorAll(".cards-project-mobile");

	cards.forEach((card) => {
		gsap.fromTo(
			card,
			{
				y: 200,
				rotation: -20,
				opacity: 0,
				scale: 0.5,
			},
			{
				y: 0,
				rotation: 0,
				opacity: 1,
				scale: 1,
				duration: 1,
				ease: "power3.out",
				scrollTrigger: {
					trigger: card,
					start: "top bottom",
					end: "top 50%",
					scrub: true,
				},
			}
		);
	});
}

export function appearBento() {
	const bento = document.querySelector(".bento");
	const articles = Array.from(document.querySelectorAll(".article"));
	const isMobile = window.matchMedia("(max-width: 768px)").matches;
	const wannaWorkWithMe = document.getElementById("wanna-work-with-me");

	if (isMobile) {
		gsap.set(wannaWorkWithMe, {
			opacity: 0,
			y: -100,
		});
		articles.forEach((article) => {
			gsap.fromTo(
				article,
				{
					opacity: 0,
					scale: 0.5,
				},
				{
					opacity: 1,
					scale: 1,
					duration: 1,
					ease: "elastic.out(1, 0.4)",
					scrollTrigger: {
						trigger: article,
						start: "top 90%",
						once: true,
						onEnter: () => {
							if (article.id === "experience-nbr") {
								setTimeout(() => {
									setExperienceTime();
								}, 500);
							} else if (article.id === "projects-nbr") {
								setTimeout(() => {
									setProjectsCounter();
								}, 500);
							}
						},
					},
				}
			);
		});
		gsap.to(wannaWorkWithMe, {
			opacity: 1,
			y: 0,
			duration: 2,
			ease: "elastic.out(1, 0.3)",
			scrollTrigger: {
				trigger: wannaWorkWithMe,
				start: "top 80%",
				once: true,
			},
			onComplete: () => {
				wannaWorkWithMe.classList.add("animate-pulse");
			},
		});
	} else {
		let randomOrder = [...articles].sort(() => Math.random() - 0.5);

		gsap.set(wannaWorkWithMe, {
			opacity: 0,
			y: -100,
		});

		randomOrder.forEach((article, index) => {
			gsap.fromTo(
				article,
				{
					opacity: 0,
					scale: 0.5,
				},
				{
					opacity: 1,
					scale: 1,
					duration: 1.5,
					delay: index * 0.3,
					ease: "elastic.out(1, 0.4)",
					scrollTrigger: {
						trigger: bento,
						start: "top 70%",
						once: true,
					},
					onStart: () => {
						if (article.id === "experience-nbr") {
							setTimeout(() => {
								setExperienceTime();
							}, 500);
						} else if (article.id === "projects-nbr") {
							setTimeout(() => {
								setProjectsCounter();
							}, 500);
						}
					},
					onComplete: () => {
						setTimeout(() => {
							gsap.to(wannaWorkWithMe, {
								opacity: 1,
								y: 0,
								duration: 2,
								ease: "elastic.out(1, 0.3)",
							});
							wannaWorkWithMe.classList.add("animate-pulse");
						}, 500);
					},
				}
			);
		});
	}
}

export function appearStart() {
	const width = window.innerWidth;
	const isMobile = width <= 768;
	const isTablet = width > 768 && width <= 1024;
	const isDesktop = width > 1024;

	const avatar = document.getElementById("avatar");
	const buttonCV = document.getElementById("download-cv");
	const buttonColor = document.getElementById("color-button");

	// Fonction réutilisable pour animer un élément
	function animateElement(selector, fromProps, toProps) {
		gsap.fromTo(selector, fromProps, toProps);
	}

	// Configuration des paramètres en fonction de l'appareil
	const easeValueAvatar = isMobile
		? "elastic.out(0.8, 1)"
		: isTablet
		? "elastic.out(0.85, 1)"
		: "elastic.out(1, 0.60)";

	// Animation de l'avatar
	animateElement(
		avatar,
		{ y: 1000, opacity: 0 },
		{ y: 0, opacity: 1, duration: 3, ease: easeValueAvatar }
	);

	// Animation pour firstname et lastname
	const commonAnimation = { duration: 3, ease: "elastic.out(1, 0.5)" };
	animateElement(
		".firstname-about-me",
		{ x: 700, opacity: 0 },
		{ x: 0, opacity: 1, ...commonAnimation }
	);
	animateElement(
		".lastname-about-me",
		{ x: -900, opacity: 0 },
		{ x: 0, opacity: 1, ...commonAnimation }
	);

	// Animations spécifiques pour Desktop et Tablet
	if (isDesktop) {
		animateElement(
			".web",
			{ x: 900, opacity: 0 },
			{ x: 0, opacity: 1, ...commonAnimation }
		);
		animateElement(
			".developer",
			{ x: -700, opacity: 0 },
			{ x: 0, opacity: 1, ...commonAnimation }
		);
		animateElement(
			".about-me-paragraph",
			{ x: 400, opacity: 0 },
			{ x: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
		animateElement(
			buttonCV,
			{ x: 500, opacity: 0 },
			{ x: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
		animateElement(
			buttonColor,
			{ x: -500, opacity: 0 },
			{ x: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
	} else if (isTablet) {
		animateElement(
			".web",
			{ y: 400, opacity: 0 },
			{ y: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
		animateElement(
			".developer",
			{ y: 400, opacity: 0 },
			{ y: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
		animateElement(
			".about-me-paragraph",
			{ y: 500, opacity: 0 },
			{ y: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
		animateElement(
			buttonCV,
			{ y: 600, opacity: 0 },
			{ y: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.5)" }
		);
	}
}

export function stickyContact() {
	const container = document.getElementById("container-contact");
	const contact = document.getElementById("contact");
	const width = window.innerWidth;
	const isDesktop = width > 1024;

	if (isDesktop && container.offsetHeight > contact.offsetHeight) {
		gsap.to(contact, {
			y: () => `${container.offsetHeight - contact.offsetHeight}px`,
			ease: "none",
			scrollTrigger: {
				trigger: container,
				start: "top 30%",
				end: "bottom 80%",
				scrub: 0.5,
			},
		});
	}
}

export function stickySkills() {
	const container = document.getElementById("container-skills");
	const skillCard = document.getElementById("skill-card");
	const width = window.innerWidth;
	const isDesktop = width > 1024;

	if (isDesktop && container.offsetHeight > skillCard.offsetHeight) {
		gsap.to(skillCard, {
			y: () => `${container.offsetHeight - skillCard.offsetHeight}px`,
			ease: "none",
			scrollTrigger: {
				trigger: container,
				start: "top 30%",
				end: "bottom 80%",
				scrub: 0.5,
			},
		});
	}
}

export function appearContact() {
	const contact = document.getElementById("contact");
	const notifs = document.querySelectorAll(".notif");
	const clipboards = document.querySelectorAll(".copy");
	const times = document.querySelectorAll(".time");

	gsap.set(notifs, {
		x: 100,
		opacity: 0,
	});

	gsap.set(clipboards, {
		scale: 0.4,
		opacity: 0,
	});

	let tl = gsap.timeline({
		scrollTrigger: {
			trigger: contact,
			start: "top 70%",
		},
	});

	tl.to(notifs, {
		x: 0,
		opacity: 1,
		ease: "elastic.out(1, 0.3)",
		duration: 2,
		stagger: 0.3,
	});

	tl.to(
		clipboards,
		{
			scale: 1,
			opacity: 1,
			ease: "elastic.out(1, 0.3)",
			duration: 2,
			stagger: 0.3,
		},
		"-=1"
	);

	tl.call(() => {
		updateTimeElements(times);
	});
}

function updateTimeElements(elements) {
	const now = Date.now();

	elements.forEach((el) => {
		el.textContent = "Now";

		setInterval(() => {
			const elapsedMinutes = Math.floor((Date.now() - now) / 60000);
			el.textContent =
				elapsedMinutes === 0 ? "Now" : `${elapsedMinutes} min ago`;
		}, 60000);
	});
}

export function appearTimeline() {
	const timelineElements = document.querySelectorAll(".timeline-element");

	timelineElements.forEach((timelineElement) => {
		gsap.set(timelineElement, {
			x: 100,
			opacity: 0,
		});

		gsap.to(timelineElement, {
			x: 0,
			opacity: 1,
			ease: "elastic.out(1, 0.3)",
			duration: 2,
			scrollTrigger: {
				trigger: timelineElement,
				start: "top 70%",
				toggleActions: "play none none none",
			},
		});
	});
}
