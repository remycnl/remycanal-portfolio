// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  css: [
    '@/assets/css/main.css',
    '@/assets/css/button.css',
    '@/assets/css/mouseEffect.css',
    '@/assets/css/backToTopButton.css',
    '@/assets/css/scrollBar.css',
    '@/assets/css/cursor.css',
    '@/assets/css/changeColorButton.css',
    '@/assets/css/transition.css',
    '@/assets/css/project.css',
    '@/assets/css/bento.css',
    '@/assets/css/checkbox.css',
    '@/assets/css/loader.css',
    '@/assets/css/clipboard.css',
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
      }
  }], 'nuxt-icon', '@nuxt/image'],

  plugins: [
    { src: '@/plugins/gsap.js', mode: 'client' },
    { src: '@/plugins/global.js', mode: 'client' },
  ],

  compatibilityDate: '2024-07-04',
})