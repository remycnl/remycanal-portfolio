---
title: Designing with motion
description: Motion isn't decoration. How I use it to create hierarchy, guide attention and make an interface feel alive, and when I choose to stay still.
author: Rémy Canal
date: 2026-07-14
image: /blog/designing-with-motion/cover.jpeg
tags:
  - Motion
  - Design
  - UX
---

Motion is how an interface explains what just happened. Used well, it creates hierarchy, shows where to look next and makes a page feel alive. Used badly, it's noise with a good frame rate.

## Motion gives time a shape

A page is not only a collection of positions. It's also a sequence, and motion is what makes that sequence readable. When I'm deciding whether something should move, I check it against four jobs:

- **Orient**: show where something came from and where it went, like a panel that opens from the card it belongs to.
- **Order**: set hierarchy through sequence. What arrives first gets read first.
- **Connect**: keep context across a change of state, so the visitor doesn't have to rebuild the scene.
- **Confirm**: acknowledge an action. A response much slower than a tenth of a second starts to feel disconnected from the gesture that caused it.

If a movement does none of the four, it's decoration. That doesn't mean everything should move. When every element asks for attention, none of them gets it, so I prefer a short vocabulary: an entrance that sets the hierarchy, a transition that preserves context, a response that confirms an action.

## Three questions I ask

### What does this movement explain?

If the answer is nothing, it probably doesn't need to exist. “It looks cool” is a fine reason to start an experiment and a poor reason to ship one.

### Could it be slower?

Slower motion often feels more deliberate and gives the content time to arrive. But speed depends on distance and frequency. Something small and constant, like a hover, should be almost instant. Something large and rare, like an image revealing itself, can take a breath.

### What if it can't move?

A good interaction should stay understandable without its animation. Reduced motion isn't a degraded version of the experience, it's another valid presentation of it.

## Speed and curves, my starting points

Things that arrive should decelerate, like an object coming to rest. Things that leave can accelerate, because the visitor has already moved on. These are starting points, not rules, and I always tune them by eye on a real device:

| Intent | Duration | Easing |
| --- | --- | --- |
| Feedback (hover, press) | 100 to 200 ms | ease-out |
| Small state change (toggle, menu) | 200 to 300 ms | ease-out |
| Entrance of an image or a section | 700 to 1,400 ms | strong ease-out |
| Exit | Shorter than the matching entrance | ease-in |
| Continuous change (progress, scroll-linked) | Follows the input | linear |

When several elements arrive together, I stagger them by a few tens of milliseconds so the eye is led through the group instead of being hit by it. On this site, images that appear at the same time reveal one after another, line by line and left to right.

The image reveal is the clearest example. The frame starts small and slightly tilted, at about 0.6 scale and −6°, and grows into place over roughly a second and a half, while the image inside never moves or scales. The picture stays sharp and the motion belongs to the container, which makes it feel like an unveiling rather than a zoom. It waits until the image is loaded and decoded, and it only plays once.

## Reduced motion is a layout, not an error state

I design the reduced version as its own thing. With the setting on, the page should be complete, readable and calm, not broken:

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 900ms var(--ease-out),
    transform 900ms var(--ease-out);
}

.reveal.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Reduced motion doesn't have to mean that nothing changes. A short fade is usually fine. What causes real discomfort for some people is large spatial movement: parallax, spinning, elements flying across the screen. So when the system asks for less motion, I remove travel first and keep whatever still communicates something.

## Friction can be a gesture

Motion can carry meanings that no label could: effort, commitment, the chance to back out. At the end of each page on this site, the scroll resists more and more as you push toward the next piece. Stop, and it drains back. The resistance tells you the gesture is deliberate and reversible, and nobody had to read an instruction.

> The best transitions are almost invisible.

They don't show off the implementation, they make the next state feel like a natural continuation of the previous one. That's the standard I aim for: movement with a reason, a comfortable pace and enough restraint to let the content stay in charge.