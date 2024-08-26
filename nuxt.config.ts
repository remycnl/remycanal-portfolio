// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/button.css',
    '~/assets/css/valueCard.css',
    '~/assets/css/mouseEffect.css',
    '~/assets/css/backToTopButton.css',
    '~/assets/css/scrollBar.css',
    '~/assets/css/cursor.css',
    '~/assets/css/changeColorButton.css',
    '~/assets/css/swiper.css',
    '~/assets/css/transition.css',
    '~/assets/css/project.css',
    '~/assets/css/bento.css',
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [['@nuxtjs/google-fonts', {
      families: {
        Roboto: true,
        Orbitron: true,
        "Share Tech Mono": true,
        Schoolbell: true,
        Neonderthaw: true,
        // Raleway: true,
        // "RocknRoll One": true,
        // Acme: true,
        // Cinzel: true,
        // "Cormorant Garamond": true,
        // "JetBrains Mono": true,
        // "Bricolage Grotesque": true,
        // "Tac One": true,
        // Orbit: true,
        // "Rubik Scribble": true,
        // Montserrat: true,
        // "Roboto Mono": true,
        // "Source Code Pro": true,
        // "IBM Plex Mono": true,
        // "Space Mono": true,
        // "Fira Code": true,
        // Inconsolata: true,
        // Audiowide: true,
        // "Exo 2": true,
      }
  }], 'nuxt-icon', '@nuxt/image', 'nuxt-swiper'],

  plugins: [
    { src: '~/plugins/gsap.js', mode: 'client' },
    { src: '~/plugins/global.js', mode: 'client' },
  ],

  compatibilityDate: '2024-07-04',
})