---
title: '"Leveraging AI"'
description: How I've found new tools fit into my workflow.
date: 2026-03-28
tags: blog
layout: layouts/blog.njk
draft: false
---

Until recently, I saw large language models as a tool for asking a quick question about how to use a CSS grid.
In mid-2025, I started to see more articles and podcasts casually mention how useful Claude Code, Cursor, and similar tools were becoming.
I had given Copilot a try but had mixed results.
After hearing good things about Cursor, I decided to give it a try in October 2026


I picked up these tools slowly.
Cursor gave me immediate value through its inline completion and simple refactoring capabilities.
If I knew how to use multiple cursors in Helix, or had a good grasp of `sed`, I wouldn't rely on Cursor as much for refactoring.
But I don't know those tools. I've found the learning curve too steep for more than basic find-and-replace, so I fall back on LLMs.

For example, just yesterday I had a series of descriptions for payments in testing fixtures that I wanted to change from irrelevant text to "Charge A", "Charge B", and so on. I'm sure that's possible with `sed` or other tools, but I wouldn't know how to implement a counter so each description is different. In the past, I would have done it manually.

Using an agent didn't change how I work, but the speedup is significant enough to make it worthwhile.
Find-and-replace, editor completions and static analysis are a well-studied problem with many, many solutions.
I don't think I'd enjoy writing TypeScript as much without VS Code's great support for the language.
At work, I write PHP, and I've had mixed success with PhpStorm and VS Code PHP plugins.
They both work well enough to be useful, but often they aren't able to show completions because they don't have enough static information.
Cursor's AI completions are a great companion to a language server.
Unlike the language server, they *can* be wrong, but they're right often enough that they save me from having to look up a function name.

For a while, I never tried using any LLM-based tools to generate significant amounts of code.
I was mostly using them during work, and I found the cost of them generating something I didn't like too high.
Small refactors and editor completions were what drew me into using LLM-based tools day to day.
It didn't cost me any time to learn how to use them, and the time savings were immediately obvious.


Once I was comfortable using Cursor for simple tasks, I started using it here and there to write tests.
I liked this use case because mistakes are inconsequential.
Tests are also easier to check, since each case is a small, self-contained program.

Like small edits, AI isn't perfect for writing tests, but it can write *a lot* of tests very quickly.
I've found that more often than not, I need to heavily edit the output.
Sometimes the assertions are wrong, and often the tests are poorly organized.

Even if the generated tests are imperfect, I find the output extremely valuable because of the breadth of test cases it can generate.
*Especially* when *I* am the author of a piece of code, I find it difficult to think outside the box and break it.
Usually, I have a handful of edge cases in mind, and breaking away from those can be difficult.
A set of LLM-written tests gives me more perspective on the logic I wrote.

Here, I started to see how LLMs could be used as a tool to help me work through problems.
I write the code, then by asking it to write tests it's like asking "what am I missing".

After tests, I started using agents for code review.
I ask for a review, go work on something else in a different worktree, and come back to a long list of issues.
The quality of these comments varies, but the time to skim and verify each is negligible.
After addressing the glaring issues, I run it again.
After my initial step into using Cursor for refactoring, this was easily the most value I've gotten out of any use case.
The extra time it takes is slim, and I've saved myself and my coworkers time during code review. 

<!-- 5. Writing Whole Programs with AI -->
Around this point, I started trying to write more code using agents.
For new projects, I had success, but working within existing systems was much more difficult.
The problem I kept running into over and over again was underspecifying what exactly I wanted done.
The agent would go off and guess, leading to a chain of poor decisions.

The issue is that I usually don't know what I want.
Doing this first as a hobbyist, and now professionally, I've learned to use writing the program as a way to clarify my thoughts.
Often, I'd ask an agent to implement something, it would fill in a logic gap in a way I did not like, and I'd have to tear down a significant amount of code to fix it.
When the hardest part of a feature is how something should be implemented, I've found writing code with LLMs isn't much faster than doing it by hand.


I've had a lot of success in the past few weeks using LLMs to help develop my thoughts.
The process I've come to is:

1. Write out ideas or algorithms in plain English.
2. Have AI review for gaps.
3. Iterate to resolve ambiguities and contradictions.
4. Generate tests from the clarified spec.
5. Implement based on the spec, usually by hand.
6. Iterate between tests, implementation, and real data.

Step 5 is important.
With a highly detailed spec, why not use AI to generate it?

While I certainly use the features of Cursor mentioned at the start of this post (small refactors and completions), and use it here and there to generate small chunks of code, I've found that working through the core logic myself is an important step in gaining a full understanding and resolving the remaining ambiguities.


Overall, AI-powered programming tools have steadily woven themselves into my workflow, helping me write, test, refactor, and review code faster and more thoroughly than I could alone.
I've found them far from a complete replacement for a software engineer, but they help me develop software faster.
