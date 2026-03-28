Thesis: What I found wasn’t that AI replaces programming, but that it becomes a tool for working through problems alongside me.

1. Introduction - I was skeptical, becuase I saw mixed results from LLMs in the past, but in about July of 2025 I decided to take it more seriously
   a. I didn’t see LLMs as useful beyond trivial tasks.
   b. articles, podcasts, and mentors shifted your perception.
   c. You decided to experiment with Cursor.
2. Early Adoption Through Low-Risk, Immediate Wins - AI earns a place by being easy and immediately useful, not perfect.
   a. Small Refactors 
      i.   LLMs aren’t the *best* tool, but they’re the most accessible.
      ii.  They replace tools you *could* learn (e.g., `sed`, multi-cursor editing) but haven’t.
      iii. Showed an immediate producivity: convenience trumped optimality 
    b. Editor Completions
      i.   AI complements language services
      ii.  less reliable, but more flexible - especially with very dynamic languages like PHP
      iii. reduces friction, like rembering function names
3. Expansion Into Structured, Higher-Leverage Tasks
   a. Writing Tests
      i.   Safe space for AI (low risk, easy to verify).
      ii.  Weakness: messy or imperfect output.
      iii. Strength: generates breadth of scenarios I wouldn’t think of
      iv.  Key insight: AI helps you see your own code from the outside.
   b. Writing code with agents - AI becomes a *thinking partner*, not just a typing shortcut.
      i.   Asynchronous workflow (run → step away → return to feedback).
      ii.  Finds real bugs *and* irrelevant noise.
      iii. Still valuable despite false positives.
      iv.  One of the most impactful uses.
4. Attempting Full AI-Driven Development leads to friction
   a. Writing full features with AI works better for smaller and greenfield projects
   b. A core issue I encounter on larger systems is underspecification
   c. Realization: I often use coding to figure out what you want.
   d. AI struggles when *the problem itself is unclear*, but it can help me clarify it... (this leads into the next point)
5. Evolving Workflow: AI as a Structured Thinking Tool: I learn AI works best when paired with intentional thinking, not delegation.
   a. from this experience, I develope a new workflow
      1. Write out ideas/algorithm in prose.
      2. Have AI review for gaps.
      3. Iterate to resolve ambiguities/contradictions.
      4. Generate tests from the clarified spec.
      5. Implement manually.
      6. Iterate between tests, implementation, and real data.
   b. Key benefit: forces clarity before coding.
   c. AI shifts earlier into the ideation phase
   d. I still implement the feature, as it helps me clarify my thinking and fully understand the system
6. Conclusion: Gradual Integration and Lasting Impact
   a. AI tools have become embedded across your workflow:
       i.   Refactoring
       ii.  Completions
       iii. Testing
       iv.  Code review
       v.   Planning
   c. They are imperfect but consistently valuable.
   d. Biggest strengths:
      i.   Speed
      ii.  Perspective
      iii. Idea generation
      iv.  Error detection
   e. Outlook: optimistic about continued evolution.
