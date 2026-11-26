---
title: Things I learned this year
description: Four small lessons from recent projects, from prototyping the risky part early to writing down decisions.
author: Rémy Canal
date: 2026-05-21
image: /blog/things-i-learned-this-year/cover.jpg
tags:
  - Notes
  - Process
  - Craft
---

This year hasn't been about one big breakthrough. It's been a pile of small adjustments that made the work better, the kind that don't make a good headline but change how a project feels on an ordinary Tuesday afternoon. Here are the four I'd most like to keep.

## Prototype the risky part first

If an interaction depends on performance, touch input or an unfamiliar API, I want to know whether it works before the rest of the page is built around it. The risky part is rarely the part I'm looking forward to, which is exactly why it gets postponed.

| If it depends on | I ask | Cheapest test |
| --- | --- | --- |
| Performance (heavy animation, big canvas, many images) | Does it hold up on a mid-range phone? | A throwaway page and DevTools CPU throttling |
| Touch input (drag, swipe, custom scroll) | Does it fight with native scrolling? | A real phone, not the emulator |
| An unfamiliar API | Does it behave the same in Safari? | The support table, then one real test |
| A third-party embed | What does it load, and what happens when it's blocked? | The network tab, then block the domain |

I time-box it to an afternoon. If the risky part fails, I've lost an afternoon. If I find out in week three, I've lost the design.

## Write down the decisions, not just the code

A short note about why a component behaves a certain way saves a surprising amount of time when the project changes a few weeks later. Code tells me what happens. Only a note tells me why.

Mine are four lines long. A typical entry looks like this:

```md
### Image reveal waits for decode
Decision: start the animation only once the image is loaded and decoded.
Why: otherwise it plays on an empty frame or a half-painted image.
Revisit if: the reveal ever needs to run before images are ready.
```

The “revisit if” line is the one that pays off most. It turns a decision from a rule into a bet, with a condition for changing my mind.

## Plan a second pass

The first implementation answers whether something works. The second answers whether it feels right. Those are different questions, and both deserve time.

If I can, I leave a night between them. The page I open the next morning belongs to a stranger, and strangers notice things. This is what I check on that pass:

- Loading, empty and error states, the ones nobody puts in a mockup.
- The keyboard path and visible focus, from top to bottom.
- Reduced motion: the page should still be complete and calm.
- The in-between widths, around tablet size, where layouts usually break.
- Text that's longer than the design assumed. French headlines are good at finding this out.

## Progress is often quiet

Better naming, fewer dependencies, a clearer loading state, one abstraction fewer: none of it looks impressive in a changelog, and all of it changes how a project feels to maintain.

- A name that finally says what the thing does.
- A dependency removed, and one less thing to update.
- A loading state that tells the truth.
- An abstraction deleted because it only had one caller.

None of it shows up in a case study. All of it shows up the next time I open the project. I'm trying to notice those improvements more, because they're usually where the durable work happens.