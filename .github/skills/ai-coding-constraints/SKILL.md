---
name: ai-coding-constraints
description: 'Behavioral guardrails that reduce common LLM coding mistakes — think before coding, simplicity first, surgical changes, goal-driven execution. Use for ALL coding tasks to improve output quality, reduce unnecessary changes, and catch architectural blind spots before they become bugs.'
---

# AI Coding Constraints

Behavioral guidelines to reduce common LLM coding mistakes. These constraints bias toward **caution over speed**. For trivial tasks (single-line fixes, obvious boilerplate), use judgment — but default to following them.

## When to Use

- **Every code change** — always active in the background
- New feature implementation
- Bug fixes and debugging
- Code review and refactoring
- Architectural decisions
- When unsure about approach

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- **State your assumptions explicitly.** If uncertain, ask the user.
- **If multiple interpretations exist, present them** — don't pick silently.
- **If a simpler approach exists, say so.** Push back when warranted.
- **If something is unclear, stop.** Name what's confusing. Ask.

**Why:** The most expensive bug is one caused by an assumption you didn't know you were making. Surfacing ambiguity early costs seconds. Fixing the wrong implementation costs hours.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- **No features beyond what was asked.**
- **No abstractions for single-use code.**
- **No "flexibility" or "configurability" that wasn't requested.**
- **No error handling for impossible scenarios.**
- **If you write 200 lines and it could be 50, rewrite it.**

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

**Why:** Every line of code is a liability — it needs to be understood, tested, and maintained. Unnecessary code doesn't add value, it adds cost.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- **Don't "improve" adjacent code, comments, or formatting** — stay focused on the task.
- **Don't refactor things that aren't broken.**
- **Match existing style** — even if you'd do it differently.
- **If you notice unrelated dead code, mention it** — don't delete it.

When your changes create orphans:
- **Remove imports/variables/functions that YOUR changes made unused.**
- **Don't remove pre-existing dead code** unless asked.

**The test:** Every changed line should trace directly to the user's request.

**Why:** Unnecessary changes make code review harder, increase merge conflict risk, and introduce bugs in code that was working fine.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → **Write tests for invalid inputs, then make them pass**
- "Fix the bug" → **Write a test that reproduces it, then make it pass**
- "Refactor X" → **Ensure tests pass before and after**

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

**Why:** Strong success criteria let you work independently. Weak criteria ("make it work") require constant clarification and produce unreliable results.

## 5. Immutability First

**Always create new objects, never mutate existing ones.**

```javascript
// WRONG — mutates original
function addItem(arr, item) { arr.push(item); return arr; }

// CORRECT — returns new copy
function addItem(arr, item) { return [...arr, item]; }
```

**Why:** Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## 6. Validate at Boundaries

**Always validate at system boundaries:**
- All user input before processing
- All external API responses before using
- All file reads before parsing
- All database queries before executing

**Fail fast with clear error messages.** Never trust external data.

## 7. No Silent Failures

**Handle errors explicitly at every level:**
- Every `try` must have a meaningful `catch`
- Every promise must have `.catch()` or be `await`ed
- Every callback must handle the error parameter
- Log enough context to debug in production
- **Never use empty catch blocks** — if you must suppress, comment why

## 8. Read Before Write

**Before modifying any code, read and understand:**
- The full function/block you're changing
- How it integrates with callers and callees
- Existing patterns and conventions in the file
- Related test files

**Why:** Code changes made without context are the #1 source of regressions.

## Gotchas

- **Testing is not optional.** If you wrote code, write the test. If you fixed a bug, write a regression test.
- **"Works on my machine" is not a valid verification.** Verify in the actual environment.
- **Don't add dependencies for convenience.** Every dependency is a security and maintenance risk.
- **If you're copying code from elsewhere, understand it first.** Copy-paste without understanding is how bugs proliferate.
- **Don't optimize prematurely.** Measure first, optimize second. The bottleneck is rarely where you guess.
- **Never hardcode secrets, keys, or tokens.** Use environment variables or a secrets manager.
- **CSS/JS caching will burn you.** Always bump version strings on static assets.
