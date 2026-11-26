---
title: Keeping things simple
description: Often the best interface is the one where everything that doesn't need to be there is gone. Notes on subtraction, complexity and what to keep.
author: Rémy Canal
date: 2026-04-03
image: /blog/keeping-things-simple/cover.jpg
tags:
  - Design
  - UX
  - Notes
---

Adding is easy: another section, another control, another animation. Simplicity is harder because it means taking things away, and an absence is the one edit everybody can see.

## Simplicity is an active choice

Each addition looks like progress when you make it, and each one sends a bill later: attention, bytes, maintenance, one more state to test, one more string to translate. Removing something takes more confidence, because the absence is visible and you'd better be able to defend it.

For me, simplicity starts with a single question: what is the visitor trying to do here? Once that's clear, everything else has to earn its place. A quieter interface is often more generous, because it leaves room for the important things to be noticed.

## Complexity doesn't disappear, it moves

Larry Tesler, who spent years at Xerox PARC and Apple, argued that every system has an irreducible amount of complexity. You can't delete it, only decide who deals with it: the visitor, the person maintaining the content, or the code.

That's the real design question behind “keep it simple.” Writing a page on my site is just Markdown with a few well-named fields. The complexity didn't vanish. It lives in the components and the content schema, where I deal with it once, instead of every time I publish.

Rich Hickey has a useful way to put it: simple means few things intertwined, easy means close at hand. Plenty of things are easy and deeply un-simple, like a one-click feature with five systems tangled underneath. I'd rather build the opposite.

## Reduce the decisions

Good interfaces don't make people decode the layout before they can use it. Clear headings, predictable actions and consistent spacing reduce the number of decisions someone has to make. There's even a name for the underlying effect, Hick's law: the more options you offer, the longer people take to choose.

This matters most on small screens. A design that only works when there's plenty of space isn't simple, it's unfinished. I use the narrowest screen as an editor: whatever still fits at 320 px is what the page is really about. It's also the width WCAG measures reflow at, so the constraint comes with a standard attached.

## Before I add anything

Before something gets added, it has to answer five questions:

- Who is this for, and what are they trying to do right now?
- What does it replace? If nothing, why isn't what's already there enough?
- What does it cost in bytes, maintenance, translations and states to test?
- How does it behave on a phone, with a keyboard, with reduced motion?
- What would be lost without it?

If I can't answer the last one, it doesn't ship.

## Leave the useful parts

Simplicity is not minimalism for its own sake. Plenty of things that look like clutter are doing quiet, important work, and stripping them out makes a page emptier without making it any easier to use:

| Looks like clutter | What it's actually doing |
| --- | --- |
| Underlined links | Tell people what's clickable, even without colour |
| A visible focus ring | The only way keyboard users know where they are |
| A label above the input | Still there after the placeholder disappears |
| Generous whitespace | Groups related things and separates unrelated ones |
| A loading skeleton | Shows that structure is coming, which can make a wait feel shorter |

> Remove the friction. Keep the character.

That's the whole job: protect the purpose of the page, keep the useful details and clear away everything that gets in their way.