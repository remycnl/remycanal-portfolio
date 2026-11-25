---
title: Éco-fidélité
description: Brand identity and low-carbon website for a solution that rewards eco-friendly actions inside loyalty programs.
date: "2024-10"
tone: "#027566"
featured: true
image: /works/ecofidelite/og_image.png
# video: /works/ecofidelite/demo.mp4
client: letmotiv
role: Brand identity, UI/UX design, eco-design, development
url: https://eco-fidelite.com/
tags:
  - Identité
  - Branding
  - Site web
  - UI/UX
  - Développement
---

Éco-fidélité is a solution from letmotiv that lets brands, companies and local authorities reward eco-friendly purchases and actions inside their loyalty program. I created the brand and built the website, which was carried out at Sharewood. The site had to explain an abstract mechanism clearly. It also had to be light, because a site that promotes eco-friendly behavior shouldn't weigh a ton.

![The Éco-fidélité homepage](/works/ecofidelite/overview.webp "Homepage")

## The brief

The idea is simple once you see it. Eco-friendly purchases and verified eco-gestures are converted into points, based on a scale of ecological benefit, and those points feed an existing loyalty program. Customers get rewarded, and the brand measures a real impact.

The difficulty is that it speaks to four very different audiences: consumers, businesses, employees (as part of a CSR approach) and local authorities. And the product is new, so the brand had to carry the explanation.

## The brand

The name already says what the product does: eco and loyalty in one word. So the logo could stay simple, in a white version and a green version for dark and light backgrounds. The deep green is the main color of the whole site.

The mechanism is explained with four pictograms, drawn as SVG: eco-friendly purchases, eco-gestures, eco-points, loyalty. The same four icons come back through the site, so after the first visit the logic is already familiar.

::media-grid{cols="2"}
![Logo, white and green](/works/ecofidelite/logo.webp "Logo")

![The four pictograms](/works/ecofidelite/pictograms.webp "Four steps, four pictograms")
::

## The pages

**Home.** The promise, the four-step principle, the objective (a measurable solution), the eco-gestures grouped by theme, the value proposition and the latest articles. Two actions only: ask for a demo or contact the team.

**Why éco-fidélité®.** The longer argument for decision-makers.

**Solution and eco-gestures, by audience.** Each audience (consumers, businesses, employees, local authorities) gets two pages: one that explains the solution for them, and one that lists the eco-gestures that apply. Same structure, different content, so a visitor from a city hall isn't read the pitch meant for a retailer.

![An eco-gestures page](/works/ecofidelite/eco-gestures.webp "Eco-gestures: mobility, waste, IT, health and more")

**letmotiv, blog and contact.** A page about the company behind the solution, a blog with case studies and tips, and a contact form.

## Green IT with Nuxt

Eco-design is mostly subtraction, and a lot of it happens before any code. Nuxt then gives you many levers to keep what's left light. This is the toolbox I worked from.

**Measure first.** Set a budget (page weight, number of requests, DOM size) before designing, then check it with EcoIndex, Lighthouse and Website Carbon. The RGESN and the 115 best practices from GreenIT.fr work as a checklist. `nuxi analyze` shows what each dependency really costs.

**Prerender what doesn't change.** With `nuxt generate` or prerendering, pages are built once and served from a CDN, so no server works on each visit. `routeRules` lets you mix this with cached or server-rendered routes where needed.

**Ship less JavaScript.** Lazy hydration (`hydrate-on-visible`, `hydrate-on-idle`) delays the work until a component is needed. Server components and islands keep some parts free of client code, and Nuxt can even render a page with no client JavaScript at all (`noScripts` in `routeRules`).

**Handle images properly.** `@nuxt/image` converts to AVIF or WebP, generates responsive sizes and lazy-loads below the fold. Images are the heaviest part of most pages, so this is where the biggest savings come from. Illustrations and pictograms stay in SVG.

**Self-host and subset fonts.** `@nuxt/fonts` serves fonts from your own domain, and subsetting keeps only the characters you use. One variable family is enough.

**Control third-party scripts.** A demo-booking widget and a contact form are the kind of third-party tools that quietly weigh more than the page. `@nuxt/scripts` loads them on interaction or when visible, not on every visit.

**Avoid runtime requests.** With `@nuxt/icon`, icons can be bundled locally, so there are no calls to an icon API.

**Prefetch less.** By default, links are prefetched as soon as they become visible. Switching to prefetch on interaction avoids downloading pages nobody asked for.

**Fetch smarter.** Call the CMS at build time instead of on every visit, and avoid duplicate requests with `useFetch` caching and deduplication.

**Compress and cache.** Static assets are precompressed with Brotli and gzip at build time, and `/_nuxt/**` files get long-lived immutable cache headers.

**Choose the host.** A host that runs on renewable energy, close to the visitors, listed in the Green Web Foundation directory.

**Respect user preferences.** `prefers-color-scheme` for the theme, `prefers-reduced-motion` for animations, no autoplay video.

```ts
export default defineNuxtConfig({
  nitro: {
    compressPublicAssets: true,
    prerender: { crawlLinks: true, routes: ["/"] },
  },
  routeRules: {
    "/_nuxt/**": {
      headers: { "cache-control": "public, max-age=31536000, immutable" },
    },
  },
  experimental: {
    defaults: {
      nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
    },
  },
  image: {
    format: ["avif", "webp"],
    quality: 70,
  },
})
```

## Results

[Replace with your real measurements.]

| Indicator         | Typical site | Éco-fidélité |
| ----------------- | ------------ | ------------ |
| Page weight       | —            | —            |
| Requests per page | —            | —            |
| EcoIndex grade    | —            | —            |
| CO₂ per page view | —            | —            |

![Browsing the site](/works/ecofidelite/demo.mp4 "From the homepage to a solution page")

## What I took from it

The biggest wins came from choices made before the code: fewer images, fewer fonts, fewer features. Nuxt then made the technical part easy, but it can't make a heavy design light. I now start every project with a weight budget and treat it like any other requirement.

See it at [eco-fidelite.com](https://eco-fidelite.com/).