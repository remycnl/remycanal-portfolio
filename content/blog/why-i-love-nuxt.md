---
title: Why I love Nuxt
description: Why Nuxt became my default for fast, expressive websites, and an honest look at where it gets in the way.
author: Rémy Canal
date: 2026-08-28
image: /blog/why-i-love-nuxt/cover.jpeg
tags:
  - Nuxt
  - Vue
  - Notes
---

The best compliment I can give a framework is that I rarely think about it. Nuxt is the one I think about least, because its conventions make a hundred small decisions for me and leave my attention for typography, interaction and the rhythm of a page. I also build with Next.js on other projects, so this isn't tribal loyalty, it's about how the pieces fit together.

## Structure without losing freedom

Nuxt gives a project a useful shape from the beginning. Pages, layouts, server routes, data fetching and build tooling all have a natural place, which removes a lot of setup work and leaves room for a very personal interface.

| What I need | Where it lives in Nuxt |
| --- | --- |
| A page at `/work` | `pages/work.vue`, from file-based routing |
| A shared layout | `layouts/` |
| A component | `components/`, auto-imported |
| A reusable function or state | `composables/`, auto-imported |
| An API endpoint | `server/api/` |
| Articles and projects | `content/`, with Nuxt Content |
| Images and static files | `public/` |

> A good convention is a decision I don't have to make twice.

For a portfolio, that balance matters. The foundation should be dependable, but the final result shouldn't feel like a template.

## Rendering is a choice per route

One of the things I appreciate most is that rendering isn't an all-or-nothing decision. A route rule is a single line:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    "/": { prerender: true },
    "/blog/**": { prerender: true },
    "/api/**": { swr: 600 },
  },
})
```

Pages that never change are built once. Endpoints that can be a few minutes stale are cached and refreshed in the background. I don't have to decide at the start of a project whether it's a static site or a server app, I can change my mind one route at a time.

## Content that lives with the code

Nuxt Content makes the editorial side as comfortable as the component side. Articles are readable Markdown, validated with a schema, and queried like the rest of the application:

```ts
const { data: posts } = await useAsyncData("blog", () =>
  queryCollection("blog").order("date", "DESC").all()
)
```

MDC then closes the gap between writing and building. It's Markdown that can call Vue components: `::media-grid{cols="3"}` renders a grid, and named slots like `#first` and `#second` become the two halves of a `::split` block. I can update a paragraph without touching the presentation, while dates, images and layout metadata stay predictable. It's a small distinction that makes a project much easier to grow.

## Where it gets in the way

No tool is free of friction, and these are the ones I actually run into:

- Auto-imports are wonderful until you wonder where a function came from. The editor and the generated types mostly answer that, a code review doesn't.
- Server-side rendering means anything that touches `window` or `document` has to wait for the client. For animation work that's a daily reminder, and `onMounted` and `<ClientOnly>` are my usual answers.
- Hydration mismatches happen when the server's HTML and the first client render disagree. Dates, random values and anything that depends on viewport size are the usual suspects.
- For a content-only site with almost no interactivity, something lighter like Astro would ship less JavaScript.

## A good default for creative work

The tools disappear when they do their job well. Nuxt handles the boring but important parts, so I can spend more attention on the ones that make a page feel like someone made it.

That's why I keep coming back to it: it gives creative work a reliable home without trying to dictate what the work should look like.