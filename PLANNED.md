# Planned — deferred capabilities and conventions

Everything here is **recorded but NOT in force.** It was split out of
`AUTHORING.md` so that doc holds only rules that apply to an animation being
written today. Nothing in this file should be built, authored against, or
inferred from unless it is explicitly moved back into `AUTHORING.md` first.

Why record it at all: several of these were designed carefully, and the design is
worth keeping so it lands consistently whenever it does get built. The cost of
*not* recording it is re-deriving it badly under time pressure.

> **Warning, learned the hard way.** `AUTHORING.md` used to describe unbuilt
> capabilities in the present tense, which made builds look cheaper than they
> were — `queues-count-vs-rear` was estimated as a one-capability build and was
> actually two. Anything in this file is unbuilt. `HANDOFF.md` carries the
> authoritative designed-vs-built table; check it before estimating.

---

## THINK mode — interactive predict gates

**Status: deferred in full.** Every animation ships WATCH-only. Rationale and the
known bugs are in `HANDOFF.md`; the design as it stood before deferral:

```js
yield {
  ...snapshot,
  type: 'predict',
  question: 'What level should it pass?',
  options: [
    {label: 'level + 1', feedback: '...', branch: 'buggy', banner: '...'},
    {label: 'level + 2', correct: true, feedback: '...'},
  ],
}
```

The engine stops; a wrong answer may `branch` into another trace so the student
watches their own bug run; Reset shows the correct one. The framing was: prediction
is engagement, whereas being shown you were wrong *before* you guessed is
discouragement.

**Known problem to solve before building it.** In the old implementation, choosing
a wrong answer made the animation execute the wrong line — the tool followed the
bad advice, which is pedagogically backwards. A wrong answer should explain and let
the student retry or reveal, **without corrupting the traced state.**

**Where it will attach.** The post-watch challenge (`AUTHORING.md`, Part 3) is
deliberately the WATCH-safe version of the same idea, placed on the final step. It
is the natural anchor point for a later THINK variant.

**Also unresolved:** question phrasing, option design, per-animation logic, and
whether a Canvas page offers "Watch" and an interactive variant side by side (a URL
param or a separate link).

---

## Loop controls — "step out" and "run to end"

**Status: deferred until the first loop-heavy animation** (the bCpp/bJava loop
modules, or `stacks-postfix-eval`). None of the early Phase-1 animations need it.
Recorded so it is consistent when built.

Stepping through every iteration one click at a time is tedious. Two debugger-style
jumps fix it, and both reuse the existing snapshot mechanism — every step is already
a stored snapshot, so a "jump" is just moving the step index to a marked target, the
same primitive that makes Back free.

- **Step out** — jump forward to the step where the current loop exits. A step
  inside a loop carries `exitTarget: <step index or label>`; when present, the
  engine shows a **"Step out ⤴"** button. Intervening iterations are skipped; the
  student can Back into them.
- **Run to end** — jump to the final step. Trivial variant of the same primitive.

Both optional per animation, appearing only when applicable.

### Explicitly NOT to be built: "go to clicked line"

Do not implement click-a-line-to-jump-there, now or later. These are pre-computed
traces, not a live program: a source line may be visited zero times, once, or many
(a loop body), so "go to line 14" has no well-defined target — which visit?
Defining it as "the next time this line is reached" is buildable but adds real
complexity and a clickable-code UI to support a gesture that is ambiguous exactly
inside loops, where beginners most need clarity.

It also works against the purpose: these are guided, can't-get-lost walkthroughs for
students who don't yet understand, not power-tools for students who already do.
Back/Next already let a student re-reach any line with full context.

---

## CALLSTACK — two later capabilities

The panel is built and in use (`AUTHORING.md`, Part 2). Two extensions are not:

- **Animated argument→parameter flow** — a value visibly moving from caller into
  callee. Polish; "frame appears with bound values" ships first.
- **Pass-by-value vs. pass-by-reference** — a parameter that is a *copy* versus an
  *alias* of the caller's variable. The data model already allows
  `kind: 'copy'|'reference'` per parameter; do not build it until the C++/Java
  animations that teach it are being authored (`functions-value-vs-reference`,
  `arrays-dont-copy`).

---

## A Python listing tab

**Status: decided, deferred — revisit after Phase 1.** Full rationale in
`HANDOFF.md`. Summary:

Occasionally a student arrives with a Python background. The standing advice —
Python is not well suited to classic data structures, switch to C++ — stands. A
Python tab would be a **reading aid, never a licence to submit Python.**

If built: use `array.array` (a genuine fixed-size typed buffer), **never a Python
`list`**, whose growth-on-append teaches the opposite of what a fixed-size array
teaches. Answer the `collections.deque` objection on the tab itself, or it is fatal
to the lesson.

**Per-animation and optional, never a global fourth tab** — Python has no honest
translation for the pointer/memory animations, and faking one with `id()` would
misteach.

Cost when it happens is low: CODE resolves `step.line` against whichever listing is
shown, so a Python tab is only a new listing string — no step data, trace, or engine
changes. With `?lang=` now in force, a Python tab is additionally *opt-in per course URL*
rather than something every ds student sees, which lowers the cost of the decision
further.

---

## Emit machinery for `?a=` and `?lang=` markers

The hidden assignment marker (`...html?a=ds-a2`) is inert and instructor-only, and
the engine correctly ignores it. `?lang=` (now in force — see `AUTHORING.md` Part 2,
CODE) is emitted from the same place.
Two deliverables are deferred:

- emitting `?a=` and `?lang=` automatically when generating per-course iframe URLs
  from `courses.json`
- a private per-course **instructor index** listing "A3 → animation → link", for
  instant answers to "is there anything for A3?"

Neither blocks any animation.

---

## Repo root index page

The repo root 404s (no `index.html`) — cosmetic, parked. A simple index listing every
animation would fix it and double as an instructor directory. Not blocking.
