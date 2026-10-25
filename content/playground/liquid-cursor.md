---
title: Liquid cursor
date: 2026-09-02
image: /playground/pdp-remy.png
width: 1920
height: 1080
description: A WebGL cursor that behaves like ink in water.
---

A small experiment around fluid simulation, built over a weekend to see how far a cursor can feel physical.

![The cursor at rest](/playground/liquid-cursor/rest.webp)

## How it works

The trail is a velocity field advected on the GPU, then composited over the page with a blend mode.
