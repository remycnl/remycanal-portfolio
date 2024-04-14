// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    '~/assets/css/button.css',
    '~/assets/css/scrolldown.css',
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
        }
    }],
    'nuxt-icon',
  ],
  plugins: [
    { src: '~/plugins/gsap.js', ssr: false },
    { src: '~/plugins/global.js', ssr: false },
  ],
})
