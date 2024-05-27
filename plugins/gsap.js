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
    const lettersContainer = document.getElementById('letters');
    const alphabet = '▞▚▞▚▞▚▞_LANAC_YMÉR_▞▚▞▚▞▚▞_YM_YB_DETFARCDNAH_▞▚▞▚▞▚▞_DEVRESER_STHGIR_LLA_▞▚▞▚▞▚▞_4202_THGIRYPOC_©_'.split('');
    let index = 0;

    for (let i = 0; i < 4; i++) {
        generateLetters();
    }

    function createLetterSpan(letter) {
        const span = document.createElement('span');
        span.className = 's';
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
        
        gsap.to(span, 
            {
                x: '100%',
				repeat: -1,
                ease: 'linear',
                onComplete: () => {
                    span.remove();
                }
            }
        );
    }

    function generateLetters() {
        alphabet.forEach(letter => {
            const span = createLetterSpan(letter);
        });
    }

    function generateAndAnimateLetters() {
        animateLetter(alphabet[index]);
        index = (index + 1) % alphabet.length;
        setTimeout(generateAndAnimateLetters, 300);
    }

    generateAndAnimateLetters();
}
