// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    '~/assets/css/button.css',
    '~/assets/css/valueCard.css',
    '~/assets/css/mouseEffect.css',
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: [
    ['@nuxtjs/google-fonts', {
        families: {
          Roboto: true,
          Sigmar: true,
          "Rubik Glitch": true,
          Gluten: true,
          "RocknRoll One": true,
          "Reggae One": true,
          Acme: true,
          "Sometype Mono": true,
          "Cutive Mono": true,
          VT323: true,
          "Source Code Pro": true,
        }
    }],
    'nuxt-icon',
  ],
  plugins: [
    { src: '~/plugins/gsap.js', ssr: false },
    { src: '~/plugins/global.js', ssr: false },
  ],
})
