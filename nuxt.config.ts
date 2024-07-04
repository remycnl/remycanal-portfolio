// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    '~/assets/css/valueCard.css',
    '~/assets/css/mouseEffect.css',
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
      }
  }], 'nuxt-icon', "@nuxt/image"],
  plugins: [
    { src: '~/plugins/gsap.js', ssr: false },
    { src: '~/plugins/global.js', ssr: false },
  ],
})