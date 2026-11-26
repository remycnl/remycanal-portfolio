---
title: Designing an Interface That Knows When to Say Nothing
description: Every toast, tooltip and confirmation dialog spends a little of the visitor's attention. Notes on restraint, and on telling the silence that helps from the silence that hurts.
author: Rémy Canal
date: 2026-11-26
image: /blog/designing-an-interface-that-knows-when-to-say-nothing/cover.jpg
tags:
  - Design
  - UX
  - Typography
---

Most interfaces talk too much. Every toast, tooltip and confirmation dialog spends a little of the visitor's attention, and most of them spend it on things the visitor already knows. This is about learning when to stay quiet, and about the moments when silence is a bug.

## Every message has a price

Think about the last hour you spent on the web. A “Saved!” appeared after you clicked Save. A cookie banner covered the page. A tooltip explained a button called “Download.” A dialog asked whether you were sure you wanted to do the thing you had just clicked on purpose. None of it was wrong. All of it was a small tax, and the tax adds up.

The deeper cost is learned dismissal. If every action asks “Are you sure?”, people learn to click OK without reading, and the one time the question really matters, it gets the same click as all the others.

::split{variant="aside"}
#first

#### Note

#second
Aza Raskin made this argument in 2007 with a line that stuck: never use a warning when you mean undo. Doing the action and offering a way back is cheaper than asking permission first.
::

## The silence test

Before I add a message to an interface, I try to take it out and see what happens:

1. Remove the message.
2. Use the interface the way a first-time visitor would.
3. Look for the moment where someone would get lost, or lose something.
4. If that moment doesn't exist, leave the message out.

Most of the time, the moment doesn't exist. The change on screen was already the message: the item moved to the cart, the text appeared, the panel closed. Announcing it again is just repeating yourself politely.

## When an interface should speak

Restraint isn't a rule against messages. It's a rule against messages that carry no information, so the question is always what the visitor can't already see or infer:

| Situation | What I do | Why |
| --- | --- | --- |
| The result is visible on screen | Say nothing | The change is the message |
| The action can be reversed | Do it, then offer Undo | Cheaper than asking first |
| The action is destructive and permanent | Ask, and name the consequence | The one place where friction earns its keep |
| Something failed and the visitor can't see it | Say so immediately, with a next step | Silence here is a bug |
| The system changed something the visitor didn't trigger | Say so, briefly | People can't infer what they didn't cause |

## Structure does the talking

When an interface doesn't need to explain itself, it's usually because the layout already did. On this site, section titles sit in the left rail on the same line as the text they introduce, so nothing needs a label saying “start here.” Every kind of text has its own measure, so nothing needs a divider to announce that a quote is a quote. Headings aren't clickable and carry no anchor icon, because nobody asked them to be.

Size, weight and space do the job that captions, arrows and badges do on louder pages. If I catch myself adding an explanatory line to a screen, I look at the hierarchy first. The fix is usually there.

The Close button is the smallest example. It shows the most useful thing for the device in your hand. With a mouse and keyboard, it reads “Close” and hints at `Esc`. On a tablet, it's just the word. On a phone, where there's no keyboard to hint at, it's a cross. A shortcut is never advertised to people who can't use it.

## Quiet words

Microcopy is where restraint is most visible, and where it's easiest to practise. A good message says what happened and what to do next, then gets out of the way:

| Chatty | Quieter |
| --- | --- |
| “Your changes have been successfully saved.” | Autosave with no message, or a plain “Saved” that fades |
| “Are you sure you want to delete this?” | “Deleted.” and an Undo button |
| “Oops! Something went wrong.” | “Couldn't send. Check your connection and try again.” |
| “No results found.” | “Nothing matches “fjord.” Try fewer words.” |
| “Welcome back! We're so glad to see you again.” | Nothing. Show what they came for |

Anything that's only there to sound friendly is the interface talking to itself.

## Silence has to be earned

There's a failure mode on the other side, and it's worse. An interface that fails silently isn't restrained, it's broken: a form that doesn't submit and says nothing, a save that never happened, a payment that went through twice. Quiet is only a virtue when everything it leaves out is already obvious.

It also shouldn't be quiet for everyone. If a message disappears visually, a person using a screen reader still needs to learn that something changed, and WCAG asks that status messages can be announced without moving focus. The region has to exist in the page from the start, with only its text changing, because many screen readers only announce changes to a live region that was already there.

```html
<!-- Nothing new appears on screen, but assistive technology announces it -->
<p role="status" class="sr-only">Saved</p>
```

So the real skill isn't saying less. It's knowing who needs to hear what, and when.

> Restraint isn't the absence of ideas. It's the choice to keep only the one that counts.

That's what I try to design: an interface that's quiet when things are going well, loud when they aren't, and clear about the difference.