---
title: Creative development
description: Where design, code and experimentation meet, and how I make websites feel a little less static without making them heavier.
author: Rémy Canal
date: 2026-06-02
image: /blog/creative-development/cover.jpg
tags:
  - Creative Development
  - Design
  - Code
---

Creative development is what happens when a design file stops being a specification and becomes a material. It's the part of the job where an idea meets real browsers, real devices and real attention spans, and has to survive all three.

## Beyond the handoff

A design file is a photograph of one moment. A website is a film that people can interrupt, scroll through at their own speed, resize, and open on a phone with one bar of signal.

The classic handoff treats everything a photograph can't show as an implementation detail. I treat it as design that happens to be done in code. A frame can't tell you:

- how long a transition lasts, and what eases it
- what the layout does at 320 px, and at 2,560
- what the page looks like while an image loads, or when it fails
- what happens to a headline that's twice as long in another language
- how the page behaves without a mouse, or with motion turned down

I like that this work needs both sensitivity and precision. A layout has to look right, but it also has to load quickly, answer input and stay legible when the viewport changes shape.

## Start with the feeling

Before choosing a library or writing an animation, I try to name the feeling the page should leave behind. That one word gives every technical decision a direction:

| Feeling | What it asks for | What it looks like in practice |
| --- | --- | --- |
| Calm | Slow, decelerating motion and few moving parts | Long ease-out curves, generous spacing, one thing at a time |
| Curious | Things revealed as you explore | Reveals on scroll, hover states that show a little more |
| Playful | Overshoot, small rotations, quick responses | Springy easing, short durations, slightly irregular timing |
| Focused | Almost nothing moves | Instant feedback, no decorative motion, strong focus states |

Then I encode it, so the feeling lives in one place instead of being scattered across components:

```css
:root {
  --ease-calm: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-playful: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-calm: 900ms;
  --duration-playful: 350ms;
}
```

Switching a section from calm to playful becomes a change of variables, not a hunt through twenty components. It also keeps me honest: if two sections need different feelings, I have to say so out loud.

## Code is a material

From there, code stops being a delivery format and becomes something you shape. CSS can set a rhythm: a spacing scale and a line length are as audible as a drum pattern. A small interaction can make a static image feel tangible, like a one-degree tilt or a shadow that answers the pointer. A carefully timed transition can connect two pieces of information without asking anyone to think about the interface, as when a card becomes the page it opens (the View Transitions API has made that far less painful than it used to be).

My own site has a small animated cat that wanders around the résumé page. It does nothing useful, which is exactly why I want it built carefully: personality is a feature, and it should cost almost nothing.

## The budget that keeps it honest

Creative work often gets a pass for being clever, and it shouldn't. At 60 frames per second, a frame lasts about 16.7 milliseconds, and the browser needs part of that for its own work.

::split{variant="aside"}
#first

#### Rule of thumb

#second
Animate `transform` and `opacity`. The browser can handle them without recalculating layout. Properties like `width`, `top` or `margin` force it to redo layout on every frame.
::

A few habits keep the rest in line:

- I test on a mid-range phone, or throttle the CPU in DevTools, never only on the machine I build on.
- Content has to be readable before any effect runs. If JavaScript fails, the page should be plainer, not empty.
- I respect `prefers-reduced-motion`, always.

If it janks, it isn't creative, it's broken.

## Keep the experiment useful

Experimentation is valuable when it clarifies the idea. I run every effect through one test: delete it, and see what the page loses.

> If nothing is lost when the effect is gone, it was decoration.

When the structure becomes harder to understand without it, the effect was doing a job and it stays. When the page just feels the same, it goes. That's also why the cat no longer says hello when a page opens: the first second belongs to the content.

The best creative development isn't decoration added at the end. It's a conversation between design, content and technology, from the first sketch to the last detail.