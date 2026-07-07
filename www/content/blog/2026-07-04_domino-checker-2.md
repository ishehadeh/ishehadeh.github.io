---
title: 'Checking Blokus Logic Gates, Again'
description: 
date: 2026-07-04
tags: blog
layout: layouts/blog.njk
draft: false
---

I didn't have much success with the domino checker I transpiled from last month for a new AND gate Alex made, so I built another one.
The main thing I wanted to address was the all-or-nothing aspect of the old checker.

Instead of an exhaustive checker, I wanted something that someone could work with, moving through different board states, or optionally jumping to a point in the tree.

I decided to vibe-code this as much as possible in a Next app, I had a small UI project going for [cgtjs](https://github.com/ishehadeh/cgtjs), so I extended that. It's thrown together, and a bit rough around the edges but I think basically useful.

Check it out here: [blokus-editor](https://cgtjs-ui.vercel.app/blokus-editor).

Here's a quick run down of the UX choices I made:

## Real-time updates

You can "paint" a board with either "blocks", squares where the player can't place dominos, or horizontal/vertical dominos.

> NOTE: it's special-cased to dominos at the moment, since that's what I was working on, but it could easily be extended to include more polyominos, or even custom ones!

As the user paints the moves from that board state update in real time.
This is also a  _massive_ performance problem, but hey it's just a first pass.
I think I may try doing the board calculations asyncronously in a worker, and stream them back in the future.
Pagination woul be fantastic as well, but I'd have to modify cgtjs to do that.

## Import / Export

In order to easily share findings, I wanted to make importing and exporting as easy as possible.
There's two methods URLs, for example [here's a demo board](https://cgtjs-ui.vercel.app/blokus-editor?b=eyJiIjoiQkFBQUFBUUFBQUFBQUFBQSIsImsiOiJCQUFBQUFRQUFBQWpCQUFBIiwicCI6WyJBZ0FBQUFFQUFBQURBQUFBIiwiQVFBQUFBSUFBQUFEQUFBQSJdfQ%3D%3D).
They encode base 64 JSON of the board state.
Then there's image import/export, which I decided on since we've been using [piskel](https://www.piskelapp.com/) up to this point to draw boards.

## Searching the Tree

I'd like to include more utilities for searching down the game tree, but for now there's three methods:

1. Every direct child board state links to itself. This allows you to click on a child board to see its children
2. The user can choose to see only "leaf" nodes, meaning descendant board states with no children of themselves. This let's you see what happens if the all peices are placed
3. "Cover Count" allows the user to specify how many squares should be covered by a polyomino. Since we've been developing circuit SAT gates which require a specific count each, this can be helpful for checking their correctness.

---

And that's pretty much it, I'm excited to play around more with the application.
In particular, I'm looking forward to solving the performance problem.