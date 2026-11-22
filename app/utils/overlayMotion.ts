/**
 * Réglages de mouvement de l'overlay, au même endroit.
 * La durée, la courbe et l'angle de l'apparition des images se règlent dans assets/css/image-reveal.css.
 */
export const OVERLAY_MOTION = {
	/** Passage au contenu suivant (LayoutOverlayNext). */
	next: {
		/** Scroll (px) qui remplit la jauge. */
		distance: 800,
		/** 0 = linéaire. Plus c'est haut, plus la jauge résiste en se remplissant. */
		resistance: 0.6,
		/** Vitesse à laquelle l'affichage rattrape la poussée. Plus haut = plus nerveux. */
		follow: 9,
		/** Temps (ms) passé en bas avant que le scroll compte : l'élan de l'arrivée ne remplit pas la jauge. */
		armDelay: 350,
		/** Temps (ms) sans geste avant que la jauge se vide. */
		idleDelay: 300,
		/** Vitesse de vidage (jauge pleine par seconde). */
		drainSpeed: 0.8,
		/** Clavier : distance ajoutée par une touche. */
		keyStep: 140,
		/** Fondu (ms) du contenu du bloc juste avant le changement de page. */
		leaveFade: 220,
	},

	/** Rideau qui recouvre la page suivante à son arrivée, puis se retire vers le haut. */
	curtain: {
		/** Secondes. */
		delay: 0.12,
		duration: 0.9,
		ease: "cubic-bezier(0.76, 0, 0.24, 1)",
	},

	/** Apparition des images (v-image-reveal) : décalage quand plusieurs arrivent ensemble. */
	reveal: {
		/** Secondes entre deux images d'une même vague. */
		stagger: 0.14,
		/** Temps (ms) pendant lequel on regroupe les images qui arrivent ensemble. */
		window: 80,
		/** Nombre maximal de places dans une vague. */
		maxSlots: 6,
		/** Écart vertical (px) en dessous duquel deux images sont sur la même ligne. */
		rowTolerance: 40,
	},
} as const
