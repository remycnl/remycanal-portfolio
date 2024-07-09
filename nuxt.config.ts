// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/button.css',
    '~/assets/css/valueCard.css',
    '~/assets/css/mouseEffect.css',
    '~/assets/css/backToTopButton.css',
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
        "RocknRoll One": true,
        Acme: true,
        Schoolbell: true,
      }
  }], 'nuxt-icon', "@nuxt/image"],

  plugins: [
    { src: '~/plugins/gsap.js', ssr: false },
    { src: '~/plugins/global.js', ssr: false },
  ],

  compatibilityDate: '2024-07-04',
})