import { gsap, Power2, Elastic } from "gsap";

export default defineNuxtPlugin(() => {
	return {
		magnetEffect,
		mouseEffect,
		toggleTextWhite,
		setExperienceTime,
	};
});

export function magnetEffect() {
	if (import.meta.client && window.innerWidth >= 1024) {
		const magnetElements = document.querySelectorAll(".magnet");

		const hoverMouse = (elements) => {
			elements.forEach((element) => {
				let hover = false;
				const offsetHoverMax =
					parseFloat(element.getAttribute("offset-hover-max")) || 0.7;
				const offsetHoverMin =
					parseFloat(element.getAttribute("offset-hover-min")) || 0.5;

				const attachEventsListener = () => {
					window.addEventListener("mousemove", (e) => {
						const hoverArea = hover ? offsetHoverMax : offsetHoverMin;

						const cursor = {
							x: e.clientX,
							y: e.clientY + window.scrollY,
						};

						const width = element.offsetWidth;
						const height = element.offsetHeight;

						const offset = element.getBoundingClientRect();
						const elPos = {
							x: offset.left + width / 2,
							y: offset.top + height / 2 + window.scrollY,
						};

						const x = cursor.x - elPos.x;
						const y = cursor.y - elPos.y;

						const dist = Math.sqrt(x * x + y * y);

						let mutHover = false;

						if (dist < width * hoverArea) {
							mutHover = true;
							if (!hover) {
								hover = true;
							}
							onHover(x, y);
						}

						if (!mutHover && hover) {
							onLeave();
							hover = false;
						}
					});
				};

				const onHover = (x, y) => {
					gsap.to(element, {
						duration: 0.4,
						x: x * 0.8,
						y: y * 0.8,
						rotation: x * 0.05,
						ease: Power2.easeOut,
					});
				};

				const onLeave = () => {
					gsap.to(element, {
						duration: 0.7,
						x: 0,
						y: 0,
						scale: 1,
						rotation: 0,
						ease: Elastic.easeOut.config(1.2, 0.4),
					});
				};

				attachEventsListener();
			});
		};
		if (magnetElements.length > 0) {
			hoverMouse(magnetElements);
		}
	}
}

export function mouseEffect() {
	if (import.meta.client && window.innerWidth >= 1024) {
		const blob = document.getElementById("blob");

		const updateBlobPosition = (event) => {
			const { clientX, clientY } = event;
			const scrollY = window.scrollY || window.pageYOffset;
			const adjustedClientY = clientY + scrollY;

			gsap.to(blob, {
				left: clientX,
				top: adjustedClientY,
				duration: 2,
				ease: "power2.out",
			});
		};

		const handleMouseEnter = () => {
			gsap.to(blob, {
				scale: 0.5,
				duration: 0.8,
				ease: "power2.out",
			});
		};

		const handleMouseLeave = () => {
			gsap.to(blob, {
				scale: 1,
				duration: 0.8,
				ease: "power2.out",
			});
		};

		document.body.onpointermove = updateBlobPosition;
		window.addEventListener("scroll", updateBlobPosition);

		const isHoveringScaleEffect = () => {
			return [...document.querySelectorAll(".hover-scale-effect")].some(
				(el) => {
					return el.matches(":hover");
				}
			);
		};

		document.addEventListener("click", () => {
			if (!isHoveringScaleEffect()) {
				gsap.to(blob, {
					scale: 0.9,
					duration: 0.2,
					ease: "power1.inOut",
				});

				gsap.to(blob, {
					scale: 1,
					duration: 0.7,
					delay: 0.2,
					ease: "elastic.out(1, 0.4)",
				});
			}
		});

		const hoverElements = document.querySelectorAll(".hover-scale-effect");
		hoverElements.forEach((element) => {
			element.addEventListener("mouseenter", handleMouseEnter);
			element.addEventListener("mouseleave", handleMouseLeave);
		});
	}
}

const lastClickedTextElement = ref(null);

export function toggleTextWhite(propsIndex) {
	const clickedElement = document.querySelector(
		`#toggle-text-white-${propsIndex}`
	);

	if (!clickedElement) {
		return;
	}

	if (clickedElement === lastClickedTextElement.value) {
		clickedElement.classList.remove("text-white");
		lastClickedTextElement.value = null;
	} else {
		if (lastClickedTextElement.value) {
			lastClickedTextElement.value.classList.remove("text-white");
		}
		clickedElement.classList.add("text-white");
		lastClickedTextElement.value = clickedElement;
	}
}

export function setExperienceTime() {
	const startYear = 2022;
	const startMonth = 9;

	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;

	let experienceYears = currentYear - startYear;

	if (currentMonth >= startMonth) {
		experienceYears++;
	}

	let currentDisplayValue = 0;
	const incrementSpeed = 200;

	function incrementExperience() {
		if (currentDisplayValue < experienceYears) {
			currentDisplayValue++;
			document.getElementById("experience").textContent = currentDisplayValue;
			setTimeout(incrementExperience, incrementSpeed);
		}
	}

	incrementExperience();
}

export function setProjectsCounter() {
	let nbrProjects = 15;

	let currentDisplayValue = 0;
	const incrementSpeed = 100;

	function incrementProjectsNbr() {
		if (currentDisplayValue < nbrProjects) {
			currentDisplayValue++;
			document.getElementById("projects-number").textContent =
				currentDisplayValue;
			setTimeout(incrementProjectsNbr, incrementSpeed);
		}
	}

	incrementProjectsNbr();
}
