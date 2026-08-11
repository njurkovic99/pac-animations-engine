# HANDOFF — pac-animations

Brief for Claude Code sessions working in this repo. Read `panel-inventory.md`
(why the engine is shaped this way), `slates.md` (what to build), and
`AUTHORING.md` (how to author one content file) first. `AUTHORING.md` holds only
rules **in force now**; deferred capabilities live in `PLANNED.md` and must not be
built or authored against. This document is the delta on top of them and the source of truth for
build order and project-wide conventions.

**This revision supersedes earlier plans:**
- Build in **efficiency order** (below), not by teaching week.
- **WATCH only.** Every animation is a passive step-through the student clicks
  through. There are NO predict gates, no `?mode=` parameter, no interactive
  question logic in this build. Interactive ("THINK") mode is deferred in full —
  see "Deferred — THINK mode" at the end. Do not add gate/branch/predict logic to
  any animation.
- Line highlighting follows the line **about to execute**, driven by a top-level
  `step.line`.

---

## State of the code

Built, rendered, merged to main:

- `engine/` — driver, five panel renderers, arrow overlay, styles (15 tokens).
- `content/recursion-fib-levels.js` — ds A5. Reproduces the ds5.html expected
  trace (level sequence 0,2,4,3,1,3,2,4,3). Predict gate branches into the
  students' real bug (`level+1` instead of `level+2`).
- `content/lists-doubly-insert-order.js` — ds A10. Four-line doubly-linked
  insertion; arrows fixed and merged.

### Capabilities: DESIGNED vs BUILT

Several capabilities are fully specified in `AUTHORING.md` / `panel-inventory.md`
but do not exist in `engine/`. The docs describe them in the present tense, which
has repeatedly made builds look cheaper than they are. Check this table before
estimating an animation.

| Capability | Designed in | Built? | Debuts on |
|---|---|---|---|
| CODE / CELLS / NODES / STREAM | panel-inventory §2 | YES | — |
| Arrow overlay | panel-inventory §3 | YES | `lists-doubly-insert-order` |
| CALLSTACK panel | AUTHORING, panel-inventory §2 | YES | `lists-array-insert-delete` |
| Caller-line dimming | AUTHORING | YES | `lists-array-insert-delete` |
| Bounded stage / pinned note | AUTHORING | YES | `lists-array-insert-delete` |
| Index-pointer markers | AUTHORING | YES | `queues-count-vs-rear` |
| `stale` CELLS role | panel-inventory §2 | YES | `queues-count-vs-rear` |
| Vertical CELLS (column, markers left) | AUTHORING | YES | `stacks-paren-scanner` |
| `sorted` role — green fill | AUTHORING | YES | `sorting-quicksort-partition` |
| Links inside notes | AUTHORING | YES | `sorting-heapsort-dual` |
| CHART renderer | panel-inventory §2 | YES | `sorting-timing-chart` |
| Slider (narrow WATCH-only exception) | AUTHORING, PLANNED | YES | `sorting-timing-chart` |
| PEGS renderer | AUTHORING | YES | `recursion-hanoi-leap` |
| Attribution footer | AUTHORING | YES | engine-level, all animations |
| Arrow-adjacency placement | AUTHORING | YES | `lists-insert-alpha` |
| Race driver (lockstep generators) | AUTHORING, panel-inventory §4 | YES, but **NO USER** in the repo | intended `sorting-race-statements` |
| **Graph layout in NODES** | panel-inventory §2 | **NO** | `graphs-representations` |
| Loop controls (step out / run to end) | AUTHORING | NO | first loop animation |
| THINK mode | this doc | NO | deferred in full |

**ONE unbuilt capability remains, and TWO animations need it: graph layout in NODES**, needed by
`graphs-representations` (A13) and `graphs-bfs-dfs`. Everything else on the ds slate is
a pure inherit. Budget those two accordingly and treat the rest as cheap.

The race driver is built and working but nothing exercises it — `queues-count-vs-rear`
was designed as a race and then dropped to a single representation. Treat it as
untested in production until `sorting-race-statements`.

Known doc conflict, unresolved: `AUTHORING.md` lists CELLS roles as
`active, compared, ok, error, empty`; `panel-inventory.md` §2 lists
`active, compared, swapped, sorted, probe, empty, stale`. Neither is a superset.
Read `engine/` for the truth and report which doc is stale; do not edit either
doc unilaterally (doc edits are a chat decision).

Two reversible engine decisions:
- **Steps are snapshots, not deltas** — this is what makes Back free.
- **The n-2 branch is evaluated first** in `recursion-fib-levels`, matching
  ds5.html. Conflicts with `recurs2.gif` (left-to-right). Both orders may be
  wanted; flagged for Neven, unresolved.

---

## FIRST TASK — strip THINK out; make the repo uniformly WATCH-only

An earlier revision added interactive "THINK" gates and a `?mode=watch|think`
parameter. That is being **fully deferred**. This build is WATCH-only. Remove it
so nothing is half-implemented and no future session re-introduces it.

Do all of the following, then render, screenshot, confirm, commit:

1. **Engine:** remove the `?mode=` URL-parameter handling and the predict-gate
   behavior (the gate UI, the stop-on-gate, and the wrong-answer `branch`
   mechanism). A step of `type:'predict'`, if any remain, should render as an
   ordinary step. Keep everything else (snapshots, Back, line highlight, panels,
   arrows).
2. **Content — the two existing animations** (`recursion-fib-levels`,
   `lists-doubly-insert-order`): convert their predict gates into **plain
   narrated WATCH steps**. Do NOT delete the teaching insight — turn it into
   narration. Where a gate asked the student to predict, the WATCH step instead
   *states* the common mistake and then shows why it is wrong:
   - fib: a step narrating "a common error is `fib(n-2, level+1)`; note that
     n + level must stay constant, so it must be `level+2`," then the animation
     proceeds correctly. (Do not execute the buggy branch.)
   - list insertion: a step narrating "a common error is doing `temp.prev = ins`
     first; then line 4 dereferences a pointer that isn't set yet," shown as
     explanation, then the correct order proceeds.
   Remove the `buggy` traces and the `branch`/`options`/`question` fields from
   both content files.
3. Confirm both animations play start-to-finish as pure click-through, with the
   line highlight advancing and no gate ever stopping the student.

Known issue that motivated this (for the deferred THINK work later): in the old
THINK mode, choosing a wrong answer caused the highlight/execution to jump to the
wrong line — i.e. the animation followed the bad advice, which is pedagogically
backwards. That is one of the THINK-behavior problems to solve when THINK is
eventually built.

---

## WATCH only (how every animation behaves)

Every animation is a **passive step-through**: the student clicks Next (or Back),
the current line highlights like a debugger, panel state updates, and narration
explains. Nothing stops to ask the student anything. No questions, no gates, no
branches, no `?mode=`.

Where an animation has a common-mistake insight worth teaching, deliver it as
**narration on a normal step** — state the mistake, show why it's wrong by
letting the correct execution proceed. The teaching value lives in what the
student watches and reads, not in an interactive prompt.

Interactive gates ("THINK") are deferred in full; see the end of this document.

---

## Build order — EFFICIENCY (not temporal)

Mature the engine against the best-specified course (ds), then build shared
animations once, then finish single-course animations, and do aCpp last because
it already has live Canvas material and is a port-and-improve job. Within a
phase, order is flexible; across phases, go in order.

`●` = shared across courses (build once, reuse via the `courses.json` mapping).

### Phase 1 — ds core (20) · proves every renderer
```
lists-array-insert-delete       ds A1   BUILT
queues-count-vs-rear            ds A2   race driver + index pointer — BOTH UNBUILT
stacks-paren-scanner            ds A3   predict/trap
stacks-postfix-eval             ds A4
recursion-factorial-stack       ds
recursion-fib-levels            ds A5   BUILT
recursion-hanoi                 ds      PEGS renderer (three disks, seven moves)  BUILT
sorting-quicksort-partition     ds A6 KEY
heap-is-this-valid              ds      confusion-first (WATCH)   BUILT
sorting-heapsort-dual           ds A7   array<->tree dual view
sorting-timing-chart            ds A7   BUILT (CHART + slider)
hashing-collision-strategies    ds A8
pointers-address-model          ds      BUILT
lists-insert-alpha              ds A9   BUILT   arrows
lists-doubly-insert-order       ds A10  BUILT
trees-bst-operations            ds A11  SPLIT 3 WAYS — all BUILT
trees-recursive-height          ds A12  BUILT
graphs-representations          ds A13
graphs-bfs-dfs                  ds
complexity-growth-curves        ● ds analysis (also aJava)
```

### Phase 2 — high-share animations (20) · each serves 2–3 courses
```
objects-constructor-init        ● bCpp A7 · bJava A7 · aJava A1
arrays-dont-copy                ● bCpp · bJava · aJava
functions-overload-resolution   ● bCpp A6 · aJava A1
random-pseudorandom-seed        ● bJava · aJava A1
types-integer-division          ● bCpp A2 · bJava A2
control-flowchart-sync          ● bCpp · bJava A2
control-case-coverage           ● bCpp A3 KEY · bJava A3 KEY (parallel problem)
control-short-circuit           ● bCpp · bJava
loops-while-vs-dowhile          ● bCpp · bJava
loops-nested-odometer           ● bCpp A4 · bJava A4
files-read-until-eof            ● bCpp A5 · bJava A5
functions-call-return           ● bCpp · bJava A5
scope-shadowing                 ● bCpp · bJava
objects-static-members          ● aCpp · aJava
objects-shallow-vs-deep-copy    ● aCpp · aJava
objects-aggregation             ● aCpp A7 · aJava A4
memory-reachability             ● aJava A4 · ds
sorting-race-statements         ● aCpp A1 · ds
intro-compile-run               ● bCpp · bJava   (WATCH-only; may not warrant building)
arrays-2d-row-col               ● aJava A3 · aCpp · bCpp   (closes aJava A3 gap)
```

### Phase 3 — bCpp / bJava singles (19)
```
types-variable-boxes         bCpp        io-single-println-escapes   bJava A1
io-single-cout-escapes       bCpp A1     types-string-concat-plus    bJava
types-uninitialized-garbage  bCpp        io-printf-format            bJava
io-cin-prompt-pause          bCpp        functions-menu-dispatch     bJava A6
io-fixed-setprecision        bCpp A2     objects-reference-vs-value  bJava
control-bool-flag            bCpp        arrays-accumulate-max-min   bJava A8
strings-relational-compare   bCpp        arrays-of-references        bJava
loops-sentinel-vs-counter    bCpp
functions-value-vs-reference bCpp
objects-three-from-one-class bCpp
arrays-index-vs-value        bCpp
arrays-parallel-lockstep     bCpp A8
```

### Phase 4 — aJava singles (13)
```
arrays-of-nulls-until-new     aJava A2      strings-immutability          aJava A5
arraylist-amortized-doubling  aJava         types-boxing-wrappers         aJava
functions-varargs             aJava         strings-tokenize-transform    aJava A5
objects-equals-vs-identity    aJava A2      inheritance-super-chain       aJava A6
types-enum                    aJava         inheritance-what-object-gives aJava
dispatch-which-method-runs    aJava A7 KEY  gui-event-dispatch            aJava A8
gui-panel-composition         aJava
```

### Phase 5 — aCpp (19) · port + improve; course already live
```
sorting-bubble-selection     port          structs-as-arguments        port struct2
searching-linear-vs-binary   port          structs-union-overlay       port enumuni
pointers-intro               port cpoint1   files-basic-operations      A4 · port file1/2
pointers-arithmetic          port cpoint2   files-stream-fail-state     error testing
pointers-new-delete-dangling A2 · cpoint3   files-random-access-seek    A5 KEY · port file3
strings-cstring-compare      port strcompare objects-intro-classes      port oop1
strings-shared-memory        port strshare   objects-ctor-dtor-lifetime A6 · port oop2
structs-array-of-records     A3              objects-operator-overload   port oop4
structs-and-pointers         port struct-ptr inheritance-base-derived    port oop3
                                             dispatch-vtable             A8 · port oop5
```

**Total: 91** (two built). Phase 1 is the priority batch. Batch instruction to
Claude Code, e.g.: *"Build the next five Phase-1 animations from HANDOFF.md,
following AUTHORING.md. WATCH-only — passive click-through, no gates or questions.
Render and screenshot each before committing."*

---

## Assignment markers (hidden, in the iframe query string)

Every assignment has at least one backing animation. NOT advertised. Identified
by a `?a=` param on the Canvas iframe, ignored by the animation — an inert marker
for Neven, invisible to students who don't read URLs:

```
objects-constructor-init.html?a=bcpp-a7
objects-constructor-init.html?a=ajava-a1
```

A shared animation backs different assignments in different courses, which is why
the marker is per-iframe, not in the filename. Multiple backers of one assignment
number as `a2-1`, `a2-2`.

Later deliverables (not blocking): emit `?a=` when generating per-course iframe
URLs from `courses.json`; and a private per-course **instructor index** listing
"A3 -> animation -> link" for instant answers to "anything for A3?".

### Backer map (source of truth for courses.json)
```
bCpp   A1 io-single-cout-escapes            A5 files-read-until-eof
       A2 types-integer-division;io-fixed-setprecision (a2-1,a2-2)
       A3 control-case-coverage (KEY,parallel)  A6 functions-overload-resolution
       A4 loops-nested-odometer              A7 objects-constructor-init
                                             A8 arrays-parallel-lockstep
bJava  A1 io-single-println-escapes          A5 files-read-until-eof;functions-call-return (a5-1,a5-2)
       A2 types-integer-division;control-flowchart-sync (a2-1,a2-2)
       A3 control-case-coverage (KEY,parallel)  A6 functions-menu-dispatch
       A4 loops-nested-odometer              A7 objects-constructor-init
                                             A8 arrays-accumulate-max-min
aCpp   A1 sorting-race-statements            A5 files-random-access-seek (KEY,direct)
       A2 pointers-new-delete-dangling       A6 objects-ctor-dtor-lifetime
       A3 structs-array-of-records           A7 objects-aggregation
       A4 files-basic-operations             A8 dispatch-vtable
aJava  A1 objects-constructor-init;random-pseudorandom-seed (a1-1,a1-2)
       A2 arrays-of-nulls-until-new;objects-equals-vs-identity (a2-1,a2-2)
       A3 arrays-2d-row-col                  A5 strings-tokenize-transform
       A4 objects-aggregation;memory-reachability (a4-1,a4-2)
       A6 inheritance-super-chain            A7 dispatch-which-method-runs (KEY,direct)
       A8 gui-event-dispatch
ds     A1 lists-array-insert-delete   A8  hashing-collision-strategies
       A2 queues-count-vs-rear        A9  lists-insert-alpha
       A3 stacks-paren-scanner        A10 lists-doubly-insert-order
       A4 stacks-postfix-eval         A11 trees-bst-operations
       A5 recursion-fib-levels        A12 trees-recursive-height
       A6 sorting-quicksort-partition (KEY)  A13 graphs-representations
       A7 sorting-heapsort-dual;sorting-timing-chart (a7-1,a7-2)
```
KEY backers are deliberately adjacent, never the graded solution.

---

## Deferred — THINK mode (do NOT build now)

Interactive gates are postponed in full, on purpose. Rationale: the WATCH build
already carries a lot of per-animation visual design work (arrow anchoring,
multiple arrows into one box, spacing, highlight timing) across ~90 animations,
and layering interactive-question design on top of that at the same time is too
much at once. THINK will be added later, animation by animation, as a separate
pass — accepted as more expensive than doing it up front, in exchange for a
single clear design axis now.

When THINK is eventually built, known problems to solve:
- A wrong answer must NOT make the animation execute the wrong line / follow the
  bad advice (the old behavior did this — pedagogically backwards). A wrong
  answer should explain and let the student retry or reveal, without corrupting
  the traced state.
- Question phrasing, option design, and per-animation logic all need review.
- Likely re-introduce a per-page mechanism (a URL param or a separate link) so a
  Canvas page can offer "Watch" and an interactive variant side by side.

None of this is in scope for the current build. Every animation ships WATCH-only.

## Deferred — a Python listing tab (decided: revisit after Phase 1)

Occasionally a student arrives with a Python background. Neven's standing advice
is that Python is not well suited to classic data structures and that they should
switch to C++; that advice stands, and a Python tab would be a **reading aid for
someone whose mental model is Python, never a licence to submit Python.**

**Decision: not now.** Finish Phase 1 in pseudo / C++ / Java. Revisit only if
Python students keep appearing, and then add tabs retroactively to the subset of
animations where a Python listing is honest.

**It can be done correctly**, using the standard library's real fixed-size array:

```python
from array import array
contents = array('u', '\0' * MAX)   # contiguous, typed, fixed capacity
```

`array.array` is a genuine typed buffer, not a list in costume. Preallocate once
and never append.

Two rules if it is ever built:
- **Never use a Python `list`.** A structure that grows on `append` teaches the
  opposite of what a fixed-size array teaches, and wraparound arithmetic becomes
  theatre.
- **Answer the `deque` objection on the tab itself.** A Python student can
  reasonably ask why any of this matters when `collections.deque` exists. One
  paragraph — "`deque` does this for you; here is the machinery it hides, and why
  a fixed capacity forces a design choice" — converts the objection into the
  lesson. Unanswered, it is fatal to the animation.

**It must be per-animation and optional, not a global fourth tab.** Python has no
honest translation for `pointers-address-model`, `pointers-new-delete-dangling`,
`strings-shared-memory`, or anything with explicit `new`/`delete`; faking one with
`id()` would actively misteach. Roughly: the array-based, sorting, and searching
animations yes; the memory-model animations no.

**Cost when it happens: low.** CODE resolves `step.line` against whichever listing
is displayed, and all listings are line-aligned, so a Python tab is *only* a new
listing string — no step data, trace, or engine changes. Python's lack of braces
helps: where C++ has a bare `}`, Python has a blank line and the numbering holds.
Verified against `queues-count-vs-rear`'s ADD block, lines 7-14, which aligns
line-for-line. The only wrinkle is `global front, rear` for module-level state,
which sits on an unnumbered line or folds into the preamble.

---

## Still open for Neven (cheap, not blocking)

- Are the 20 aCpp animation pages actually unpublished in Canvas? (2 min.)
- Fix the aJava schedule's malformed span (polymorphism/KEY module cell is blank).
- `recurs2.gif` vs ds5.html evaluation-order conflict.

## What stays a chat decision, not a Claude Code one

Anything that changes what an animation teaches, or edits a design `.md`: new
animations, pedagogical framing, mode design, build order. Design lands in the
`.md` files (chat); implementation lands in code (Claude Code); git keeps them
coherent.
