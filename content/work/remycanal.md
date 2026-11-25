---
title: My Portfolio
description: My personal portfolio, designed and built with Nuxt and Nuxt Content.
date: "2026-12"
tone: "#C6FF33"
featured: true
image: /works/remycanal/og_image.png
# video: /works/remycanal/demo.mp4
client: Personal project
role: Art direction, UI/UX design, development
# url: https://
tags:
  - Identité
  - Site web
  - UI/UX
  - Développement
---

This is the new version of my portfolio. I wanted something that behaves like a small product: fast, easy to update, and with room for both finished case studies and unfinished experiments.

## The brief

Three needs. Show my client work properly. Keep a place for quick pieces that don't deserve a full case study. Make adding anything new as easy as writing a text file.

![The portfolio homepage](/works/remycanal/overview.webp "Homepage")

## Structure

The content is split into four types, each with its own role:

- **Work**: full case studies, with a cover, a color, tags and a long-form page.
- **Playground**: smaller pieces like logos, posters and a business card, shown in a grid that keeps each image's real proportions.
- **Blog**: short writing.
- **Resume**: education, experience, toolbox and awards, all from a single data file.

Work, playground and blog pages open in an overlay, so you can look at a project without losing your place on the page behind.

## Color as a signature

Each project has its own color. It sets the mood of its card and its page, and it makes the grid feel like a collection rather than a list. The portfolio's own accent is a loud lime, because a personal site is allowed to be a bit loud.

::media-grid{cols="2"}
![Work grid](/works/remycanal/work-grid.webp "The work grid")

![A case study page](/works/remycanal/case-study.webp "A case study")
::

## Under the hood

Everything runs on Nuxt and Nuxt Content. Each collection has a strict schema, so a typo in a date, a color or a tag is caught at build time instead of showing up as a broken page. Tags on case studies come from a fixed list, which keeps the filtering consistent.

A project can have a cover video that loops silently, with the cover image as its poster. Each resume entry has a small "+" that opens extra details (a description, images or documents) only when there is something to show. Durations for ongoing jobs are calculated up to the current month.

![Overlay navigation and the resume panel](/works/remycanal/demo.mp4 "Overlays and the resume")

## What I'd do differently

Start with the content model, not the design. Once the schemas were right, the pages were easy to build, and adding a project took minutes.