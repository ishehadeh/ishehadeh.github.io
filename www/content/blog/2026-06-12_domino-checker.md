---
title: 'Checking Blokus Logic Gates'
description: 
date: 2026-06-12
tags: blog
layout: layouts/blog.njk
draft: false
---

Recently I've been working on creating logic gates follow single-player ("Lonely") Blokus rules, with [Alex Meadows](http://faculty.smcm.edu/ammeadows/) to show the game is NP-Complete.
A few months ago I wrote a tool in Rust to check the gates met certain properties.
Since we've been using [Piskel](https://www.piskelapp.com) to create draw and share the gates, so I had the tool take images as input, with specific pixels describing properties of the cell.

In an effort to share the checker, I vibe-translated it to JS, and put it up at [/blokus/domino-checker](/blokus/domino-checker). The source code for the script isn't minified, feel free to read over it!
