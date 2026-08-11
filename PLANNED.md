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

## Per-course language selection — `?lang=`

**Status: designed and approved. Build FIRST, before any Phase 2 animation is
authored.** This is the one item in this file with a scheduled build; it is here
rather than in `AUTHORING.md` only because it is not merged yet. Move it into
`AUTHORING.md` Part 2 (CODE) the day the branch merges, and delete it here.

### The problem it solves

Twelve Phase-2 animations are shared across courses that are not the same
language. `objects-constructor-init` backs bCpp A7, bJava A7 and aJava A1 — one
C++ course and two Java courses, from one animation.

That collides head-on with two rules already in force:

- `AUTHORING.md` Part 2: the four programming courses get **no language toggle**;
  tabs there mean *source files in one program*, never languages.
- `AUTHORING.md` Part 1: filenames carry **no language suffix**, so
  `objects-constructor-init-cpp` / `-java` twins are not available either.

Both rules are right. What was missing is the thing that decides *which* listing a
given course sees.

### The resolution

**The content file declares which listings exist. The course decides how many are
shown.** A shared animation declares every language it honestly supports:

```js
languages: ['cpp', 'java'],   // order = fallback order; first is the default
```

and the per-course Canvas iframe carries the choice:

```
objects-constructor-init.html?a=bcpp-a7&lang=cpp
objects-constructor-init.html?a=bjava-a7&lang=java
objects-constructor-init.html?a=ajava-a1&lang=java
```

A bCpp student sees C++ and no tab bar. A bJava student sees Java and no tab bar.
Neither can see the other language, so the "no language toggle" rule holds — it is
now enforced by the URL, not by the content file. One build serves three courses.

`?lang=` is **inert configuration in the same family as `?a=`, not a mode.** It
selects which of several pre-written listings is displayed. It changes no step
data, no trace, no behavior. This is the distinction that makes it acceptable
after `?mode=` was removed: `?mode=` changed what the animation *did*.

### Engine rules — exactly these, no more

1. **`?lang=` applies only when the content file declares a `languages` array.**
   A content file whose listings are keyed by filename (a multi-file program) has
   no languages to select and ignores the parameter entirely. `?lang=` can never
   fight source-file tabs.
2. **Hide the tab bar whenever exactly one listing resolves** — whether because
   `?lang=` narrowed a multi-language file to one, or because the content file
   declared only one language to begin with. Not a disabled tab, not a lone tab: a
   single tab is an affordance that does nothing. (This also cleans up the
   single-language singles in Phases 3–5.)
3. **Absent, empty, or unrecognized `?lang=` falls back to the first declared
   language, with the tab bar shown exactly as today.** A course must never get a
   blank code panel or an error because a URL was typed wrong.
4. **`?lang=` composes with `?a=`** in either order, and both stay invisible to a
   student who does not read URLs.
5. **`?lang=` and `profile` are independent axes.** Do not couple them. A beginner
   profile still caps panels at 3 and hides addresses regardless of language, and a
   `standard` profile animation may still be language-narrowed.

**The change must be a strict no-op for all 22 existing ds pages.** None of them
carries `?lang=`, all declare three languages, all keep their tab bar and their
current default. That is the review test for the branch: every ds animation looks
and behaves identically before and after.

### What it obliges elsewhere

- **`courses.json` gains a course-level `"lang"`** (`"cpp"` for bCpp/aCpp,
  `"java"` for bJava/aJava; `ds` keeps its `languages` array and gets none) so
  that per-course iframe URLs can be emitted with the right value. Per process
  rule 5 this rides in its own commit, never with an animation.
- The deferred `?a=` emit machinery below becomes `?a=` **and** `?lang=` emit
  machinery. Same deliverable, one more field.

### The alternative that was rejected

Emitting two thin wrapper pages in `anim/` from one content file avoids the URL
parameter, but doubles the page count for every shared animation and puts a
language into a filename by the back door — the exact thing the naming rule
exists to prevent.

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
changes. Once `?lang=` exists, a Python tab is additionally *opt-in per course URL*
rather than something every ds student sees, which lowers the cost of the decision
further.

---

## Emit machinery for `?a=` and `?lang=` markers

The hidden assignment marker (`...html?a=ds-a2`) is inert and instructor-only, and
the engine correctly ignores it. `?lang=` (above) is emitted from the same place.
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
