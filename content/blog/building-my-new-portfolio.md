---
title: Building my new portfolio
description: Rebuilding my portfolio from scratch with Nuxt and Vue, with overlay pages, a small set of visual rules and a slightly obsessive attention to details.
author: Rémy Canal
date: 2026-09-12
image: /blog/building-my-new-portfolio/cover.jpg
tags:
  - Portfolio
  - Nuxt
  - Design
---

I didn't want a grid of thumbnails with a contact form underneath. I wanted a site that behaves like a place: pages that open on top of each other, a typographic rhythm you can feel while scrolling, and visual rules small enough that I can still remember all of them.

## A portfolio should feel like a place

This portfolio started with a simple question: how can I show the way I work, rather than only the work itself? A grid of thumbnails is useful, but it says very little about the person who made it.

So the site is built closer to a small studio than a catalogue. Projects, experiments and articles are all Markdown files, and each one opens as an overlay on top of its own listing. Open `/work/some-project` from a shared link, or reload it, and you get exactly what you'd get by clicking from `/work`: the listing stays behind, the content sits on top, and Close or Esc brings you back without a page transition.

It sounds like a small detail, but it shaped the whole routing. A content page and its listing are really one screen in two layers, so they have to be able to render together from a cold start.

## Rules small enough to remember

The most important decision was to keep the visual rules few. Type is set in Lineal, with VG5000 as the monospace voice for small details. Colour is black, white and grays, plus two accents, lime and violet, defined in oklch so I can tune them by lightness and chroma instead of eyeballing hex values. Lime works on dark backgrounds, violet on light ones, and the whole site flips between them as one system.

Layout is a 12-column grid with two rails. Section titles live in the left rail, on the same line as the block that follows, like chapter headings. Paragraphs sit in a main column of about 60 characters, and only media goes full width. Every kind of text has its own maximum measure, so no line ever stretches across a wide screen.

I also wrote a handful of Tailwind v4 utilities around `text-box-trim`, so text aligns on its cap height and baseline instead of its line box. Icons, arrows and labels finally line up the way the eye expects, rather than the way the box model does.

Motion follows the same logic. The text effect exists in three places and nowhere else:

| Element | When it moves | Why |
| --- | --- | --- |
| Page title | When the page opens | Sets the tone |
| Section titles | When they enter the screen | Marks the chapters |
| Quotes | When they enter the screen | The one sentence meant to be remembered |
| Images and video | Once, when they enter the screen and are ready | A reveal instead of a pop-in |
| Paragraphs and lists | Never | They're for reading |

Everything else holds still, which is exactly why those few effects work. Constraints make the interesting decisions easier to see.

## The scroll that asks for a decision

At the bottom of every page there's a separate screen: a panel in the text colour, with rounded top corners and the title of the next piece centred inside it. Keep scrolling once you're at the very end and a gauge starts to fill, with a resistance that grows the further you push. The title colours in from left to right, a thin line advances, the corners straighten, and at 100% the panel retracts upwards to reveal the next page, which always opens at the top. Stop, or scroll back up, and the gauge drains smoothly.

The order follows the date, newest first, within the same collection, and the last piece loops back to the first. Lenis handles the smooth scrolling, and GSAP with ScrollTrigger drives the choreography.

I wanted something between a “next” button, which is too easy to hit by accident, and infinite scroll, which decides for you. Pushing a little is a small act of intent. And because a gesture is never an interface on its own, the panel is also a link you can click or reach with the keyboard.

## Content is a product too

Writing for the site should be as pleasant as building it. Every file starts with frontmatter that a schema validates: required fields, dates in a fixed format and, for projects, a closed list of tags. If I mistype a tag, the page doesn't render with a strange label. It fails validation, and I hear about it immediately instead of after publishing.

```ts
// content.config.ts (simplified)
import { defineCollection, defineContentConfig, z } from "@nuxt/content"

export default defineContentConfig({
  collections: {
    work: defineCollection({
      type: "page",
      source: "work/*.md",
      schema: z.object({
        date: z.string().regex(/^\d{4}-\d{2}$/),
        tone: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        featured: z.boolean().optional(),
        tags: z.array(z.enum(["Identité", "Branding", "E-commerce", "UI/UX", "3D"])).optional(),
      }),
    }),
  },
})
```

Each project also carries a `tone`, a background colour, and the text switches to black or white automatically depending on it. Optional fields I leave out simply disappear from the page, with no gap where they would have been.

I even wrote a content guide for the site, with every field, every component and the usual mistakes. If I can't publish an article after six months away by reading a single page, the system isn't finished.

## The details nobody asks for

The final pass is where the portfolio began to feel like mine. None of this is glamorous, and almost none of it will ever be noticed, which is the point:

- Images stay invisible until their reveal starts, and the reveal waits for the image to be loaded and decoded, so it never plays on an empty frame or a half-rendered picture.
- The Close button follows the page's text colour, never slips under the header, and Esc does the same job on any screen with a keyboard.
- With reduced motion turned on, everything simply appears, and the next-page gauge keeps working without its smoothing and curtain.
- Images are served untouched, so I compress them before they go anywhere near `public`.

These are the things that separate an interface that was assembled from one that was considered.

There is still plenty to refine. That's part of the point: a portfolio is never finished, it's a living record of how I think and build.