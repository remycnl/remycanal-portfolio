import { gsap } from "gsap";
import { Elastic } from 'gsap/all';
export { gsap };
export default defineNuxtPlugin(() => {
	return {
		toggleDropdown,
        applyZoomEffect,
		applyUnzoom,
		toggleCard,
		animationFooter,
	};
});

gsap.registerPlugin(Elastic);

let isDropdownOpen = false;

export function toggleDropdown() {
	if (window.innerWidth < 1024) {
		isDropdownOpen = !isDropdownOpen;
		const slotElement = document.getElementById('slot');
		const footerElement = document.getElementById('footer');

		if (isDropdownOpen) {
			document.body.classList.add('overflow-hidden');
			gsap.to(slotElement, {
				duration: 0.8,
				filter: "blur(10px)",
				backdropFilter: "blur(10px)",
				ease: "power2.out"
			});
			gsap.to(footerElement, {
				duration: 0.8,
				filter: "blur(10px)",
				backdropFilter: "blur(10px)",
				ease: "power2.out"
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
			document.body.classList.remove('overflow-hidden');
			gsap.to(slotElement, {
				duration: 0.8,
				filter: "blur(0px)",
				backdropFilter: "blur(0px)",
				ease: "power2.in"
			});
			gsap.to(footerElement, {
				duration: 0.8,
				filter: "blur(0px)",
				backdropFilter: "blur(0px)",
				ease: "power2.in"
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

export function animationFooter() {
	const scrollingTextElements = document.querySelectorAll('.s');

    scrollingTextElements.forEach(scrollingTextElement => {
        // Récupérez la taille de l'écran
        const screenWidth = window.innerWidth;

        // Calculez la largeur du texte pour savoir combien il faut décaler
        const textWidth = scrollingTextElement.offsetWidth;

        // Calculez la distance à laquelle le texte doit se déplacer pour couvrir toute la largeur de l'écran
        const distanceToTravel = screenWidth + textWidth;

        // Utilisez GSAP pour animer le défilement du texte
        gsap.to(scrollingTextElement, {
            x: distanceToTravel,
            duration: 20, // Durée de l'animation en secondes
            ease: "linear", // Assure une vitesse constante
            repeat: -1, // Répétez l'animation indéfiniment
            modifiers: {
                x: gsap.utils.unitize(value => value % (screenWidth + textWidth) - textWidth)
                // Cette fonction permet de faire boucler le texte
            }
        });

		
    });
}