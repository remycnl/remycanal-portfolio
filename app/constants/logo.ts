/**
 * Versions des GLB : à incrémenter quand un fichier de /public/models change.
 * Elles sont ajoutées en query string pour pouvoir servir /models/** avec un
 * cache immutable d'un an (cf. routeRules dans nuxt.config.ts) sans jamais
 * rester bloqué sur une ancienne version.
 */
const LOGO_MODEL_VERSION = "1"
const CHARACTER_MODEL_VERSION = "1"

export const DEFAULT_LOGO_MODEL_URL = `/models/logo-metal-lime.glb?v=${LOGO_MODEL_VERSION}`

export const CHARACTER_MODEL_URL = `/models/character-black.glb?v=${CHARACTER_MODEL_VERSION}`
