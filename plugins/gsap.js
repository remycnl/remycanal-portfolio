import { gsap } from "gsap";
import { Elastic } from 'gsap/all';
export { gsap };
export default defineNuxtPlugin(() => {
	return {
		toggleDropdown,
        applyZoomEffect,
		applyUnzoom,
		toggleCard,
	};
});

gsap.registerPlugin(Elastic);

let isDropdownOpen = false;

export function toggleDropdown() {
	if (window.innerWidth < 1024) {
		isDropdownOpen = !isDropdownOpen;
		if (isDropdownOpen) {
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
        }
    });
}

export function applyUnzoom(index) {
    const logo = document.querySelector(`#skill-bubble-${index}`);

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
        }
    });
}

export function toggleCard(index) {
    const card = document.querySelector(`.card-${index}`);

	gsap.to(card, {
		duration: 0.1,
		rotationY: "+=180",
		ease: "none",
		onComplete: () => {
			card.classList.toggle("is-flipped");
		},
	});
}
