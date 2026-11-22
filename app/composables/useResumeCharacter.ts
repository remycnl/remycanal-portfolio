/**
 * État partagé entre le hero, le CV et leurs personnages 3D.
 *
 * - `heroReady` / `cvReady` : la scène WebGL correspondante est visible (le sticker SVG
 *   sert de poster avant, et de repli si WebGL échoue).
 * - `pinTop` : position viewport (px) où le personnage du hero reste épinglé.
 * - `above` : remontée du slot du CV au-dessus de la bande blanche. Les deux sont mesurés par
 *   le hero ; le CV s'en sert pour caler son personnage sur la même ligne.
 */
export function useResumeCharacterState() {
	return {
		heroReady: useState("resume-character-hero-ready", () => false),
		cvReady: useState("resume-character-cv-ready", () => false),
		pinTop: useState("resume-character-pin-top", () => 0),
		above: useState("resume-character-above", () => 0),
	}
}
