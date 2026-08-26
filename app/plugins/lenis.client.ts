import Lenis from "lenis"

export default defineNuxtPlugin({
  name: "lenis",
  dependsOn: ["gsap"],

  setup(nuxtApp) {
    const lenis = new Lenis()

    lenis.on("scroll", nuxtApp.$ScrollTrigger.update)

    nuxtApp.$gsap.ticker.add((time: number) => {
      lenis.raf(time * 1000)
    })

    return {
      provide: {
        lenis,
      },
    }
  },
})